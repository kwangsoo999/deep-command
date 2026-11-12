# AI handoff

Read this and PROJECT_INDEX.md before editing. Product: DEEP COMMAND — Silent Ocean; single-player fictional submarine game, Vietnamese interface, local-first playable alpha.

## Important files

- `src/simulation.ts`: typed state, seeded RNG, missions/upgrades, clock, actions, serialize/restore. No React or network dependency. Keep domain rules here.
- `src/store.ts`: Zustand boundary, persistence, scheduler hook interface.
- `src/App.tsx`: stations/map/sonar/dialogs/HUD and effects. Large; split before major new UI features.
- `src/CommandRoom.tsx`: lazy procedural Three.js scene and resource lifecycle.
- `src/style.css`: layout, design tokens, breakpoints/reduced motion.
- `tests/simulation.test.ts`: clock/determinism/full 5-mission run/save validation.
- `tests/ui.test.tsx`: actual DOM actions, pause/scan/verify/waypoint/save controls.
- `backend/main.py`: account/profile/save API; optional and not connected to UI.
- `backend/test_api.py`: SQLite-memory ownership/auth/validation tests.
- `.github/workflows/ci.yml`: Node/Python checks.

## Rules

Preserve working core and save schema; add migrations before changing saved state. Do not put simulation logic into React effects. No real-world targeting/navigation/acoustic model. Do not represent procedural models as finished realistic assets, or DOM tests as browser/WebGL tests. No secrets or .env in Git. Keep local simulation/data source labels truthful.

## Current limits

See PROJECT_STATUS and QA_REPORT. Most significant: no actual browser/WebGL/FPS verification, no deployed game URL, cloud API not wired into UI, no real PostgreSQL/Docker runtime evidence, no migration pipeline or final art. Rank unlocks/advanced crew/branching/intel conflict are absent. No claim of full beta.

## How to continue

Run README commands; execute tests before/after changes. Begin browser QA when approved runtime tools are available, then component extraction and auth/cloud save integration. Avoid rebuilding the repository from scratch. Update CHANGELOG and evidence-backed docs when scope changes. API auth tests use SQLite; add Postgres tests before deployment. Resource values and upgrades intentionally fictional and balance is preliminary.
