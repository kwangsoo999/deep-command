# Project status — 0.9.1 campaign build

The playable single-player MVP is implemented with a complete campaign loop; final beta certification is incomplete. Read RELEASE_READINESS.md for scope and gates.

Implemented: one vessel, one fictional map/three regions, five contacts, five missions, six crew roles, eight shared-template incident types with three response options, ten equipment upgrades, three research technologies, career ranks/best records/replay, preparation hub, local and optional cloud persistence, deck/ocean graphics and deployment configurations.

| Original phase | Current evidence | Remaining |
| --- | --- | --- |
| 01 Foundation | React/TS/Three UI, actual 3D geometry, camera/clock/settings, auth API/UI | Broader visual acceptance and non-Chromium devices; full ambient audio |
| 02 Simulation | Deterministic fixed step; map/sonar/reports/navigation/event/jobs/save; tests | Rich lost-contact/conflicting-source lifecycle and department model |
| 03 Gameplay | Full 5-mission loop, resources/crew actions/incidents/upgrades/research/career; tests | Recruitment/assignment, branch decisions, multiple classes and wider content |
| 04 Content | Authored procedural scenes/materials/postprocessing | Final GLB/PBR art/animated crew/voice/cinematics; hardware FPS profiling; Chromium software-render smoke has passed |
| 05 Release | Build/unit/DOM/API, HTTP/PostgreSQL and container smoke QA, CI, docs | Non-Chromium/physical-device matrix, production Podman/VPS checks, production backup/security/load review |

The owner's tank.daitan.site was previously read-only verified at v0.3.0 with working API routing. This task does not have VPS SSH access and did not update that deployment. Local container checks are separate from production acceptance.

0.9.1 adds actual live/candidate browser evidence and CI: five missions, persistence reload, six rendered viewport/quality scene checks, physical console picking and one context-loss recovery. See BROWSER_QA.md for scope and limitations.
