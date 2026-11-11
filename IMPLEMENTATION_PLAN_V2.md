# Kế hoạch triển khai TomEng V2

1. **Audit & an toàn dữ liệu:** giữ nguyên ID `p001–p150`; snapshot localStorage hiện có trước migration; chỉ suy ra bài cũ hoàn tất khi đủ đúng năm ID; migration lặp lại không đổi kết quả.
2. **Curriculum:** lấy JSON V2 làm nguồn chuẩn, nạp 1.200 câu, 7 danh mục, 53 nhóm nhỏ, 240 bài; duyệt schema, tính toàn vẹn và rà soát ngôn ngữ. Ghi rõ dữ liệu hiện là editorial draft, chưa có native-speaker sign-off.
3. **Learning engine:** phiên đầu học 5 câu; từ phiên sau ôn 5 câu của bài hoàn tất gần nhất rồi mới học 5 câu mới; bắt buộc xem đáp án và tự recall; completion record theo lesson ID, SRS 1/3/7/14/30 ngày.
4. **Thực hành giao tiếp:** Speaking trước khi lật đáp án, nhận dạng giọng nói tùy trình duyệt và luôn có tự đánh giá thủ công; Rescue Mode tìm ba câu phản hồi theo ý định.
5. **Sổ tay & độ tin cậy:** danh mục/nhóm nhỏ, search đa trường, pattern families, mẹo nhanh, backup/import có kiểm tra, PWA/offline, layout mobile và hỗ trợ bàn phím.
6. **Xác minh & giao hàng:** kiểm thử dữ liệu, migration, trạng thái học, ngày biên, 375px, offline/cache và các luồng thực tế; cập nhật branch riêng, mở PR vào `main`, tuyệt đối chưa merge.

## Defect/rủi ro hiện tại

- Tiến độ suy ra từ `learned.length / 5`, bị chặn ở 30 ngày; thư viện/modal cho đánh dấu đã học nên có thể mở bài mới giả.
- Chưa có phiên học có trạng thái, ôn bài trước hay lịch spaced repetition.
- Danh mục gắn theo ngày cũ; tìm kiếm thiếu tag/pattern/nhóm nhỏ; không có backup/import.
- Số ngày streak khởi tạo giả bằng 1; thống kê số câu “đã nhớ” không phản ánh recall.
- `Georgia`/`Arial` có thể làm tiếng Việt thiếu nhất quán; cột ghi chú hẹp bị xuống chữ dọc; service worker cache cũ.
