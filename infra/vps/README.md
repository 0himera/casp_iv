# VPS deployment

Active since 2026-11-13 on Debian 12, x86_64. The domain's existing Cloudflare
Worker reaches nginx on port 18443. nginx now proxies directly to VPS loopback
8000 (FastAPI) and 3100 (Next.js); the workstation and SSH forwards are not on the
request path. Other nginx sites, Xray and the existing homebridge tunnel are unchanged.

## Layout

- `/opt/caspian/app`: backend/app, pyproject.toml, uv.lock, data/ports.json,
  data/geography, api/fixtures and contracts/deployments.
- `/opt/caspian/frontend`: Next.js standalone build, public and .next/static.
- `/opt/caspian/node`: Node 22; archive checked against the official SHA256 manifest.
- `/opt/caspian/python`: uv-managed Python 3.12; backend/.venv contains runtime
  dependencies only (`uv sync --frozen --no-dev`). No ML dependency group or weights.
- `/opt/caspian/bin`: uv and casper-client 5.0.1.
- `/var/lib/caspian`: transit.sqlite3 (including documents and outbox),
  public-data.sqlite3 and worker lock. Owned by the dedicated `caspian` user.
- `/etc/caspian/backend.env`: root-only environment, loaded by systemd.
- `/etc/caspian/keys`: existing testnet signing keys, readable only by root/service group.

Environment must set CASPIAN_TRANSIT_PATH and CASPIAN_CACHE_PATH to those database
paths, CASPIAN_TRANSIT_WRITES=true, the role tokens and CASPIAN_SIGNING_KEYS mapping.
Set CASPIAN_DWELL_MODEL_DIR='' and CASPIAN_DWELL_HISTORY_MODEL_DIR='' to disable weights.
The terminal-dwell API reports MODEL_DISABLED and uses its algorithmic fallback.
The normal Monte Carlo readiness forecast is unaffected.

## Services and updates

Install the three service files here in /etc/systemd/system, then enable
caspian-api, caspian-web and caspian-worker. All bind only loopback and run as caspian.
The web cache directory must exist and be owned by caspian. Never start two workers
against independently copied production databases.

Build frontend locally with `bun run build` in frontend. Package
`.next/standalone/` contents, `public/` and `.next/static/` (the latter goes into
standalone's `.next/static/`). Upload to `/opt/caspian/frontend` and restart
caspian-web. This avoids a Next.js build in 1 GB RAM. Do not replace production data
or environment during a code update.

After a backend update, sync locked runtime dependencies if necessary and restart
caspian-api and caspian-worker. Inspect status and journalctl for all three services.
Use `nginx -t` before nginx reload. `nginx-origin.conf` here is the direct-VPS config.
The previous tunnel config is retained on the VPS as
`/etc/caspian/nginx-tunnel-rollback.conf` (outside nginx's include directory).

## Migration verification

SQLite online backups transferred two shipments, five stored document versions,
version history and outbox. Pending operations were zero before the final copy.
The workstation's backend, worker and frontend services were stopped and disabled.
The independent SSH tunnel was preserved. Casper contract identity and all three
signing identities were checked on the VPS; signing checks did not broadcast.
Check the public site, document download, /passport-state, a marine route preview
and POST /predictions/terminal-dwell after deployment.

Production still uses public preview roles and Casper testnet. Secrets, signing keys,
databases and temporary migration bundles must never be committed.
