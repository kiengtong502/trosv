## Mo ta thay doi
<!-- Mo ta ngan gon ve noi dung PR nay. Neu thay doi apps/web: bat buoc dan anh chup man hinh (truoc/sau) cua man hinh bi thay doi ngay tai day. -->

## Loai thay doi
- [ ] Refactor / Don dep ma nguon (khong doi hanh vi)
- [ ] Sua loi (bug fix)
- [ ] Tinh nang moi (feature)
- [ ] Tai lieu / CI / Ha tang

## Quy tac bat buoc (PR Guard tu dong kiem tra)
- [ ] Diff <= 400 dong thay doi va <= 15 file (khong tinh lockfile). Neu vuot qua -> tach PR nho hon.
- [ ] PR chi thay doi **mot** app duy nhat (`apps/api/`, `apps/web/`, `apps/ai-service/`, hoac chi chore). Can nhieu app -> tach PR rieng cho tung app.
- [ ] Neu co thay doi o `apps/web/`: da dan anh chup man hinh (truoc/sau) vao phan **Mo ta**. Khong co anh -> PR bi tu choi.

## Kiem tra truoc khi tao PR
- [ ] Frozen contracts: Khong thay doi endpoints, route URIs, HTTP status codes, JSON shape hoac chuoi tieng Viet user-facing. Neu thay doi API/AI/DB phai cap nhat docs/contracts/ truoc.
- [ ] Schema database: Khong sua doi, doi ten hoac di chuyen migrations hien co.
- [ ] Backend Pint: `./vendor/bin/pint --test` vuot qua (0 loi format).
- [ ] Backend Tests: `php artisan test` vuot qua (tat ca test case pass).
- [ ] Route list diff: `php artisan route:list` khong co thay doi ngoai y muon.
- [ ] Frontend Lint: `npm run lint` khong co warning / error.
- [ ] Frontend Build: `npm run build` bien dich thanh cong.
- [ ] E2E / Smoke: Cac kich ban kiem thu hoat dong on dinh.
- [ ] Bao mat: Khong commit file `.env`, credential, hay secret token.
- [ ] Conventional commit: Format commit ro rang, khong dau tieng Viet (vd: `chore(repo): ...`).

> [!WARNING]
> Bot **PR Guard** tu dong tu choi (review `REQUEST_CHANGES`) moi PR vi pham "Quy tac bat buoc". Sau khi sua va push lai, bot tu chay lai va bo qua neu khong con vi pham.

## Ghi chu them / Can chu y khi deploy
<!-- Cac luu y dac biet, bien moi truong can thiet, hoac rui ro neu co -->
