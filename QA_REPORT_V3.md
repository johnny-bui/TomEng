# TomEng V3.4 — QA & Release Report

Ngày lập: 11/11/2026
Issue: [#7 — Adaptive Scenario Sessions](https://github.com/johnny-bui/TomEng/issues/7)
Branch: `feat/tomeng-issue-7-adaptive-learning`
Release: `3.4.0` / content plan `native-v3.4`

## Phạm vi triển khai

- Mỗi phiên tình huống có đúng 5 ID khác nhau. Vai trò từng ID được lưu tách bạch bằng `candidatePhraseIds` (đủ điều kiện giới thiệu mới) và `reusePhraseIds` (đã có bằng chứng introduced); phiên thực tế chụp cố định các vai trò trước khi bắt đầu.
- Bộ chọn thích ứng đưa 1–5 câu NEW vào phiên; số REUSE phụ thuộc số câu mới còn lại, mức yếu và lịch SRS. Khi track còn câu chưa introduced, phiên hoàn thành cần giới thiệu ít nhất một ID mới. SRS không nhét câu không hợp tình huống để lấp chỗ trống.
- Review đầu buổi lấy tối đa 5 câu từ phiên trước, loại câu trùng với năm câu tình huống hiện tại.
- Progress Home lấy số ID introduced duy nhất trên 1.200; số buổi là số session thực tế, không dùng mẫu số 240.
- Danh mục hiện có 265 scenario-candidate records, mỗi record đúng 5 câu. Giữ 240 ID bài lịch sử để đọc/migration; giữ snapshot V3.2 và V3.3 gồm 240 bài mỗi bản. Số scenario records không giới hạn số buổi thực tế.
- Khi membership một bài lịch sử thay đổi, migration lưu completion trong archive cùng phrase IDs cũ; các ID đó vẫn là bằng chứng introduced và không bị cấp lại là NEW. Bookmark, learned, SRS, nội dung người dùng sửa, ngày học và session đang dở được giữ.
- PWA cache được nâng lên `tomeng-v14-native`, có precache snapshot V3.2/V3.3.

## Acceptance & QA matrix

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| Đúng 1.200 ID, 150 ID gốc không đổi; mỗi ID có đúng một vị trí candidate | PASS | `tests/content.test.py`, `QA_CONTENT.py`; IDs được kiểm tra toàn bộ và mapping đồng bộ. |
| Năm slot, role NEW/REUSE riêng, ratio linh hoạt | PASS | Regression kiểm tra phiên 3+2, 4+1, 2+3; lần đầu là 5+0; reused IDs chỉ lấy từ introduced. |
| Coverage đủ 1.200; không lặp NEW, không bỏ sót, >240 phiên khi cần | PASS | Mô phỏng runtime đến 1.200/1.200, kiểm tra `introduced ∪ remaining`, không giao nhau; có lần refresh, giữ IDs/vai trò/snapshot. |
| Home progress 0 → 5 → 8; 3 session không hiện `/240` | PASS | Regression kiểm tra ID duy nhất và case 3 NEW + 2 REUSE. |
| Track switch, track cạn, chuyển Mixed; migration V3.2/V3.3 | PASS | Regression Everyday/Workplace/Mixed, lưu bằng chứng phrase-level và archive lesson đổi membership; session legacy resume theo snapshot. |
| Review → Learn → Recall → áp dụng → lưu | PASS | Engine regression tương tác qua các bước; không cộng progress khi chưa hoàn tất application. |
| Hết 1.200 chuyển Mastery, không tạo NEW giả | PASS | Mô phỏng đến full coverage rồi kiểm tra session Mastery và progress không đổi. |
| English/translation được kiểm duyệt bởi native editor | NOT TESTED | QA cấu trúc và các sample tình huống đã rà; chưa có biên tập viên native duyệt đủ 1.200 câu. Không tuyên bố native-approved. |
| Android Chrome, iPhone Safari, mic/TTS thật, offline PWA | NOT TESTED | Không chạy thiết bị thật trong phiên này; PWA worker chỉ qua regression test. |
| Production GitHub Pages của bản V3.4 | NOT TESTED | Pages dùng `main:/`; sẽ kiểm tra URL sau khi merge và deployment hoàn tất. |

## Scenario examples đã rà mẫu

- **Small talk trước giờ làm:** hỏi thăm cuối tuần, bắt chuyện nhẹ, phản hồi điều vừa nghe và hỏi tiếp.
- **Trao đổi phương án trong cuộc họp:** mời góp ý về flow, ghi deadline, nêu rủi ro timeline và quay lại open questions.
- **Review luồng sản phẩm:** đề xuất đơn giản hóa navigation, rà interaction state, design system và onboarding flow.
- Các nhóm được tạo bằng cách đan xen subcategory liên quan; tự động QA kiểm tra diversity/pattern/ID, nhưng không thay thế việc đọc ngữ nghĩa toàn bộ nội dung.

## Commands

- `node --check app.js && node --check sw.js && node --check tests/engine.test.cjs && node --check tests/pwa.test.cjs`
- `node tests/engine.test.cjs`
- `node tests/pwa.test.cjs`
- `python3 tests/content.test.py`
- `python3 content/native-v3/QA_CONTENT.py`
- `git diff --check`

## GitHub Actions

Trên source commit `79b243e` của PR #8, cả PR check và push check đều **PASS**:

- [PR workflow run](https://github.com/johnny-bui/TomEng/actions/runs/43004618053)
- [Push workflow run](https://github.com/johnny-bui/TomEng/actions/runs/43004665464)

Sau khi ghi kết quả này vào report và gọn trigger push, Actions chạy lại trên head cuối của PR trước khi merge.

## Release gate

Local regression và Actions trên source đã PASS. Chỉ merge sau khi check của head cuối PR PASS; kiểm tra GitHub Pages production sau merge. Các kiểm thử native/editor và thiết bị thật là residual risks, không được ghi PASS.
