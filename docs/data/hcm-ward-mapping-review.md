# Đối chiếu dữ liệu phường/xã TROSV

Cập nhật ngày **15/11/2026**, snapshot lúc **00:56:37 (UTC+07:00)** của database `rental`. Dữ liệu được lấy bằng một truy vấn SELECT tổng hợp; kết nối đặt `default_transaction_read_only=on` và đã đọc lại `transaction_read_only=on`. Lượt này không chạy seed/migration hoặc sửa dữ liệu.

Báo cáo này thay số liệu ngày 13/11/2026. Chi tiết từng bản ghi nằm trong [JSON đối chiếu](hcm-ward-mapping-review.json); số liệu cũ chỉ giữ ở `previous_review` để so sánh, không còn là hiện trạng.

## Kết quả hiện tại

**Đã đồng bộ đủ 102 phường/xã và 61 trường TP.HCM. Không còn thiếu 92 phường/xã như báo cáo cũ.** Phạm vi phòng là địa bàn TP.HCM trước sáp nhập tỉnh năm 2025, dùng tên phường/xã mới. Hai cơ sở Đông Hòa vẫn được phép làm mốc tìm phòng theo lựa chọn của người dùng.

| Nội dung | Snapshot hiện tại |
| --- | ---: |
| Phường/xã toàn database | 130 |
| Phường/xã TP.HCM khớp bộ 102 | 102 |
| Trong đó phường / xã | 78 / 24 |
| Đơn vị trong bộ 102 còn thiếu theo tên | 0 |
| Điểm phường/xã lệch JSON nguồn ở độ chính xác DB | 0 |
| Trường mang nhãn TP.HCM | 61 |
| Trường gắn một trong 102 phường/xã | 59 |
| Cơ sở Đông Hòa được giữ làm mốc, `ward_id = null` | 2 |
| Điểm trường lệch dữ liệu người dùng ở độ chính xác DB | 0 |
| Tin phòng gắn phường TP.HCM, mọi trạng thái | 23 |
| Trong đó tin có trạng thái `available` | 21 |
| Tổng tin phòng, mọi thành phố và trạng thái | 54 |
| Phường/xã ngoài phạm vi còn trong DB | 28 |
| Tin phòng ngoài phạm vi còn trong DB | 31 |
| Trường ngoài danh mục TP.HCM còn trong DB | 40 |
| Hồ sơ đang tham chiếu trường ngoài danh mục TP.HCM | 9 |

Đối chiếu tọa độ chỉ xác nhận DB khớp hai file JSON ở độ chính xác 7 chữ số thập phân. Đây không phải xác nhận ghim nằm đúng địa giới hoặc xác minh độc lập vị trí thực tế.

## Các ánh xạ cũ đã xử lý

| Tên cũ | Tên hiện tại | Mã hành chính | ID đích trong DB |
| --- | --- | --- | ---: |
| Phường Bến Nghé | Phường Sài Gòn | `26740` | 18 |
| Phường Linh Trung | Phường Linh Xuân | `26800` | 21 |
| Phường Linh Chiểu | Phường Thủ Đức | `26824` | 22 |
| Phường Võ Thị Sáu | Phường Xuân Hòa | `27139` | 23 |
| Phường Tân Phong | Phường Tân Hưng | `27475` | 30 |
| Phường Thảo Điền | Phường An Khánh | `27094` | 31 |

Sáu tên cũ trên không còn trong snapshot; các đích mới đều đã có. Đa Kao cũng không còn bản ghi tên cũ. Cơ chế giữ/chuyển ID và khóa tham chiếu nằm trong [WardSeeder.php](../../apps/api/database/seeders/WardSeeder.php). Không cần lặp lại bước nhập/hợp nhất chỉ vì báo cáo ngày 13/11 từng liệt kê chúng.

Các chỉ số `full_merge_wards` và `split_wards` ở phần `summary` của JSON hiện bằng 0 để chỉ số tên cũ còn chờ xử lý trong snapshot, không phải phủ nhận sáu ánh xạ đã hoàn thành. Thông tin này được ghi riêng ở `completed_ward_mappings`.

## Đối chiếu đủ 102 đơn vị với ID database

Nguồn tên, mã và tọa độ là [hcm-wards-102.json](../../apps/api/database/data/hcm-wards-102.json). **Mã hành chính không phải ID database.** Số tin bao gồm mọi trạng thái; số trường là các bản ghi có `school.ward_id` trỏ tới đơn vị đó.

| ID DB | Phường/xã hiện tại | Mã hành chính | Tin phòng | Trường |
| ---: | --- | --- | ---: | ---: |
| 16 | Phường Diên Hồng | `27169` | 1 | 1 |
| 17 | Phường Chợ Quán | `27301` | 1 | 3 |
| 18 | Phường Sài Gòn | `26740` | 1 | 3 |
| 19 | Phường Bến Thành | `26743` | 1 | 2 |
| 21 | Phường Linh Xuân | `26800` | 2 | 6 |
| 22 | Phường Thủ Đức | `26824` | 1 | 1 |
| 23 | Phường Xuân Hòa | `27139` | 1 | 3 |
| 25 | Phường Thạnh Mỹ Tây | `26956` | 1 | 3 |
| 26 | Phường Bình Lợi Trung | `26905` | 1 | 0 |
| 27 | Phường Xóm Chiếu | `27259` | 1 | 2 |
| 28 | Phường Hạnh Thông | `26890` | 1 | 2 |
| 29 | Phường Chợ Lớn | `27343` | 1 | 3 |
| 30 | Phường Tân Hưng | `27475` | 9 | 2 |
| 31 | Phường An Khánh | `27094` | 1 | 2 |
| 46 | Phường Tân Định | `26737` | 0 | 0 |
| 47 | Phường Cầu Ông Lãnh | `26758` | 0 | 1 |
| 48 | Phường Bàn Cờ | `27154` | 0 | 1 |
| 49 | Phường Nhiêu Lộc | `27142` | 0 | 0 |
| 50 | Phường Khánh Hội | `27265` | 0 | 0 |
| 51 | Phường Vĩnh Hội | `27286` | 0 | 0 |
| 52 | Phường An Đông | `27316` | 0 | 0 |
| 53 | Phường Bình Tây | `27367` | 0 | 0 |
| 54 | Phường Bình Tiên | `27373` | 0 | 0 |
| 55 | Phường Bình Phú | `27364` | 0 | 0 |
| 56 | Phường Phú Lâm | `27349` | 0 | 0 |
| 57 | Phường Tân Thuận | `27478` | 0 | 0 |
| 58 | Phường Phú Thuận | `27484` | 0 | 0 |
| 59 | Phường Tân Mỹ | `27487` | 0 | 1 |
| 60 | Phường Chánh Hưng | `27418` | 0 | 1 |
| 61 | Phường Phú Định | `27427` | 0 | 0 |
| 62 | Phường Bình Đông | `27424` | 0 | 0 |
| 63 | Phường Vườn Lài | `27190` | 0 | 0 |
| 64 | Phường Hòa Hưng | `27163` | 0 | 3 |
| 65 | Phường Minh Phụng | `27238` | 0 | 0 |
| 66 | Phường Bình Thới | `27232` | 0 | 0 |
| 67 | Phường Hòa Bình | `27211` | 0 | 0 |
| 68 | Phường Phú Thọ | `27226` | 0 | 0 |
| 69 | Phường Đông Hưng Thuận | `26791` | 0 | 0 |
| 70 | Phường Trung Mỹ Tây | `26785` | 0 | 1 |
| 71 | Phường Tân Thới Hiệp | `26782` | 0 | 0 |
| 72 | Phường Thới An | `26773` | 0 | 0 |
| 73 | Phường An Phú Đông | `26767` | 0 | 0 |
| 74 | Phường An Lạc | `27460` | 0 | 0 |
| 75 | Phường Tân Tạo | `27457` | 0 | 0 |
| 76 | Phường Bình Tân | `27442` | 0 | 0 |
| 77 | Phường Bình Trị Đông | `27448` | 0 | 0 |
| 78 | Phường Bình Hưng Hòa | `27439` | 0 | 0 |
| 79 | Phường Gia Định | `26944` | 0 | 4 |
| 80 | Phường Bình Thạnh | `26929` | 0 | 1 |
| 81 | Phường Bình Quới | `26911` | 0 | 0 |
| 82 | Phường An Nhơn | `26876` | 0 | 1 |
| 83 | Phường Gò Vấp | `26884` | 0 | 1 |
| 84 | Phường An Hội Đông | `26878` | 0 | 0 |
| 85 | Phường Thông Tây Hội | `26898` | 0 | 0 |
| 86 | Phường An Hội Tây | `26882` | 0 | 0 |
| 87 | Phường Đức Nhuận | `27043` | 0 | 0 |
| 88 | Phường Cầu Kiệu | `27058` | 0 | 0 |
| 89 | Phường Phú Nhuận | `27073` | 0 | 1 |
| 90 | Phường Tân Sơn Hòa | `26977` | 0 | 2 |
| 91 | Phường Tân Sơn Nhất | `26968` | 0 | 1 |
| 92 | Phường Tân Hòa | `26995` | 0 | 0 |
| 93 | Phường Bảy Hiền | `26983` | 0 | 1 |
| 94 | Phường Tân Bình | `27004` | 0 | 0 |
| 95 | Phường Tân Sơn | `27007` | 0 | 0 |
| 96 | Phường Tây Thạnh | `27013` | 0 | 1 |
| 97 | Phường Tân Sơn Nhì | `27019` | 0 | 0 |
| 98 | Phường Phú Thọ Hòa | `27022` | 0 | 0 |
| 99 | Phường Tân Phú | `27031` | 0 | 0 |
| 100 | Phường Phú Thạnh | `27028` | 0 | 0 |
| 101 | Phường Hiệp Bình | `26809` | 0 | 0 |
| 102 | Phường Tam Bình | `26803` | 0 | 0 |
| 103 | Phường Tăng Nhơn Phú | `26842` | 0 | 4 |
| 104 | Phường Long Bình | `26833` | 0 | 0 |
| 105 | Phường Long Phước | `26857` | 0 | 0 |
| 106 | Phường Long Trường | `26860` | 0 | 0 |
| 107 | Phường Cát Lái | `27112` | 0 | 1 |
| 108 | Phường Bình Trưng | `27097` | 0 | 0 |
| 109 | Phường Phước Long | `26848` | 0 | 0 |
| 110 | Xã Vĩnh Lộc | `27601` | 0 | 0 |
| 111 | Xã Tân Vĩnh Lộc | `27604` | 0 | 0 |
| 112 | Xã Bình Lợi | `27610` | 0 | 0 |
| 113 | Xã Tân Nhựt | `27595` | 0 | 0 |
| 114 | Xã Bình Chánh | `27637` | 0 | 0 |
| 115 | Xã Hưng Long | `27628` | 0 | 0 |
| 116 | Xã Bình Hưng | `27619` | 0 | 0 |
| 117 | Xã Bình Khánh | `27667` | 0 | 0 |
| 118 | Xã An Thới Đông | `27673` | 0 | 0 |
| 119 | Xã Cần Giờ | `27664` | 0 | 0 |
| 120 | Xã Thạnh An | `27676` | 0 | 0 |
| 121 | Xã Củ Chi | `27553` | 0 | 0 |
| 122 | Xã Tân An Hội | `27496` | 0 | 0 |
| 123 | Xã Thái Mỹ | `27526` | 0 | 0 |
| 124 | Xã An Nhơn Tây | `27508` | 0 | 0 |
| 125 | Xã Nhuận Đức | `27511` | 0 | 0 |
| 126 | Xã Phú Hòa Đông | `27541` | 0 | 0 |
| 127 | Xã Bình Mỹ | `27544` | 0 | 0 |
| 128 | Xã Đông Thạnh | `27568` | 0 | 0 |
| 129 | Xã Hóc Môn | `27559` | 0 | 0 |
| 130 | Xã Xuân Thới Sơn | `27577` | 0 | 0 |
| 131 | Xã Bà Điểm | `27592` | 0 | 0 |
| 132 | Xã Nhà Bè | `27655` | 0 | 0 |
| 133 | Xã Hiệp Phước | `27658` | 0 | 0 |

Danh sách thiếu `missing_target_units` trong JSON hiện là mảng rỗng.

## Trường và cơ sở được phép ngoài bộ 102

Danh mục [61 cơ sở chính](../../apps/api/database/data/hcm-schools-main-campuses.json) đã được đối chiếu theo tên, tọa độ và liên kết phường. Có 59 trường gắn phường/xã đúng theo file nguồn; hai trường sau được giữ làm mốc khoảng cách:

| ID DB | Trường | Cơ sở | Địa chỉ nguồn | Liên kết phường |
| ---: | --- | --- | --- | --- |
| 24 | ĐH Quốc tế | Cơ sở | khu phố 6, Đông Hòa, TP.HCM | `null` theo chủ đích |
| 61 | ĐH Khoa học Sức khỏe | Cơ sở | Tòa nhà hành chính YA1, Đ. Hải Thượng Lãn Ông, Khu Đô thị ĐHQG-HCM, Đông Hòa, Hồ Chí Minh, Việt Nam | `null` theo chủ đích |

Không nhập phường Đông Hòa vào bộ 102 để phục vụ hai cơ sở này. Chi tiết cả 101 bản ghi trường hiện có trong DB, gồm số hồ sơ tham chiếu từng trường, nằm ở `school_assessments` trong JSON.

## Database đang dùng và bộ seed mới là hai hiện trạng khác nhau

| Thành phố ngoài phạm vi | Phường/xã còn trong DB | Tin phòng | Trường | Hồ sơ tham chiếu trường |
| --- | ---: | ---: | ---: | ---: |
| Hà Nội | 15 | 16 | 20 | 9 |
| Đà Nẵng | 13 | 15 | 20 | 0 |

Dữ liệu Hà Nội/Đà Nẵng đang được giữ nguyên trong database hiện hữu. Không được hiểu việc dọn seeder là đã xóa các bản ghi này. Giới hạn hoạt động dùng [ServiceArea.php](../../apps/api/app/Shared/Support/ServiceArea.php); lượt này không chạy lại các luồng UI/API.

Bộ seed trong code hiện chỉ tạo **1 thành phố, 102 phường/xã, 61 trường, 16 phòng minh họa và 13 tài khoản** khi khởi tạo database trống. [DatabaseSeeder.php](../../apps/api/database/seeders/DatabaseSeeder.php) bỏ qua bộ demo nếu đã có thành phố. Không chạy `migrate:fresh` để làm cho số lượng DB hiện hữu giống bộ seed mới.

## Phòng minh họa và phần còn cần xác minh

Theo xác nhận của người dùng, các phòng đang dùng là dữ liệu minh họa giao diện. Lượt này chỉ cập nhật liên kết và trạng thái của 54 tin trong `listing_assessments`, không gán lại phường dựa trên địa chỉ/ghim.

Các bảng khoảng cách >5 km và đích suy ra từ địa chỉ trong báo cáo cũ không được coi là kết quả hiện tại hoặc đã giải quyết. Trường `distance_to_current_ward_reference_km` được để `null` vì không tính lại ở lượt này. [ListingSeeder.php](../../apps/api/database/seeders/ListingSeeder.php) vẫn sinh địa chỉ và tọa độ minh họa, chưa xác nhận vị trí thực tế.

Những điểm còn thiếu bằng chứng:

- 101 điểm tọa độ phường/xã từ bộ nguồn chưa được kiểm chứng độc lập; Hiệp Phước dùng tọa độ do người dùng cung cấp.
- Điểm Bình Mỹ `10.66, 106.77` vẫn được giữ trong `coordinate_followup` với trạng thái chờ xác minh từ báo cáo trước; lượt này chưa thay điểm đó.
- Tọa độ cơ sở trường đã khớp dữ liệu người dùng, chưa tra cứu lại độc lập từng ghim.
- Bộ nguồn chưa có đa giác ranh giới; không thể dùng việc khớp tên hoặc khoảng cách tới điểm phường để kết luận một tọa độ thuộc phường đó.

## Việc còn lại

1. Khi chuẩn bị demo AI, chọn lại trường trong danh mục TP.HCM cho các hồ sơ mẫu đang dùng trường ngoài phạm vi; báo cáo này không tự sửa 9 hồ sơ.
2. Chỉ xử lý/xóa dữ liệu ngoài phạm vi trong DB bằng một tác vụ riêng sau khi có yêu cầu và sao lưu. Các khóa ngoại hiện tại, gồm `listings.ward_id` xóa dây chuyền, đã được đọc lại ở `deletion_effects_observed` trong JSON.
3. Kiểm chứng tọa độ phường/xã trước khi dùng làm dữ liệu vị trí chính thức. Chưa cần rà lại địa chỉ thực tế của từng phòng mẫu nếu nhóm chỉ dùng chúng để thử giao diện.

Báo cáo phản ánh snapshot nêu ở đầu file. Khi database hoặc hai JSON nguồn thay đổi, cần đối chiếu lại số lượng và các liên kết.
