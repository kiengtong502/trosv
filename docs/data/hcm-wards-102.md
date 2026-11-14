# 102 phường/xã trong phạm vi TROSV

Phạm vi gồm 78 phường và 24 xã mới trên địa bàn TP.HCM trước sáp nhập cấp tỉnh năm 2025, theo danh sách người dùng cung cấp. Địa bàn cũ dùng để nhóm và tra cứu.

[File JSON](../../apps/api/database/data/hcm-wards-102.json) chứa mã đơn vị dạng chuỗi, tên đầy đủ, loại, địa bàn cũ, tọa độ và trạng thái kiểm chứng.

## Nguồn và cách chuẩn bị

- Tên và phạm vi được đối chiếu với [Nghị quyết 1685/NQ-UBTVQH15](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-1685-nq-ubtvqh15-sap-xep-cac-dvhc-cap-xa-cua-thanh-pho-ho-chi-minh-nam-2025-119250616211341304.htm).
- Mã và tọa độ được trích từ [open-admin-data/vietnam-administrative-divisions](https://github.com/open-admin-data/vietnam-administrative-divisions/tree/54cdb052284b02e75dfaa44089ca383aa12c57db/divisions/ho-chi-minh-79), commit `54cdb052284b02e75dfaa44089ca383aa12c57db`.
- Nguồn được cấp phép [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/). Bộ dữ liệu này đã được lọc theo phạm vi, thêm tiền tố Phường/Xã, loại và nhóm địa bàn cũ. Tọa độ Hiệp Phước được thay bằng điểm người dùng cung cấp.

## Trạng thái tọa độ

- 101 điểm chép từ nguồn đang ở trạng thái chưa đối chiếu vị trí thực tế hoặc nguồn độc lập.
- Xã Hiệp Phước, mã `27658`, dùng điểm `10.657190620522726, 106.72935708292374` do người dùng cung cấp. Tọa độ gốc là `11.308, 106.425`. Điểm mới chưa được xác minh độc lập.
- Xã Bình Mỹ, mã `27544`, có tọa độ nguồn `10.66, 106.77`. Cần ưu tiên đối chiếu vị trí với địa bàn Củ Chi cũ.
- Tọa độ là điểm tham chiếu cần kiểm tra trước khi tính khoảng cách và hiển thị bản đồ. Bộ dữ liệu hiện gồm các điểm tọa độ, chưa có đa giác ranh giới.

## Danh sách phường

| Mã | Tên | Địa bàn cũ | Vĩ độ | Kinh độ | Trạng thái tọa độ |
| --- | --- | --- | --- | --- | --- |
| `26740` | Phường Sài Gòn | Quận 1 | 10.782 | 106.677 | Chưa đối chiếu |
| `26737` | Phường Tân Định | Quận 1 | 10.791 | 106.694 | Chưa đối chiếu |
| `26743` | Phường Bến Thành | Quận 1 | 10.77 | 106.695 | Chưa đối chiếu |
| `26758` | Phường Cầu Ông Lãnh | Quận 1 | 10.763 | 106.691 | Chưa đối chiếu |
| `27154` | Phường Bàn Cờ | Quận 3 | 10.77 | 106.682 | Chưa đối chiếu |
| `27139` | Phường Xuân Hòa | Quận 3 | 10.782 | 106.69 | Chưa đối chiếu |
| `27142` | Phường Nhiêu Lộc | Quận 3 | 10.786 | 106.675 | Chưa đối chiếu |
| `27259` | Phường Xóm Chiếu | Quận 4 | 10.76 | 106.712 | Chưa đối chiếu |
| `27265` | Phường Khánh Hội | Quận 4 | 10.76 | 106.702 | Chưa đối chiếu |
| `27286` | Phường Vĩnh Hội | Quận 4 | 10.756 | 106.694 | Chưa đối chiếu |
| `27301` | Phường Chợ Quán | Quận 5 | 10.758 | 106.681 | Chưa đối chiếu |
| `27316` | Phường An Đông | Quận 5 | 10.755 | 106.672 | Chưa đối chiếu |
| `27343` | Phường Chợ Lớn | Quận 5 | 10.752 | 106.659 | Chưa đối chiếu |
| `27367` | Phường Bình Tây | Quận 6 | 10.749 | 106.648 | Chưa đối chiếu |
| `27373` | Phường Bình Tiên | Quận 6 | 10.743 | 106.643 | Chưa đối chiếu |
| `27364` | Phường Bình Phú | Quận 6 | 10.739 | 106.627 | Chưa đối chiếu |
| `27349` | Phường Phú Lâm | Quận 6 | 10.754 | 106.631 | Chưa đối chiếu |
| `27478` | Phường Tân Thuận | Quận 7 | 10.753 | 106.728 | Chưa đối chiếu |
| `27484` | Phường Phú Thuận | Quận 7 | 10.731 | 106.735 | Chưa đối chiếu |
| `27487` | Phường Tân Mỹ | Quận 7 | 10.726 | 106.724 | Chưa đối chiếu |
| `27475` | Phường Tân Hưng | Quận 7 | 10.74 | 106.703 | Chưa đối chiếu |
| `27418` | Phường Chánh Hưng | Quận 8 | 10.745 | 106.676 | Chưa đối chiếu |
| `27427` | Phường Phú Định | Quận 8 | 10.724 | 106.629 | Chưa đối chiếu |
| `27424` | Phường Bình Đông | Quận 8 | 10.728 | 106.638 | Chưa đối chiếu |
| `27169` | Phường Diên Hồng | Quận 10 | 10.766 | 106.664 | Chưa đối chiếu |
| `27190` | Phường Vườn Lài | Quận 10 | 10.767 | 106.674 | Chưa đối chiếu |
| `27163` | Phường Hòa Hưng | Quận 10 | 10.781 | 106.669 | Chưa đối chiếu |
| `27238` | Phường Minh Phụng | Quận 11 | 10.757 | 106.647 | Chưa đối chiếu |
| `27232` | Phường Bình Thới | Quận 11 | 10.763 | 106.642 | Chưa đối chiếu |
| `27211` | Phường Hòa Bình | Quận 11 | 10.77 | 106.644 | Chưa đối chiếu |
| `27226` | Phường Phú Thọ | Quận 11 | 10.766 | 106.655 | Chưa đối chiếu |
| `26791` | Phường Đông Hưng Thuận | Quận 12 | 10.836 | 106.622 | Chưa đối chiếu |
| `26785` | Phường Trung Mỹ Tây | Quận 12 | 10.859 | 106.618 | Chưa đối chiếu |
| `26782` | Phường Tân Thới Hiệp | Quận 12 | 10.877 | 106.641 | Chưa đối chiếu |
| `26773` | Phường Thới An | Quận 12 | 10.879 | 106.658 | Chưa đối chiếu |
| `26767` | Phường An Phú Đông | Quận 12 | 10.861 | 106.692 | Chưa đối chiếu |
| `27460` | Phường An Lạc | Quận Bình Tân | 10.738 | 106.615 | Chưa đối chiếu |
| `27457` | Phường Tân Tạo | Quận Bình Tân | 10.748 | 106.586 | Chưa đối chiếu |
| `27442` | Phường Bình Tân | Quận Bình Tân | 10.794 | 106.59 | Chưa đối chiếu |
| `27448` | Phường Bình Trị Đông | Quận Bình Tân | 10.768 | 106.61 | Chưa đối chiếu |
| `27439` | Phường Bình Hưng Hòa | Quận Bình Tân | 10.798 | 106.603 | Chưa đối chiếu |
| `26944` | Phường Gia Định | Quận Bình Thạnh | 10.801 | 106.697 | Chưa đối chiếu |
| `26929` | Phường Bình Thạnh | Quận Bình Thạnh | 10.811 | 106.703 | Chưa đối chiếu |
| `26905` | Phường Bình Lợi Trung | Quận Bình Thạnh | 10.823 | 106.703 | Chưa đối chiếu |
| `26956` | Phường Thạnh Mỹ Tây | Quận Bình Thạnh | 10.799 | 106.718 | Chưa đối chiếu |
| `26911` | Phường Bình Quới | Quận Bình Thạnh | 10.827 | 106.737 | Chưa đối chiếu |
| `26890` | Phường Hạnh Thông | Quận Gò Vấp | 10.82 | 106.683 | Chưa đối chiếu |
| `26876` | Phường An Nhơn | Quận Gò Vấp | 10.837 | 106.683 | Chưa đối chiếu |
| `26884` | Phường Gò Vấp | Quận Gò Vấp | 10.816 | 106.685 | Chưa đối chiếu |
| `26878` | Phường An Hội Đông | Quận Gò Vấp | 10.85 | 106.665 | Chưa đối chiếu |
| `26898` | Phường Thông Tây Hội | Quận Gò Vấp | 10.842 | 106.657 | Chưa đối chiếu |
| `26882` | Phường An Hội Tây | Quận Gò Vấp | 10.842 | 106.639 | Chưa đối chiếu |
| `27043` | Phường Đức Nhuận | Quận Phú Nhuận | 10.806 | 106.678 | Chưa đối chiếu |
| `27058` | Phường Cầu Kiệu | Quận Phú Nhuận | 10.8 | 106.685 | Chưa đối chiếu |
| `27073` | Phường Phú Nhuận | Quận Phú Nhuận | 10.795 | 106.675 | Chưa đối chiếu |
| `26977` | Phường Tân Sơn Hòa | Quận Tân Bình | 10.797 | 106.665 | Chưa đối chiếu |
| `26968` | Phường Tân Sơn Nhất | Quận Tân Bình | 10.798 | 106.659 | Chưa đối chiếu |
| `26995` | Phường Tân Hòa | Quận Tân Bình | 10.781 | 106.655 | Chưa đối chiếu |
| `26983` | Phường Bảy Hiền | Quận Tân Bình | 10.79 | 106.647 | Chưa đối chiếu |
| `27004` | Phường Tân Bình | Quận Tân Bình | 10.8 | 106.641 | Chưa đối chiếu |
| `27007` | Phường Tân Sơn | Quận Tân Bình | 10.821 | 106.637 | Chưa đối chiếu |
| `27013` | Phường Tây Thạnh | Quận Tân Phú | 10.813 | 106.623 | Chưa đối chiếu |
| `27019` | Phường Tân Sơn Nhì | Quận Tân Phú | 10.801 | 106.625 | Chưa đối chiếu |
| `27022` | Phường Phú Thọ Hòa | Quận Tân Phú | 10.789 | 106.627 | Chưa đối chiếu |
| `27031` | Phường Tân Phú | Quận Tân Phú | 10.776 | 106.638 | Chưa đối chiếu |
| `27028` | Phường Phú Thạnh | Quận Tân Phú | 10.772 | 106.627 | Chưa đối chiếu |
| `26809` | Phường Hiệp Bình | TP. Thủ Đức | 10.85 | 106.719 | Chưa đối chiếu |
| `26824` | Phường Thủ Đức | TP. Thủ Đức | 10.851 | 106.759 | Chưa đối chiếu |
| `26803` | Phường Tam Bình | TP. Thủ Đức | 10.869 | 106.735 | Chưa đối chiếu |
| `26800` | Phường Linh Xuân | TP. Thủ Đức | 10.873 | 106.765 | Chưa đối chiếu |
| `26842` | Phường Tăng Nhơn Phú | TP. Thủ Đức | 10.845 | 106.786 | Chưa đối chiếu |
| `26833` | Phường Long Bình | TP. Thủ Đức | 10.848 | 106.831 | Chưa đối chiếu |
| `26857` | Phường Long Phước | TP. Thủ Đức | 10.812 | 106.86 | Chưa đối chiếu |
| `26860` | Phường Long Trường | TP. Thủ Đức | 10.798 | 106.808 | Chưa đối chiếu |
| `27112` | Phường Cát Lái | TP. Thủ Đức | 10.77 | 106.775 | Chưa đối chiếu |
| `27097` | Phường Bình Trưng | TP. Thủ Đức | 10.789 | 106.755 | Chưa đối chiếu |
| `26848` | Phường Phước Long | TP. Thủ Đức | 10.825 | 106.769 | Chưa đối chiếu |
| `27094` | Phường An Khánh | TP. Thủ Đức | 10.785 | 106.729 | Chưa đối chiếu |

## Danh sách xã

| Mã | Tên | Địa bàn cũ | Vĩ độ | Kinh độ | Trạng thái tọa độ |
| --- | --- | --- | --- | --- | --- |
| `27601` | Xã Vĩnh Lộc | Huyện Bình Chánh | 10.82 | 106.551 | Chưa đối chiếu |
| `27604` | Xã Tân Vĩnh Lộc | Huyện Bình Chánh | 10.787 | 106.554 | Chưa đối chiếu |
| `27610` | Xã Bình Lợi | Huyện Bình Chánh | 10.754 | 106.519 | Chưa đối chiếu |
| `27595` | Xã Tân Nhựt | Huyện Bình Chánh | 10.698 | 106.57 | Chưa đối chiếu |
| `27637` | Xã Bình Chánh | Huyện Bình Chánh | 10.664 | 106.57 | Chưa đối chiếu |
| `27628` | Xã Hưng Long | Huyện Bình Chánh | 10.659 | 106.639 | Chưa đối chiếu |
| `27619` | Xã Bình Hưng | Huyện Bình Chánh | 10.719 | 106.656 | Chưa đối chiếu |
| `27667` | Xã Bình Khánh | Huyện Cần Giờ | 10.643 | 106.787 | Chưa đối chiếu |
| `27673` | Xã An Thới Đông | Huyện Cần Giờ | 10.591 | 106.789 | Chưa đối chiếu |
| `27664` | Xã Cần Giờ | Huyện Cần Giờ | 10.393 | 106.932 | Chưa đối chiếu |
| `27676` | Xã Thạnh An | Huyện Cần Giờ | 10.505 | 107.337 | Chưa đối chiếu |
| `27553` | Xã Củ Chi | Huyện Củ Chi | 10.974 | 106.495 | Chưa đối chiếu |
| `27496` | Xã Tân An Hội | Huyện Củ Chi | 10.97 | 106.465 | Chưa đối chiếu |
| `27526` | Xã Thái Mỹ | Huyện Củ Chi | 11.037 | 106.435 | Chưa đối chiếu |
| `27508` | Xã An Nhơn Tây | Huyện Củ Chi | 11.089 | 106.514 | Chưa đối chiếu |
| `27511` | Xã Nhuận Đức | Huyện Củ Chi | 11.06 | 106.476 | Chưa đối chiếu |
| `27541` | Xã Phú Hòa Đông | Huyện Củ Chi | 10.989 | 106.556 | Chưa đối chiếu |
| `27544` | Xã Bình Mỹ | Huyện Củ Chi | 10.66 | 106.77 | Chưa đối chiếu |
| `27568` | Xã Đông Thạnh | Huyện Hóc Môn | 10.923 | 106.771 | Chưa đối chiếu |
| `27559` | Xã Hóc Môn | Huyện Hóc Môn | 10.886 | 106.593 | Chưa đối chiếu |
| `27577` | Xã Xuân Thới Sơn | Huyện Hóc Môn | 10.871 | 106.574 | Chưa đối chiếu |
| `27592` | Xã Bà Điểm | Huyện Hóc Môn | 10.84 | 106.599 | Chưa đối chiếu |
| `27655` | Xã Nhà Bè | Huyện Nhà Bè | 10.696 | 106.74 | Chưa đối chiếu |
| `27658` | Xã Hiệp Phước | Huyện Nhà Bè | 10.657190620522726 | 106.72935708292374 | Người dùng cung cấp |

## Kiểm tra bộ dữ liệu

- Đã kiểm tra đủ 102 đơn vị, gồm 78 phường và 24 xã.
- Mỗi tên khớp duy nhất một bản ghi trong 168 đơn vị của nguồn.
- Các mã và tên trong bộ lọc đều duy nhất.
- Các giá trị tọa độ chuyển được sang số và nằm trong miền giá trị vĩ độ/kinh độ.
- Các kiểm tra trên xác nhận cấu trúc và tính đầy đủ theo danh sách. Việc kiểm chứng vị trí thực tế cần thực hiện tiếp.
