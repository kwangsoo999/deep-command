# QA report — 2026-11-12

Target: DEEP COMMAND 0.1.0 local-first alpha. Tested on Node 24.22.1, Python 3.12.14, Linux. Evidence is command results, not assumptions from file existence.

| Check | Result | Evidence / scope |
| --- | --- | --- |
| Frontend unit/DOM | PASS | `npm test`: 17/17 tests, 2 files |
| Production build | PASS | `npm run build`: TypeScript + Vite, no build errors |
| API tests | PASS | `.venv/bin/pytest -q backend/test_api.py`: 3/3, SQLite memory database |
| Clock pause/plan/speeds | PASS | frozen full state; resume; 1/2/4 speed; frame partition comparison |
| Seed/save continuation | PASS | deterministic events and restored future state; no duplicate events |
| Full campaign | PASS (logic) | 5 missions completed using actions/ticks; rewards once, next unlock, final completion |
| DOM interactions | PASS | briefing/start/stations; Space pause; scan/verify/waypoint controls; manual save/load |
| Auth/privacy | PASS (tested scope) | register/login, duplicate user, invalid password, unauthorized access, cross-player save isolation, logout revocation |
| Invalid import | PASS (tested scope) | malformed schema, invalid confidence and missing contacts rejected |
| 3D, pointer/raycast, layouts | NOT VERIFIED | actual browser/WebGL QA not run |
| FPS/memory/Chrome/Firefox/Edge | NOT VERIFIED | no performance or cross-browser evidence |
| Docker/PostgreSQL | NOT VERIFIED | configuration only; API tests use SQLite |
| GitHub access | VERIFIED | Owner created private repository kwangsoo999/deep-command; current integration reports pull/push permission. Remote upload is verified separately after push. |

Build output after lazy loading: main JS ~282 KB (89 KB gzip), Three.js room chunk ~494 KB (127 KB gzip), CSS ~29 KB (8 KB gzip). These are bundle sizes, not network/FPS benchmarks. UI beep tested only by code/build, not audible playback. No browser preview server was started.

The managed Sites workflow requires `cua_repl.js`; no such callable tool was available. Its instruction is: “If cua_repl.js is unavailable, skip browser QA: do not start a preview server, install a browser, or improvise another browser-control path.” Source: `skill://plugin_connector_1p_689987207de08191979cf68eca2941c6/sites/SKILL.md`. DOM tests do not replace this visual/runtime check.

## Corrections during implementation

- Split Three.js into a lazy-loaded room to avoid loading 3D for the tactical UI.
- Added field/array validation to imported saves.
- Prevented background interaction while overlays open; added dialog semantics and keyboard focus trapping.
- Scoped UI test through accessible dialog content after discovering overlapping save control names; all final tests pass.

## Remaining risks / scope limits

- Alpha is not release-certified. Browser/WebGL QA must precede user-facing beta.
- Original brief includes realistic art, full crew/rank branches, migration lifecycle and cloud persistence UI; these are still pending, detailed in PROJECT_STATUS.
- Cloud API is optional and not connected to current local UI. API save payload checks are basic; public deployments need body caps, stronger deployment hardening and authoritative validation if adding competitive features.
- Starlette TestClient reports one dependency deprecation warning about anyio.BlockingPortal; no test failure.

No blanket “zero defects” claim is made. Initial GitHub repository creation was denied by integration permissions. The owner subsequently created the private repository and enabled access; pull/push permissions have now been verified. Repository creation was not an automatic approval-review rejection.
