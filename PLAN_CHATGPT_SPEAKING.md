# Kế hoạch: phân tích Speaking bằng gói ChatGPT của owner

## Mục tiêu

Sau `Thử nói → Dừng`, TomEng hiển thị ngay bản nhận dạng và phản hồi hiện có. Nếu owner chọn `Phân tích bằng ChatGPT`, hệ thống đánh giá câu anh tự ghép theo ý và ngữ cảnh của cụm, rồi nêu phần dùng được, phần cần sửa, lý do và một cách nói tự nhiên. Câu khác câu mẫu không bị coi là sai chỉ vì ít từ trùng.

## Kiến trúc

`GitHub Pages (iPhone/desktop) → Neon Function có Neon Auth → hàng đợi Neon → worker trên Mac → OpenAI Responses với quyền Sign in with ChatGPT → hàng đợi → TomEng`.

- Tái sử dụng **cách đăng nhập và gọi model chính thức** của SenNote, nhưng đăng ký TomEng như một ứng dụng riêng. Không đọc hoặc sao chép file credentials của SenNote. Token chỉ nằm trên Mac; frontend và Neon không nhận token ChatGPT.
- Worker TomEng chạy bằng launchd, dùng DB role chỉ có quyền trên bảng job Speaking của TomEng. Neon Auth hiện có xác minh đúng tài khoản owner trước khi tạo/đọc job. Job gắn user ID để không đọc chéo.
- Tạo bảng job riêng, không sửa `tomeng_cloud_state`, schema học, 1.200 phrase ID, lịch ôn hay tiến độ. Không ghi bản ghi âm; chỉ gửi transcript đã hiện cho owner kiểm tra. Có thời hạn giữ kết quả và xóa job cũ theo chính sách rõ ràng.
- Đường dẫn `/speaking-analysis` của Neon Function tạo job, xem trạng thái/kết quả; giới hạn kích thước, tần suất và số job chờ. Kiểm tra origin chỉ là lớp bổ sung, quyền truy cập dựa vào JWT.

## Đầu vào và kết quả

Đầu vào tối thiểu: phrase ID, transcript đã xác nhận, câu mẫu, bản dịch, ngữ cảnh, khung câu, câu nối tiếp và vai trò trong tình huống. Backend lấy nội dung chuẩn theo phrase ID hoặc kiểm tra với snapshot/version, không tin nội dung bài do client tự gửi.

Model trả JSON có schema cố định:

1. `verdict`: `usable`, `near`, `needs_fix`, hoặc `uncertain`.
2. `intent`: ý định người học nói có khớp tình huống không, kèm lý do.
3. `grammar`: các chỗ sai có ảnh hưởng đến nghĩa/cấu trúc; mỗi chỗ có đoạn gốc, cách sửa và giải thích ngắn.
4. `naturalness`: sắc thái/lịch sự/tính tự nhiên; tách lỗi thật khỏi khác biệt phong cách.
5. `suggestedSentence`: câu sửa tối thiểu, giữ ý riêng của người học; `alternative`: một cách nói tự nhiên khác nếu hữu ích.
6. `uncertainty`: lưu ý khi transcript có thể nghe sai hoặc thiếu bối cảnh.

Không cho model tự chấm phát âm từ transcript. Không dùng phần trăm khớp chữ làm điểm đúng ý. Chỉ hiển thị nhận định có căn cứ từ câu nói và tình huống; khi thiếu thông tin thì trả `uncertain`.

## Luồng giao diện

- Nút `Thử nói` đổi ngay thành `Dừng`; sau khi dừng, transcript vẫn hiện và có nút `Sửa bản nhận dạng` trước khi gửi phân tích.
- `Phân tích bằng ChatGPT` là hành động riêng, có trạng thái `Đang chờ Mac`, `Đang phân tích`, `Xong`, `Cần đăng nhập lại`, `Hết hạn mức`, `Không có mạng/Thử lại`.
- Giữ phản hồi quy tắc hiện tại để dùng ngay và offline. AI chỉ bổ sung sau, không khóa `Đã tự luyện · tiếp theo` hay các nút tự đánh giá.
- Kết quả AI không tự tăng tiến độ, đổi điểm SRS hay đánh dấu câu là đã nhớ. Người học quyết định mức nhớ.

## Thứ tự triển khai

1. **Spike xác nhận quyền gói**: tạo đăng nhập TomEng riêng trên Mac; gọi một câu kiểm thử bằng quyền ChatGPT, kiểm tra hạn mức và refresh token. Không deploy trước khi bước này chạy thật.
2. **Backend & worker**: migration bảng job, role tối thiểu, endpoint có auth, worker nhận job idempotent, retry có giới hạn, token refresh và launchd. Xử lý Mac ngủ/tắt bằng trạng thái chờ; không mất job.
3. **Giao diện**: transcript có thể sửa; nút phân tích; polling có backoff; kết quả theo 4 nhóm dễ đọc; giữ fallback hiện tại.
4. **QA**: unit/schema/security tests; test câu đúng chữ, paraphrase đúng ý, câu cùng khung nhưng lệch ngữ cảnh, phủ định đổi nghĩa, thiếu `the/to`, nhận dạng sai, câu không đủ căn cứ; test Chrome và Safari iPhone trên production, Mac online/offline, hết hạn đăng nhập/hạn mức. CI PASS rồi merge/deploy.

## Điều kiện hoàn tất

- Trên iPhone và Chrome: nói → dừng → thấy transcript → sửa nếu cần → gửi → nhận nhận xét có sửa câu cụ thể.
- Câu diễn đạt khác nhưng đúng tình huống được nhận là dùng được hoặc gần đúng; câu trái ý hoặc sai ngữ cảnh không được khen là đúng.
- Mac tắt/ngủ: job hiện trạng thái chờ và xử lý khi Mac trở lại. Hết quyền/hạn mức: có thông báo rõ, không trừ tiến độ.
- Refresh và đồng bộ không làm mất phiên học, lịch ôn hoặc dữ liệu cũ. Token ChatGPT không xuất hiện ở frontend, DB, log hay GitHub.

## Giới hạn đã biết

Phân tích AI cần Mac đang chạy để trả kết quả; thời gian trả lời phụ thuộc kết nối và hạn mức gói ChatGPT. Phản hồi ngữ nghĩa là gợi ý học tập, không phải chứng nhận phát âm hay một tỷ lệ đúng tuyệt đối.
