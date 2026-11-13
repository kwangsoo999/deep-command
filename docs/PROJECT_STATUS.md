# Status and roadmap — 0.3.0 alpha

This is a new implementation based on the supplied design. No previously accepted phase was available. Status refers to code and checks in this repository, not every item in the long-term brief.

| Original phase | Implemented | Remaining / verification |
| --- | --- | --- |
| 01 Foundation | React/TS/Vite/Tailwind/Zustand; Three.js deck/ocean viewer; clock; menus/settings; basic API; account/cloud UI | WebGL runtime, camera station picking and visual layout QA; FPS; realistic GLB/PBR; ambient audio |
| 02 Simulation | seeded fixed step; map pan/zoom/layers; waypoint; contacts/scan; intel expiration; events; save/import/export | source conflict logic, lost-contact lifecycle, richer department model; browser testing |
| 03 Gameplay | 5-mission progression; goals/results/rewards; 6 officers; fatigue/train/rest; 8 shared-template incidents; 10 upgrades | recruitment/assignment/promotion, branches, rank unlocks, more diverse incident choices, broader balance QA |
| 04 Content/visual | original SVG map and vessel diagram; detailed procedural deck, live console textures, underwater exterior/shader, camera presets; lazy load; optional UI beep | realistic assets/characters/ocean, voice/music, cinematics, LOD, FPS profiling |
| 05 Release | build, unit/DOM/API checks; CI with real HTTP cloud round trip; revision conflict protection; Docker/Postgres config; run docs | PostgreSQL/Docker runtime, migrations, browser matrix, security review/load tests, hosted release |

No full phase is represented as final approved/beta complete. A playable campaign core is implemented and automatically tested.

## Next priorities

1. Browser QA at 1920×1080, 1600×900, 1366×768 and tablet. Validate map SVG pointer math, focus, overlays, 3D station raycasting and WebGL cleanup/performance.
2. Extract map, station panels and dialogs from App.tsx into components; retain deterministic simulation API and save compatibility.
3. Extend cloud saves with per-slot history/account recovery after production hardening; current login/manual cloud sync/conflict protection is implemented and tested.
4. Run PostgreSQL integration tests and compose smoke test; introduce reviewed Alembic migration, backup/restore, reverse-proxy body limits, distributed rate limiting.
5. Commission/license realistic GLB assets, texture pipeline, crew animation, sound and benchmark on target hardware.
6. Extend contact lifecycle/conflicting intel, rank progression, richer crew and incident mechanics; re-balance campaign with playtesting.

Do not call this beta until the original release gate has real evidence.


## v0.2 delivery

AccountPanel extracted from App for the new feature. Registration/login/logout, manual cloud save/load, remote metadata, conflict handling, in-memory sessions, local backup and recovery are implemented. Tested via component/client/API checks plus a real FastAPI HTTP round trip on disposable SQLite. PostgreSQL, public API rollout and browser/WebGL QA remain unverified. No claim of beta readiness.

Owner-hosted frontend tank.daitan.site is reachable (read-only HTTP/title check). Prepared Podman backend/database and Cloudflare path-routing templates preserve existing web origin 18088. API route currently returns 404; no VPS SSH or rollout has been performed.

## v0.3 graphics delivery

Implemented a new deck/ocean viewer with read-only simulation data, direct station commands, camera views and context recovery. Added assembly/raycast/resource/pause and fallback tests. Still not verified with a real WebGL renderer/browser and no FPS claims. See VISUALS.md.
