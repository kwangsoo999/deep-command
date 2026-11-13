# Accounts and cloud saves — v0.2

## Setup and play

Game works without a server. To enable accounts, run the optional FastAPI service, set `VITE_API_URL=http://localhost:8000` in frontend `.env` (copy `.env.example`), restart Vite/rebuild, and use **Tài khoản / cloud** in briefing or **Menu → Tài khoản & cloud save**. Hosted builds must use a reachable HTTPS API and exact CORS allowlist; no production backend has been deployed for you.

Register a 3–40 character username (letters/digits/_/-), password 10–128 characters. Registration is followed by login; no email/recovery system exists yet. Token stays only in memory and expires after 24h server time. Refresh requires login again. Logout revokes current server session when reachable and always removes the local in-memory session. Failed network logout can leave the server session until expiry; no client token is retained.

Login reads cloud metadata but does not alter local progress. Autosave remains local every 15s. Opening account from a running mission pauses it; closing does not automatically resume.

## Upload/download

- **Kiểm tra cloud** refreshes the known revision; no local state changes.
- **Lưu lên cloud** requires checked remote state and confirmation. One slot per account. First save expects no existing slot; subsequent save expects exact known revision.
- If another device changed the slot, upload returns conflict and UI disables further upload until a fresh check. No retry/force overwrite is performed.
- **Tải về game** requires confirmation. Latest cloud data is fetched/validated; local current state is backed up before replacement. Imported state is paused. You can recover through **Menu → Khôi phục điểm dự phòng**.

Backup key: `deep-command-save-v1-backup`; primary key remains `deep-command-save-v1`. Only one prior-import backup is kept per browser origin, not one per account. Importing again replaces the backup; export JSON for durable archives. Backup/primary write failures leave running state unchanged; browser quota or clearing site data can still prevent recovery. No token/password is included in save exports.

## API compatibility

GET save returns `{schema,state,revision}`. PUT accepts `{schema,state,expected_revision}` and returns `{status,updated_at,revision}`. `expected_revision=null` creates only; updates need the exact revision returned by server. Revision is normalized UTC updated_at. Atomic UPDATE matches player_id and old updated_at; insert races and mismatches return 409. No DB schema migration required.

Offline schema is unchanged (`deep-command-v1`). v0.1 UI cannot update an existing cloud slot without the new expected_revision; upgrade frontend and backend together. API validates envelope/version/size; client validates full imported game shape. This is personal save storage, not an authoritative competitive game server.

## Verification

Client tests cover token attachment/expiry, network errors, conflicts and malformed saves. Component tests exercise login, explicit confirmation, conflict lockout, backup and storage failures. API tests cover ownership, stale revisions and CORS. A real HTTP round trip uses two sessions to verify register/login/save/read/conflict/restore/logout against disposable SQLite. Actual browser/3D performance and PostgreSQL runtime remain separate unverified release gates.

## Campaign build compatibility

v0.9 keeps envelope/version v1 and adds Career state plus optional incident response. Legacy saves receive empty career defaults while keeping XP/completions/resources. Best-score history is recorded only from new mission results. Back up JSON before upgrade/rollback; older clients do not understand new career/research/job behavior. Mission-switch checkpoints share the one local backup slot.
