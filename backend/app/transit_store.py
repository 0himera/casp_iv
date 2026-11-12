"""Single-host durable outbox. No network calls inside SQLite transactions."""

import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path


class Store:
    def __init__(self, path: Path):
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        path.touch(mode=0o600, exist_ok=True)
        os.chmod(path, 0o600)
        with self.connect() as db:
            db.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS shipments (
                    id TEXT PRIMARY KEY, chain_id TEXT NOT NULL UNIQUE,
                    snapshot TEXT NOT NULL, pending TEXT
                );
                CREATE TABLE IF NOT EXISTS operations (
                    id TEXT PRIMARY KEY, shipment_id TEXT NOT NULL,
                    scope TEXT NOT NULL, idem TEXT NOT NULL, digest TEXT NOT NULL,
                    public TEXT NOT NULL, plan TEXT NOT NULL, candidate TEXT NOT NULL,
                    signed TEXT, UNIQUE(scope, idem)
                );
                CREATE TABLE IF NOT EXISTS documents (
                    shipment_id TEXT NOT NULL, id TEXT NOT NULL, version INTEGER NOT NULL,
                    content BLOB NOT NULL, PRIMARY KEY(shipment_id, id, version)
                );
                CREATE TABLE IF NOT EXISTS versions (
                    shipment_id TEXT NOT NULL, version INTEGER NOT NULL,
                    snapshot TEXT NOT NULL, proof TEXT NOT NULL,
                    PRIMARY KEY(shipment_id, version)
                );
                CREATE TABLE IF NOT EXISTS forecast_requests (
                    shipment_id TEXT NOT NULL, idem TEXT NOT NULL, digest TEXT NOT NULL,
                    response TEXT NOT NULL, PRIMARY KEY(shipment_id, idem)
                );
                CREATE TABLE IF NOT EXISTS forecast_runs (
                    id TEXT PRIMARY KEY, shipment_id TEXT NOT NULL,
                    scenario TEXT NOT NULL, result TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS candidate_requests (
                    shipment_id TEXT NOT NULL, idem TEXT NOT NULL, digest TEXT NOT NULL,
                    response TEXT NOT NULL, PRIMARY KEY(shipment_id, idem)
                );
            """)
        os.chmod(path, 0o600)

    @contextmanager
    def connect(self, write=False):
        db = sqlite3.connect(self.path, timeout=15)
        db.row_factory = sqlite3.Row
        try:
            if write:
                db.execute("BEGIN IMMEDIATE")
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def shipment(self, shipment_id):
        with self.connect() as db:
            row = db.execute("SELECT * FROM shipments WHERE id=?", (shipment_id,)).fetchone()
        return dict(row) if row else None

    def operation(self, operation_id):
        with self.connect() as db:
            row = db.execute("SELECT * FROM operations WHERE id=?", (operation_id,)).fetchone()
        return dict(row) if row else None

    def pending(self):
        with self.connect() as db:
            rows = db.execute(
                "SELECT o.* FROM operations o JOIN shipments s ON s.pending=o.id ORDER BY o.rowid"
            ).fetchall()
        return [dict(row) for row in rows]

    def save_operation(self, operation, signed=None):
        with self.connect(write=True) as db:
            db.execute(
                "UPDATE operations SET public=?, signed=COALESCE(?,signed) WHERE id=?",
                (json.dumps(operation), json.dumps(signed) if signed else None, operation["id"]),
            )
