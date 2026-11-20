# TomEng 3.6.3 — sổ tay luyện phản xạ tiếng Anh

TomEng là PWA tĩnh (GitHub Pages), lưu tiến độ trên thiết bị (localStorage) và có thể đồng bộ cloud tuỳ chọn giữa các thiết bị. Nội dung tập trung vào tiếng Anh dùng được trong đời sống, họp, UI/UX, BA, Developer và giao tiếp công việc. Học offline không cần tài khoản hay API AI trả phí; tài khoản chỉ cần khi bật đồng bộ cloud.

## Nội dung và buổi học

- 1.200 ID câu, 7 chuyên mục, 70 nhóm nhỏ và 210 mẫu câu.
- 265 scenario-candidate records, mỗi record có 5 câu. 240 ID bài cũ và snapshot V3.2/V3.3 vẫn được giữ để migration; đây không phải giới hạn số buổi học.
- Buổi đầu có thể gồm 5 câu mới. Các buổi sau luôn có 5 câu cho một tình huống: kết hợp linh hoạt 1–5 câu chưa introduced với câu đã học phù hợp. Hệ thống không tính câu cũ là câu mới.
- Trước tình huống mới, ứng dụng có thể ôn tối đa 5 câu của buổi trước; câu trùng với tình huống hôm nay được bỏ khỏi phần warm-up.
- Tiến độ Home là số ID introduced duy nhất trên 1.200, chỉ tăng sau khi hoàn tất Learn, Recall và nhiệm vụ áp dụng. Lịch SRS dựa trên mức nhớ; nhóm ôn thêm được giới hạn để tránh dồn nợ.
- Khi hết câu mới trong track đã chọn, ứng dụng báo phần còn lại và cho chuyển sang Mixed. Khi đủ 1.200 ID, ứng dụng chuyển sang Mastery Mode.

## Các chế độ

- Everyday English, Workplace English và Mixed Learning.
- Listening Drill phát audio trước rồi mới mở transcript; Speaking Practice dùng nhận dạng giọng nói của trình duyệt (Web Speech API), so transcript với câu mẫu, hiển thị % khớp văn bản và gợi ý sửa (ví dụ thiếu mạo từ, trợ động từ). Đây là so khớp văn bản theo kết quả nhận dạng của trình duyệt, không phải chấm phát âm; kết quả phụ thuộc trình duyệt/thiết bị (đặc biệt Safari iPhone).
- TTS dùng giọng có sẵn trên thiết bị ở tốc độ 0.8× hoặc 1×.
- Library tìm theo câu, bản dịch, tình huống, mẫu câu và mẹo nhớ. Rescue Mode có thể tìm mọi cụm theo tình huống.
- PWA lưu shell và snapshot migration để mở lại khi offline; backup/restore nằm trong ứng dụng.

## Đồng bộ cloud (tuỳ chọn)

- Frontend: `sync-config.js` (endpoint công khai), `auth-session.js` (chuẩn hoá session Neon Auth), `sync-merge.js` (gộp state an toàn), `cloud-sync.js` (UI + vòng đồng bộ), `sync.css`.
- Backend: `sync-api/` — Neon Function, chỉ nhận JWT EdDSA của tài khoản owner đã verify; lưu state schema 7 theo revision, xung đột trả `409` để client gộp và thử lại. Xem [sync-api/README.md](sync-api/README.md) cho biến môi trường (cấu hình trong Neon, không commit).
- localStorage luôn là bản offline; đồng bộ chạy sau khi lưu nếu đang đăng nhập. Hiện chỉ một email owner được phép đồng bộ.

## Chạy local

Mở `index.html` để xem giao diện. Để kiểm tra service worker/PWA, chạy máy chủ tĩnh:

```bash
python3 -m http.server 4173
```

Mở `http://localhost:4173`. Asset dùng đường dẫn tương đối để chạy tại `/TomEng/` trên GitHub Pages.

## Migration và sao lưu

Store hiện tại dùng key `tomeng_native_v3`, schema 7 và content plan `native-v3.4`. Bản app `3.4.1` sửa việc chọn câu ôn theo snapshot phiên thực tế, thêm `catalogCandidatePhraseIds`/`practicedPhraseIds` vào completion mới và giữ tương thích dữ liệu cũ. Migration từ dữ liệu V1/V2/V3/V3.1/V3.2/V3.3 tạo và xác minh backup trước khi đổi plan. Snapshot phiên thật được giữ nguyên; completion catalog cũ chỉ là fallback khi backup không có session log. Bookmark, lịch SRS, session đang dở và nội dung người dùng sửa được giữ theo ID, không theo số thứ tự bài.

Tải backup JSON định kỳ. Nếu không ghi được backup trước migration, ứng dụng dừng migration và không ghi đè tiến độ cũ.

## Kiểm thử

```bash
node --check app.js && node --check sw.js && node --check cloud-sync.js && node --check auth-session.js && node --check sync-merge.js && node --check sync-api/index.mjs
node tests/engine.test.cjs        # chậm: ~2–3 phút
node tests/auth-session.test.cjs
node tests/sync-merge.test.cjs
node tests/pwa.test.cjs
python3 tests/content.test.py
python3 content/native-v3/QA_CONTENT.py
npm ci --prefix sync-api && npm --prefix sync-api run bundle
```

Content QA tự động kiểm tra ID, coverage, role NEW/REUSE, scenario structure và mapping. Đây không phải xác nhận rằng biên tập viên bản ngữ đã duyệt toàn bộ 1.200 câu; xem [QA_REPORT_V3.md](QA_REPORT_V3.md) để biết giới hạn và bằng chứng.

## Phát hành (checklist)

1. Tăng `APP_VERSION` trong `app.js`, cache `tomeng-vNN-native` trong `sw.js`, query `?v=` và `sw.js?v=NN-native` trong `index.html`/SHELL cùng lúc (xem [APP_VERSIONING.md](APP_VERSIONING.md)).
2. Cập nhật `tests/pwa.test.cjs` (version, danh sách cache cũ bị xoá).
3. Chạy toàn bộ bộ kiểm thử ở trên; CI GitHub Actions phải PASS trước khi merge vào `main` (merge = deploy GitHub Pages).
4. Báo rõ trạng thái: local / committed / pushed / deployed / đã kiểm trên site live.
