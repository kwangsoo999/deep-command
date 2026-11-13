# API and database reference

Service: `backend/main.py`, FastAPI 0.115.12. Tài liệu tương tác `/docs`. Service version 0.9.0; cloud revision contract introduced in 0.2.0. JSON requests; lỗi dùng `{"detail": ...}`. Bearer token từ login, hết hạn sau 86400 giây. Tất cả tài khoản/saves thật được DB lưu; game browser kết nối API khi cấu hình VITE_API_URL; cloud sync là thao tác chủ động.

| Method/path | Auth | Input / output | Errors |
| --- | --- | --- | --- |
| GET /health | No | DB probe → status ok | DB failure → server error |
| GET /api/version | No | version/stage/simulation/frontend_mode | — |
| POST /api/auth/register | No | username,password → id,username (201) | 409 duplicate, 422 validation, 429 rate limit |
| POST /api/auth/login | No | username,password → access_token,token_type,expires_in | 401 invalid,422,429 |
| GET /api/player/profile | Bearer | id,username | 401 |
| PUT /api/player/save | Bearer | schema=deep-command-v1,state object,expected_revision nullable → status,updated_at,revision | 401,409 conflict,413 encoded >2MB,422 version |
| GET /api/player/save | Bearer | saved JSON envelope + revision | 401,404 |
| DELETE /api/auth/logout | Bearer | revoke token; 204 | 401 |

Username: 3–40 ASCII letters/digits/_/-, case-insensitive storage. Password: 10–128 characters. Unknown fields rejected by auth model. PUT save is a storage API with basic envelope/version validation, not full authoritative simulation validation. Full frontend import validation happens in `restore`.

## ORM

| Table | Columns | Constraints |
| --- | --- | --- |
| players | id varchar64, username varchar40, password_hash varchar256 | id PK; username unique indexed |
| sessions | token_hash varchar64, player_id varchar64, expires datetime timezone | token_hash PK; player_id FK players.id indexed |
| saves | player_id varchar64, payload text, updated_at datetime timezone | player_id PK/FK players.id; one slot per account |

```mermaid
erDiagram
 players ||--o{ sessions : authenticates
 players ||--o| saves : owns
```

Initial schema only: `backend/init_db.py` executes metadata.create_all. No Alembic migrations yet. SQLite tests use StaticPool memory DB; PostgreSQL schema and real HTTP save/conflict/ownership flow were exercised on a disposable Postgres 17 container. Database payloads are private to authenticated owner. Expired sessions denied; no scheduled cleanup yet. API mutation bodies are capped at 2,100,000 bytes before JSON/Pydantic parsing, including streaming bodies; encoded save payload is additionally limited to 2 MB. A production edge limit can add an outer bound. Add edge/distributed rate limits, TLS, migrations, observability and backup automation before exposing service publicly.


## Revision protocol (v0.2)

`expected_revision: null` chỉ tạo save đầu tiên. Khi có save, GET trước rồi gửi chính xác revision nhận được cùng PUT. Thiếu/stale revision trả 409; state đã lưu không đổi. Revision dùng timestamp UTC microseconds từ cột updated_at hiện có; SQL UPDATE có điều kiện cột này, không chỉ kiểm tra trong Python. Client không được tự suy ra revision từ giờ local. Race insert trả 409. Không có forced-overwrite endpoint.

Backend lưu envelope không chứa expected_revision. GET vẫn chứa schema/state v1 và thêm revision, nên có thể dùng state qua restore v1. Bản local JSON cũ không bị migration. Frontend/backend cần nâng cùng nhau: client cũ có thể tạo slot mới, nhưng không được update slot hiện có nếu không gửi revision.
