# Changelog

## 0.9.1 — 2026-11-13 / browser-led visual fixes

- Tested deployed 0.9.0 in actual Chromium, completed five missions and restored persisted campaign using keyboard contact selection as a baseline workaround.
- Fixed SVG contact hit area and Space selection propagation; candidate mouse-based playthrough passes.
- Added SVG favicon and production image copy of public assets.
- Increased deck fill, softened water shafts and surface fog, reduced exterior reflection banding, adjusted exterior lens/portrait framing.
- Added immersive 3D panel with Escape/focus handling and in-view pause/resume.
- Added repeatable Playwright campaign/render/picking/context-loss tests and browser CI artifact evidence. Software WebGL is not a hardware FPS benchmark.

## 0.9.0 — 2026-11-13 / campaign completion pass

- Added campaign HQ with mission unlock/replay, preflight fleet/crew access, ranks, personal best records, resupply and research.
- Added timed crew response and emergency stabilization incident options; timers pause/restore correctly.
- Prevented replay reward duplication and saved mission results immediately; checkpoint before mission changes.
- Added backward-compatible v1 career defaults and stricter history/job validation. Older saves retain existing XP/completions; missing old best scores are not fabricated.
- Added real PostgreSQL/concurrent-save HTTP checks, CI PostgreSQL service, Docker web/API runtime smoke QA and optional build CA mount support.
- Split lazy graphics resources into viewer/effects/engine chunks for caching; main UI remains separate.
- Added playthrough/readiness documentation with explicit remaining beta gates. No production deployment or browser/FPS claim.

## 0.5.0 — 2026-11-13

- Replaced capsule hull/box sail/rectangular propeller blades with curved lathed hull and beveled authored sail/blade silhouettes.
- Added analog hull/power gauges driven from live game state.
- Added high-quality render/bloom/color-grade/output pipeline with mild vignette and three visual looks; low quality renders directly.
- Added geometry validity/quality/taper tests, pipeline order/lifecycle tests and visual-style controls tests.
- Save/API contract unchanged. Pixel appearance, GPU shader compilation and FPS remain unverified; no production rollout performed.

## 0.4.0 — 2026-11-13

- Added original procedural albedo, normal and roughness maps for brushed steel/acoustic hull and generated reflection environment.
- Added shader water-light pattern on hull, seabed terrain, instanced rocks, soft particle textures and navigation-driven propeller wake.
- Added bow/sail/stern camera presets, exterior height bounds, exposure adjustment and clean HUD viewing.
- Added texture/color-space/normal/disposal/shader-anchor tests and viewer controls tests; no save or API contract change.
- All graphics remain procedural and actual rendered appearance/FPS has not been verified in this environment.

## 0.3.0 — 2026-11-13

- Rebuilt procedural command deck with curved hull/ribs, detailed consoles, plotting table, fixtures, chairs and mixed warm/cool lighting.
- Added live canvas-texture console displays driven by current simulation state; incident lighting follows pause-aware presentation time.
- Added underwater Aurora scene with procedural hull/fins/masts/propeller, ocean shader, suspended particles and light shafts.
- Added camera presets with smooth transitions, orbit/zoom, deck camera bounds and reset.
- Added direct sonar/navigation actions, keyboard-accessible station shortcuts, low-quality rendering, context-loss recovery and WebGL fallback.
- Added assembly/raycast/disposal/presentation-clock and fallback UI tests; no save/database schema change.
- Runtime visual quality/FPS remains unverified; no final realistic asset claim.

## 0.2.0 — 2026-11-13

- Added registration/login/logout UI and explicit cloud save/load through optional configured FastAPI.
- Added atomic revision checks to prevent another device's save from being overwritten; DB columns and offline save v1 remain unchanged.
- Added pre-import/pre-download local backup and recovery; storage failure preserves active state.
- Added pre-parse API body limits for direct reverse-proxy deployments.
- Added client timeout, session expiry handling, memory-only tokens and cloud busy/error/success states.
- Added stronger save identity validation, client/component/API tests and real HTTP integration test in CI.
- Added VITE_API_URL build/Compose configuration and cloud setup documentation.
- Prepared Podman/PostgreSQL Quadlets and Cloudflare /api path routing for owner-hosted tank.daitan.site; existing service is preserved. No public API deployment is implied.

## 0.1.0 — 2026-11-12

- Initial project from supplied DEEP COMMAND design.
- Added fictional seeded simulation, pause/plan, 1×/2×/4× and save/restore.
- Added five-mission Northern Horizon campaign, results, resources, crew actions, incidents and upgrades.
- Added tactical SVG map, sonar, intel, engineering, fleet and command log.
- Added lazy procedural Three.js room and opt-in generated interface beep.
- Added local autosave/manual save and JSON export/import validation.
- Added optional FastAPI/SQLAlchemy auth/profile/save service and Docker/PostgreSQL configuration.
- Added simulation/DOM/API tests, GitHub Actions CI and handoff documentation.
- Alpha limitations are listed in docs/PROJECT_STATUS.md; no claim of beta or final realistic art.
