# QA TomEng Native V3 — trạng thái PR nháp

## Đã triển khai

- Dùng đúng gói Native V3 làm nguồn chạy: 1.200 câu, 7 chuyên mục, 70 nhóm nhỏ, 210 họ mẫu, 240 trang; 150 câu đầu giữ các trường cốt lõi của bản đang phát hành.
- Luồng trang học: trang 1 học 5 câu; trang sau bắt buộc tự đánh giá đúng 5 câu của trang trước trước khi mở 5 câu mới; cuối trang đánh giá lại 5 câu. Chỉ lật đáp án không hoàn tất bước.
- Khóa một trang mới mỗi ngày theo ngày địa phương; ngày bỏ lỡ không tăng streak. Sau trang 240 còn mục ôn cách quãng.
- SRS theo đánh giá, câu chưa nhớ đến hạn hôm sau; tối đa 12 câu ôn thêm mỗi lượt. Đã tách số câu thử nói, tự kiểm tra và nhớ ngay.
- Speaking Practice có nhận dạng giọng nói tùy trình duyệt, có cách tự luyện; TTS en-US 0.8×/1×. Rescue Mode có 9 tình huống cố định. Tìm kiếm gồm chuyên mục và nhóm nhỏ.
- Migration tạo key mới và snapshot; đối chiếu ID V2 từ p151 bằng nguyên câu tiếng Anh, lưu danh sách không khớp; không chuyển sai tiến độ bài học khi thứ tự V2/V3 khác nhau. Backup V2 nhập vào cũng dùng đối chiếu.
- Service worker dùng cache V3 mới và nút kiểm tra cập nhật.

## QA nội dung

- Kiểm tra tự động **1.200/1.200** bản ghi, 240 bài × 5, 210 họ mẫu × 5 biến thể, 7 chuyên mục, 70 nhóm, ID duy nhất, không có câu tiếng Anh trùng sau chuẩn hóa, CSV và JavaScript cùng nguồn.
- Đối chiếu **150/150** bản ghi legacy theo ID, ngày, Anh/Việt, ngữ cảnh và câu nối tiếp.
- Biên tập AI đã sửa **179 ID** qua **191 lượt sửa trường**, gồm lỗi ngữ pháp, bản dịch lệch, lặp câu, câu nối tiếp trái nghĩa, diễn đạt gượng ở quán, chỉ đường, hỗ trợ thiết bị và thanh toán. Danh sách ID, lý do và câu thay nằm ở [CONTENT_QA_ISSUES.md](content/native-v3/CONTENT_QA_ISSUES.md).
- **Chưa có biên tập viên tiếng Anh bản ngữ độc lập duyệt từng câu.** Việc kiểm tra cấu trúc và biên tập AI không chứng nhận tính tự nhiên của toàn bộ 1.200 câu. Cần duyệt thêm câu nối tiếp và các biến thể theo họ mẫu trước khi chốt nội dung sản xuất.

## Kiểm thử đã chạy

| Kiểm thử | Kết quả |
| --- | --- |
| `python3 content/native-v3/QA_CONTENT.py` | PASS: 1.200 câu / 240 bài / 7 chuyên mục / 70 nhóm / 210 mẫu |
| `python3 tests/content.test.py` | PASS: legacy, danh mục, bài, CSV, payload |
| `node tests/engine.test.cjs` | PASS: ngày 1, cổng ôn trước, lật/đánh giá, SRS, streak, migration V2/import, ngày 31/240, Rescue/tìm kiếm, cap 12 |
| `node --check app.js; node --check sw.js` | PASS |
| HTTP static server: `/`, `/data.js`, `/sw.js` | 200 OK |
| `git diff --check` | PASS |

## Chưa xác minh thực tế

- Chưa có ảnh chụp hoặc video của luồng học ở 360 / 768 / 1440 px. Chưa kiểm thử trên Chrome, Safari di động hoặc trình đọc màn hình thật.
- Chưa xác minh cài PWA, cập nhật cache và mở lại khi offline trên thiết bị thật. HTTP smoke và kiểm thử engine không thay thế các bước này.
- Microphone và chất lượng TTS phụ thuộc thiết bị/trình duyệt; chưa đo nhận dạng hay phát âm thực tế. Ứng dụng không chấm điểm phát âm.
- Cần kiểm tra migration bằng bản sao lưu thực của người dùng trước khi merge; test hiện dùng fixture tổng hợp.

PR nên giữ ở trạng thái **Draft**. Không merge cho đến khi hoàn tất QA giao diện/trình duyệt, migration dữ liệu thật và duyệt nội dung còn lại.

## Audit update 2026-11-11

- Sắp lại 1.050 câu mới theo 40 chủ đề chính; mỗi bài ngày 31–240 gom 5 câu cùng chủ đề, giữ nguyên ID phrase. Các bài 1–30 và 150 cụm đầu giữ nguyên. Bài ôn liên kết đúng 5 ID của ngày trước.
- Sửa review screen để không có nút TTS đọc đáp án trước khi recall.
- Chỉ tính `speakingPracticed` khi nhận được transcript không rỗng; lỗi quyền, lỗi nhận dạng và browser không hỗ trợ không tăng tiến độ.
- Giảm bottom navigation mobile còn 4 mục chính.
- GitHub Pages source đã trả về `main` theo yêu cầu chưa phát hành production trước khi đạt P0. PR #2 vẫn là Draft.
- Chưa triển khai trong audit này: chọn track, Listening Drill/conversation 2–4 lượt, tối ưu bỏ qua phrase đã thành thạo theo due policy, test migration có completion lịch sử sau đổi thứ tự, browser/device matrix và offline/update test trên thiết bị thật. Các mục này còn mở, không được coi là PASS.
