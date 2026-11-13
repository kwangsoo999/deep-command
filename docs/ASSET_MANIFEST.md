# Asset manifest

No remote image/model/audio downloads or embedded third-party reference images. No GLB/GLTF/textures/voices exist yet.

| ID | Source | Format | Status / purpose |
| --- | --- | --- | --- |
| map-northern | src/App.tsx TacticalMap | Generated SVG | Functional fictional geography, grid, contacts and route; no real chart |
| sonar-array | src/App.tsx Sonar | Generated SVG | Game visual driven by game time/confidence |
| aurora-diagram | src/App.tsx fleet-hero | Inline SVG | Original schematic illustration; not a 3D model |
| command-room | src/CommandRoom.tsx | Three.js geometry/materials | Procedural placeholder interior, 4 stations, chairs, pipes, lights; not final realistic assets |
| ui-beep | src/App.tsx beep | Web Audio oscillator | Original generated short tone; opt-in, disabled initially |
| interface-icons | lucide-react dependency | SVG | Lucide ISC license; not original game art |
| typography | src/style.css | System font stack | No downloaded font assets |

Three.js and its code are MIT; React/Zustand/Vite and other packages retain their respective licenses in package metadata. This repository adds no broad open-source license for owner-created game content. Audit third-party licenses again when distributing a packaged release. All screenshots/model renders/FPS remain unverified in this handoff.

## v0.3 additions (source: src/graphics/scenes.ts)

- Replaced command-room placeholder layout with detailed procedural curved deck and interactive console meshes.
- Five dynamic CanvasTexture displays (four stations + navigation plotting table) use simulated runtime state. No external textures.
- Added Aurora exterior geometry, original ocean shader, deterministic particle field and translucent light-shaft geometry.
- Three.js OrbitControls from the same MIT dependency provides camera interaction.
- All are procedural development assets, not final realistic GLB/PBR assets. See VISUALS.md for exact scope and unverified render quality.
