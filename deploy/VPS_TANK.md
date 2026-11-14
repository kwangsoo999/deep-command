# tank.daitan.site — rollout notes

Observed 2026-11-14: HTTPS root loads DEEP COMMAND — Silent Ocean and `/api/version` returns JSON version 0.9.0. The frontend still has the older viewer without immersive controls. Browser deck/ocean/picking checks passed at three viewports; production accounts/cloud saves were not modified. The owner-provided screenshot describes a Podman/systemd Quadlet frontend (`deep-command.service`) at `127.0.0.1:18088`, image `localhost/deep-command:20261113-v1`, exposed by Cloudflare Tunnel. Host-local service/container details are reported by the screenshot, not independently verified over SSH.

The deploy files visible in that screenshot were **not present in remote main** when inspected. Do not overwrite the VPS's existing frontend Quadlet or tunnel configuration with assumptions from this repository. No SSH connection to that VPS is configured in this task environment; these are prepared templates, not an executed rollout.

## Update the existing frontend to 0.9.2

Export the browser save and record the working image tag for rollback. Pull main in the VPS checkout after preserving local modifications. Build with the existing API origin (the command below uses the observed same-origin routing):

```bash
podman build --build-arg VITE_API_URL=https://tank.daitan.site -t localhost/deep-command:0.9.2 .
```

Change only Image= in the working frontend Quadlet, preserving ports, volumes, environment and service scope. Reload/restart that existing service. Verify the frontend menu says v0.9.2, SVG favicon loads, Phóng to 3D is available and the existing save restores. All dist chunks must be shipped together. API version is independent of the frontend: the existing backend may still report 0.9.0 after a web-only update. No schema migration is required for this art update. API image template below is tagged 0.9.2 for operators who also rebuild it.

The following optional backend/routing setup is retained for a fresh installation. Since the observed domain already returns /api/version, do not duplicate an existing API service, database or tunnel rule.

## Optional routing setup

Keep frontend service/origin/tunnel hostname. Add private API origin `127.0.0.1:18089`, route `/api/.*` for the same hostname to it before the existing frontend route. Browser API base is **`https://tank.daitan.site`**, without `/api` suffix (client already adds `/api/...`). Database stays on an internal Podman network, no published PostgreSQL port.

```text
https://tank.daitan.site/           → existing tunnel → 127.0.0.1:18088 → web
https://tank.daitan.site/api/...    → same tunnel     → 127.0.0.1:18089 → API → PostgreSQL
```

## Run on the actual VPS, as the existing service owner

1. Back up current frontend Quadlet and tunnel configuration. Record the working image tag for rollback. Export browser save JSON before deployment. Pull the reviewed source from GitHub into the appropriate VPS checkout; preserve local modifications first.
2. Create `$HOME/.config/deep-command/` with access limited to its owner. Copy `deploy/podman/database.env.example` to `database.env` and `backend.env.example` to `backend.env` there. Enter the same strong URI-safe password in both files locally; never paste secrets in chat or commit real env files. Set their filesystem mode to 600.
3. Build the API image:

   ```bash
   podman build -f backend/Dockerfile -t localhost/deep-command-api:0.9.2 backend
   ```

4. Copy the four Quadlet files (`*.container`, `*.network`, `*.volume`) from `deploy/podman/` into the existing **user/rootless** Quadlet directory (normally `$HOME/.config/containers/systemd/`). The API restarts on initial DB-startup failures; systemd start rate limits are configured. These templates assume modern Podman with Quadlet and network DNS. If existing services are root-owned, adapt paths/units instead of mixing scopes.

   ```bash
   systemctl --user daemon-reload
   systemctl --user start deep-command-db.service deep-command-api.service
   curl -fsS http://127.0.0.1:18089/health
   curl -fsS http://127.0.0.1:18089/api/version
   ```

   Inspect service logs if DB initialization is still in progress. Do not proceed until API health/version succeed. Named volume retains PostgreSQL across container replacement; do not delete it during updates. `init_db.py` only initializes missing tables; it is not a future schema migration system.
5. In the **existing tunnel's** configuration, add the path-specific API rule before the web rule, preserving tunnel ID/credentials/all unrelated hostnames and final fallback. `cloudflared-ingress.fragment.yml` shows only the target rules; it is not a complete replacement config. For a dashboard-managed tunnel, configure equivalent hostname/path routes in that dashboard. Validate using the tunnel's installed configuration workflow and reload/restart the correct tunnel service.
6. Verify `https://tank.daitan.site/api/version` now returns JSON version `0.9.2`. Do not point the frontend at localhost; that would refer to each player's own computer. Preserve Authorization headers and bypass any custom cache-everything rule for `/api/`.
7. Build web with the actual origin:

   ```bash
   podman build --build-arg VITE_API_URL=https://tank.daitan.site -t localhost/deep-command:0.9.2 .
   ```

   Update **only Image=** in the existing working frontend Quadlet to this new tag, keeping its `127.0.0.1:18088` mapping and other settings. Reload user systemd and restart `deep-command.service` in its existing scope. Replacing the file blindly could discard the operator's settings.
8. Test domain root, account registration/login, save in one session, load in another, stale-save conflict, logout and local backup recovery. Compare downloaded game state; do not rely only on HTTP 200. Public metadata/render checks do not verify Podman, production cloud save flows or backup/restore.

## Rollback

Restore prior frontend image tag in the existing Quadlet, reload and restart its service. Keep PostgreSQL volume and env files. v0.2 does not alter DB columns or offline save schema; backend can remain available while frontend rolls back, but old API clients cannot overwrite existing cloud saves without the revision contract. If removing the API route, preserve the existing frontend tunnel rule and every unrelated hostname. Restoring any database backup requires a separate reviewed restore procedure; do not overwrite live data as an ordinary frontend rollback.
