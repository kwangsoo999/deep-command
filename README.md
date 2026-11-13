# DEEP COMMAND — Silent Ocean

Game web chiến thuật chỉ huy tàu ngầm, dựa trên hồ sơ thiết kế DEEP COMMAND do chủ dự án cung cấp. **v0.4.0 — playable alpha**, chưa phải beta hoàn chỉnh trong roadmap gốc.

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
- Boong 3D với vòm thân tàu, khung sườn, bàn tác chiến, ghế, đường ống, màn hình cập nhật từ nhiệm vụ và ánh sáng cảnh báo.
- Góc camera toàn boong/từng trạm; click màn hình mở trạm, quét sonar và đặt tuyến ngay trong giao diện 3D.
- Ngoại cảnh Aurora dưới biển với mô hình thân tàu, tháp chỉ huy, chân vịt, hạt nước, mặt biển shader và tia sáng. Nạp riêng khi chọn Boong / Biển.
- Hai mức chất lượng, phương án thao tác khi WebGL lỗi và nút nạp lại khi mất context.
- UI tiếng Việt, giao diện dữ liệu tối, hỗ trợ bàn phím và bố cục responsive.
- Đăng ký/đăng nhập, lưu/tải cloud qua FastAPI tùy chọn; kiểm soát xung đột bản lưu giữa các thiết bị.
- Bản dự phòng local trước khi nhập JSON/tải cloud; khôi phục từ Menu.
- Cấu hình PostgreSQL và Docker; CI có kiểm thử cloud save qua HTTP thật.

## Đồ họa 0.4

Chọn **Boong / Biển** trên thanh trạm. Dùng nút **Boong chỉ huy / Đại dương** để đổi cảnh, chọn góc nhìn camera hoặc kéo/zoom. Trong boong, chọn màn hình hoặc nút trạm để mở chức năng. Nút quét sonar/đặt tuyến tác động cùng simulation như bản đồ. Pause/Plan dừng hiệu ứng theo thời gian; camera vẫn quan sát được.

Bản 0.4 bổ sung các lớp màu/normal/roughness sinh từ code cho kim loại và tấm phủ thân tàu, môi trường phản chiếu, vệt sáng nước, địa hình đáy biển/đá dựng theo cụm và dòng nước sau chân vịt khi có hành trình. Camera ngoại cảnh có thêm Mũi tàu, Tháp chỉ huy, Đuôi tàu. Thanh Độ sáng và nút Ẩn HUD chỉ thay cách quan sát, không đổi tiến trình.

Chất lượng thấp tắt bóng đổ, giảm mật độ hạt và chia lưới mặt biển. Đồ họa vẫn procedural, chưa có asset GLB/PBR cuối cùng; browser/WebGL/FPS chưa được xác minh thực tế. Xem [VISUALS](docs/VISUALS.md).

## Backend tùy chọn

Game luôn chơi được bằng localStorage; không cần đăng nhập. Để bật tài khoản/cloud save, sao chép `.env.example` thành `.env` và đặt `VITE_API_URL=http://localhost:8000`, rồi khởi động lại Vite/build lại. API cần chạy riêng bằng các lệnh bên dưới.

Trong briefing chọn **Tài khoản / cloud**, hoặc mở **Menu → Tài khoản & cloud save**. Đăng ký/đăng nhập, kiểm tra bản cloud, rồi chọn lưu hoặc tải và xác nhận. Cloud không đồng bộ tự động. Khi thiết bị khác đã cập nhật bản lưu, server trả xung đột và yêu cầu kiểm tra lại; không âm thầm ghi đè.

Token chỉ giữ trong bộ nhớ; reload trang cần đăng nhập lại. Autosave 15 giây vẫn chỉ lưu local. Tải cloud/import JSON tạo một bản dự phòng local; chọn **Menu → Khôi phục trước khi nhập** để lấy lại. Lưu offline cũ `deep-command-v1` vẫn dùng được. Chi tiết ở [CLOUD_SAVE](docs/CLOUD_SAVE.md).

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

## VPS đang sử dụng

Chủ dự án đang phục vụ frontend tại [tank.daitan.site](https://tank.daitan.site) qua Podman/systemd và Cloudflare Tunnel. API `/api/version` trả 404 khi kiểm tra; bản cloud 0.2 cần cập nhật frontend và bổ sung backend/routing. Xem [hướng dẫn riêng cho VPS](deploy/VPS_TANK.md). Các file Quadlet là mẫu bổ sung, chưa được chạy trên VPS trong phiên này.

## Tiếp tục phát triển

Bắt đầu từ [PROJECT_INDEX](docs/PROJECT_INDEX.md) và [AI_HANDOFF](docs/AI_HANDOFF.md). Ưu tiên QA trình duyệt, chia nhỏ UI, tích hợp tài khoản/cloud save, migration database và thay asset procedural bằng GLB/PBR được cấp phép.

Tài sản hình ảnh, sơ đồ và âm thanh hiện tại được tạo bằng code; icon thuộc Lucide (ISC). Chưa có nhạc, voice, model GLB, texture PBR hay nhân vật animation. Không có API key/secret trong repository.
