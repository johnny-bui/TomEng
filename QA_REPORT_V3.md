# TomEng Native V3.2 — Independent Audit & QA

**Ngày:** 2026-11-11
**Branch:** `feat/tomeng-native-v3` · **PR:** [#2](https://github.com/johnny-bui/TomEng/pull/2) (**Draft**)
**Audit được xử lý:** Independent Audit review `5854030770`
**Phiên bản nội dung / schema:** `native-v3.2` / `5`
**Quyết định:** Giữ Draft, không merge và không phát hành production. Chỉ các mục có bằng chứng tương ứng mới được đánh dấu PASS; thiết bị thật và biên tập viên độc lập vẫn chưa có trong môi trường này.

## Tóm tắt audit mới

| Hạng mục audit | Trạng thái | Xử lý / bằng chứng |
| --- | --- | --- |
| P0: import V2/V3/V3.1 backup nhầm ID do dùng fingerprint V2 | **PASS** | Import phân nhánh theo `schemaVersion` + `contentVersion`. V2 dùng fingerprint; V3/V3.1 giữ ID gốc và lesson plan nguồn; V3.2 restore theo schema/version hiện tại. Regression xác nhận `p151 → p152` chỉ cho V2, còn V3/V3.1/V3.2 giữ `p151`. |
| P0: giữ dữ liệu import và tránh áp completion sang bài đã đổi nội dung | **PASS** | Fixtures bao gồm saved, learned, reviews, contentEdits, completions, archive, sessions, activeSession. Completion chỉ giữ khi 5 phrase ID khớp lesson hiện tại; completion cũ khác plan được archive cùng ID/snapshot nguồn. |
| P0: backup trước import / import lỗi | **PASS** | Tạo snapshot rồi đọc lại xác nhận đã ghi trước khi thay store; lỗi ghi backup dừng import. Schema/version không hỗ trợ hoặc envelope/payload mâu thuẫn cũng bị từ chối trước khi mutate. |
| P1: đổi track nhưng phải ôn bài hoàn thành gần nhất ở track khác | **PASS** | Test chuyển Everyday → Workplace, Workplace → Everyday và tuyến học trong từng track; reviewPhraseIds được lấy từ completion mới nhất toàn cục. |
| P1: migration V3.1 đang ở phase review chọn sai plan theo điểm ID | **PASS** | Khi phase là `review`, migration ưu tiên plan theo contentVersion nguồn; fixture đang review 2/5 phrase xác nhận lesson, review lesson, index và done IDs giữ nguyên. |
| QA report phản ánh phiên bản mới | **PASS** | Báo cáo này là V3.2 và phân biệt PASS / NOT TESTED, gồm giới hạn của test giả lập và thiết bị thật. |

## P0 — Nội dung, chu trình học và dữ liệu

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| 1.200 cụm hợp lệ, ID duy nhất; giữ đủ 150 cụm legacy | **PASS** | `python3 tests/content.test.py`; `python3 content/native-v3/QA_CONTENT.py`. |
| 240 bài, mỗi bài 5 cụm; bài mới nhất quán theo tình huống/pattern | **PASS** | Automated content QA: 240 bài, 7 danh mục, 70 tiểu mục, 210 pattern; không thay ID. |
| Rà soát độc lập ngữ pháp, tự nhiên, ngữ cảnh, dịch và mẹo nhớ toàn bộ 1.200 cụm | **NOT TESTED** | Script cấu trúc không chứng nhận chất lượng bản ngữ. Chưa có biên tập viên độc lập duyệt thủ công từng mục; không tuyên bố native-approved. |
| Review 5 → Learn 5 → Recall 5, không lộ đáp án trước recall | **PASS** | `node tests/engine.test.cjs` kiểm tra chuyển phase, review gate và reveal/rating. |
| SRS theo kết quả người học và giới hạn lượt ôn | **PASS** | Engine regression kiểm tra lịch 1/3/7/14/30 ngày, đánh giá nhớ và review cap. |
| Ngày học, streak, bài đầu/cuối và 240 bài | **PASS** | Regression kiểm tra ngày địa phương, ngày nghỉ, lesson 31 và hoàn tất đến lesson 240. |
| Local migration V1/V2/V3/V3.1 → V3.2, giữ active session | **PASS** | Synthetic fixtures kiểm tra phrase IDs, completion archive, review phase và session cũ; backup local được tạo trước migration. |
| Import backup V2/V3/V3.1/V3.2 | **PASS** | `node tests/engine.test.cjs`; fixtures phiên bản riêng kiểm tra toàn bộ mảng/trường tiến độ và ID `p151`. |
| Khôi phục profile thật của người dùng và xác nhận mọi dữ liệu riêng | **NOT TESTED** | Không có file backup thật để nhập; chỉ fixture tổng hợp. |
| Rollback trên trình duyệt / profile thật sau import | **NOT TESTED** | Test xác minh guard và snapshot khi import; chưa khôi phục một profile production thật. |

## P1 — Track, tìm kiếm, Speaking/Listening và trải nghiệm

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| Everyday / Workplace / Mixed; đổi track vẫn ôn completion gần nhất | **PASS** | Regression các hướng chuyển track và kiểm tra chính xác review phrase IDs. |
| Search/category/Library/Rescue và trang dữ liệu lớn | **PASS** (logic) / **NOT TESTED** (thiết bị thật) | Engine test xác nhận tìm phrase trên catalog; chưa benchmark trên điện thoại yếu. |
| `contentEdits` đồng nhất trong các bề mặt học | **PASS** (fixture logic) / **NOT TESTED** (browser E2E) | Regression xác nhận edit đi qua import/persistence và các view model được dựng từ nội dung đã sửa; chưa hoàn thành thao tác browser E2E mọi màn. |
| Listening nghe trước, transcript sau | **PASS** (callback giả lập) / **NOT TESTED** (voice thật) | Engine test kiểm tra transcript gate và trường hợp TTS không hỗ trợ/lỗi. Chất lượng voice chưa nghe trên thiết bị. |
| Speaking chỉ ghi nhận khi có kết quả transcript; không chấm phát âm | **PASS** (callback giả lập) / **NOT TESTED** (micro thật) | Engine test mô phỏng unsupported, permission/start/error và transcript. Không có xác nhận chấm phát âm; chưa chạy quyền micro thật. |
| Hội thoại nối tiếp và tính tự nhiên của mọi hội thoại | **PASS** (cấu trúc) / **NOT TESTED** (biên tập ngữ nghĩa) | Có cấu trúc hội thoại 2–4 lượt theo scenario; chưa nghe/đọc độc lập toàn bộ hội thoại. |
| Keyboard, modal, screen reader, focus và accessibility | **NOT TESTED** | Không có vòng browser/screen-reader QA mới trong phiên này. |
| Mobile layout và Safari input zoom | **NOT TESTED** | Chưa chạy Chrome Android/Safari iPhone thật trong phiên này. |

## P2 — PWA, hiệu năng và giao diện

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| PWA cache version, precache migration assets, install/activate | **PASS** (mô phỏng worker) | `node tests/pwa.test.cjs`: kiểm tra asset tồn tại, cache version mới, xóa cache cũ, `skipWaiting`/`clients.claim`. |
| Offline thật, cài đặt và cập nhật PWA trên thiết bị | **NOT TESTED** | Worker test không thay thế kiểm tra offline từ browser/device. |
| Screenshot browser QA và kiểm tra 360/768/1440 px | **NOT TESTED** | Chưa chụp bằng chứng browser trong vòng audit hiện tại. |
| Benchmark tìm kiếm / render trên thiết bị cấu hình thấp | **NOT TESTED** | Chưa đo hiệu năng định lượng. |
| CSS override refactor và kiểm tra toàn bộ breakpoint sau thay đổi | **NOT TESTED** | Không thuộc patch audit hiện tại; cần browser visual regression. |

## Regression suite đã chạy

- `node --check app.js` — **PASS**
- `node --check sw.js` — **PASS**
- `node --check tests/engine.test.cjs` — **PASS**
- `node --check tests/pwa.test.cjs` — **PASS**
- `node tests/engine.test.cjs` — **PASS**: daily flow, cross-track review, import/migration fixtures, persistence, SRS, Listening/Speaking callbacks, 240 lessons.
- `node tests/pwa.test.cjs` — **PASS**: service-worker cache lifecycle và asset precache.
- `python3 tests/content.test.py` — **PASS**: 1.200 phrase records, 150 legacy fields, payload/CSV.
- `python3 content/native-v3/QA_CONTENT.py` — **PASS** cấu trúc; **không** xác nhận editorial/native naturalness.
- `git diff --check` — **PASS**
- GitHub Actions sau commit — **PENDING**; sẽ cập nhật sau khi push.

## Kết luận

Các mục code có thể tái lập trong audit mới đã được sửa và có regression tests. PR vẫn **Draft**. Chưa đủ bằng chứng để đánh dấu hoàn tất toàn bộ audit: editorial review độc lập, import/rollback profile thật, browser/device QA (Android/iPhone), offline PWA, accessibility và benchmark vẫn **NOT TESTED**.
