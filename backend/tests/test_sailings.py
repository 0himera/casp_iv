from datetime import UTC, date, datetime, timedelta

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.providers import UpstreamError
from app.sailings import local_short, parse_asco, parse_kuryk


def kuryk_html(stamp="12.11.2026", name="Тестовое судно"):
    return f"""<div class="disp-wrap"><h3 class="disp-title">Трафик судов на {stamp}.</h3>
    <div class="disp-grid"><div class="disp-head">Заголовки</div><div class="disp-body">
    <div class="disp-row">
    <span class="disp-cell-value">Пр.№1</span><span class="disp-cell-value">{name}</span>
    <span class="disp-cell-value">11.11/ 09:00</span>
    <span class="disp-cell-value">Ожидание погрузки, метео</span></div></div></div>
    <section class="disp-section"><h4 class="disp-section__title">Подходы судов</h4>
    <div class="disp-section__row"><span class="disp-cell-value">1</span>
    <span class="disp-cell-value">Другое судно</span>
    <span class="disp-cell-value">12.11/ 17:00</span>
    <span class="disp-cell-value">20 автомашин</span></div></section></div>"""


def asco_html(empty=False):
    parts = ['<h4>Cari hərəkət qrafiki 12.11.2026 13:19</h4><div id="collapseExample">']
    for category, heading in [
        ("sea", "Dənizdə olan RO-RO və bərələr"),
        ("port", "Limanda olan RO-RO və bərələr"),
    ]:
        headers = ["Gəminin adı", "Məkan", "Çıxdığı liman", "Çıxma vaxtı", "Yan alacağı liman"]
        if category == "sea":
            headers.append("Gözlənilən Çatma vaxtı")
        headers.append("Status")
        values = (
            [
                "Test Vessel",
                "",
                "Ələt",
                "12/11/2026 00:30",
                "Türkmənbaşı",
                "13/11/2026 01:00",
                "Yolda",
            ]
            if category == "sea"
            else ["Other Vessel", "", "Kurık", "", "Ələt", "Körpüdə - Hava şəraiti"]
        )
        row = "" if empty else "<tr>" + "".join(f"<td>{v}</td>" for v in values) + "</tr>"
        parts.append(
            f"<h5>{heading}</h5><table><thead><tr>"
            + "".join(f"<th>{h}</th>" for h in headers)
            + f"</tr></thead><tbody>{row}</tbody></table>"
        )
    return "".join(parts) + "</div>"


def test_kuryk_keeps_sections_cargo_notes_and_unknown_timezone():
    result = parse_kuryk(kuryk_html())
    berth, expected = result["items"]
    assert result["reported_date"] == "2026-11-12" and result["reported_at_local"] is None
    assert berth["berth"] == "Пр.№1" and berth["weather_related"]
    assert berth["event_at_local"] == "2026-11-11T09:00:00"
    assert berth["year_inferred"] and berth["timezone"] is None
    assert expected["category"] == "expected" and expected["status_raw"] == "20 автомашин"
    assert expected["destination_port_raw"] is None
    assert parse_kuryk(kuryk_html())["items"][0]["id"] == berth["id"]


def test_asco_ports_times_and_missing_departure():
    result = parse_asco(asco_html())
    sea, port = result["items"]
    assert sea["port_ids"] == ["alat", "turkmenbashi"]
    assert sea["arrival_at_local"] == "2026-11-13T01:00:00"
    assert sea["timezone"] is None and not sea["year_inferred"]
    assert port["port_ids"] == ["kuryk", "alat"] and port["weather_related"]
    assert port["departure_at_local"] is None
    assert result["reported_at_local"] == "2026-11-12T13:19:00"
    assert parse_asco(asco_html(empty=True))["items"] == []


def test_year_rollover_is_based_on_publication_not_fetch_year():
    assert local_short("31.12/ 23:00", date(2027, 1, 1)) == "2026-12-31T23:00:00"
    assert local_short("01.01/ 01:00", date(2026, 12, 31), True) == "2027-01-01T01:00:00"


@pytest.mark.parametrize(
    "parser,html",
    [
        (parse_kuryk, "<html>Login</html>"),
        (parse_asco, "<html>Login</html>"),
        (parse_asco, asco_html().replace("Status", "Changed column")),
        (parse_asco, asco_html().replace("12/11/2026 00:30", "invalid")),
        (parse_kuryk, kuryk_html().replace('class="disp-cell-value">Пр.№1', ">Пр.№1")),
        (parse_kuryk, kuryk_html().replace("11.11/ 09:00", "invalid")),
    ],
)
def test_changed_structure_or_invalid_time_rejects_snapshot(parser, html):
    with pytest.raises((UpstreamError, ValueError)):
        parser(html)


@pytest.fixture
def rig(tmp_path):
    now = [datetime(2026, 11, 12, 10, tzinfo=UTC)]
    state = {"kuryk": kuryk_html(), "asco": asco_html()}
    calls = []

    def handle(request):
        source = "kuryk" if request.url.host == "portkuryk.kz" else "asco"
        calls.append(source)
        if state[source] is None:
            raise httpx.ReadTimeout("Timeout", request=request)
        return httpx.Response(200, text=state[source], headers={"content-type": "text/html"})

    settings = Settings(cache_path=tmp_path / "cache.db", sailings_ttl_seconds=60)
    with TestClient(create_app(settings, httpx.MockTransport(handle), lambda: now[0])) as client:
        yield client, state, calls, now


def test_combines_sources_filters_port_and_reuses_source_cache(rig):
    client, _, calls, _ = rig
    result = client.get("/api/v1/sailings?port_id=kuryk")
    assert result.status_code == 200
    data = result.json()
    assert len(data["items"]) == 3 and len(data["sources"]) == 2 and not data["partial"]
    assert all("kuryk" in item["port_ids"] for item in data["items"])
    assert all(s["source_updated_at"] is None for s in data["sources"])
    alat = client.get("/api/v1/sailings?port_id=alat").json()
    assert len(alat["items"]) == 2 and len(alat["sources"]) == 1
    assert len(calls) == 2


def test_partial_failure_is_explicit_and_total_failure_is_503(rig):
    client, state, _, _ = rig
    state["kuryk"] = None
    data = client.get("/api/v1/sailings?port_id=kuryk").json()
    assert data["partial"] and data["errors"][0]["source_id"] == "kuryk"
    state["asco"] = None
    # ASCO is still within its healthy cache TTL; force a fresh failure through another rig test.
    assert client.get("/api/v1/sailings?port_id=kuryk").status_code == 200


def test_total_failure(rig):
    client, state, _, _ = rig
    state.update(kuryk=None, asco=None)
    assert client.get("/api/v1/sailings?port_id=kuryk").status_code == 503


def test_malformed_page_keeps_previous_snapshot_and_published_date(rig):
    client, state, _, now = rig
    original = client.get("/api/v1/sailings?port_id=kuryk").json()
    state["kuryk"] = "<html>Site under maintenance</html>"
    now[0] += timedelta(seconds=61)
    data = client.get("/api/v1/sailings?port_id=kuryk").json()
    source = next(s for s in data["sources"] if s["source_id"] == "kuryk")
    old = next(s for s in original["sources"] if s["source_id"] == "kuryk")
    assert source["stale"] and source["cache_status"] == "stale"
    assert source["fetched_at"] == old["fetched_at"]
    assert data["items"] == original["items"] and not data["partial"]


def test_old_publication_is_stale_even_after_successful_fetch(rig):
    client, state, _, _ = rig
    state["kuryk"] = kuryk_html(stamp="01.11.2026")
    data = client.get("/api/v1/sailings?port_id=kuryk").json()
    source = next(s for s in data["sources"] if s["source_id"] == "kuryk")
    assert source["stale"] and source["cache_status"] == "live"


def test_unsupported_unknown_and_missing_port_are_not_empty_success(rig):
    client, _, calls, _ = rig
    assert client.get("/api/v1/sailings?port_id=baku").status_code == 422
    assert client.get("/api/v1/sailings?port_id=unknown").status_code == 404
    assert client.get("/api/v1/sailings").status_code == 422
    assert not calls
