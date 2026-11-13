# Tổng hợp các thay đổi trên fork TROSV

Tài liệu dành cho các thành viên trong nhóm để nắm những phần đã sửa và các phần cần kiểm tra khi lấy bản fork về.

- Fork của nhóm đang dùng tại <https://github.com/kiengtong502/trosv>.
- Nhánh chứa các thay đổi là `unstable`.
- Bản gốc dùng làm mốc so sánh là commit `c5c29ff` của `newtab64/trosv`.
- Bản cuối được tổng hợp trong tài liệu là `22acebd`, ngày 13/11/2026.
- Có thể xem toàn bộ thay đổi trong [trang so sánh hai bản](https://github.com/kiengtong502/trosv/compare/c5c29ff...22acebd).

## 1. Tóm tắt trước và sau khi sửa

| Phần                            | Trước khi sửa                                                                                                    | Sau khi sửa                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Xóa tin đăng và hội thoại       | Khóa ngoại có thể làm xóa cả hội thoại khi xóa tin đăng liên quan.                                               | Giữ hội thoại và tin nhắn, gỡ liên kết tới tin đã xóa.                                   |
| Chat trực tiếp                  | Hai bên có lúc phải tải lại trang mới thấy tin mới.                                                              | Sửa kết nối WebSocket và cập nhật hội thoại khi có sự kiện tin nhắn.                     |
| Badge tin chưa đọc              | Đọc tin rồi nhưng badge vẫn giữ số cũ tới khi tải lại.                                                           | Danh sách hội thoại và badge cập nhật sau khi đánh dấu đã đọc.                           |
| Giới hạn yêu cầu API            | Tham số cửa sổ thời gian được hiểu sai đơn vị.                                                                   | Tính theo phút đúng với khai báo route, giữ các header giới hạn yêu cầu.                 |
| Điều kiện đánh giá phòng        | Khi cùng một cuộc trò chuyện chuyển sang phòng khác, phòng đã liên hệ trước có thể mất căn cứ cho phép đánh giá. | Lưu các phòng từng liên quan tới hội thoại để kiểm tra quyền đánh giá.                   |
| Gửi đánh giá                    | Thiếu lời nhắc rõ về việc gửi một lần và không sửa sau khi gửi.                                                  | Hiện lời nhắc ngay trước nút gửi.                                                        |
| Phân trang tìm phòng            | Nhóm số trang hiển thị lệch khi chuyển trang.                                                                    | Hiển thị tối đa 5 số quanh trang hiện tại, thêm nút trang đầu và trang cuối.             |
| Nút “Đăng tin ngay” ở trang chủ | Chủ trọ đã đăng nhập vẫn bị đưa tới đăng ký.                                                                     | Chủ trọ được đưa thẳng tới form đăng tin mới.                                            |
| Giá mỗi tháng                   | Nút tăng/giảm của ô số thay đổi 1 đồng mỗi lần.                                                                  | Dùng mũi tên trong ô số như ô diện tích, bước tăng/giảm là 100.000 đồng.                 |
| Nhập địa chỉ                    | Nhập địa chỉ đầy đủ bằng tay.                                                                                    | Nhập số nhà, tên đường riêng, địa chỉ đầy đủ tự ghép với phường/xã và tỉnh/thành.        |
| Bản đồ đăng tin                 | Thiếu nền bản đồ, chọn hoặc hiển thị lại tọa độ chưa hoàn chỉnh.                                                 | Có nền OpenStreetMap, chọn vị trí, hiển thị lại tọa độ và zoom bằng cuộn chuột.          |
| Chọn ảnh đăng tin               | Chọn ảnh lần sau thay thế danh sách ảnh đang chờ, thiếu xem trước và bỏ từng ảnh.                                | Chọn nhiều lần để thêm ảnh, có xem trước và bỏ từng ảnh trước khi gửi.                   |
| Lớp hiển thị bản đồ             | Bản đồ và nút điều khiển có thể đè lên header, bộ lọc, chatbot và nút xem danh sách.                             | Giới hạn lớp hiển thị trong bản đồ, các thành phần giao diện chung nằm phía trên.        |
| Nút lưu phòng                   | Nút trái tim trên thẻ phòng có thể nổi lên thanh bộ lọc xanh khi cuộn.                                           | Giới hạn lớp hiển thị trong từng thẻ phòng.                                              |
| Tìm theo trường ở trang chủ     | Dãy trường bị cắt ở cuối và khó cuộn bằng chuột trên desktop.                                                    | Có nút cuộn trái/phải trên desktop và thanh cuộn ngang.                                  |
| Header chung                    | Logo nằm giữa, nhóm liên kết bị tách xa nhau, header desktop cao 72px.                                           | Logo lớn hơn ở trái, liên kết nằm cạnh logo, tài khoản ở phải, header desktop cao 64px.  |
| Menu chủ trọ                    | “Thuê phòng” chưa phù hợp vai trò, “Đăng tin” lại mở trang quản lý.                                              | Có “Xem phòng”, “Quản lý tin đăng” và nút “Đăng tin mới” mở form.                        |
| Menu sinh viên                  | Nhãn “Thuê phòng”, các mục điều hướng header bị ẩn trên điện thoại.                                              | Đổi thành “Tìm phòng”, bổ sung menu điện thoại tới các chức năng gợi ý AI.               |
| Chi tiết phòng trên điện thoại  | Nội dung có thể tràn ngang, tiêu đề và địa chỉ bị nút lưu/chia sẻ ép thành cột hẹp.                              | Tiêu đề và địa chỉ dùng hết chiều ngang, nút lưu/chia sẻ xếp bên dưới trên màn hình nhỏ. |
| Tiện ích của phòng              | Không chọn tiện ích thì cột bên phải mô tả bị trống.                                                             | Luôn có khung Tiện ích, hiện thông báo khi chủ nhà chưa cung cấp thông tin.              |
| Hướng dẫn trên form             | Có nhiều dòng giải thích dưới ô giá, địa chỉ và tiêu đề bản đồ.                                                  | Rút gọn các dòng này, dùng nhãn “Địa chỉ đầy đủ (tự động)”.                              |
| Kiểm tra tự động                | Một số test chưa theo kịp giao diện mới, các ca E2E đăng nhập liên tiếp bị dùng chung bộ đếm giới hạn.           | Cập nhật test, chuẩn hóa định dạng và tách cache trong môi trường E2E.                   |

## 2. Chat và dữ liệu hội thoại

- Sửa đường kết nối WebSocket để mặc định đi qua cùng địa chỉ frontend. Nginx chuyển tiếp `/app/` tới Laravel Reverb, Vite cũng có cấu hình proxy tương ứng.
- Cách kết nối này xử lý trường hợp cổng 8080 trên máy Windows đã được ứng dụng khác sử dụng.
- Đồng bộ danh sách hội thoại và badge qua `useConversations`, nhận sự kiện tin nhắn mới, xóa tin và đọc hội thoại.
- Điều chỉnh vòng đời đăng ký sự kiện để cập nhật form hoặc trang không làm mất kết nối nhận tin.
- Khi xóa một phòng, `conversations.listing_id` được đặt về `NULL`. Hội thoại và tin nhắn được giữ lại.

Các file chính gồm [useConversations.ts](apps/web/src/features/messaging/hooks/useConversations.ts), [useConversationRealtime.ts](apps/web/src/features/messaging/hooks/useConversationRealtime.ts), [nginx.conf.template](apps/web/nginx.conf.template) và [migration giữ hội thoại](apps/api/database/migrations/2026_11_13_000001_preserve_conversations_when_listing_deleted.php).

## 3. Đánh giá phòng và giới hạn API

- Thêm bảng `conversation_listing` để ghi nhận các phòng từng được sinh viên liên hệ trong một hội thoại.
- Khi người dùng liên hệ thêm phòng khác của cùng chủ trọ, hệ thống ghi nhận cả ngữ cảnh phòng trước và phòng mới.
- Backend dùng cùng căn cứ để kiểm tra quyền đánh giá và trả thông tin `can_review` cho giao diện.
- Lời nhắc trước khi gửi nêu rõ mỗi phòng chỉ được đánh giá một lần và không thể chỉnh sửa sau khi gửi.
- Middleware giới hạn yêu cầu đổi thời gian từ phút sang giây trước khi ghi bộ đếm. Ví dụ `10,1` có nghĩa 10 yêu cầu trong 1 phút.
- Phản hồi lỗi HTTP giữ lại các header như `Retry-After` để phía gọi biết lúc nào có thể thử lại.

Các file chính gồm [ListingPolicy.php](apps/api/app/Modules/Listing/Policies/ListingPolicy.php), [ConversationService.php](apps/api/app/Modules/Messaging/Services/ConversationService.php), [ReviewDialog.tsx](apps/web/src/features/room/components/ReviewDialog.tsx) và [ApiThrottle.php](apps/api/app/Shared/Http/Middleware/ApiThrottle.php).

**Giới hạn dữ liệu cũ** — Migration bổ sung lịch sử từ liên kết phòng hiện còn trong hội thoại. Những liên kết đã bị ghi đè trước đó không thể tự khôi phục đầy đủ. Sinh viên có thể cần liên hệ lại phòng cũ để hệ thống ghi nhận.

## 4. Đăng tin và sửa tin

### Giá và địa chỉ

- Ô giá dùng nút tăng/giảm mặc định của trình duyệt, giống ô diện tích, với bước 100.000 đồng.
- Thêm ô “Số nhà, tên đường”.
- Ô “Địa chỉ đầy đủ (tự động)” chỉ đọc, ghép theo thứ tự số nhà, tên đường → phường/xã → tỉnh/thành phố.
- Khi sửa tin cũ, form tách phần tên phường và thành phố đã biết khỏi địa chỉ để hạn chế ghép lặp lại.
- Đổi tỉnh/thành hoặc phường/xã sẽ xóa tọa độ đã chọn để tránh giữ nhầm vị trí của khu vực trước.

### Bản đồ và ảnh

- Bổ sung lớp nền OpenStreetMap và dấu tròn chọn vị trí.
- Bấm bản đồ để điền vĩ độ, kinh độ. Có thể nhập tọa độ bằng tay và hiển thị lại điểm đã lưu khi sửa tin.
- Bản đồ ưu tiên vị trí đã chọn, sau đó tới khu vực phường hoặc thành phố.
- Bật zoom bằng cuộn chuột, dời nhãn tọa độ sang cạnh nút zoom.
- Chọn ảnh lần sau được cộng vào danh sách đang chờ. Có thể bỏ từng ảnh trước khi gửi.
- Giới hạn tổng cộng 5 ảnh cho một tin, tính cả ảnh đã lưu và ảnh mới. Kiểm tra định dạng JPG, PNG, WebP và dung lượng tối đa 2 MB mỗi ảnh.

Các file chính nằm trong [nhóm giao diện form](apps/web/src/features/landlord/components/landlord-form), [useListingForm.ts](apps/web/src/features/landlord/hooks/useListingForm.ts), [useListingPhotos.ts](apps/web/src/features/landlord/hooks/useListingPhotos.ts) và [listingFormModel.ts](apps/web/src/features/landlord/lib/listingFormModel.ts).

## 5. Header, tìm phòng, trang chủ và chi tiết phòng

- Header desktop đưa logo sang trái và giảm chiều cao. Thanh bên và thanh bộ lọc lấy cùng biến chiều cao header để căn vị trí.
- Chủ trọ có “Xem phòng”, “Quản lý tin đăng”, “Đăng tin mới”.
- Sinh viên có “Tìm phòng” và menu “Gợi ý AI” trên desktop.
- Điện thoại có menu ba gạch cạnh logo cho tài khoản đã đăng nhập. Sinh viên truy cập được tìm phòng, bạn cùng phòng và khu vực phù hợp. Chủ trọ truy cập được xem phòng, quản lý và đăng tin mới.
- Nút phòng đã lưu tiếp tục truy cập qua biểu tượng trái tim ở thanh bên hoặc thanh dưới trên điện thoại.
- Phân trang tìm phòng có trang đầu, trang trước, nhóm số trang, trang sau và trang cuối. Nút ở giới hạn được vô hiệu hóa.
- Nút “Đăng tin ngay” trên trang chủ mở đúng form khi đăng nhập chủ trọ.
- Dãy trường ở trang chủ có nút cuộn ngang cho desktop.
- Giới hạn lớp hiển thị Leaflet và từng thẻ phòng để bản đồ, nút trái tim nằm đúng dưới header và bộ lọc.
- Chi tiết phòng dùng đủ chiều rộng trên điện thoại. Tiêu đề, địa chỉ và nút thao tác được xếp lại để dễ đọc.
- Khung Tiện ích vẫn hiện khi danh sách trống với nội dung “Chủ nhà chưa cung cấp thông tin tiện ích.”

Các file chính gồm [shell.tsx](apps/web/src/app/shell.tsx), [Pagination.tsx](apps/web/src/features/search/components/Pagination.tsx), [HomeQuickStrip.tsx](apps/web/src/features/home/components/HomeQuickStrip.tsx), [RoomHeader.tsx](apps/web/src/features/room/components/RoomHeader.tsx) và [RoomDescription.tsx](apps/web/src/features/room/components/RoomDescription.tsx).

## 6. Thay đổi database và lưu ý khi lấy bản fork

Có hai migration mới cần áp dụng trên database đang dùng.

| Migration                                                           | Nội dung                                                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `2026_11_13_000001_preserve_conversations_when_listing_deleted.php` | Đổi khóa ngoại của hội thoại để xóa phòng sẽ gỡ liên kết phòng thay vì xóa hội thoại. |
| `2026_11_13_000002_track_conversation_listings.php`                 | Thêm bảng `conversation_listing` và bổ sung liên kết từ dữ liệu hiện có.              |

Với máy đã có môi trường Docker, lấy code từ fork rồi cập nhật image ứng dụng theo hướng dẫn chạy của repo. Sau khi backend sẵn sàng, kiểm tra và chạy migration còn thiếu.

```powershell
docker compose exec backend php artisan migrate:status
docker compose exec backend php artisan migrate --force
```

Database, tài khoản, ảnh upload và cấu hình bí mật trên máy mỗi người được lưu riêng. Khi clone fork, cần thiết lập môi trường theo [README](README.md). Nếu cần chia sẻ đúng dữ liệu demo đang có, nhóm phải chuyển bản sao database và ảnh riêng.

## 7. Kiểm thử và trạng thái đã xác nhận

Tại commit `22acebd`, [GitHub Actions CI](https://github.com/kiengtong502/trosv/actions/runs/43387902798) và [CodeQL](https://github.com/kiengtong502/trosv/actions/runs/43387903454) đều thành công.

- 554 test frontend đạt. Coverage vượt các ngưỡng đang cấu hình trong repo.
- 132 test E2E đạt, 1 test được bỏ qua theo điều kiện có sẵn của bộ test.
- Các job API, AI service, build Docker, kiểm tra stack và quét bí mật đều đạt trên CI.
- Đã bổ sung test cho quyền đánh giá, giữ hội thoại khi xóa phòng, giới hạn đăng nhập, cập nhật chat/badge, phân trang, địa chỉ và chọn ảnh.
- Đã chạy thử tạo và sửa tin với 5 ảnh, địa chỉ tự ghép và vị trí bản đồ trên Chrome.
- Đã kiểm tra bố cục ở nhiều chiều rộng từ 320px tới desktop. Một số kiểm tra menu dùng tài khoản giả lập. Người dùng đã xác nhận thử menu và chat bằng tài khoản của mình.

Trong CI E2E, `CACHE_STORE=array` giúp các ca giao diện chạy liên tiếp từ cùng IP không tích lũy bộ đếm đăng nhập qua các request. Giới hạn đăng nhập được kiểm tra riêng trong bộ test API. Hai test bản đồ đã được cập nhật theo dấu tròn và ô số nhà, tên đường mới.

**Phần cần kiểm tra tiếp** — Chưa xác nhận đầy đủ các chức năng AI với nhà cung cấp AI thật và chưa thử trên điện thoại thật. Phạm vi chỉ TP.HCM đang là đề xuất để xem xét sau. Nhóm nên chạy lại luồng demo bằng tài khoản thật trước khi trình bày.

## 8. Các commit để tra cứu

| Commit                                                            | Nội dung                                                                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [`c6ed37d`](https://github.com/kiengtong502/trosv/commit/c6ed37d) | Tổng hợp sửa chat, dữ liệu hội thoại, quyền đánh giá, form đăng tin, phân trang và giao diện. |
| [`36fd533`](https://github.com/kiengtong502/trosv/commit/36fd533) | Làm rõ menu theo vai trò và thêm menu header trên điện thoại.                                 |
| [`61d76aa`](https://github.com/kiengtong502/trosv/commit/61d76aa) | Chuẩn hóa định dạng test bố cục chi tiết phòng để CI đạt bước Prettier.                       |
| [`722837a`](https://github.com/kiengtong502/trosv/commit/722837a) | Tách cache môi trường E2E và báo rõ lỗi đăng nhập trong helper test.                          |
| [`22acebd`](https://github.com/kiengtong502/trosv/commit/22acebd) | Cập nhật test bản đồ theo dấu tròn và ô địa chỉ mới.                                          |
