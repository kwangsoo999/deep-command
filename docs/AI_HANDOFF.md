# AI handoff

Read this and PROJECT_INDEX.md before editing. Product: DEEP COMMAND — Silent Ocean; single-player fictional submarine game, Vietnamese interface, local-first playable alpha.

## Important files

- `src/simulation.ts`: typed state, seeded RNG, missions/upgrades, clock, actions, serialize/restore. No React or network dependency. Keep domain rules here.
- `src/store.ts`: Zustand boundary, persistence, one-slot import backup/recovery, scheduler hook interface.
- `src/AccountPanel.tsx`: login/register/cloud UI, explicit sync confirmation.
- `src/cloud.ts`: API boundary, in-memory token/profile, timeout, conflict/expiry handling.
- `src/App.tsx`: stations/map/sonar/dialogs/HUD and effects. Large; split before major new UI features.
- `src/CommandRoom.tsx`: lazy deck/ocean viewer, OrbitControls, camera transitions, context recovery and direct station actions.
- `src/graphics/scenes.ts`: Three.js assembly builders, canvas console textures, pause-aware visual clock and deduplicated resource disposal.
- `docs/VISUALS.md`: rendering scope and QA limits.
- `src/style.css`: layout, design tokens, breakpoints/reduced motion.
- `tests/simulation.test.ts`: clock/determinism/full 5-mission run/save validation.
- `tests/ui.test.tsx`: actual DOM actions, pause/scan/verify/waypoint/save controls.
- `backend/main.py`: account/profile/save API; optional; UI uses it when VITE_API_URL is configured.
- `backend/test_api.py`: SQLite-memory ownership/auth/validation tests.
- `.github/workflows/ci.yml`: Node/Python checks.

## Rules

Preserve working core and save schema; add migrations before changing saved state. Do not put simulation logic into React effects. No real-world targeting/navigation/acoustic model. Do not represent procedural models as finished realistic assets, or DOM tests as browser/WebGL tests. No secrets or .env in Git. Keep local simulation/data source labels truthful.

## Current limits

See PROJECT_STATUS and QA_REPORT. Most significant: no actual browser/WebGL/FPS verification, existing tank.daitan.site frontend/API last read-only verified at v0.3.0, no real PostgreSQL/Docker runtime evidence, no migration pipeline or final art. Rank unlocks/advanced crew/branching/intel conflict are absent. No claim of full beta.

## How to continue

Run README commands; execute tests before/after changes. Begin browser QA when approved runtime tools are available, then more component extraction and production cloud infrastructure. Avoid rebuilding the repository from scratch. Update CHANGELOG and evidence-backed docs when scope changes. API auth tests use SQLite; add Postgres tests before deployment. Resource values and upgrades intentionally fictional and balance is preliminary.


## v0.2 contract

Read CLOUD_SAVE.md before altering persistence. Save schema stays v1. Existing DB columns are unchanged; updated_at is the optimistic concurrency revision. Every PUT update must include exact expected_revision from GET/previous PUT. Never retry 409 blindly or silently overwrite local gameplay on download. Tokens must remain outside localStorage/game exports. Backup must persist before replacing game state. CI backend job starts a disposable service and runs tests/cloud.integration.test.ts over real HTTP; ordinary npm test intentionally skips this test unless VITE_TEST_API_URL is provided.


## Owner's VPS

Owner reports existing Podman/Quadlet service deep-command.service, local web origin 127.0.0.1:18088, Cloudflare Tunnel. Read deploy/VPS_TANK.md. Screenshot deployment files are not in remote main; preserve VPS-local configuration. Public root/assets/API were read-only verified at v0.3.0 after owner rollout; protected profile/save returned 401 without login. No configured SSH/VPS write access exists in this task environment. Prepared backend origin is 127.0.0.1:18089 with same-host /api/ tunnel routing; this is a proposal, not an executed rollout.

## v0.3 graphics

Graphics consumes State read-only through a ref, so 1-second UI updates do not rebuild WebGL. Presentation time freezes under pause/planning; camera stays interactive. Five camera presets in deck and one exterior preset. Preserve disposeScene deduplication and dispose controls/observer/RAF/listeners on switching scene/quality. No new save fields. WebGL context loss exposes reload UI. Assembly and DOM-fallback tests do not prove rendered output or FPS.


## v0.4 graphics

`graphics/appearance.ts` owns deterministic generated DataTextures (albedo/normal/roughness, equirectangular reflection and bubble alpha) and onBeforeCompile water light. Color maps/reflection are sRGB; normal/roughness are non-color. Keep texture/shadow/InstancedMesh disposal intact. Caustic shader is tested against Three's standard shader anchors, not compiled by a real GPU in current QA. Additional exterior camera presets and exposure/HUD controls are presentation-only and do not change save schema. Terrain is artistic, not geographic data. See VISUALS.md.

## v0.5 graphics

models.ts owns fictional curved hull/sail/blade geometry and analog gauges. cinema.ts owns high-quality composer passes and low-quality direct rendering. Maintain OutputPass last for color management and dispose each pass plus composer. Do not claim mock-composer tests establish framebuffer/shader/browser correctness. Look/exposure selections are ephemeral presentation settings; save schema stays v1. Keep line geometry/material disposal (analog tick marks).


## v0.9 campaign completion pass

Read RELEASE_READINESS.md before describing release status: the functional campaign loop is complete, not the full original realistic beta. career.ts defines additive Career data, ranks and technologies. CampaignPanel is HQ/preparation; IncidentPanel is three-way response UI. State.career is initialized on new saves; restore adds empty defaults for legacy v1 saves and validates new records/jobs. No DB columns or envelope version changed. Do not invent older best scores. Preserve first-completion-only rewards and score-zero reward on replay.

Base preparation starts hull/power/supplies at minimum 80/60/60 and preserves larger reserves. Crew incident jobs use game ticks and serialize their remaining time. Store persists debrief transitions immediately; persistence failure retains game state and sets saveError. Mission change UI checkpoints before dispatch. One backup slot is shared with imports; do not promise full history.

CI API unit tests still use SQLite; HTTP integration now uses a real PostgreSQL service and concurrent writers plus cross-account isolation. Web/API Docker images were built/run in local QA; this is not Podman/VPS acceptance. Optional proxy_ca build secret extends trust only within the install RUN and is not copied into the image. vite.config manual chunks keep Three engine/effects/viewer lazy; ship all dist assets together.
