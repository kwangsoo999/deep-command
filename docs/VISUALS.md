# Graphics v0.9.1 — implementation reference

## What changed

`CommandRoom.tsx` now provides a deck/exterior viewer. `graphics/scenes.ts` creates actual Three.js meshes, materials, light sources, shader and dynamic console textures. No illustration is passed off as a 3D scene; no third-party models or photos were downloaded.

Deck: curved interior shell, ribs, grated/planked floor treatment, bulkhead wheel, four stations with keypads and labeled data screens, chairs, pipes, vents, central plotting table, observation mast, warm ceiling fixtures and cyan strips. High quality enables one shadow-casting spotlight; incident lights use game/presentation time.

Exterior: original curved Aurora hull with seam rings, sail, masts, fins and seven-blade propeller. Underwater fog, transparent animated surface shader, light-shaft meshes and deterministic suspended particles add depth. It is an artistic game model, not an engineering reconstruction or final asset.

## Interaction

- Switch deck/ocean with top buttons. Camera presets select all stations or full deck; transition uses exponential interpolation. OrbitControls handles drag/zoom/touch.
- Deck camera position is bounded inside an approximate elliptical hull and behind front consoles. This is a visual bound, not general collision detection.
- Click a console screen to open its station; keyboard-accessible station buttons offer the same action. Direct scan/waypoint commands call the existing simulation dispatch and retain normal cost/pause rules.
- Displays paint navigation/contacts/reports/hull/power from the actual State. A state identity change refreshes textures even when no clock tick occurred.
- Ocean motion, particles, propeller and alert pulsation use a presentation clock bounded to the current game second. It never advances simulation, resets after restoring older time and freezes under paused/planning. Camera remains usable during pause.
- Low quality disables antialiasing/shadows, caps DPR at 1, reduces ocean subdivisions and particle count (180 vs 650). High quality caps DPR at 1.5. These are quality policies, not performance guarantees.
- Missing WebGL shows an error and retains non-WebGL actions. Context loss stops rendering and offers rebuild. Resource cleanup deduplicates shared geometries/materials/textures and releases shadow targets, OrbitControls, resize observer, listeners, RAF and renderer.

## Art limits and verification

Models/materials are still procedural. There are no GLB assets or scanned PBR texture sets, animated crew, HDR environment maps, authored cinematics or final sound assets. Shader light shafts are stylized translucent geometry, not volumetric simulation.

Automated assembly tests verify station raycasts from presets, live display refresh, exterior construction, lower particle count, visual time semantics and deduplicated disposal. DOM tests deliberately simulate unavailable WebGL and verify accessible actions/error state. None of these renders pixels.

Chromium software-render screenshots and selected control/context-recovery checks are now available in BROWSER_QA.md. Broader shader/device compatibility and hardware FPS/memory profiling remain required. Current automated Chromium/SwiftShader render/control/screenshots are recorded in BROWSER_QA.md. Older CPU-only verification notes below describe earlier milestones; hardware FPS remains unverified.


## v0.4 surface and atmosphere pass

Original generated RGBA DataTextures provide albedo, tangent-space normals and roughness for steel and acoustic tiles (256² high, 128² low). Color maps are sRGB; normal/roughness maps remain non-color. A generated LDR equirectangular map gives environmental reflection; it is not an HDR photograph or scanned asset. Three.js performs its usual environment processing at render time.

Hull material augments the standard emissive shader chunk with artistic water-light patterns in world space. Shader uniforms use the existing paused presentation time. Tests verify anchor replacement against the installed Three ShaderLib, but do not establish GPU shader compilation or rendered appearance.

Seabed is a deformed plane and an InstancedMesh rock group (48 high/16 low). Particle alpha is a generated soft texture; wake appears only while a waypoint is active. Terrain, effects and submarine shape are fictional decoration. Ocean camera height is bounded above the seabed/below the surface.

Exterior presets now include bow/sail/stern. Exposure range 0.7–1.8 and Hide HUD let players inspect details without changing saved game settings or progression. Low quality reduces generated texture resolution and scene budgets. Shared textures, reflection maps and instance resources are explicitly disposed on scene changes. No new save/database fields.

Four added appearance tests check deterministic texture data, color-space handling, encoded normals, quality dimensions, bubble alpha, shader injection anchors and lifecycle of terrain/wake/environment resources. Viewer DOM tests cover close-up buttons/exposure/HUD state without WebGL. Real lighting/material review, screenshots and FPS remain unverified.


## v0.5 silhouette and cinema pass

`graphics/models.ts` contains the fictional hull spline/LatheGeometry, beveled sail profile, curved propeller blade profile and analog gauges. High/low variants use different subdivisions. No engineering dimensions or external models are used. Gauges consume hull/power read-only; line tick geometry/materials are now included in disposal.

`graphics/cinema.ts` owns high-quality EffectComposer passes: RenderPass → UnrealBloomPass → color-grade/vignette ShaderPass → OutputPass. Bloom defaults mild; natural disables it and sets grade/vignette to zero. OutputPass handles tone mapping/output color space. Every pass and composer target is disposed on scene/quality changes; resizing follows viewport dimensions.

Low quality allocates no composer/passes and renders the scene directly. All three looks still change exposure/fog tint in that mode; the UI labels it LIGHT MODE / NO POST FX. Look selection is presentation-only, not saved gameplay data. Bloom adds render-target/bandwidth costs; no FPS guarantee is made. Renderer setup, GPU framebuffers and pixels have not been verified in an actual browser.

Geometry tests check finite positions, subdivision differences and tapered shape; gauge tests check data-driven needles. Pipeline tests mock the composer to check pass ordering, sizing, natural-mode disable and ownership/disposal. They do not execute GPU postprocessing. Existing picking, save, campaign and fallback tests still run.


## 0.9.1 observed rendering pass

Actual Chromium/SwiftShader rendering exposed hard light-shaft edges, excessive dark fill/reflection striping and portrait cropping. Shafts now fade by view-normal angle/height; ocean surface includes Three fog chunks; reflection strips are reduced for the ocean environment. Fill lights and CSS overlay opacity were adjusted. Exterior default camera is closer with a tighter lens; narrow aspect scales distance and widens lens, while deck widens its portrait lens.

Immersive panel expands within the browser viewport, traps focus, exits with Escape and has direct pause/resume. Renderer resources are resized rather than recreated for expansion. See BROWSER_QA.md for actual shader/control/screenshot evidence; earlier unverified-render statements above are historical. Hardware FPS and broad device coverage remain open.
