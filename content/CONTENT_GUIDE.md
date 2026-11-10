# TomEng — Content V2 (Vietnamese editor notes)

## Mục tiêu
Luyện *cụm câu nói được ngay* cho người Việt làm UI/UX, họp với BA/biz users, phối hợp FE/BE và trao đổi đời thường. Không đào tạo từ đơn và không nhồi lý thuyết hàn lâm. Mỗi ngày **5 cụm mới**, trước đó cần ôn 5 cụm của buổi học gần nhất.

## Dữ liệu
- Tổng 1.200 bản ghi câu hoàn chỉnh, 7 danh mục, 53 nhóm nhỏ, 240 bài × 5.
- 150 câu gốc giữ nguyên `id`, `day`, `en`, `vi`, `context`, `follow`.
- 1.050 câu mới: 210 **khung câu có ích** ×5 ngữ cảnh khác nhau. `patternId` chung là một 'gia đình câu'; mỗi `variant` đổi nội dung thực tế. Mỗi pattern được bố trí cách xa ~42 bài/ngày, thay vì năm câu na ná nhau cùng ngày.
- 7 nhóm: Reflex 150; Meeting 220; Design 250; BA 200; Engineering 170; Everyday 120; Leadership 90.

## Các trường chính
| Trường | Ý nghĩa |
|---|---|
| `id` | ID không thay đổi theo thời gian, quan trọng với migration |
| `day` | Bài học số 1–240 |
| `en` / `vi` | Câu mẫu / bản dịch gần với văn nói |
| `context` | Khi nào dùng; hiển thị trước khi nói |
| `follow` | Câu nói tiếp giúp mở rộng giao tiếp |
| `categoryId`, `subCategoryId` | Bộ lọc điều hướng |
| `patternId` | Nhóm câu sử dụng cùng một khung nói |
| `pattern` | Khung câu dễ nhớ với dấu `…` là vị trí thay ý |
| `memoryTip` | Mẹo thuộc nhanh, dùng ngay, tránh ngữ pháp thuần lý thuyết |
| `variant` | 0 = legacy; 1–5 = ngữ cảnh mới |
| `source` | `legacy` hay `v2` |

## Quy chuẩn biên tập
1. Câu ngắn gọn, tự nhiên, 1–2 ý, thích hợp B1 làm việc; tránh business jargon chỉ để cho dài.
2. Có ngữ cảnh rõ, không dạy một từ lẻ. Ưu tiên cụm có thể dùng nguyên vẹn hoặc thay 1 cụm danh từ.
3. Cần kiểm tra collocation, sắc thái lịch sự, đại từ, thì và bản dịch qua người giỏi English business / native editor trước khi công bố rộng rãi.
4. Không diễn giải ngữ pháp quá dài. `pattern` là trọng tâm; điểm ngữ pháp chỉ bổ trợ khi thực sự giúp nói nhanh.
5. Câu biến thể không được xuất hiện cạnh nhau như 5 bài mới khác nhau cùng ngày (đã sắp ở các wave khác nhau trong `lessons.v2.json`).
6. Có thể thêm `naturalnessReviewed`, `approvedBy`, `reviewedAt`, `reviewNotes` trong pipeline content review nhưng không để cản phiên bản dùng thử.
7. Không tự động đổi lại `id` khi chỉnh bản dịch hay chính tả; cần versioning dữ liệu.

## Lưu ý chưa kiểm định
Đây là **editorial draft**, đã kiểm tra tự động đủ số lượng, ID, danh mục, không trùng nguyên câu, nhưng **chưa được một người bản ngữ duyệt từng câu**. Một vài biến thể có thể cần điều chỉnh cách dùng cho tự nhiên hơn theo ngữ cảnh. Codex phải thực hiện editorial QA trước khi merge.

## Cách tích hợp
Dùng `phrases.v2.json` làm dữ liệu chuẩn và `categories.v2.json`, `subcategories.v2.json`, `lessons.v2.json` làm metadata. `phrases.v2.js` có thể gắn như asset browser nhưng **app.js cũ vẫn hard-code Day 30**, vì vậy không chỉ thay data rồi xem như xong. Sửa learning engine trước khi publish.

## Xem nhanh
Mở `REVIEW_1200.html` để duyệt nội dung có lọc nhóm, tìm kiếm tiếng Anh và tiếng Việt, kiểm tra bản dịch/mẹo nhớ trước khi nạp vào ứng dụng.
