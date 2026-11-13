# Release readiness — campaign build 0.9.0

This build closes the playable single-player campaign loop. It is not certified as the full realistic beta described in the original multi-phase document. No percentage completion is assigned.

| Area | Evidence / state |
| --- | --- |
| Campaign loop | Implemented + automated 5-mission success progression, failure/retry, replay without duplicate rewards, final career screen |
| Preparation | Implemented + DOM checks for entering fleet/crew before mission; resupply/research/rank/best records tested |
| Incidents | Three response choices; crew job timer pauses and restores; resource effects tested |
| Persistence | Legacy v1 normalization, immediate debrief save, checkpoint before deployment, quota failure keeps memory state; tests |
| Account/cloud | UI and API; real HTTP tests with PostgreSQL, ownership, stale/concurrent update conflict, logout |
| Container packaging | Web/API images built; local QA containers and PostgreSQL started; HTTP/asset smoke checks. No production VPS change |
| UI/3D implementation | Deck/ocean, generated materials, authored procedural hull, camera controls, optional postprocessing; CPU/DOM tests |
| Browser/render/performance | **NOT VERIFIED**: no callable managed browser control tool; WebGL pixel output, shader compilation, FPS/memory and browser/device matrix remain gates |
| Final realistic content | **PARTIAL**: procedural authored assets; no final GLB/character animation/ocean audio/crew voice/cinematics |
| Full original GDD | **PARTIAL**: one vessel/one campaign/6 roles; no recruitment/assignment, branching campaigns, multiple hull classes or deep conflicting-source intel engine |
| Production operations | **NOT VERIFIED** on owner's VPS for this revision: Podman, tunnel rollout, production backup/restore, load/security review |

The original beta gate cannot honestly be marked complete while browser/render/performance and production verification remain absent. These limits are evidence gaps or unimplemented scope, not invented runtime defects. No “zero vulnerabilities” or 60 FPS claim is made.

## Next required acceptance work

Use an environment with the supported managed browser tool to inspect actual 1920×1080/1366×768 layouts, shaders, picking, camera bounds, context recovery and mission UI; record screenshots/frame/memory measurements. Apply the reviewed source on the owner's VPS, preserving local Quadlet/Tunnel settings, then test real accounts/cloud and database backup/restore there. Finish realistic assets and remaining GDD systems if the full original specification is the release target.

User-facing run/play instructions: USER_GUIDE.md and root README. Current implementation handoff: AI_HANDOFF.md. Technical evidence: QA_REPORT.md. Deployment instructions: DEPLOYMENT_GUIDE.md and deploy/VPS_TANK.md.
