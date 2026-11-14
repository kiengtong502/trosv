# 47 cơ sở đại học tại TP.HCM cũ

Ngày tra cứu 13/11/2026. Phạm vi gồm 47 địa điểm thuộc 12 trường trong danh sách người dùng cung cấp, trên địa bàn TP.HCM trước sáp nhập cấp tỉnh năm 2025.

## Kết quả

- Đã đối chiếu địa chỉ của 47 địa điểm qua trang trường hoặc tài liệu chính thức và ghép mã với [bộ 102 phường/xã](../../apps/api/database/data/hcm-wards-102.json).
- Đã tìm được 46 ghim mang tên trường, cơ sở hoặc đơn vị thuộc trường, có địa chỉ phù hợp với nguồn đối chiếu.
- Cơ sở Đại học Mở tại 283 Lý Thường Kiệt có tọa độ theo số nhà. Bản ghi `ou-5` mang trạng thái `address_pin_needs_review`, cần xác nhận đúng khuôn viên hoặc cổng trường trước khi dùng để tìm phòng.
- Bộ dữ liệu này phục vụ bước chuẩn bị cập nhật database. Phạm vi danh mục trường và cơ sở sẽ tiếp tục được bổ sung.

## Cách đọc dữ liệu

[File JSON](hcm-university-campuses-47.json) lưu tên trường, cơ sở, địa chỉ, tên và mã phường/xã, tọa độ, đường dẫn nguồn, tên địa điểm và địa chỉ quan sát được trên bản đồ.

Địa chỉ chính thức được đối chiếu với website trường. Tọa độ được lấy từ cặp `!3d` và `!4d` trong URL ghim Google Maps sau khi mở địa điểm. Link bản đồ trong bảng dùng CID của cùng địa điểm để rút gọn đường dẫn. Các điểm là vị trí tham chiếu do bản đồ cung cấp, vị trí cổng vào và độ chính xác thực địa chưa được đo kiểm.

`map_place_matched` nghĩa là đã đối chiếu tên địa điểm và địa chỉ với cơ sở. `address_pin_needs_review` nghĩa là đã tìm được điểm theo địa chỉ và còn cần xác nhận vị trí cơ sở tại điểm đó. `map_address_observation` ghi địa chỉ được đọc từ phần chi tiết địa điểm hay danh sách kết quả tìm kiếm.

## Các trường hợp cần lưu ý

- **Đại học Mở, 283 Lý Thường Kiệt**. Tọa độ tham khảo là `10.7750029, 106.6562908`. Bản đồ chỉ ghi số nhà 283 và còn liệt kê doanh nghiệp khác tại địa chỉ. Cần đối chiếu cổng hoặc biển tên cơ sở để xác nhận. Trang trường xác nhận cơ sở tại địa chỉ này. [Nguồn trường](https://hoso.ou.edu.vn/2026), [điểm theo địa chỉ](https://www.google.com/maps?cid=12970121903663599986).
- **UEH cơ sở C**. Nguồn trường ghi 91 đường 3/2, bản đồ ghi 91C 3 Tháng 2. Tên địa điểm trên bản đồ ghi rõ UEH CS C. [Nguồn trường](https://hotro.ueh.edu.vn/bai-viet/co-so-truc-thuoc-580), [bản đồ](https://www.google.com/maps?cid=12019651520249826355).
- **HUTECH Medical Campus**. Địa chỉ được bổ sung thành 276–282 Điện Biên Phủ theo nguồn trường và địa điểm trên bản đồ. [Nguồn trường](https://www.hutech.edu.vn/homepage/tin-tuc/1498-t-ng-quan), [bản đồ](https://www.google.com/maps?cid=9351381451275575953).
- **Hoa Sen Quang Trung**. Cơ sở trong danh sách là Quang Trung 2 tại lô 10. Nguồn trường và bản đồ có các địa điểm mang tên Quang Trung khác, cần giữ đúng lô và cơ sở. [Nguồn trường](https://www.hoasen.edu.vn/dtdh/wp-content/uploads/sites/28/2025/10/Thong-bao-ve-viec-huong-dan-tan-sinh-vien-Khoa-2025-tra-cuu-thoi-khoa-bieu.pdf), [bản đồ](https://www.google.com/maps?cid=16397134748935261922).
- **Đại học Mở, Gia Phú**. Trang nhập học ghi 311 Gia Phú, trang thư viện và bản đồ ghi 311–319 Gia Phú. [Trang nhập học](https://hoso.ou.edu.vn/2026), [trang thư viện](https://thuvien.ou.edu.vn/vi/gioi-thieu/gioi-thieu), [bản đồ](https://www.google.com/maps?cid=10388373076430480992).
- **Đại học Mở, Nhơn Đức**. Trang thư viện và trạm y tế còn liệt kê cơ sở này. Bảng bố trí học tập khóa 2026 dẫn nguồn ở các cơ sở khác. Cần xác nhận tình trạng sử dụng trước khi giới thiệu cho sinh viên khóa mới. [Trang thư viện](https://thuvien.ou.edu.vn/vi/gioi-thieu/gioi-thieu), [bảng khóa 2026](https://hoso.ou.edu.vn/2026).
- **Tôn Đức Thắng, 98 Ngô Tất Tố**. Danh mục công khai ghi loại hình cơ sở là “Khác”. Cần xác nhận có lớp học thường xuyên trước khi ưu tiên làm mốc tìm trọ. [Danh mục của trường](https://www.tdtu.edu.vn/cong-khai-thong-tin/danh-muc-cac-co-so-dao-tao).

## Danh sách tọa độ

### Đại học Kinh tế TP.HCM (UEH)

| Cơ sở        | Địa chỉ                              | Phường/xã và mã          | Vĩ độ, kinh độ          | Nguồn                                                                                                                                        |
| ------------ | ------------------------------------ | ------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| A            | 59C Nguyễn Đình Chiểu                | Phường Xuân Hòa · 27139  | 10.7830828, 106.6946682 | [Trường](https://hotro.ueh.edu.vn/bai-viet/dia-chi-cac-co-so-cua-ueh-12008) · [Bản đồ](https://www.google.com/maps?cid=8375644629846925477)  |
| B            | 279 Nguyễn Tri Phương                | Phường Diên Hồng · 27169 | 10.7610532, 106.668358  | [Trường](https://hotro.ueh.edu.vn/bai-viet/dia-chi-cac-co-so-cua-ueh-12008) · [Bản đồ](https://www.google.com/maps?cid=17483450238918377894) |
| C            | 91 đường 3/2                         | Phường Vườn Lài · 27190  | 10.7731552, 106.6776034 | [Trường](https://hotro.ueh.edu.vn/bai-viet/dia-chi-cac-co-so-cua-ueh-12008) · [Bản đồ](https://www.google.com/maps?cid=12019651520249826355) |
| D            | 196 Trần Quang Khải                  | Phường Tân Định · 26737  | 10.7916937, 106.688399  | [Trường](https://hotro.ueh.edu.vn/bai-viet/dia-chi-cac-co-so-cua-ueh-12008) · [Bản đồ](https://www.google.com/maps?cid=15674321866518091379) |
| E            | 54 Nguyễn Văn Thủ                    | Phường Tân Định · 26737  | 10.7904107, 106.6993687 | [Trường](https://hotro.ueh.edu.vn/bai-viet/dia-chi-cac-co-so-cua-ueh-12008) · [Bản đồ](https://www.google.com/maps?cid=4478464828596665815)  |
| H            | 1A Hoàng Diệu                        | Phường Phú Nhuận · 27073 | 10.7960409, 106.6722079 | [Trường](https://hotro.ueh.edu.vn/bai-viet/dia-chi-cac-co-so-cua-ueh-12008) · [Bản đồ](https://www.google.com/maps?cid=1796792983754684743)  |
| I            | 17 Phạm Ngọc Thạch                   | Phường Xuân Hòa · 27139  | 10.7830021, 106.695181  | [Trường](https://hotro.ueh.edu.vn/bai-viet/dia-chi-cac-co-so-cua-ueh-12008) · [Bản đồ](https://www.google.com/maps?cid=13628312840070848017) |
| N            | Khu chức năng số 15, Nguyễn Văn Linh | Xã Bình Hưng · 27619     | 10.706018, 106.6401289  | [Trường](https://hotro.ueh.edu.vn/bai-viet/dia-chi-cac-co-so-cua-ueh-12008) · [Bản đồ](https://www.google.com/maps?cid=3615273085007476556)  |
| V            | 232/6 Võ Thị Sáu                     | Phường Xuân Hòa · 27139  | 10.7827814, 106.6856197 | [Trường](https://hotro.ueh.edu.vn/bai-viet/dia-chi-cac-co-so-cua-ueh-12008) · [Bản đồ](https://www.google.com/maps?cid=1188275160746047765)  |
| Phạm Đức Sơn | 144 Phạm Đức Sơn                     | Phường Phú Định · 27427  | 10.722313, 106.624085   | [Trường](https://hotro.ueh.edu.vn/bai-viet/dia-chi-cac-co-so-cua-ueh-12008) · [Bản đồ](https://www.google.com/maps?cid=4358382036018185956)  |

### Trường Đại học Công nghệ TP.HCM (HUTECH)

| Cơ sở                 | Địa chỉ                                | Phường/xã và mã              | Vĩ độ, kinh độ          | Nguồn                                                                                                                                |
| --------------------- | -------------------------------------- | ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Trụ sở Điện Biên Phủ  | 475A Điện Biên Phủ                     | Phường Thạnh Mỹ Tây · 26956  | 10.8016954, 106.7145032 | [Trường](https://www.hutech.edu.vn/homepage/tin-tuc/1498-t-ng-quan) · [Bản đồ](https://www.google.com/maps?cid=7799436117781326462)  |
| Ung Văn Khiêm         | 31/36 Ung Văn Khiêm                    | Phường Thạnh Mỹ Tây · 26956  | 10.8095819, 106.71501   | [Trường](https://www.hutech.edu.vn/homepage/tin-tuc/1498-t-ng-quan) · [Bản đồ](https://www.google.com/maps?cid=4048980860444142734)  |
| Medical Campus        | 276–282 Điện Biên Phủ                  | Phường Gia Định · 26944      | 10.7990264, 106.706387  | [Trường](https://www.hutech.edu.vn/homepage/tin-tuc/1498-t-ng-quan) · [Bản đồ](https://www.google.com/maps?cid=9351381451275575953)  |
| Thu Duc Campus E1     | Phân khu Đào tạo E1, Khu Công nghệ cao | Phường Tăng Nhơn Phú · 26842 | 10.8557382, 106.7856068 | [Trường](https://www.hutech.edu.vn/homepage/tin-tuc/1498-t-ng-quan) · [Bản đồ](https://www.google.com/maps?cid=13172765832531514151) |
| Viện Công nghệ cao E2 | Lô E2b-4, đường D1, Khu Công nghệ cao  | Phường Tăng Nhơn Phú · 26842 | 10.8408075, 106.8088987 | [Trường](https://www.hutech.edu.vn/homepage/tin-tuc/1498-t-ng-quan) · [Bản đồ](https://www.google.com/maps?cid=4223445811689793502)  |

### Trường Đại học Nguyễn Tất Thành (NTTU)

| Cơ sở             | Địa chỉ                                                         | Phường/xã và mã              | Vĩ độ, kinh độ          | Nguồn                                                                                                          |
| ----------------- | --------------------------------------------------------------- | ---------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Nguyễn Tất Thành  | 298A–300A Nguyễn Tất Thành                                      | Phường Xóm Chiếu · 27259     | 10.7609859, 106.7102319 | [Trường](https://ctsv.ntt.edu.vn/gioi-thieu/) · [Bản đồ](https://www.google.com/maps?cid=11936156233496335301) |
| Nguyễn Hữu Thọ    | 458/3F Nguyễn Hữu Thọ                                           | Phường Tân Hưng · 27475      | 10.7431428, 106.7015354 | [Trường](https://ctsv.ntt.edu.vn/gioi-thieu/) · [Bản đồ](https://www.google.com/maps?cid=2771978802829758546)  |
| An Phú Đông 331   | 331A–331B Đỗ Mười                                               | Phường An Phú Đông · 26767   | 10.8598029, 106.6946237 | [Trường](https://ctsv.ntt.edu.vn/gioi-thieu/) · [Bản đồ](https://www.google.com/maps?cid=17026128465184511809) |
| An Phú Đông 1165  | 1165 Đỗ Mười                                                    | Phường An Phú Đông · 26767   | 10.8598939, 106.7065509 | [Trường](https://ctsv.ntt.edu.vn/gioi-thieu/) · [Bản đồ](https://www.google.com/maps?cid=7647364462544032600)  |
| Khu Công nghệ cao | Lô E3-1.1, E3-1.2, E3-1.3, đường Võ Chí Công, Khu Công nghệ cao | Phường Tăng Nhơn Phú · 26842 | 10.8378744, 106.8096428 | [Trường](https://ctsv.ntt.edu.vn/gioi-thieu/) · [Bản đồ](https://www.google.com/maps?cid=9832039649395337807)  |

### Trường Đại học Ngoại ngữ – Tin học TP.HCM (HUFLIT)

| Cơ sở       | Địa chỉ          | Phường/xã và mã             | Vĩ độ, kinh độ          | Nguồn                                                                                                                                                             |
| ----------- | ---------------- | --------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sư Vạn Hạnh | 828 Sư Vạn Hạnh  | Phường Hòa Hưng · 27163     | 10.7760147, 106.6673648 | [Trường](https://huflit.edu.vn/wp-content/uploads/2026/05/Brochure-Huflit-4-2026-compressed.pdf) · [Bản đồ](https://www.google.com/maps?cid=11111815958054471075) |
| Hóc Môn     | 806 Lê Quang Đạo | Xã Hóc Môn · 27559          | 10.8653321, 106.6006639 | [Trường](https://huflit.edu.vn/wp-content/uploads/2026/05/Brochure-Huflit-4-2026-compressed.pdf) · [Bản đồ](https://www.google.com/maps?cid=15137732222504728325) |
| Ba Gia      | 52–70 Ba Gia     | Phường Tân Sơn Nhất · 26968 | 10.7850274, 106.6546273 | [Trường](https://huflit.edu.vn/wp-content/uploads/2026/05/Brochure-Huflit-4-2026-compressed.pdf) · [Bản đồ](https://www.google.com/maps?cid=9934501399566278429)  |
| Trường Sơn  | 32 Trường Sơn    | Phường Tân Sơn Hòa · 26977  | 10.80893, 106.664929    | [Trường](https://huflit.edu.vn/wp-content/uploads/2026/05/Brochure-Huflit-4-2026-compressed.pdf) · [Bản đồ](https://www.google.com/maps?cid=6369715252243693648)  |

### Trường Đại học Hoa Sen (HSU)

| Cơ sở            | Địa chỉ                                           | Phường/xã và mã             | Vĩ độ, kinh độ          | Nguồn                                                                                                         |
| ---------------- | ------------------------------------------------- | --------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| Nguyễn Văn Tráng | 8 Nguyễn Văn Tráng                                | Phường Bến Thành · 26743    | 10.7700877, 106.6923949 | [Trường](https://www.hoasen.edu.vn/lien-he/) · [Bản đồ](https://www.google.com/maps?cid=15564301956967001748) |
| Thành Thái       | 7/1 Thành Thái                                    | Phường Diên Hồng · 27169    | 10.7696874, 106.6651139 | [Trường](https://www.hoasen.edu.vn/lien-he/) · [Bản đồ](https://www.google.com/maps?cid=5739967011403123724)  |
| Quang Trung 2    | Lô 10, đường số 3, Công viên Phần mềm Quang Trung | Phường Trung Mỹ Tây · 26785 | 10.8568774, 106.6255196 | [Trường](https://www.hoasen.edu.vn/lien-he/) · [Bản đồ](https://www.google.com/maps?cid=16397134748935261922) |
| Cao Thắng        | 93 Cao Thắng                                      | Phường Bàn Cờ · 27154       | 10.7722328, 106.6790097 | [Trường](https://www.hoasen.edu.vn/lien-he/) · [Bản đồ](https://www.google.com/maps?cid=4200720416310585639)  |

### Trường Đại học Mở TP.HCM (OU)

| Cơ sở                         | Địa chỉ             | Phường/xã và mã             | Vĩ độ, kinh độ          | Nguồn                                                                                                                      |
| ----------------------------- | ------------------- | --------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Võ Văn Tần                    | 97 Võ Văn Tần       | Phường Xuân Hòa · 27139     | 10.7763284, 106.6902291 | [Trường](https://hoso.ou.edu.vn/2026) · [Bản đồ](https://www.google.com/maps?cid=2361319187428244451)                      |
| Hồ Hảo Hớn                    | 35–37 Hồ Hảo Hớn    | Phường Cầu Ông Lãnh · 26758 | 10.7611471, 106.6923099 | [Trường](https://hoso.ou.edu.vn/2026) · [Bản đồ](https://www.google.com/maps?cid=4546818783970697183)                      |
| Mai Thị Lựu                   | 2 Mai Thị Lựu       | Phường Tân Định · 26737     | 10.7906789, 106.700175  | [Trường](https://hoso.ou.edu.vn/2026) · [Bản đồ](https://www.google.com/maps?cid=8440700928380478147)                      |
| Gia Phú                       | 311 Gia Phú         | Phường Bình Tiên · 27373    | 10.7451498, 106.6496446 | [Trường](https://hoso.ou.edu.vn/2026) · [Bản đồ](https://www.google.com/maps?cid=10388373076430480992)                     |
| Lý Thường Kiệt — cần xác nhận | 283 Lý Thường Kiệt  | Phường Phú Thọ · 27226      | 10.7750029, 106.6562908 | [Trường](https://hoso.ou.edu.vn/2026) · [Bản đồ](https://www.google.com/maps?cid=12970121903663599986)                     |
| Nhơn Đức                      | Khu dân cư Nhơn Đức | Xã Hiệp Phước · 27658       | 10.6754047, 106.6906695 | [Trường](https://v1.ou.edu.vn/tramyte/Pages/Lien-he.aspx) · [Bản đồ](https://www.google.com/maps?cid=15807768283253781994) |

### Trường Đại học Tôn Đức Thắng (TDTU)

| Cơ sở      | Địa chỉ           | Phường/xã và mã             | Vĩ độ, kinh độ          | Nguồn                                                                                                                                             |
| ---------- | ----------------- | --------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tân Hưng   | 19 Nguyễn Hữu Thọ | Phường Tân Hưng · 27475     | 10.7319314, 106.6993418 | [Trường](https://www.tdtu.edu.vn/cong-khai-thong-tin/danh-muc-cac-co-so-dao-tao) · [Bản đồ](https://www.google.com/maps?cid=3729404011035276819)  |
| Ngô Tất Tố | 98 Ngô Tất Tố     | Phường Thạnh Mỹ Tây · 26956 | 10.792528, 106.7113936  | [Trường](https://www.tdtu.edu.vn/cong-khai-thong-tin/danh-muc-cac-co-so-dao-tao) · [Bản đồ](https://www.google.com/maps?cid=12925208283194893077) |

### Trường Đại học Bách khoa – ĐHQG-HCM (HCMUT)

| Cơ sở          | Địa chỉ            | Phường/xã và mã          | Vĩ độ, kinh độ         | Nguồn                                                                                                           |
| -------------- | ------------------ | ------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Lý Thường Kiệt | 268 Lý Thường Kiệt | Phường Diên Hồng · 27169 | 10.772075, 106.6579018 | [Trường](https://hcmut.edu.vn/contact?lang=en) · [Bản đồ](https://www.google.com/maps?cid=17255486204834244894) |

### Trường Đại học Khoa học Xã hội và Nhân văn – ĐHQG-HCM (USSH)

| Cơ sở     | Địa chỉ                         | Phường/xã và mã          | Vĩ độ, kinh độ          | Nguồn                                                                                                       |
| --------- | ------------------------------- | ------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Sài Gòn   | 10–12 Đinh Tiên Hoàng           | Phường Sài Gòn · 26740   | 10.7858607, 106.7027086 | [Trường](https://hcmussh.edu.vn/post/42908) · [Bản đồ](https://www.google.com/maps?cid=9832161201916899196) |
| Linh Xuân | Khu phố 33, Khu đô thị ĐHQG-HCM | Phường Linh Xuân · 26800 | 10.8699483, 106.8009318 | [Trường](https://hcmussh.edu.vn/post/42908) · [Bản đồ](https://www.google.com/maps?cid=2748454972927113019) |

### Trường Đại học Sư phạm TP.HCM (HCMUE)

| Cơ sở          | Địa chỉ            | Phường/xã và mã          | Vĩ độ, kinh độ         | Nguồn                                                                                                                                          |
| -------------- | ------------------ | ------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| An Dương Vương | 280 An Dương Vương | Phường Chợ Quán · 27301  | 10.761394, 106.6821834 | [Trường](https://ctsv.hcmue.edu.vn/storage/files/so-tay-sinh-vien-khoa-51.pdf) · [Bản đồ](https://www.google.com/maps?cid=1923042302746724370) |
| Lê Văn Sỹ      | 222 Lê Văn Sỹ      | Phường Nhiêu Lộc · 27142 | 10.7865253, 106.680667 | [Trường](https://ctsv.hcmue.edu.vn/storage/files/so-tay-sinh-vien-khoa-51.pdf) · [Bản đồ](https://www.google.com/maps?cid=1326040421039107761) |

### Trường Đại học Sài Gòn (SGU)

| Cơ sở        | Địa chỉ                 | Phường/xã và mã         | Vĩ độ, kinh độ          | Nguồn                                                                                                                                                  |
| ------------ | ----------------------- | ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Trụ sở chính | 273 An Dương Vương      | Phường Chợ Quán · 27301 | 10.7599171, 106.6822583 | [Trường](https://tuyensinh.sgu.edu.vn/images/files/2026/01_Thongtintuyensinh2026.pdf) · [Bản đồ](https://www.google.com/maps?cid=11558015143712973960) |
| Cơ sở 1      | 105 Bà Huyện Thanh Quan | Phường Xuân Hòa · 27139 | 10.7793043, 106.6842107 | [Trường](https://tuyensinh.sgu.edu.vn/images/files/2026/01_Thongtintuyensinh2026.pdf) · [Bản đồ](https://www.google.com/maps?cid=16334494091797084942) |
| Cơ sở 2      | 4 Tôn Đức Thắng         | Phường Sài Gòn · 26740  | 10.7830382, 106.7062212 | [Trường](https://tuyensinh.sgu.edu.vn/images/files/2026/01_Thongtintuyensinh2026.pdf) · [Bản đồ](https://www.google.com/maps?cid=1802866252934481413)  |

### Trường Đại học Ngân hàng TP.HCM (HUB)

| Cơ sở        | Địa chỉ         | Phường/xã và mã        | Vĩ độ, kinh độ          | Nguồn                                                                                                      |
| ------------ | --------------- | ---------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| Trụ sở chính | 36 Tôn Thất Đạm | Phường Sài Gòn · 26740 | 10.7701603, 106.7039075 | [Trường](https://hub.edu.vn/lien-he.html) · [Bản đồ](https://www.google.com/maps?cid=17769652750311509264) |
| Hàm Nghi     | 39 Hàm Nghi     | Phường Sài Gòn · 26740 | 10.7704904, 106.7048202 | [Trường](https://hub.edu.vn/lien-he.html) · [Bản đồ](https://www.google.com/maps?cid=2760501463285881962)  |
| Hoàng Diệu   | 56 Hoàng Diệu 2 | Phường Thủ Đức · 26824 | 10.8576719, 106.7626157 | [Trường](https://hub.edu.vn/lien-he.html) · [Bản đồ](https://www.google.com/maps?cid=5622212781141359288)  |

## Giới hạn xác minh

Các mã phường/xã được ghép theo địa chỉ công bố của trường. Việc kiểm tra vị trí bằng đa giác ranh giới và đo thực địa còn thiếu bằng chứng. Một số nhãn bản đồ vẫn dùng tên địa danh cũ, JSON giữ địa chỉ quan sát được để nhóm đối chiếu với địa chỉ mới.

Danh mục hiện gồm 47 dòng đã cung cấp. Danh sách đầy đủ các cơ sở của toàn bộ trường đại học trên địa bàn TP.HCM cũ còn cần bổ sung.
