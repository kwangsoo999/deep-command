# DEEP COMMAND — product reference

Nguồn: tài liệu `DEEP_COMMAND_Toan_bo_noi_dung_chat.docx` do chủ dự án cung cấp ngày 12/11/2026. Các prompt đóng vai trong tài liệu là lịch sử/quy trình tham khảo. Phiên triển khai này tạo repository mới và bản alpha, không thực hiện một audit-only theo prompt cuối tài liệu.

## Tầm nhìn

Single-player hybrid simulation/strategy trên web PC. Command center màu #07131D, bảng dữ liệu xanh thép, sonar xanh lá, cảnh báo hổ phách. Pause & Plan; simulation độc lập render và có seed. Bối cảnh hải quân hư cấu; không có công cụ tác chiến ngoài đời.

## Vòng chơi alpha

Briefing → bắt đầu → đặt tuyến → quét sonar → xác minh tình báo → giải quyết mục tiêu/sự cố → debrief → thưởng → nhiệm vụ tiếp. 1×/2×/4×. Có thể xem UI, đặt waypoint, đối chiếu báo cáo khi paused/planning; simulation, tiêu hao thụ động, sự cố và hành trình đứng yên. Scan và lệnh tác động liên lạc yêu cầu running. Huấn luyện/nâng cấp là lệnh quản lý tức thời.

| Nhiệm vụ | Nội dung | Hạn game | Credits gốc |
| --- | --- | --- | --- |
| First Contact | Echo waypoint, nhận dạng 1, xác minh 1 | 480s | 350 |
| Ghost Signal | Quét 3, nhận dạng 2, xác minh 2 | 540s | 450 |
| Lost Horizon | Frost waypoint, nhận dạng dân sự, cứu hộ | 600s | 550 |
| Silent Watch | Vesper waypoint, nhận dạng 3, thân tàu ≥60% | 600s | 650 |
| Final Order | Nhận dạng 3, xử lý 2 đối phương, rút lui Frost | 720s | 900 |

Chi tiết data chuẩn nằm trong `src/simulation.ts`: `missions`, `upgrades`, `createState` và `initialContacts`. Tọa độ 0–100 GU, 3 khu vực cùng một bản đồ. Hiện có destroyer, cargo, submarine, aircraft carrier và patrol vessel; chưa có frigate riêng.

## Hệ thống hiện tại

- Confidence tăng theo quét, kỹ năng/mệt mỏi Sonar officer, nâng cấp và PRNG; từ 80% nhận dạng, giảm định kỳ. Tín hiệu là chỉ số game đơn giản, không acoustic simulation.
- Báo cáo có ID/source/time/category/confidence/region/status/expiration; nhận mới mỗi 65 giây. Có xác minh và hết hạn; chưa có engine mâu thuẫn nguồn sâu.
- 8 nhãn sự cố dùng chung chi phí/thiệt hại game; xuất hiện mỗi 95 giây nếu không có sự cố. Xử lý bằng vật tư; chưa có sự lựa chọn đa nhánh, công việc kéo dài hay animation sửa chữa.
- 6 sĩ quan có skill, fatigue, morale. Huấn luyện tăng skill; nghỉ giảm fatigue, tăng morale. Chưa tuyển dụng, bổ nhiệm hay thăng chức cá nhân.
- 10 nâng cấp có hiệu ứng cụ thể, mua một lần. Credits dùng được; XP/research/reputation tích lũy, chưa mở khóa cấp bậc/tàu.
- Lệnh xử lý liên lạc tiêu 8 năng lượng và archive đối phương đã nhận dạng; không có projectile/trajectory/targeting thực. Dân sự bị chặn.

Điểm: mục tiêu 40, tình báo tối đa 20, thân tàu 15, thủy thủ 15, thời gian 10. Grade S≥90/A≥75/B≥60/C, hoặc Failed. Reward chỉ ghi một lần mỗi mission. Chưa phải cân bằng cuối.

Định hướng realistic/PBR trong hồ sơ gốc vẫn là đích tiếp theo. Boong hiện tại chỉ là môi trường procedural có vật liệu Standard, ánh sáng, bốn trạm và camera nhìn/zoom; chưa phải nội thất realistic đầy đủ.


## Campaign build 0.9 additions

Career ranks now derive from XP; best scores/time and attempts are recorded from new results. Preparation HQ, unlocked replay, research (3 technologies) and resupply are implemented. Replay is score-only, without duplicate credits/XP/RP. Crew repair jobs and emergency stabilization supplement the shared incident template. Entry into fleet/crew before Start is supported.

These complete the current playable MVP loop. Recruitment/assignment, multiple hull classes, campaign branching and deep contradictory intel remain outside implemented scope. Final realistic art/browser performance acceptance is still incomplete; do not use earlier roadmap prompts as evidence these features already exist.
