# Deployment guide

## Static game

Use Node 24, `npm ci && npm run build`. Upload **contents of dist** to a static host. Vite base is relative, so subdirectories work. Serve over HTTP(S), not `file://` because ES module loading is browser restricted. No secrets or backend needed. The repository is delivered privately; no public Pages deployment is implied.

## Local service

See root README for venv/init_db/uvicorn commands. Default SQLite is local development only. Before running against PostgreSQL, create DB/role and set DATABASE_URL; passwords with reserved URI characters must be URL encoded. Configure exact CORS_ORIGINS. Do not commit .env or databases.

## Docker

`cp .env.example .env`, set POSTGRES_PASSWORD (a long randomly generated URI-safe value), `docker compose up --build`. Static frontend at :8080, optional API :8000 bound to loopback. DB persists in named volume. Backend container waits for healthy DB and initializes missing tables. This is initial schema setup, not a migration system. Runtime Docker verification has not been performed.

For public backend: put API behind a TLS reverse proxy, body cap 2MB and distributed auth rate limit; remove development origins, scope CORS exactly, restrict service ports, run migrations explicitly before rollout, manage credentials outside Git. API token is bearer access and must be kept out of logs. Auth service is alpha and requires production review.

## Backup/restore

Browser: Menu → Xuất tệp lưu JSON, then import in same-version game. Export before origin change or clearing browser data. API: back up PostgreSQL with pg_dump using externally managed credentials, restore into an isolated test DB first, verify account/save ownership. No automated backup workflow exists yet. Local SQLite: stop service before copying DB; restart and smoke test profile/save.

## Release checks

Run frontend tests/build, backend tests, actual browser QA, actual Postgres/compose checks. CI runs frontend checks and SQLite-backed API tests; CI is not proof of production deployment, Postgres compatibility or WebGL rendering.
