# TomEng V3.4.1 — QA report P0 Issue #9

Ngày lập: 11/11/2026

Issues: [#7 — Adaptive Scenario Learning](https://github.com/johnny-bui/TomEng/issues/7), [#9 — Actual session review snapshot](https://github.com/johnny-bui/TomEng/issues/9)

Branch: `fix/issue-9-actual-review-snapshot`

Release: app `3.4.1` / content plan `native-v3.4` / store schema `7`

## Thay đổi Issue #9

- `sessions[]` là nguồn ưu tiên cho phần ôn: chọn snapshot `practicedPhraseIds` hoặc `phraseIds` của phiên thật gần nhất. Nếu thời điểm trùng, thứ tự phiên tăng dần được ghi bằng `sessionSequence`; log cũ không có sequence dùng vị trí cuối trong mảng.
- Completion mới tách `catalogCandidatePhraseIds` khỏi `practicedPhraseIds`; completion không còn ghi bộ phrase tĩnh dưới trường `phraseIds` như thể đó là năm câu người học vừa thực hành. Completion cũ chỉ làm fallback khi không có snapshot phiên thật.
- Migration V3.2/V3.3 và import backup giữ snapshot phiên có thật; không tự điền câu catalog vào log phiên bị thiếu dữ liệu. Backup, bookmark, learned, SRS, content edits, lịch sử và dữ liệu phiên đang dở vẫn được giữ.
- Nếu bộ phân bổ SRS không ghép được, selector thử các scenario khác rồi fallback sang câu trong cùng family; nếu vẫn không khả thi, Home cho biết còn ID mới và đưa hành động thử lại/chuyển Mixed thay vì báo đã hết bài.
- Service worker cache được nâng lên `tomeng-v15-native`; app version hiển thị `3.4.1`.

## QA matrix

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| Cùng bài có 3 NEW + 2 REUSE rồi 2 NEW + 3 REUSE; completion lưu snapshot thực tế | PASS local | Regression hoàn tất đủ 5 candidate ID, so sánh snapshot với catalog candidates. |
| Hai timestamp giống hệt; phiên thật thắng completion tĩnh | PASS local | `ClockDate` cố định cùng millisecond; ngày kế tiếp chỉ ôn ID của phiên cuối sau khi loại overlap với scenario mới. |
| V3.2 và V3.3 giữ snapshot phiên thật | PASS local | Migration có backup trước; snapshot review vẫn trùng phrase IDs đã thực hành. |
| Backup legacy không có session log | PASS local | Completion chỉ dùng làm fallback có nguồn `legacy-completion-fallback`; không bịa session snapshot. |
| Không bỏ sót ID cuối trong state partial và sau migration V3.2 | PASS local | State còn đúng một ID chưa học vẫn cấp ID đó vào buổi năm câu; saved/learned/SRS và backup còn nguyên. |
| Coverage 1.200 ID, track switch, refresh, SRS, Mastery, persistence | PASS local | Engine simulation và regression suite hiện có chạy qua đủ coverage; #9 thêm case snapshot/migration/adversarial. |
| Lint cú pháp, PWA shell/cache, ID/content structural QA, scenario map | PASS local | Các lệnh bên dưới. |
| GitHub Actions trên head PR cuối | NOT TESTED | Sẽ cập nhật sau khi workflow hoàn tất. |
| Native editor duyệt ngữ nghĩa toàn bộ 1.200 cụm | NOT TESTED | Structural/content QA không thay thế việc biên tập viên bản ngữ rà toàn bộ catalog. |
| Chrome Android, Safari iPhone, micro/TTS và offline trên thiết bị thật | NOT TESTED | Chưa chạy trên thiết bị thật trong môi trường hiện tại. |
| GitHub Pages production sau merge | NOT TESTED | Pages production sẽ được xác minh sau CI và merge. |

## Lệnh kiểm thử

```bash
node --check app.js && node --check sw.js && node --check tests/engine.test.cjs && node --check tests/pwa.test.cjs
node tests/engine.test.cjs
node tests/pwa.test.cjs
python3 tests/content.test.py
python3 content/native-v3/QA_CONTENT.py
git diff --check
```

## Release gate

Chỉ merge sau khi CI của đúng head PR PASS. Sau merge, xác minh `main` quality workflow, GitHub Pages deploy và production assets. Các giới hạn native-editor và thiết bị thật được ghi rõ, không đánh dấu PASS.
