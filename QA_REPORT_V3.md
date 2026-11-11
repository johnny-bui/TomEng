# TomEng V3.1 — QA checklist cập nhật

**Ngày:** 2026-11-11
**Branch:** `feat/tomeng-native-v3` · **PR:** #2 (Draft)
**Quyết định:** chưa merge; chưa đủ căn cứ để phát hành vì còn nội dung cần biên tập viên độc lập và kiểm thử thiết bị thật.

## P0 — Nội dung, luồng học và dữ liệu

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| Đủ 1.200 cụm, ID duy nhất p001–p1200; giữ nguyên 150 câu cũ | **PASS** | `QA_CONTENT.py`, `tests/content.test.py`; đối chiếu toàn bộ trường legacy yêu cầu. |
| 240 bài, mỗi bài 5 cụm; bài 31–240 cùng một chủ đề | **PASS** | Kiểm tra tự động trên 210 bài mới; bài 1–30 legacy giữ nhóm gốc. |
| Duyệt ngữ nghĩa độc lập toàn bộ bản dịch, câu nối, mẹo nhớ và biến thể | **NOT TESTED** | Đã biên tập AI 179 ID / 191 lượt sửa; chưa có biên tập viên tiếng Anh bản ngữ rà từng câu. `CONTENT_QA_ISSUES.md` còn ghi các mục cần người duyệt. |
| Follow-up không lặp trong từng nhóm 5 biến thể và nối được hội thoại | **PASS** (đa dạng cấu trúc) / **NOT TESTED** (ngữ nghĩa) | 1.050 follow-up mới đã được biên tập lại; cả 210 nhóm đều có 5 câu nối tiếp khác nhau. Tổng hiện 350 follow-up duy nhất, tối đa lặp 8 lần trong các nhóm cùng chủ đề. Chưa có người duyệt xem từng câu có đúng mạch không. |
| Review 5 → Learn 5 → Recall 5; không bỏ qua ôn; không lộ đáp án trước khi recall | **PASS** | `node tests/engine.test.cjs`: kiểm tra cổng chuyển bước, đánh giá sau reveal và 5 cụm ôn bắt buộc. |
| SRS theo tự đánh giá; câu “Chưa nhớ” đến hạn ngày sau; giới hạn lượt ôn | **PASS** | Kiểm tra interval 1/3/7/14/30 ngày và giới hạn 12 câu/lượt. Đây là lịch dựa trên tự đánh giá, không phải đo trí nhớ sinh lý. |
| Ngày học, bỏ ngày, bài 31 và bài 240 | **PASS** | Kiểm tra ngày địa phương, streak, day 31, hoàn tất 240 bài. |
| Migration V1/V2/V3, sao lưu trước, không gán sai ID sau đổi thứ tự | **PASS** | Kiểm thử fixture tổng hợp; V2 đối chiếu English fingerprint; completion bài cũ khác thứ tự được giữ trong archive thay vì đánh dấu nhầm bài mới. |
| Hoàn tác migration | **PASS** | Có thao tác rollback xác nhận; chụp trạng thái hiện tại trước khi khôi phục key đã lưu. Kiểm thử trên localStorage giả lập. |
| Không mất dữ liệu trên profile thật của người dùng | **NOT TESTED** | Chưa nhận/khôi phục bản backup thật; dữ liệu cá nhân không có trong fixture kiểm thử. |

## P1 — Học, speaking/listening, UI và mobile

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| Everyday / Workplace / Mixed track | **PASS** | Chọn track, lưu lựa chọn, giữ phiên đã bắt đầu và áp dụng track mới cho phiên chưa chạm được kiểm tra tự động. |
| Listening: nghe trước, transcript chỉ mở sau khi audio kết thúc và tự kiểm tra | **PASS** | Engine test giả lập TTS và callback kết thúc; không hỗ trợ hoặc lỗi TTS không mở transcript. |
| Listening trên giọng đọc thật của thiết bị | **NOT TESTED** | Môi trường browser QA không phát hoàn tất TTS; chưa đo giọng/voice trên Chrome Android hoặc Safari iPhone. |
| Hội thoại 4 lượt theo chủ đề | **PASS** | Có lượt nối tiếp và gợi ý sau khi người học tự đáp; điều hướng 1–4 được kiểm tra. Tính liên tục tự nhiên của mọi nhóm cần người biên tập nghe/đọc lại. |
| Speaking không tăng tiến độ do bấm micro, thiếu hỗ trợ, lỗi quyền hoặc lỗi khởi động | **PASS** | Unit test cho unsupported, permission error, start throw và transcript không rỗng. |
| Không tuyên bố chấm điểm phát âm bằng speech-to-text | **PASS** | UI ghi rõ transcript gần đúng/tham khảo; không có điểm phát âm. |
| Rescue Mode ngoài 9 ý định cố định | **PASS** | Tìm kiếm tự do trên 1.200 cụm; browser QA tìm `airport` trả kết quả và giữ focus input. |
| Tìm kiếm, lọc và nội dung sửa cục bộ hiển thị nhất quán giữa mọi màn học | **NOT TESTED** | Luồng search chính và Rescue đã thử; chưa kiểm chứng end-to-end toàn bộ `contentEdits` qua mọi view. |
| Mobile nav 4 mục, không tràn ngang ở 360 / 768 / 1440 px | **PASS** | Browser localhost QA tại cả ba viewport; 360px có 4 mục, 0px overflow. |
| Ô nhập mobile không kích hoạt Safari auto-zoom | **PASS** | Các ô search, recall và biên tập dùng 16px ở breakpoint mobile; đo CSS computed 16px trên viewport 360px. Safari thật chưa thử. |
| Keyboard modal, focus ban đầu, Escape và focus trap | **PASS** | Browser QA mở phrase bằng Enter, focus vào nút Đóng, đóng bằng Escape. Screen reader chưa kiểm thử. |
| Permission prompt/micro thực tế và callbacks trên thiết bị | **NOT TESTED** | Có test callback giả lập; chưa bấm micro hoặc cấp quyền trên thiết bị thật. |

## P2 — Giao diện, kiến trúc, hiệu năng và PWA

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| Lỗi panel ghi chú bị ép chữ thành cột dọc | **PASS** | Sửa grid thành block có marker định vị; đo chiều rộng nội dung 280px tại desktop 1440px và xem trực tiếp browser. |
| CSS override mâu thuẫn ở note panel và bottom nav | **PASS** | Bỏ các override 8px/1fr gây lỗi và các cấu hình nav 5/6 cột xung đột; giữ cấu hình 4 mục. |
| Refactor CSS override trùng lặp gây lệch giao diện | **PASS** | Gộp mỗi breakpoint vào một media block; bỏ khai báo trùng cho root font, lưới chính, note panel, grammar và bottom nav; giữ responsive override cần thiết theo viewport. |
| Không lỗi console trong browser QA | **PASS** | Không có warning/error console trong các luồng đã mở trên localhost. |
| Benchmark hiệu năng tìm kiếm 1.200 câu và Library trên máy yếu | **NOT TESTED** | Có kiểm tra functional; chưa chạy benchmark định lượng trên điện thoại thật. |
| PWA cập nhật app shell/cache | **PASS** | Tăng cache lên `tomeng-v8-native` sau khi chốt code và payload nội dung để app shell mới lấy đủ asset mới. Browser QA trước đó bắt được lỗi cache v6; v8 chưa được xác minh offline trên thiết bị. |
| PWA cài đặt, mở offline, nâng cấp cache và Safari iOS | **NOT TESTED** | Chưa xác minh offline thật hoặc cài PWA trên iPhone/Android; localhost browser smoke không thay thế kiểm thử đó. |
| Kiểm thử Chrome Android, Safari iPhone, screen reader | **NOT TESTED** | Không có thiết bị tương ứng trong phiên QA. |

## Kiểm thử đã chạy

- `node --check app.js` — **PASS**
- `node --check sw.js` — **PASS**
- `node tests/engine.test.cjs` — **PASS**: daily flow, track, Rescue search, Listening gate, Speaking callbacks/error cases, SRS, migration/archive/rollback, 240 bài.
- `python3 content/native-v3/QA_CONTENT.py` — **PASS** cấu trúc: 1.200 cụm, 240 bài, 7 danh mục, 70 nhóm, 210 pattern; script nêu rõ không chứng nhận văn phong bản ngữ.
- `python3 tests/content.test.py` — **PASS**: payload, CSV, 150 câu legacy.
- `git diff --check` — **PASS**
- Browser localhost: **PASS** functional/responsive tại 360, 768, 1440px; Rescue search; modal keyboard; ghi chú không còn chữ dọc.
- Browser console: **PASS** không có lỗi trong các luồng trên.

## Kết luận

Các sửa chức năng P0/P1 có thể kiểm tra tự động đã được triển khai. Không đánh dấu PR hoàn tất vì semantic review toàn bộ chưa có người duyệt độc lập, PWA offline/device QA chưa thực hiện. Giữ PR **Draft**, không merge hoặc phát hành production cho đến khi các mục NOT TESTED phía trên được xử lý hoặc được người sở hữu chấp nhận với lý do cụ thể.
