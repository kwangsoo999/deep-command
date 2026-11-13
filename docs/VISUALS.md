# Graphics v0.3 — implementation reference

## What changed

`CommandRoom.tsx` now provides a deck/exterior viewer. `graphics/scenes.ts` creates actual Three.js meshes, materials, light sources, shader and dynamic console textures. No illustration is passed off as a 3D scene; no third-party models or photos were downloaded.

Deck: curved interior shell, ribs, grated/planked floor treatment, bulkhead wheel, four stations with keypads and labeled data screens, chairs, pipes, vents, central plotting table, observation mast, warm ceiling fixtures and cyan strips. High quality enables one shadow-casting spotlight; incident lights use game/presentation time.

Exterior: original capsule-based Aurora hull with seam rings, sail, masts, fins and seven-blade propeller. Underwater fog, transparent animated surface shader, light-shaft meshes and deterministic suspended particles add depth. It is an artistic game model, not an engineering reconstruction or final asset.

## Interaction

- Switch deck/ocean with top buttons. Camera presets select all stations or full deck; transition uses exponential interpolation. OrbitControls handles drag/zoom/touch.
- Deck camera position is bounded inside an approximate elliptical hull and behind front consoles. This is a visual bound, not general collision detection.
- Click a console screen to open its station; keyboard-accessible station buttons offer the same action. Direct scan/waypoint commands call the existing simulation dispatch and retain normal cost/pause rules.
- Displays paint navigation/contacts/reports/hull/power from the actual State. A state identity change refreshes textures even when no clock tick occurred.
- Ocean motion, particles, propeller and alert pulsation use a presentation clock bounded to the current game second. It never advances simulation, resets after restoring older time and freezes under paused/planning. Camera remains usable during pause.
- Low quality disables antialiasing/shadows, caps DPR at 1, reduces ocean subdivisions and particle count (180 vs 650). High quality caps DPR at 1.5. These are quality policies, not performance guarantees.
- Missing WebGL shows an error and retains non-WebGL actions. Context loss stops rendering and offers rebuild. Resource cleanup deduplicates shared geometries/materials/textures and releases shadow targets, OrbitControls, resize observer, listeners, RAF and renderer.

## Art limits and verification

Models/materials are still procedural. There are no GLB assets, scanned PBR texture sets, animated crew, HDR environment maps, authored cinematics or final sound assets. Shader light shafts are stylized translucent geometry, not volumetric simulation.

Automated assembly tests verify station raycasts from presets, live display refresh, exterior construction, lower particle count, visual time semantics and deduplicated disposal. DOM tests deliberately simulate unavailable WebGL and verify accessible actions/error state. None of these renders pixels.

Real browser screenshots, visual review of material/light balance, control feel, clipping, shader compatibility, context recovery and FPS/memory profiling remain required. The managed environment has no callable cua_repl.js; the Sites workflow prohibits installing/improvising another browser QA path in that case. No screenshot or FPS result is claimed.
