# TomEng V3.2 — Final Content QA

## Kết quả

- **PASS (cấu trúc/tính toàn vẹn):** 1.200 câu, 240 bài, 7 danh mục, 70 ngăn nhỏ, 210 pattern; ID, `day`, thứ tự 5 câu mỗi bài và chuỗi ôn được giữ nguyên. 150 câu legacy giữ nguyên các trường nội dung được migration bảo vệ.
- **Đã sửa trong lượt này:** 165 ID theo các lỗi lặp/mismatch được khoanh vùng; không đổi lesson membership. Everyday: 55 ID; Reflex: 110 ID.
- **Chưa kiểm định thủ công toàn bộ:** 1.035 ID còn trạng thái `EDITORIAL REVIEW PENDING` trong CSV. Không khẳng định native-approved; automated QA không thể chứng minh độ tự nhiên/ngữ nghĩa đầy đủ.
- **CSV:** `FINAL_CONTENT_QA_V3_2.csv` có đủ 1.200 ID, trường scenario/role/register và quyết định rõ cho từng dòng.

## Nhóm ID đã biên tập

- **everyday (55):** p151, p195, p237, p280, p322, p361, p405, p447, p490, p532, p568, p571, p615, p657, p700, p742, p771, p781, p825, p867, p910, p952, p975, p991, p1035, p1077, p1120, p1162, p1185, p159, p201, p349, p357, p369, p536, p559, p704, p746, p872, p914, p990, p1041, p1082, p1197, p1200, p330, p540, p750, p960, p1170, p317, p527, p737, p947, p1157
- **reflex (110):** p152, p183, p212, p239, p269, p297, p325, p354, p362, p393, p422, p449, p479, p507, p535, p564, p572, p603, p632, p659, p689, p717, p745, p774, p782, p813, p842, p869, p899, p927, p955, p984, p992, p1023, p1052, p1079, p1109, p1137, p1165, p1194, p164, p193, p221, p249, p279, p306, p335, p374, p403, p431, p459, p489, p516, p545, p584, p613, p641, p669, p699, p726, p755, p794, p823, p851, p879, p909, p936, p965, p1004, p1033, p1061, p1089, p1119, p1146, p1175, p174, p202, p230, p259, p288, p316, p344, p384, p412, p440, p469, p498, p526, p554, p594, p622, p650, p679, p708, p736, p764, p804, p832, p860, p889, p918, p946, p974, p1014, p1042, p1070, p1099, p1128, p1156, p1184

## Ví dụ trọng yếu đã sửa

- p737: follow-up giao đồ ăn hỏi tin nhắn khi đơn **đến nơi**, không phải khi được gửi đi.
- p447: phản hồi buổi sáng đang diễn ra; không còn câu hỏi “Would you do it again?”.
- p280: câu hỏi cuối tuần được đổi thành lượt chia sẻ qua lại.
- p781: dùng “How’s your new project going?” và câu nối về tiến độ hiện tại.
- p357: câu nối đề cập việc kiểm tra dự báo thời tiết.
- p405: small talk buổi sáng gọn, tự nhiên hơn.
- p960: giữ đúng ngữ cảnh cacao nóng và mức độ đường.
- Lesson 31 (p151, p195, p237, p280, p322): các lượt lần lượt mở chuyện → hỏi chi tiết → hưởng ứng → chia sẻ lại → chuyển sang kế hoạch sắp tới.

## Phạm vi kiểm định và giới hạn

- Kiểm tra tự động xác minh schema, số lượng, ID, lesson plan, follow-up duy nhất trong mỗi family, đồng bộ JSON/CSV/browser payload và các regression examples kể trên.
- Chỉnh sửa các nhóm hỏi thăm, small talk, giao nhận, đồ uống và phản xạ làm rõ/nghe thiếu/xin thêm thời gian dựa trên vai trò hội thoại và chủ đề câu.
- Chưa có native editor kiểm định từng câu, sắc thái vùng miền, tính tự nhiên của toàn bộ follow-up, bản dịch và mẹo nhớ. Những phần chưa duyệt được đánh dấu chờ trong CSV; chúng không phải bằng chứng ngữ nghĩa PASS.
- Chưa chạy kiểm thử thiết bị thật trong lượt content QA này.
