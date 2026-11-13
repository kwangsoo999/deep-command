# QA report — 2026-11-13 / v0.5.0

Tested on Node 24.22.1, Python 3.12.14, Linux. Evidence is command output, not file existence. Earlier CI runs passed; results below describe the current source and explicitly separate CPU/DOM checks from rendering.

| Check | Result | Evidence / scope |
| --- | --- | --- |
| Frontend simulation/client/DOM | PASS | `npm test`: 50 passed, one optional HTTP test skipped by default |
| Real HTTP integration | PASS | `VITE_TEST_API_URL=http://127.0.0.1:8012 npm exec vitest -- run tests/cloud.integration.test.ts`: 1 passed against running FastAPI and disposable SQLite |
| API tests | PASS | `.venv/bin/pytest -q backend/test_api.py`: 7 passed, SQLite memory DB |
| Production build | PASS | TypeScript/Vite production build |
| Full campaign/clock/save core | PASS | Original 5-mission action/tick run; pause/plan/speeds, deterministic seed, save continuation remain passing |
| Account UI | PASS (DOM) | Registration/login, confirmation before upload/download, conflict lockout, backup recovery, briefing access without starting mission |
| Cloud client | PASS | Bearer headers, memory-only session, expiry/logout handling, malformed downloaded state, no-backend behavior and conflict error; no automatic retry |
| Revision/ownership/CORS | PASS | stale revision blocked, exact revision updates, per-player isolation, logout revocation, CORS preflight and pre-parse oversized-body rejection |
| Import/storage failure | PASS | bad identity/schema rejected; failed backup/save does not replace active game |
| Browser/WebGL/layout/FPS | NOT VERIFIED | no browser QA or benchmark evidence; DOM tests are not a rendering/performance test |
| Docker/Podman/PostgreSQL | NOT VERIFIED | templates/configuration only; database tests use SQLite; Docker Compose config passes static validation |
| Existing public site | READ-ONLY VERIFIED | tank.daitan.site root returns HTTP 200 and DEEP COMMAND title; /api/version returns 404 at inspection. No VPS rollout performed. |

Total executed checks: 50 frontend tests + 1 HTTP integration test + 7 API tests = 58 checks in the CI suite. Default npm test intentionally skips the HTTP test unless VITE_TEST_API_URL targets a disposable service. CI backend job now starts that service and runs the HTTP test explicitly.

Build: main JS ~292 KB (92 KB gzip), Three.js/viewer lazy chunk ~601 KB (158 KB gzip), CSS ~39 KB (10 KB gzip). These are bundle sizes, not FPS/network measurements. Backend ephemeral HTTP QA service uses a disposable SQLite file under work/, outside source. No production account, database or domain was modified by these tests.

The managed Sites skill requires `cua_repl.js`; it is not offered in this environment. Its exact instruction is: “If cua_repl.js is unavailable, skip browser QA: do not start a preview server, install a browser, or improvise another browser-control path.” Source: `skill://plugin_connector_1p_689987207de08191979cf68eca2941c6/sites/SKILL.md`. No browser preview server was started. FastAPI was started only for the HTTP integration test.

## Scope limits

- Cloud UI/API is implemented but the public site's API is not yet routed. See deploy/VPS_TANK.md for prepared Podman/Cloudflare steps; VPS SSH is not configured in this task environment.
- PostgreSQL and Podman templates are not runtime verified. No DB schema change was made in v0.2; existing updated_at is used as revision.
- Cloud API save validation is envelope/version/size validation; full game validation occurs on client import. Personal saves are not authoritative competitive state.
- Realistic art, advanced crew/rank mechanics, broader balance and beta gates remain pending in PROJECT_STATUS.
- Starlette TestClient emits one anyio.BlockingPortal dependency deprecation warning; no test failure.


## v0.3 graphics checks

Five scene/geometry tests verify console picking from presets, live data texture refresh without clock ticks, exterior scene state isolation, particle budget, shared-resource disposal and visual pause/restore behavior (some tests group related assertions). Two additional DOM tests simulate unavailable WebGL and check station/scan/waypoint actions and scene-mode switching. These tests do not create a real renderer or verify visual quality. Production build emits a >500KB lazy-chunk advisory for the graphics module; it is only requested when opening the 3D viewer and does not add this chunk to initial tactical UI loading. No render screenshot/FPS/memory evidence exists.


## v0.4 appearance checks

Four additional tests validate deterministic material map bytes, correct data/color spaces, near-unit encoded normals, low/high budgets, particle alpha, water-light injection using the installed standard shader chunks, terrain/wake behavior and disposal of environment/instance resources. A further DOM test verifies exterior camera controls and presentation-only exposure/HUD adjustments. These remain CPU/DOM tests; no GPU shader compilation or pixel/FPS claim is made. No production deployment was performed.


## v0.5 geometry and postprocessing checks

Three additional model tests check finite geometry, lower quality vertex budgets, tapered hull and live gauges; two mock-composer tests check direct low-quality rendering, high-quality pass order, look parameters, resize and disposal. An added viewer DOM test checks look selection without changing gameplay. GPU framebuffers, bloom/grade shaders and actual material/light balance remain unverified. The larger lazy chunk now contains Three postprocessing examples; initial tactical UI loading remains separate.
