# QA report — 2026-11-13 / v0.9.0 campaign build

Environment: Node 24.22.1, Python 3.12.14, Linux, managed Docker daemon 29.9.2. All container/database testing used disposable local resources, not the owner's VPS.

| Check | Result | Evidence / boundaries |
| --- | --- | --- |
| Frontend/domain/DOM | PASS | `npm test`: 64 passed; one HTTP integration test intentionally skipped by default |
| Production build | PASS | TypeScript + Vite build; lazy viewer/effects/engine chunks |
| API unit tests | PASS | `pytest -q backend/test_api.py`: 7 passed with SQLite |
| HTTP + PostgreSQL | PASS | Cloud client against FastAPI with actual Postgres 17: register/login/save/read, stale and simultaneous-writer conflict, another account's isolation, logout |
| Container API | PASS | Built API image, ran with Postgres, /health and /api/version return JSON; same real HTTP cloud test passes against container |
| Container web | PASS | Built static image, Nginx HTTP root/CSS/entry JS and all lazy viewer/effects/engine assets load; campaign HQ text present in bundle |
| Container users | PASS (metadata) | Web configured as user 101; API configured as game; both containers running |
| CORS | PASS | API container preflight from QA web origin returns 200; unit test rejects foreign origin |
| Campaign | PASS (logic) | Original full 5-mission action/tick run now verifies all best records and attempt count; failure/retry, replay no duplicate rewards, unlocks, research/resource costs |
| Persistence | PASS | Legacy career normalization, new history/job validation, completion saved immediately, quota failure retains memory state, preparation checkpoint and backup/recovery |
| Clock | PASS | Pause/planning, speed multipliers, deterministic continuation; decimal 0.1-second accumulation regression fixed/tested |
| Graphics structure | PASS (CPU/DOM only) | Geometry/raycast/data-texture/pass lifecycle/fallback tests; not actual GPU rendering |
| Runtime npm audit | PASS (limited) | `npm audit --omit=dev --audit-level=high`: reports 0 known vulnerabilities at test time. Not a whole-application security audit |
| Browser/WebGL/FPS | NOT VERIFIED | Actual pixels/shaders/camera feel/layouts/memory/FPS and browser matrix still need supported browser QA |
| Podman/VPS rollout | NOT VERIFIED | No SSH/VPS changes in this task; Docker QA does not establish owner-hosted rollout |
| Final original GDD content | PARTIAL | Procedural art/one campaign; see RELEASE_READINESS.md |

Unique automated suite: 64 frontend tests + 7 API tests + 1 real HTTP test = 72. The HTTP test was exercised against both host-run API/Postgres and container API/Postgres; repeated executions are not counted as new distinct tests. CI now provisions PostgreSQL for that test.

Build sizes: main JS ~303 KB (95 KB gzip), viewer ~24 KB (10 KB gzip), effects ~38 KB (9 KB gzip), Three engine ~540 KB (140 KB gzip), CSS ~41 KB (10 KB gzip). The engine retains a >500KB advisory. These are bundle sizes, not FPS evidence; lazy assets are requested with the viewer and all must be deployed together.

Dockerfiles support an optional proxy_ca build secret for dependency-install trust without copying it into images. Image builds and runtime smoke checks used the managed daemon's local socket explicitly. PostgreSQL was initialized in a disposable database; no production data was touched. Initial schema creation was tested; there are no DB column changes in this release.

The managed Sites skill requires cua_repl.js, which is not available. Its instruction is: “If cua_repl.js is unavailable, skip browser QA: do not start a preview server, install a browser, or improvise another browser-control path.” Source: skill://plugin_connector_1p_689987207de08191979cf68eca2941c6/sites/SKILL.md. The Nginx/API containers were tested via HTTP only, not through an improvised browser-control path. No render screenshot or frame-rate result is claimed.

Starlette TestClient emits an anyio.BlockingPortal dependency deprecation warning; tests pass. Full production security/load/backup-restore review has not been performed. Original beta release gate is not marked complete; read RELEASE_READINESS.md.
