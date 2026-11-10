# TomEng V2 — sổ tay luyện phản xạ tiếng Anh

TomEng giúp người Việt phản xạ bằng các câu ngắn dùng thật trong Meeting, UI/UX, BA, Engineering, Leadership và giao tiếp hằng ngày. Sản phẩm ưu tiên nghe tình huống, tự nói, mở khung câu và dùng lại trong công việc; không yêu cầu API trả phí hay tài khoản.

## Trải nghiệm

- 1.200 câu hoàn chỉnh, 7 chuyên mục, 53 nhóm tình huống và lộ trình 240 trang × 5 câu.
- Từ phiên thứ hai: ôn 5 câu của trang hoàn tất gần nhất trước khi mở 5 câu mới.
- Recall cuối phiên và Spaced Repetition theo đánh giá `Again / Hard / Good / Easy`, khoảng 1/3/7/14/30 ngày; có thêm tối đa 12 câu ôn tự chọn mỗi lượt.
- Speaking Practice có thể dùng nhận dạng giọng nói của trình duyệt; bản chép là tham khảo, luôn có cách tự luyện không dùng micro.
- Rescue Mode tìm 3 câu có sẵn theo ý định giao tiếp, có nghĩa tiếng Việt, nghe và copy.
- Sổ tay có tìm kiếm đa trường, bộ lọc chuyên mục/nhóm nhỏ, khung câu và biến thể, mẹo nói nhanh, bookmark, backup/restore có xác nhận.
- Dữ liệu tiến độ lưu trên thiết bị. Migration lưu snapshot, giữ ID cũ và chỉ xác nhận trang legacy khi đủ 5 ID.

## Chạy local

App không cần build step. Mở `index.html` trực tiếp để xem app; PWA/offline cần chạy qua HTTPS hoặc một static server:

```bash
python3 -m http.server 4173
```

Mở `http://localhost:4173`. Các đường dẫn asset đều tương đối để hỗ trợ GitHub Pages tại `/TomEng/`.

## Kiểm thử

```bash
python3 tests/content.test.py
node tests/engine.test.cjs
node --check app.js
```

## Nội dung và giới hạn biên tập

`content/phrases.v2.json` là nguồn chuẩn; các JSON metadata và CSV biên tập đi kèm trong `content/`. Bản 1.200 câu là editorial draft: schema, ID, phân loại, trùng lặp chính xác và trường song ngữ đã được kiểm tra tự động; 150 câu cũ được đối chiếu với main. Toàn bộ 1.050 câu mới chưa được native-speaker duyệt từng câu. Cần hoàn tất bước duyệt collocation, sắc thái và bản dịch trước khi coi nội dung là bản phát hành biên tập cuối cùng.

## Cấu trúc

- `index.html`, `style.css`: shell và giao diện responsive
- `app.js`: học theo phiên, migration, SRS, speaking, rescue, tìm kiếm, sao lưu
- `data.js`, `meta.js`: payload trình duyệt, tải được cả trong `file://`
- `content/`: nguồn JSON/CSV và hướng dẫn nội dung
- `tests/`: QA dữ liệu và kiểm thử engine trong Node
- `manifest.webmanifest`, `sw.js`: cài PWA và offline cache
