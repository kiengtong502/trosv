# Đối chiếu dữ liệu phường/xã TROSV

Rà soát database `rental` ngày 13/11/2026. Các truy vấn đọc chạy trong kết nối đặt `default_transaction_read_only=on`. Số lượng bao gồm các trạng thái tin phòng hiện có.

Bảng đối chiếu dùng [bộ 102 đơn vị](hcm-wards-102.md) và [file JSON ánh xạ](hcm-ward-mapping-review.json). Mã trong bộ 102 đơn vị và ID nội bộ trong database được ghi thành hai trường riêng.

## Tổng hợp

| Nội dung | Số lượng |
| --- | ---: |
| Phường/xã toàn database | 45 |
| Phường/xã mang nhãn TP.HCM | 17 |
| Tên TP.HCM trùng bộ dữ liệu mới | 10 |
| Tên cũ có đích nhập toàn bộ | 6 |
| Tên cũ bị chia địa bàn | 1 |
| Đơn vị trong bộ 102 chưa có theo tên hiện tại | 92 |
| Tin phòng gắn phường TP.HCM | 23 |
| Trường mang nhãn TP.HCM | 20 |
| Phường/xã ngoài phạm vi | 28 |
| Tin phòng ngoài phạm vi | 31 |
| Trường ngoài phạm vi | 40 |
| Hồ sơ đang tham chiếu trường ngoài phạm vi | 9 |

92 đơn vị thiếu được xác định theo tên khớp hiện tại. Sáu ánh xạ nhập toàn bộ có 4 đích chưa trùng tên trong DB và 2 đích đã tồn tại là Linh Xuân, Tân Hưng. Cần hợp nhất các đích trước khi tính số bản ghi mới cần tạo.

## Bảng ánh xạ 17 phường TP.HCM

Đích trong bảng thể hiện quan hệ địa bàn. Vị trí của từng phòng và cơ sở trường cần được đối chiếu với địa chỉ thực tế trước khi cập nhật liên kết. Các trường hợp nhập toàn bộ và chia địa bàn dựa vào Điều 1 của [Nghị quyết 1685/NQ-UBTVQH15](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-1685-nq-ubtvqh15-sap-xep-cac-dvhc-cap-xa-cua-thanh-pho-ho-chi-minh-nam-2025-119250616211341304.htm).

| ID DB | Tên đang dùng | Đích dự kiến và mã | Cơ sở | Tin phòng | Trường |
| --- | --- | --- | --- | ---: | ---: |
| 16 | Phường Diên Hồng | Phường Diên Hồng (`27169`) | Khớp tên | 1 | 1 |
| 17 | Phường Chợ Quán | Phường Chợ Quán (`27301`) | Khớp tên | 1 | 3 |
| 18 | Phường Bến Nghé | Phường Sài Gòn (`26740`) | Khoản 1 | 1 | 1 |
| 19 | Phường Bến Thành | Phường Bến Thành (`26743`) | Khớp tên | 1 | 1 |
| 20 | Phường Linh Trung | Phường Linh Xuân (`26800`) | Khoản 70 | 1 | 3 |
| 21 | Phường Linh Xuân | Phường Linh Xuân (`26800`) | Khớp tên | 1 | 1 |
| 22 | Phường Linh Chiểu | Phường Thủ Đức (`26824`) | Khoản 68 | 1 | 1 |
| 23 | Phường Võ Thị Sáu | Phường Xuân Hòa (`27139`) | Khoản 6 | 1 | 2 |
| 24 | Phường Tân Phong | Phường Tân Hưng (`27475`) | Khoản 21 | 2 | 2 |
| 25 | Phường Thạnh Mỹ Tây | Phường Thạnh Mỹ Tây (`26956`) | Khớp tên | 1 | 1 |
| 26 | Phường Bình Lợi Trung | Phường Bình Lợi Trung (`26905`) | Khớp tên | 1 | 1 |
| 27 | Phường Xóm Chiếu | Phường Xóm Chiếu (`27259`) | Khớp tên | 1 | 1 |
| 28 | Phường Hạnh Thông | Phường Hạnh Thông (`26890`) | Khớp tên | 1 | 1 |
| 29 | Phường Chợ Lớn | Phường Chợ Lớn (`27343`) | Khớp tên | 1 | 1 |
| 30 | Phường Tân Hưng | Phường Tân Hưng (`27475`) | Khớp tên | 7 | 0 |
| 31 | Phường Thảo Điền | Phường An Khánh (`27094`) | Khoản 78 | 1 | 0 |
| 32 | Phường Đa Kao | Phường Sài Gòn (`26740`) / Phường Tân Định (`26737`) | Khoản 1, 2 | 0 | 0 |

Có 7 tin phòng và 9 trường đang tham chiếu 6 phường có đích nhập toàn bộ. Đa Kao hiện có 0 tin phòng và 0 trường tham chiếu.

## Tin phòng TP.HCM cần đối chiếu

Ngưỡng 5 km giữa ghim phòng và điểm phường trong database được chọn để ưu tiên rà soát. Khoảng cách dùng tọa độ hiện có trong database. Việc xác định phường cho từng ghim cần địa chỉ thực tế hoặc đa giác ranh giới.

| ID tin | Phường đang gắn | Khoảng cách đến điểm phường (km) | Địa chỉ đang lưu |
| --- | --- | ---: | --- |
| 4 | Phường Bến Thành | 16.64 | Số 126 Đường Võ Văn Ngân, Phường Bến Thành, TP.HCM |
| 7 | Phường Linh Chiểu | 11.13 | Số 205 Đường An Dương Vương, Phường Linh Chiểu, TP.HCM |
| 8 | Phường Võ Thị Sáu | 6.14 | Số 215 Đường Đặng Thùy Trâm, Phường Võ Thị Sáu, TP.HCM |
| 9 | Phường Tân Phong | 15.51 | Số 175 Đường Nguyễn Văn Bảo, Phường Tân Phong, TP.HCM |
| 11 | Phường Bình Lợi Trung | 6.15 | Số 242 Đường Tô Hiến Thành, Phường Bình Lợi Trung, TP.HCM |
| 13 | Phường Hạnh Thông | 6.27 | Số 124 Đường Lý Thường Kiệt, Phường Hạnh Thông, TP.HCM |
| 15 | Phường Tân Hưng | 17.92 | Số 118 Đường Đinh Tiên Hoàng, Phường Tân Hưng, TP.HCM |
| 54 | Phường Tân Hưng | 5.47 | E39 Hoàng Quốc Việt, Phường Phú Thuận, TPHCM |

`ListingSeeder.php` lấy phường theo vòng lặp tại dòng 114, chọn trường độc lập tại dòng 123 và đặt ghim gần trường tại dòng 130–131. Cách sinh này có thể tạo địa chỉ/phường và ghim lệch nhau. Khi chuẩn bị dữ liệu demo cần chọn phường, địa chỉ và điểm ghim nhất quán. [Code seeder](../../apps/api/database/seeders/ListingSeeder.php)

### Các địa chỉ cần kiểm tra riêng

| ID tin | Phường đang gắn | Đích theo thông tin địa chỉ | Bằng chứng và việc cần xác nhận |
| --- | --- | --- | --- |
| 51 | Phường Tân Hưng | Phường Tân Thuận | Địa chỉ hiện ghi Tân Thuận, khác ward_id đang gắn Tân Hưng. Cần xác nhận địa chỉ/ghim thực tế. |
| 52 | Phường Tân Hưng | Phường Phú Thuận | Địa chỉ hiện ghi Phú Thuận, khác ward_id đang gắn Tân Hưng. Đối chiếu khoản 19. |
| 53 | Phường Tân Phong | Phường Tân Hưng | Địa chỉ ghi khu vực Tân Quy. Khoản 21 đưa Tân Quy vào Tân Hưng. Cần xác nhận vị trí phòng. |
| 54 | Phường Tân Hưng | Phường Phú Thuận | Địa chỉ ghi Phú Thuận, khác ward_id đang gắn Tân Hưng. Đối chiếu khoản 19. |
| 55 | Phường Tân Hưng | Xã Nhà Bè | Địa chỉ ghi xã Phước Kiển cũ. Khoản 134 đưa Phước Kiển vào xã Nhà Bè. Cần xác nhận vị trí phòng. |
| 61 | Phường Tân Hưng | Phường Tân Thuận / Phường Tân Hưng | Địa chỉ 350 Huỳnh Tấn Phát ghi Tân Hưng, còn tin 51 cùng số nhà/đường ghi Tân Thuận và hai ghim rất gần nhau. Cần xác minh địa chỉ thực tế. |

Các đích theo địa chỉ là ứng viên rà soát. Tin 61 cùng số nhà và đường với tin 51 nhưng ghi khác phường, cần xác minh điểm thực tế trước khi chọn đích.

## Trường và liên kết hồ sơ

Bảng sau thể hiện đích suy ra từ `schools.ward_id` hiện tại. Cần đối chiếu địa chỉ từng cơ sở học, đặc biệt khi một trường có nhiều cơ sở.

| ID trường | Tên trong DB | ID phường DB | Đích theo phường đang gắn | Hồ sơ liên kết |
| --- | --- | ---: | --- | ---: |
| 21 | ĐH Bách Khoa - ĐHQG TP.HCM (HCMUT) | 16 | Phường Diên Hồng | 0 |
| 22 | ĐH Khoa học Tự nhiên - ĐHQG TP.HCM (HCMUS) | 17 | Phường Chợ Quán | 0 |
| 23 | ĐH KHXH&NV - ĐHQG TP.HCM (USSH HCM) | 18 | Phường Sài Gòn | 0 |
| 24 | ĐH Quốc tế - ĐHQG TP.HCM (HCMIU) | 20 | Phường Linh Xuân | 0 |
| 25 | ĐH Công nghệ Thông tin - ĐHQG TP.HCM (UIT) | 20 | Phường Linh Xuân | 0 |
| 26 | ĐH Kinh tế - Luật - ĐHQG TP.HCM (UEL) | 21 | Phường Linh Xuân | 0 |
| 27 | ĐH Kinh tế TP.HCM (UEH) | 23 | Phường Xuân Hòa | 0 |
| 28 | ĐH Tôn Đức Thắng (TDTU) | 24 | Phường Tân Hưng | 1 |
| 29 | ĐH Sư phạm Kỹ thuật TP.HCM (HCMUTE) | 22 | Phường Thủ Đức | 0 |
| 30 | ĐH Công nghệ TP.HCM (HUTECH) | 25 | Phường Thạnh Mỹ Tây | 0 |
| 31 | ĐH Sư phạm TP.HCM (HCMUE) | 17 | Phường Chợ Quán | 0 |
| 32 | ĐH Y Dược TP.HCM (UMP) | 29 | Phường Chợ Lớn | 0 |
| 33 | ĐH Luật TP.HCM (HCMULAW) | 27 | Phường Xóm Chiếu | 0 |
| 34 | ĐH Ngân hàng TP.HCM (HUB) | 19 | Phường Bến Thành | 0 |
| 35 | ĐH Nông Lâm TP.HCM (NLU) | 20 | Phường Linh Xuân | 0 |
| 36 | ĐH Văn Lang (VLU) | 26 | Phường Bình Lợi Trung | 0 |
| 37 | ĐH RMIT Việt Nam (RMIT) | 24 | Phường Tân Hưng | 0 |
| 38 | ĐH Sài Gòn (SGU) | 17 | Phường Chợ Quán | 0 |
| 39 | ĐH Công nghiệp TP.HCM (IUH) | 28 | Phường Hạnh Thông | 0 |
| 40 | ĐH Mở TP.HCM (HCMCOU) | 23 | Phường Xuân Hòa | 0 |

## Dữ liệu ngoài phạm vi

| Thành phố | Phường/xã | Tin phòng | Trường | Hồ sơ tham chiếu trường |
| --- | ---: | ---: | ---: | ---: |
| Hà Nội | 15 | 16 | 20 | 9 |
| Đà Nẵng | 13 | 15 | 20 | 0 |

Các ID và số liên kết từng bản ghi được ghi trong file JSON. Đối với 9 hồ sơ đang tham chiếu trường ngoài phạm vi, cần lựa chọn trường đúng theo thông tin người dùng khi chuyển phạm vi hoạt động.

## Tác động xóa dữ liệu đã kiểm tra trong PostgreSQL

- Xóa phường/xã sẽ xóa các tin phòng tham chiếu do `listings.ward_id` dùng `ON DELETE CASCADE`.
- Khi tin phòng bị xóa, các liên kết tiện ích, bản ghi ảnh, đánh giá, yêu thích và liên kết lịch sử phòng trong hội thoại bị xóa theo.
- Trường đang tham chiếu phường bị xóa sẽ có `ward_id = NULL`.
- Xóa trường sẽ đặt `school_id = NULL` cho các hồ sơ đang tham chiếu.
- Hội thoại đang tham chiếu tin bị xóa sẽ có `listing_id = NULL`.

Các tác động trên được đọc từ khóa ngoại của database đang chạy. Trước khi loại dữ liệu cần sao lưu và chuẩn bị cách xử lý các liên kết.

## 92 đơn vị chưa khớp tên hiện tại

- **Quận 1** — Phường Sài Gòn, Phường Tân Định, Phường Cầu Ông Lãnh.
- **Quận 3** — Phường Bàn Cờ, Phường Xuân Hòa, Phường Nhiêu Lộc.
- **Quận 4** — Phường Khánh Hội, Phường Vĩnh Hội.
- **Quận 5** — Phường An Đông.
- **Quận 6** — Phường Bình Tây, Phường Bình Tiên, Phường Bình Phú, Phường Phú Lâm.
- **Quận 7** — Phường Tân Thuận, Phường Phú Thuận, Phường Tân Mỹ.
- **Quận 8** — Phường Chánh Hưng, Phường Phú Định, Phường Bình Đông.
- **Quận 10** — Phường Vườn Lài, Phường Hòa Hưng.
- **Quận 11** — Phường Minh Phụng, Phường Bình Thới, Phường Hòa Bình, Phường Phú Thọ.
- **Quận 12** — Phường Đông Hưng Thuận, Phường Trung Mỹ Tây, Phường Tân Thới Hiệp, Phường Thới An, Phường An Phú Đông.
- **Quận Bình Tân** — Phường An Lạc, Phường Tân Tạo, Phường Bình Tân, Phường Bình Trị Đông, Phường Bình Hưng Hòa.
- **Quận Bình Thạnh** — Phường Gia Định, Phường Bình Thạnh, Phường Bình Quới.
- **Quận Gò Vấp** — Phường An Nhơn, Phường Gò Vấp, Phường An Hội Đông, Phường Thông Tây Hội, Phường An Hội Tây.
- **Quận Phú Nhuận** — Phường Đức Nhuận, Phường Cầu Kiệu, Phường Phú Nhuận.
- **Quận Tân Bình** — Phường Tân Sơn Hòa, Phường Tân Sơn Nhất, Phường Tân Hòa, Phường Bảy Hiền, Phường Tân Bình, Phường Tân Sơn.
- **Quận Tân Phú** — Phường Tây Thạnh, Phường Tân Sơn Nhì, Phường Phú Thọ Hòa, Phường Tân Phú, Phường Phú Thạnh.
- **TP. Thủ Đức** — Phường Hiệp Bình, Phường Thủ Đức, Phường Tam Bình, Phường Tăng Nhơn Phú, Phường Long Bình, Phường Long Phước, Phường Long Trường, Phường Cát Lái, Phường Bình Trưng, Phường Phước Long, Phường An Khánh.
- **Huyện Bình Chánh** — Xã Vĩnh Lộc, Xã Tân Vĩnh Lộc, Xã Bình Lợi, Xã Tân Nhựt, Xã Bình Chánh, Xã Hưng Long, Xã Bình Hưng.
- **Huyện Cần Giờ** — Xã Bình Khánh, Xã An Thới Đông, Xã Cần Giờ, Xã Thạnh An.
- **Huyện Củ Chi** — Xã Củ Chi, Xã Tân An Hội, Xã Thái Mỹ, Xã An Nhơn Tây, Xã Nhuận Đức, Xã Phú Hòa Đông, Xã Bình Mỹ.
- **Huyện Hóc Môn** — Xã Đông Thạnh, Xã Hóc Môn, Xã Xuân Thới Sơn, Xã Bà Điểm.
- **Huyện Nhà Bè** — Xã Nhà Bè, Xã Hiệp Phước.

## Đối chiếu tiếp tọa độ Bình Mỹ

Danh bạ Công an TP.HCM công bố địa chỉ Công an xã Bình Mỹ tại 76 Hà Duy Phiên, ấp 6, xã Bình Mỹ. Có thể dùng địa chỉ này làm một mốc đối chiếu vị trí. Tọa độ tham chiếu cho toàn xã vẫn cần xác minh và ghi rõ cách chọn điểm. [Danh bạ chính thức](https://congan.hochiminhcity.gov.vn/wps/portal/Home/trang-chu/noi-dung-chi-tiet/danh%2Bba)

Điểm `10.66, 106.77` trong bộ nguồn tiếp tục được đánh dấu cần kiểm tra. Lượt này chưa xác định điểm thay thế đủ căn cứ.

## Cách chuẩn bị bước cập nhật tiếp theo

1. Xác nhận địa chỉ/ghim của các tin đã được đánh dấu và cơ sở trường đang dùng.
2. Lập đích cuối cùng cho từng tin và trường, ưu tiên giữ ID của tin, trường và các liên kết hồ sơ.
3. Lưu mã đơn vị tham chiếu riêng khi bổ sung bộ 102 đơn vị. Bảng `wards` hiện có ID nội bộ và các cột tên, tọa độ, thành phố.
4. Sau khi sao lưu, cập nhật/hợp nhất phường và chuyển các khóa tham chiếu trong giao dịch. Các tên trùng như Linh Xuân và Tân Hưng cần hợp nhất về một bản ghi đích.
5. Kiểm tra lại số tin, trường và hồ sơ, rồi xử lý các dữ liệu ngoài phạm vi đã chọn.
6. Đồng bộ seeder, backend, giao diện và AI với bộ dữ liệu đã xác nhận.

## Giới hạn của lượt đối chiếu

- Đã rà toàn bộ 45 phường/xã, 60 trường và 54 tin phòng qua dữ liệu đọc. Liên kết hồ sơ được tổng hợp theo trường.
- Quan hệ tên cũ → mới dùng nghị quyết và bộ 102 đơn vị. Tên trùng mới chỉ xác nhận sự khớp tên.
- 101 tọa độ trong bộ nguồn còn cần kiểm chứng. Tọa độ Hiệp Phước dùng theo thông tin người dùng.
- Việc xác định phường thực tế của từng phòng và cơ sở trường còn cần địa chỉ chính xác hoặc ranh giới.
- Bảng này là kết quả rà soát tại thời điểm đọc. Khi dữ liệu phòng, trường hoặc hồ sơ thay đổi, số lượng liên kết cần được kiểm tra lại.
