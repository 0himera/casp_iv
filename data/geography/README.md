# Caspian water mask

`caspian-water.geojson` is the largest enclosed water component inside 46–55°E,
36–48°N after subtracting Natural Earth 1:10m land polygons, retaining islands.
Source: https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_land.zip
Natural Earth data is public domain. The mask is generalized, not a navigation chart.

`tools/generate_marine_routes.py` builds a 0.04° water grid, validates whole edges
against a 0.005° inward buffer, then computes shortest paths and water-only visibility
smoothing. The output is `frontend/src/data/marineRoutes.json`; every final segment
must be covered by the water polygon. No straight-line fallback is permitted.

Eleven catalog ports have offshore anchors; 54 unordered pairs (108 directions)
are generated and every full sea segment is covered by the water mask. The only
missing pair is Astrakhan–Olya: both use the same sea entrance, so it requires
separate river routing. The API rejects this pair instead of inventing a sea route.

Coastal anchors are snapped within 25 km (Kuryk ~15 km). Astrakhan and Olya use
the sea entrance of the Volga–Caspian canal, 44°45.8′ N, 47°45.6′ E, documented by
[the port administration](https://ampastra.ru/slujba_kapitana_morskogo_porta_olya.html).
River/port approaches are **not drawn**; the output records their straight-line
geographic gaps. Planning adds those gaps as an explicit approximate assumption;
these are not fairway distances or depth-checked voyage times.

Alat's approximate catalog location is the port authority building in
[OpenStreetMap way 630876699](https://www.openstreetmap.org/way/630876699).
Olya's location is the harbour in
[OpenStreetMap way 1008827948](https://www.openstreetmap.org/way/1008827948).
Retrieved 2026-11-13; © OpenStreetMap contributors, ODbL. These locations support
map markers and weather grids; they do not identify a berth or prove a sailing.

The generator writes identical geometry to `data/geography/marine-routes.json`
(backend) and `frontend/src/data/marineRoutes.json` (map). Run it after changing
port coordinates. Tests assert the two copies agree and reverse paths correctly.

Archive SHA-256: `e547d749445eaa0964aba76738090ec88f5e63c4585122170f98c67a7ea922dc`.
Natural Earth version: 5.1.1.
