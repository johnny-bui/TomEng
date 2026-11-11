# TomEng Native V3 — sổ tay luyện phản xạ tiếng Anh

TomEng là ứng dụng tĩnh, chạy bằng trình duyệt và lưu tiến độ trên thiết bị. Nội dung ưu tiên câu ngắn cho đời sống hằng ngày, phản xạ nghe, họp, UI/UX, BA, Developer và công việc. Không cần tài khoản hoặc API AI trả phí.

## Nội dung và luồng học

- 1.200 câu, 7 chuyên mục, 70 nhóm tình huống, 210 họ mẫu và 240 trang × 5 câu.
- Trang đầu học 5 câu mới. Từ trang thứ hai: ôn đúng 5 câu của trang trước, sau đó học 5 câu mới và tự nhớ lại cả 5 câu.
- Một ngày địa phương chỉ hoàn tất tối đa một trang mới. Bỏ lỡ ngày không làm mất trang; streak tính từ ngày hoàn tất thực tế.
- Đánh giá Nhớ ngay / Cần gợi ý / Chưa nhớ tạo lịch ôn. Mục Ôn thêm giới hạn 12 câu đến hạn mỗi lượt; số còn lại giữ nguyên.
- Speaking Practice có microphone tùy chọn; bản nhận dạng chỉ là tham khảo. TTS do thiết bị tạo, tốc độ 0.8× hoặc 1×; không phải bản thu của người bản ngữ.
- Rescue Mode chọn câu theo 9 tình huống thường dùng. Tìm kiếm gồm câu tiếng Anh, bản dịch, ngữ cảnh, chuyên mục, nhóm nhỏ và mẹo nhớ.

## Chạy local

Mở `index.html` trực tiếp để xem ứng dụng. Để kiểm tra PWA và service worker, chạy máy chủ tĩnh:

```bash
python3 -m http.server 4173
```

Rồi mở `http://localhost:4173`. Asset dùng đường dẫn tương đối để chạy tại `/TomEng/` trên GitHub Pages.

## Migration và sao lưu

Native V3 ghi vào key `tomeng_native_v3` với `schemaVersion: 4` và `contentVersion: native-v3.1`. Dữ liệu từ `tomeng_reflex_v3`, `tomeng_notebook_v2` và `speak5_data_v1` được giữ nguyên cùng snapshot migration. ID p001–p150 giữ nội dung cũ. Với ID p151 trở đi, app đối chiếu nguyên câu tiếng Anh V2 trước khi chuyển bookmark, trạng thái nhớ và lịch ôn. ID không khớp nằm trong bản gốc và danh sách `migration.unresolvedIds`; app không gán nhầm sang câu V3. Không suy diễn bài hoàn tất từ số câu đã học.

Xuất và nhập JSON trong ứng dụng để sao lưu. Khi nhập bản V2, app sao lưu bản gốc trước khi chuyển. Lịch sử hoàn tất sau trang 30 của bản V2 nháp không được tính thành trang V3 vì thứ tự câu đã đổi.

## Kiểm thử

```bash
python3 content/native-v3/QA_CONTENT.py
python3 tests/content.test.py
node tests/engine.test.cjs
node --check app.js
```

Nguồn nội dung V3 ở `content/native-v3/`. Các sửa biên tập có thể tái tạo bằng `editorial_pass.py` từ file gốc trong gói V3. [Báo cáo vấn đề nội dung](content/native-v3/CONTENT_QA_ISSUES.md) và [báo cáo QA V3](QA_REPORT_V3.md) ghi rõ giới hạn kiểm thử. Không coi bản nháp AI là bản đã được người bản ngữ duyệt.
