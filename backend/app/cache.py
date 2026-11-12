import asyncio
import json
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


@dataclass
class Snapshot:
    fetched_at: datetime
    source_url: str
    payload: dict


class SnapshotCache:
    """One latest good snapshot per bounded request key, retained across restarts."""

    def __init__(self, path: Path):
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.execute("""CREATE TABLE IF NOT EXISTS snapshots (
                cache_key TEXT PRIMARY KEY, fetched_at TEXT NOT NULL,
                source_url TEXT NOT NULL, payload TEXT NOT NULL, raw_payload TEXT NOT NULL
            )""")

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=5)
        try:
            with db:
                yield db
        finally:
            db.close()

    def _get(self, key: str) -> Snapshot | None:
        with self.connect() as db:
            row = db.execute(
                "SELECT fetched_at, source_url, payload FROM snapshots WHERE cache_key=?", (key,)
            ).fetchone()
        return Snapshot(datetime.fromisoformat(row[0]), row[1], json.loads(row[2])) if row else None

    async def get(self, key: str) -> Snapshot | None:
        return await asyncio.to_thread(self._get, key)

    def _put(self, key: str, snapshot: Snapshot, raw: dict):
        with self.connect() as db:
            db.execute(
                """INSERT INTO snapshots VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(cache_key) DO UPDATE SET fetched_at=excluded.fetched_at,
                source_url=excluded.source_url, payload=excluded.payload,
                raw_payload=excluded.raw_payload""",
                (
                    key,
                    snapshot.fetched_at.isoformat(),
                    snapshot.source_url,
                    json.dumps(snapshot.payload, allow_nan=False),
                    json.dumps(raw, allow_nan=False),
                ),
            )

    async def put(self, key: str, snapshot: Snapshot, raw: dict):
        await asyncio.to_thread(self._put, key, snapshot, raw)
