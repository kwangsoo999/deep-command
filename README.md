# DEEP COMMAND — Silent Ocean

Game web chiến thuật chỉ huy tàu ngầm, dựa trên hồ sơ thiết kế DEEP COMMAND do chủ dự án cung cấp. **v0.1.0 — playable alpha**, chưa phải beta hoàn chỉnh trong roadmap gốc.

Bạn chỉ huy **DCS Aurora** trong chiến dịch **Northern Horizon**: đọc tình báo, nhận dạng liên lạc, đặt hành trình, xử lý sự cố và bảo vệ thủy thủ đoàn. Thế giới, tọa độ GU, sonar và giao chiến đều là cơ chế game giả tưởng.

## Chạy game

Cần Node.js 24 và npm.

```bash
npm ci
npm run dev
```

Mở địa chỉ Vite in trong terminal, thường là `http://localhost:5173`. Không cần backend để chơi. Build production: `npm run build`; thư mục `dist/` dùng được trên static hosting, kể cả hosting dưới subpath.

## Cách chơi

1. Chọn **Nhận quyền chỉ huy** trong briefing.
2. Chọn **Đến mục tiêu** hoặc click bản đồ đặt waypoint; kéo để pan, dùng nút +/− để zoom.
3. **Quét sonar** vài lần, mỗi lần tốn 3 năng lượng. Độ tin cậy từ 80% mở nhận dạng.
4. Mở **Tình báo**, xác minh các báo cáo còn hiệu lực.
5. **Space** tạm dừng/tiếp tục khi bàn phím không đang ở một nút điều khiển; **PLAN** đóng băng simulation để lập hành trình. Tốc độ 1×/2×/4×.
6. Mở **Kỹ thuật** xử lý cảnh báo bằng vật tư. Sự cố bỏ qua gây hỏng thân tàu.
7. Hoàn thành 3 mục tiêu trước hạn. Debrief cấp thưởng và mở nhiệm vụ tiếp theo.

**Lost Horizon:** tới điểm cứu hộ, nhận dạng tàu dân sự, chọn Điều phối cứu hộ. **Final Order:** chọn từng liên lạc đối phương đã nhận dạng trên bản đồ, dùng Lệnh mô phỏng, rồi tới điểm rút lui. Không áp dụng lệnh này cho tàu dân sự.

Menu có lưu/tải, xuất/nhập JSON và chiến dịch mới. Autosave mỗi 15 giây. Lưu trữ theo trình duyệt và origin; hãy xuất tệp trước khi xóa dữ liệu trình duyệt hoặc đổi hosting. Import luôn khôi phục ở trạng thái paused.

## Có trong bản này

- 5 nhiệm vụ nối tiếp: First Contact, Ghost Signal, Lost Horizon, Silent Watch, Final Order.
- Bản đồ SVG tương tác, 3 khu vực, 5 liên lạc; sonar, tình báo có hết hạn.
- Simulation fixed timestep, seed xác định; pause thực sự dừng simulation.
- 6 sĩ quan, huấn luyện/nghỉ ngơi, 8 loại sự cố, 10 nâng cấp, tài nguyên và debrief.
- Boong 3D Three.js dựng bằng code, kéo để nhìn, cuộn zoom, click 4 màn hình mở trạm. Nạp riêng khi chọn Boong 3D.
- UI tiếng Việt, giao diện dữ liệu tối, hỗ trợ bàn phím và bố cục responsive.
- FastAPI + SQLAlchemy cho auth/profile/save tùy chọn; cấu hình PostgreSQL và Docker; CI.

## Backend tùy chọn

Giao diện alpha hiện dùng localStorage, **chưa gọi API tài khoản hoặc cloud save**. API hoạt động độc lập và có kiểm thử; không cần đăng nhập để chơi.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python init_db.py
uvicorn main:app --reload
```

Mặc định dùng SQLite local. Để dùng PostgreSQL, đặt `DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DB` trước khi chạy `init_db.py`. Swagger: `http://localhost:8000/docs`.

Docker: sao chép `.env.example` thành `.env`, đặt mật khẩu database mạnh rồi chạy `docker compose up --build`. Web ở `http://localhost:8080`; API chỉ bind loopback `127.0.0.1:8000`. Docker/PostgreSQL chưa được kiểm thử runtime trong phiên bàn giao này.

## Kiểm tra

```bash
npm test
npm run build
.venv/bin/pytest -q backend/test_api.py
```

Xem [QA_REPORT](docs/QA_REPORT.md) để biết phạm vi bằng chứng và giới hạn. Chưa xác minh trực quan WebGL, FPS và các trình duyệt; không tuyên bố đáp ứng 60 FPS hoặc beta release gate.

## Tiếp tục phát triển

Bắt đầu từ [PROJECT_INDEX](docs/PROJECT_INDEX.md) và [AI_HANDOFF](docs/AI_HANDOFF.md). Ưu tiên QA trình duyệt, chia nhỏ UI, tích hợp tài khoản/cloud save, migration database và thay asset procedural bằng GLB/PBR được cấp phép.

Tài sản hình ảnh, sơ đồ và âm thanh hiện tại được tạo bằng code; icon thuộc Lucide (ISC). Chưa có nhạc, voice, model GLB, texture PBR hay nhân vật animation. Không có API key/secret trong repository.
