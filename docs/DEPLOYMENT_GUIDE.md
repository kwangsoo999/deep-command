# Deployment guide

## Static game

Use Node 24, `npm ci && npm run build`. Upload **contents of dist** to a static host. Vite base is relative, so subdirectories work. Serve over HTTP(S), not `file://` because ES module loading is browser restricted. No backend needed for offline play. For optional cloud sync, set VITE_API_URL to the browser-reachable API URL before build; this value is public configuration, never a secret. An HTTPS frontend needs an HTTPS API to avoid mixed-content blocking. The repository is delivered privately; no public Pages deployment is implied.

## Local service

See root README for venv/init_db/uvicorn commands. Default SQLite is local development only. Before running against PostgreSQL, create DB/role and set DATABASE_URL; passwords with reserved URI characters must be URL encoded. Configure exact CORS_ORIGINS. Do not commit .env or databases.

## Docker

`cp .env.example .env`, set POSTGRES_PASSWORD (a long randomly generated URI-safe value), `docker compose up --build`. Static frontend at :8080, optional API :8000 bound to loopback. Web build receives VITE_API_URL (default http://localhost:8000 for local Compose). Change it before building for a real host, then rebuild; API is not automatically published. DB persists in named volume. Backend container waits for healthy DB and initializes missing tables. This is initial schema setup, not a migration system. Runtime Docker verification has not been performed.

For public backend: put API behind a TLS reverse proxy, body cap 2MB and distributed auth rate limit; remove development origins, scope CORS exactly, restrict service ports, run migrations explicitly before rollout, manage credentials outside Git. API token is bearer access and must be kept out of logs. Auth service is alpha and requires production review.

## Backup/restore

Browser: Menu → Xuất tệp lưu JSON, then import in same-version game. Export before origin change or clearing browser data. API: back up PostgreSQL with pg_dump using externally managed credentials, restore into an isolated test DB first, verify account/save ownership. No automated backup workflow exists yet. Local SQLite: stop service before copying DB; restart and smoke test profile/save.

## Release checks

Run frontend tests/build, backend tests, actual browser QA, actual Postgres/compose checks. CI runs frontend checks, SQLite-backed API tests and a real HTTP client/service cloud save test; CI is not proof of production deployment, Postgres compatibility or WebGL rendering.


For manual HTTP integration QA: run a disposable backend on port 8012, then `VITE_TEST_API_URL=http://127.0.0.1:8012 npm exec vitest -- run tests/cloud.integration.test.ts`. This creates a temporary account and saves; do not point it at a production database. No hosted public service is provisioned by this repository.

## Existing owner-hosted deployment

The owner already serves the frontend at https://tank.daitan.site through Podman/Quadlet and Cloudflare Tunnel. Use [VPS_TANK](../deploy/VPS_TANK.md), preserving the existing frontend service/origin. That guide prepares an optional API route; no remote VPS deployment was executed in this task.
