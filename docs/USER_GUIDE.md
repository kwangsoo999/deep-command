# DEEP COMMAND — hướng dẫn chơi trọn chiến dịch

## Bắt đầu

Game chơi được offline trên trình duyệt, không bắt buộc tài khoản. Nhận briefing hoặc chọn **Chiến dịch & chuẩn bị** để xem hồ sơ/cấp bậc. Nhiệm vụ sau mở khi nhiệm vụ trước hoàn thành. Bản save v0.1–0.5 vẫn đọc được; chưa có bảng thành tích cũ thì bảng mới bắt đầu trống, không tạo điểm giả.

Tại Bộ chỉ huy, bạn có thể vào **Nâng cấp hạm đội**, **Chuẩn bị thủy thủ**, **Kiểm tra kỹ thuật** mà thời gian game chưa chạy. Chọn **Chỉ thị nhiệm vụ** để trở lại briefing, rồi **Nhận quyền chỉ huy**. Chuẩn bị không tự bắt đầu nhiệm vụ.

## Trong nhiệm vụ

- **Đến mục tiêu** đặt tuyến tới điểm nhiệm vụ. Click bản đồ để đặt waypoint khác, kéo/zoom để quan sát.
- **Quét sonar** tiêu 3 năng lượng. Quét vài lần để độ tin cậy đạt 80%, mở nhận dạng. Không quét được khi paused/planning.
- **Tình báo** → xác minh báo cáo còn hiệu lực. Báo cáo hết hạn theo thời gian game; nguồn mới xuất hiện khi thời gian chạy.
- Space (khi không tập trung vào nút/ô nhập) hoặc nút Pause để dừng. PLAN đóng băng simulation để xem dữ liệu và đặt lệnh; camera và giao diện vẫn dùng được. 1×/2×/4× là tốc độ game.
- Mỗi mission có đúng 3 mục tiêu và thời hạn. Đạt đủ mục tiêu thì game tự mở debrief. Hết giờ, hết năng lượng hoặc hết thân tàu sẽ thất bại.

## Sự cố

Mở Kỹ thuật. Có ba phương án:

1. **Tiêu chuẩn**: trả vật tư và xử lý ngay; công nghệ Thu hồi vật tư hoàn lại 2.
2. **Kíp kỹ thuật**: không tiêu vật tư, tăng 15 mệt mỏi Engineering, cần 8–14 giây game. Sự cố vẫn gây hại trong lúc chờ. Pause/Plan dừng bộ đếm; save/load giữ công việc đang làm.
3. **Ổn định khẩn**: trả 8 năng lượng và mất ngay 3% thân tàu, đổi lấy xử lý tức thời. Có thể nguy hiểm khi thân tàu quá thấp.

Không nhận thêm phương án khi kíp đang xử lý. Kíp quá mệt cần nghỉ trước. Các chỉ số là luật game hư cấu.

## Chiến dịch Northern Horizon

| Nhiệm vụ | Cách hoàn thành |
| --- | --- |
| First Contact | Tới Echo, nhận dạng ≥1 liên lạc, xác minh ≥1 báo cáo |
| Ghost Signal | Quét ≥3 lượt, nhận dạng ≥2, xác minh ≥2 |
| Lost Horizon | Tới Frost, nhận dạng tàu dân sự, chọn Điều phối cứu hộ |
| Silent Watch | Tới Vesper, nhận dạng ≥3, giữ hull ≥60% |
| Final Order | Nhận dạng ≥3, chọn và xử lý 2 đối phương đã nhận dạng bằng lệnh mô phỏng, tới điểm rút lui |

Không thể áp dụng lệnh đối phương cho tàu dân sự. Lệnh là cơ chế trừu tượng, không có tính toán vũ khí thực.

## Kết quả, cấp bậc và chuẩn bị chặng tiếp

Thưởng credits/XP/RP/reputation chỉ cấp ở lần hoàn thành đầu tiên. Điểm tốt nhất mỗi nhiệm vụ được lưu; nếu bằng điểm, ưu tiên thời gian nhanh hơn. Chơi lại không nhận thêm thưởng. Cấp chỉ huy dẫn xuất từ XP, từ Cadet tới Fleet Commander.

Mở Bộ chỉ huy ở debrief để tiếp tế/nghiên cứu trước chặng tiếp. Căn cứ bảo đảm tối thiểu 80 hull, 60 power và 60 vật tư khi triển khai/retry; nguồn lực cao hơn được giữ. Tiếp tế thêm/repair giúp xuất phát tốt hơn nhưng tốn credits. Nghiên cứu bằng RP chỉ thực hiện ở briefing/debrief. Có ba công nghệ: tuyến +10%, sonar +5 confidence, thu hồi 2 vật tư.

Sau Final Order, màn hình chiến dịch cho xem 5 nhiệm vụ đã hoàn thành và chọn chơi lại. Chiến dịch mới trong Menu là reset toàn bộ game; có xác nhận. Xuất JSON trước nếu muốn giữ hồ sơ cũ.

## Lưu và phục hồi

Autosave local mỗi 15s; kết quả nhiệm vụ được lưu local ngay khi engine chuyển sang debrief. Lỗi lưu có thông báo và không xóa kết quả trong bộ nhớ. Menu có lưu/tải, xuất/nhập JSON và **Khôi phục điểm dự phòng**.

Chọn lại nhiệm vụ có xác nhận và ghi một checkpoint local trước khi thay trạng thái. Import/tải cloud cũng dùng cùng slot dự phòng; chỉ giữ một slot, lần sau có thể thay lần trước. Xuất JSON để có nhiều bản lưu bền vững. Import/load luôn paused. Điểm dự phòng theo browser origin, không theo tài khoản.

Tài khoản/cloud save cần backend được cấu hình. Đăng nhập, kiểm tra cloud rồi chọn lưu/tải và xác nhận. Autosave vẫn chỉ local; cloud không đồng bộ tự động. Xung đột phiên bản không bị ghi đè tự động. Xem CLOUD_SAVE.md.

## Đồ họa

Chọn Quan sát Aurora 3D / Boong–Biển. Có preset camera, chọn trạm, sonar/hành trình nhanh, độ sáng, ẩn HUD và kiểu Điện ảnh/Tự nhiên/Biển sâu. Chất lượng thấp bỏ hậu kỳ/bóng đổ và giảm texture/hạt. Mất WebGL có nút nạp lại; các trạm vẫn mở qua nút không cần WebGL. Chưa có bảo đảm FPS trên thiết bị của bạn.
