# QA report — 2026-11-14 / v0.9.2

## Automated and observed evidence

| Area | Result | Scope |
| --- | --- | --- |
| Frontend/domain/DOM | PASS | 68 tests; one separately configured HTTP test skipped in default npm test |
| API unit suite | PASS | 7 tests with SQLite; API behavior unchanged apart from version metadata |
| HTTP/PostgreSQL | Covered by CI | Existing real-service test includes ownership/concurrent save conflicts; no production account/save mutation for this browser task |
| Production build | PASS | TypeScript/Vite; viewer/effects/engine remain lazy |
| Live browser campaign | PASS with documented workaround | Deployed tank.daitan.site 0.9.0, 5/5 grade S and localStorage reload. Final Order used keyboard contact selection after pointer defect was reproduced |
| Candidate browser campaign | PASS | Five missions via actual UI including mouse contact selection; saved final campaign and best records reloaded |
| Candidate WebGL | PASS in tested renderer | Deck/ocean at 1366×768 high, 1920×1080 high, 390×844 low; desktop bow/sail/stern and three looks; shader/page/console errors absent and WebGL2 getError()=0 |
| Picking/context recovery | PASS in tested cases | Actual canvas click after navigation preset opens Navigation at each viewport. Context loss injected and renderer rebuilt in the 1366 viewport |
| Layout/framing | PASS in tested cases | No horizontal overflow, portrait hull fits projection bounds and observed screenshot; immersive panel avoids page footer crossing scene |
| Resource requests | PASS candidate | No unexpected HTTP errors; favicon SVG added after deployed favicon.ico 404 was identified |
| Hardware FPS/memory | NOT VERIFIED | SwiftShader software rendering and controlled game timers are not hardware performance benchmarks |
| Other browsers/devices | NOT VERIFIED | Chromium viewport coverage is not real-phone/Safari/Firefox/Edge certification |
| Production rollout | NOT PERFORMED | Repo updated; no SSH/VPS modification from this task |

Browser setup: Playwright 1.62.1 with installed Chromium 156.0.8078.79, ANGLE/SwiftShader. Managed proxy settings retained, TLS verification enabled. Live tests used isolated browser profiles and localStorage only. Virtual timers accelerated campaign gameplay through UI, not by injecting simulation state. Graphics checks ran with real-time browser rendering in separate contexts. See BROWSER_QA.md and screenshots for detailed evidence and known baseline workaround.

Core suite totals: 68 frontend tests + 7 API tests + 1 real HTTP integration = 76, plus the browser scenarios described separately above. Do not add screenshots or repeated viewport runs to the unit-test total.

Build: main JS ~303 KB, viewer ~29 KB, effects ~38 KB, Three engine ~540 KB, CSS ~42 KB before compression. Engine still has a >500KB advisory; all chunks must be deployed together. This is not FPS evidence.

Earlier sessions reported browser QA unavailable because they carried a Sites-hosting workflow limitation into this custom VPS/repository task. The cloud runtime supports automated Playwright and system Chromium was available; this task exercised it and replaces that blanket verification gap with the specific scope above. Interactive desktop control is still not offered, but it is not required for these automated tests.

0.9.0 Docker/PostgreSQL image/runtime smoke evidence remains documented in release history; this task did not rerun Podman/VPS packaging acceptance. Public-folder copy was added to the web Dockerfile so favicon assets are included in future images. Full GDD art/content and production load/backup/security review remain open in RELEASE_READINESS.md. No zero-defect/60-FPS/full-beta claim is made.


## 0.9.2 verification detail

Fresh live graphics-only smoke (2026-11-14) passed deck/ocean/picking/no-overflow at all three viewports; live API/frontend remain 0.9.0 and old favicon 404 is still present. The 5-mission live campaign row above is the earlier 2026-11-13 result, not a second live campaign run.

Local 0.9.2 full browser suite passed 5/5 grade S and persistence reload, plus the expanded graphics checks. The final backdrop toneMapped=false correction was followed by another graphics sweep to cover direct low mode. Frontend 68/68 and API 7/7 passed; PostgreSQL HTTP integration runs in CI. No new test cases are added to the unit total: existing geometry/pipeline tests now include swept fins and fog/backdrop consistency. Build retains the advisory for the lazy Three engine >500 KB.
