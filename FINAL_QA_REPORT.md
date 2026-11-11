# TomEng V3.2 — Final QA & Release Readiness

**Ngày QA:** 2026-11-11  
**Repository:** `johnny-bui/TomEng`  
**Branch / PR:** `feat/tomeng-native-v3` / [PR #2](https://github.com/johnny-bui/TomEng/pull/2) (Draft)  
**QA target:** `debbed2e437a50313652ad6d1826c3d15e512947` (`debbed2`)  
**Production URL:** https://johnny-bui.github.io/TomEng/

## Kết luận

**Chưa đủ điều kiện phát hành.** Browser E2E learning flow và export/import mẫu đã chạy trên Chrome desktop bằng bản local đúng target commit. Automated suite và GitHub Actions đều PASS. Các tiêu chí đòi hỏi thiết bị thật, offline/update PWA, rollback import lỗi trong browser, ảnh lưu thành artifact, và duyệt ngữ nghĩa toàn bộ 1.200 cụm vẫn thiếu bằng chứng. PR #2 tiếp tục ở trạng thái Draft; không merge và không phát hành.

## Test matrix

| ID | Hạng mục | Trạng thái | Bằng chứng / giới hạn |
|---|---|---|---|
| QA-01 | Review 5 → Learn 5 → Recall 5 → hoàn tất/lưu | **PASS** | Chạy trên Chrome desktop thật tại `http://localhost:8765/`, source HEAD `debbed2`. Test data được nhập qua giao diện restore. UI đi qua đủ 5 cụm review, 5 cụm mới, 5 lượt recall; trang chủ báo hoàn thành và `2 / 240 trang`. Dữ liệu là fixture QA, không phải hồ sơ người dùng. |
| QA-02 | Refresh rồi tiếp tục lesson | **PASS** | Trong lesson 003, sau refresh nút `Tiếp tục` mở lại phase Learn ở câu `3/5`, không quay về đầu. |
| QA-03 | Export backup trên browser | **PASS** | Nút export tạo file JSON thật `tomeng-backup-2026-11-11.json` (1,337 bytes), `schemaVersion: 5`, `contentVersion: native-v3.2`; có payload saved/learned/reviews/completions/sessions/activeSession. UI báo tải backup thành công. Đây là file test trên local origin. |
| QA-04 | Import backup mẫu qua browser | **PASS** | Chọn fixture JSON qua file chooser của Chrome; UI xác nhận `Đã khôi phục dữ liệu`, home hiện `2 / 240` và lesson kế tiếp là 003, phase review của lesson 002. |
| QA-05 | Rollback khi import backup lỗi trên browser | **NOT TESTED** | Lần chạy invalid fixture không mở được file chooser trong browser harness, nên không xác minh rollback qua UI. Regression test `tests/engine.test.cjs` bao phủ transactional import và rollback storage failure, nhưng không thay thế browser thật. |
| QA-06 | Responsive 360px | **PASS** (visual) | Chrome viewport 360×800. Lesson card, thao tác và bottom navigation nằm trong viewport; không quan sát thấy cắt ngang nội dung. Không đo toàn bộ route. |
| QA-07 | Responsive 768px | **PASS** (visual) | Chrome viewport 768×900. Lesson card và rail hiển thị; không quan sát thấy tràn ngang ở màn hình đã chụp. |
| QA-08 | Responsive 1440px | **PASS** | Chrome viewport 1440×1000; `window.innerWidth=1440`, `documentElement.scrollWidth=1440`, `clientWidth=1440`; không tràn ngang trên lesson screen. |
| QA-09 | Screenshot files | **NOT TESTED / evidence unavailable** | Đã chụp và xem các viewport trong phiên browser QA, nhưng không lưu được ảnh thành artifact trong workspace. Cổng an toàn browser từ chối URL `data:` dùng để xuất ảnh; clipboard browser không cung cấp file local. Không có screenshot file nào được commit. |
| QA-10 | Offline PWA, mất mạng rồi refresh | **NOT TESTED** | Không có network offline control khả dụng trong browser harness hiện tại; không giả định unit test service worker là test offline thật. |
| QA-11 | Service worker install/update trên browser | **NOT TESTED** | `tests/pwa.test.cjs` PASS cho cache lifecycle/precache/install/activate theo mock; chưa quan sát update của worker trên origin browser hoặc thiết bị. |
| QA-12 | Semantic audit 1.200 cụm | **NOT TESTED** (full editorial audit) | Structural QA xác nhận đủ 1.200 phrase IDs, 240 lessons, 7 categories, 70 subcategories, 210 patterns. Chỉ xem một vài câu xuất hiện trong luồng UI; không lấy mẫu đại diện và không có native-speaker/editorial reviewer. Không xác nhận toàn bộ độ tự nhiên, bản dịch, follow-up hoặc mẹo nhớ. |
| QA-13 | Chrome Android | **NOT TESTED** | Không chạy trên thiết bị Android thật. Viewport desktop giả lập không được tính là thiết bị thật. |
| QA-14 | Safari iPhone | **NOT TESTED** | Không có iPhone Safari session/thiết bị thật trong môi trường. |
| QA-15 | CI trên PR #2 head | **PASS** | `gh pr checks 2`: hai `verify` checks xanh (push và pull_request) tại head `debbed2`. |

## Automated regression và content checks

Đã chạy trên working tree của target head; kết quả:

- `python3 content/native-v3/QA_CONTENT.py` — **PASS**: 1.200 unique phrases, 240 lessons, 7 categories, 70 subcategories, 210 patterns. Script nêu rõ không xác định được chất lượng biên tập bởi người bản ngữ.
- `python3 tests/content.test.py` — **PASS**: 1.200 phrase records, 210 families, 240 lessons, 150 legacy fields, CSV và browser payload.
- `node tests/engine.test.cjs` — **PASS**: learning flow, SRS, V1/V2 migration, archive/rollback, 240 lessons, review cap, Listening/Speaking callback handling.
- `node tests/pwa.test.cjs` — **PASS**: cache version, precache assets, install/activate và asset existence. Đây là test mock/static, không chứng minh offline browser.
- GitHub Actions checks trên PR #2 — **PASS**.

## UX findings

Không thấy lỗi UX nghiêm trọng ở màn lesson tại 360, 768 và 1440 CSS pixels trong lần kiểm tra này. Home và lesson mở được, chữ/nút chính đọc được và phần điều hướng mobile chuyển sang bottom navigation. Phạm vi quan sát giới hạn ở luồng lesson; Library/search, modal, keyboard/focus, screen reader, Speaking permission, các route còn lại và xoay màn hình chưa được kiểm hết. Không ghi nhận bug sản phẩm mới cần sửa trong phạm vi QA đã chạy.

## Bug IDs, blockers, residual risks

| ID | Severity | Trạng thái | Chi tiết |
|---|---|---|---|
| RBL-01 | Release blocker | **OPEN — NOT TESTED** | Cần hoàn tất rollback import backup lỗi trên Chrome browser thật với fixture; giữ dữ liệu trước/sau và kiểm tra UI thông báo. |
| RBL-02 | Release blocker | **OPEN — NOT TESTED** | Cần xác minh offline thật, refresh mất mạng, cập nhật service worker và cache cũ/mới trên browser hỗ trợ. |
| RBL-03 | Release blocker | **OPEN — NOT TESTED** | Cần test Chrome Android và Safari iPhone thật, gồm các luồng học và kiểm tra mobile. |
| RBL-04 | Release blocker | **OPEN — NOT TESTED** | Cần biên tập/người có chuyên môn rà đủ 1.200 cụm và các bản dịch, follow-up, mẹo nhớ; cấu trúc hợp lệ không phải semantic approval. |
| RBL-05 | QA evidence | **OPEN — NOT TESTED** | Cần lưu screenshot artifacts cho 360/768/1440 vào PR hoặc báo cáo. Ảnh đã xem trong phiên nhưng chưa thành file. |
| RISK-01 | Residual risk | **OPEN** | Backup/import browser thử bằng fixture trên localhost; chưa kiểm quota đầy, profile dữ liệu thật hoặc rollback browser trên thiết bị cá nhân. |
| RISK-02 | Residual risk | **OPEN** | Chưa hoàn tất keyboard/focus/screen reader và permission/TTS/mic trên thiết bị. |
| RISK-03 | Residual risk | **OPEN** | GitHub Pages đang cấu hình nguồn `main` (root); workflow deploy `main` gần nhất thành công 2026-11-10 16:52 UTC. PR #1 và PR #2 vẫn Draft, nên deployment đó chưa đại diện cho `debbed2`. |

## Release plan (không tự merge)

1. Hoàn tất các release blockers RBL-01…RBL-05 và cập nhật QA evidence trên PR #2.
2. Review/merge **PR #1 → `main`** theo quy trình của chủ repository; PR #1 hiện Draft, head `codex/tomeng-v2-reflex-trainer`.
3. Cập nhật PR #2 từ base cũ `codex/tomeng-v2-reflex-trainer` sang trạng thái dựa trên `main`; chạy lại CI và xác minh các thay đổi V3.2 không bị mất.
4. Review/merge **PR #2 → `main`** sau khi blocker đóng và migration/dữ liệu được xác nhận. Không merge ở lượt QA này.
5. GitHub Pages được cấu hình deploy từ `main` root. Sau merge, chờ Pages build thành công, rồi kiểm tra URL production, version/head, hard refresh, PWA cache update và dữ liệu browser.
6. Trước release trên browser có dữ liệu: export backup từ profile đó và giữ file ngoài storage của app. Không xóa/reset `localStorage`; migration phải chạy trên dữ liệu người dùng đã backup và cần xác minh bookmark, review, completion, active session sau deploy.

## Hành động trong lượt QA

Chỉ chạy kiểm thử và tạo báo cáo. Không sửa code sản phẩm, không merge PR, không triển khai production. `icons/` là dữ liệu không theo dõi đã có trong working tree và không được đưa vào report commit.
