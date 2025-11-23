# Hướng Dẫn Triển Khai ZaloPay Merchant Platform trên GitHub Codespaces

**Phiên bản:** 1.0.0  
**Ngày cập nhật:** November 2025  
**Mục đích:** Hướng dẫn chi tiết từng bước để triển khai và chạy toàn bộ dự án trên GitHub Codespaces

---

## 📋 Mục Lục

1. [Giới Thiệu về GitHub Codespaces](#giới-thiệu-về-github-codespaces)
2. [Yêu Cầu Trước Khi Bắt Đầu](#yêu-cầu-trước-khi-bắt-đầu)
3. [Tạo và Cấu Hình Codespace](#tạo-và-cấu-hình-codespace)
4. [Các Bước Triển Khai Chi Tiết](#các-bước-triển-khai-chi-tiết)
5. [Khởi Động và Kiểm Tra Hệ Thống](#khởi-động-và-kiểm-tra-hệ-thống)
6. [Sử Dụng Ứng Dụng trong Codespaces](#sử-dụng-ứng-dụng-trong-codespaces)
7. [Quản Lý và Bảo Trì](#quản-lý-và-bảo-trì)
8. [Troubleshooting Codespaces](#troubleshooting-codespaces)
9. [Best Practices](#best-practices)
10. [FAQ - Câu Hỏi Thường Gặp](#faq---câu-hỏi-thường-gặp)

---

## 🌟 Giới Thiệu về GitHub Codespaces

### GitHub Codespaces là gì?

GitHub Codespaces là một môi trường phát triển đám mây (cloud-based development environment) được tích hợp sẵn trong GitHub. Nó cho phép bạn:

- **Phát triển ngay trên trình duyệt**: Không cần cài đặt môi trường local
- **Cấu hình tự động**: Environment được setup tự động qua `.devcontainer`
- **Tài nguyên đám mây**: CPU, RAM, và storage được cung cấp bởi GitHub
- **Truy cập mọi nơi**: Làm việc từ bất kỳ thiết bị nào có internet

### Lợi Ích cho Dự Án ZaloPay Merchant Platform

1. **Setup Nhanh Chóng**: Không cần cài đặt Node.js, PostgreSQL, Docker
2. **Môi Trường Nhất Quán**: Mọi người đều có cùng một môi trường phát triển
3. **Tiết Kiệm Tài Nguyên Local**: Không tốn tài nguyên máy tính cá nhân
4. **Dễ Dàng Chia Sẻ**: Chia sẻ môi trường phát triển với team members
5. **Port Forwarding Tự Động**: Truy cập ứng dụng qua HTTPS URLs

---

## 📋 Yêu Cầu Trước Khi Bắt Đầu

### 1. Tài Khoản GitHub

- **Yêu cầu**: Tài khoản GitHub (Free hoặc Pro)
- **Codespaces Free Tier**: 
  - Personal accounts: 120 core hours/month + 15 GB storage/month
  - Pro accounts: 180 core hours/month + 20 GB storage/month
- **Lưu ý**: Kiểm tra quota của bạn tại [GitHub Billing Settings](https://github.com/settings/billing)

### 2. Quyền Truy Cập Repository

- Phải có quyền truy cập (read/write) vào repository
- Fork repository nếu bạn không phải là collaborator

### 3. Hiểu Biết Cơ Bản

- Kiến thức cơ bản về Linux/Unix commands
- Hiểu biết về Node.js và PostgreSQL
- Quen thuộc với VS Code (optional nhưng recommended)

---

## 🚀 Tạo và Cấu Hình Codespace

### Bước 1: Tạo Codespace Mới

#### Option A: Từ GitHub Repository

1. Truy cập repository: `https://github.com/mariecalallen12/zalopay`
2. Click vào nút **Code** (màu xanh)
3. Chọn tab **Codespaces**
4. Click **Create codespace on main** (hoặc branch bạn muốn)

#### Option B: Từ GitHub Codespaces Dashboard

1. Truy cập: `https://github.com/codespaces`
2. Click **New codespace**
3. Chọn repository: `mariecalallen12/zalopay`
4. Chọn branch (default: `main`)
5. Chọn region (gần bạn nhất để có latency thấp)
6. Chọn machine type:
   - **2-core, 8GB RAM**: Đủ cho development cơ bản
   - **4-core, 16GB RAM**: Recommended cho project này
   - **8-core, 32GB RAM**: Cho performance tốt nhất
7. Click **Create codespace**

### Bước 2: Chờ Codespace Khởi Động

- Codespace sẽ mất **2-5 phút** để:
  - Pull Docker image
  - Chạy `.devcontainer/setup.sh`
  - Cài đặt dependencies
  - Setup database

**Những gì xảy ra tự động:**

```
1. ✓ Tạo container với Node.js 18
2. ✓ Clone repository vào /workspace
3. ✓ Install Git, GitHub CLI
4. ✓ Tạo thư mục storage và logs
5. ✓ Copy environment files
6. ✓ Install backend dependencies
7. ✓ Generate Prisma client
8. ✓ Install admin frontend dependencies
9. ✓ Setup PostgreSQL database
10. ✓ Run migrations và seed data
```

### Bước 3: Xác Minh Codespace Đã Sẵn Sàng

Sau khi Codespace khởi động, bạn sẽ thấy VS Code trên trình duyệt với:

- Terminal ở dưới cùng
- File explorer bên trái
- Editor ở giữa

Chạy lệnh kiểm tra:

```bash
# Kiểm tra Node.js version
node --version
# Kết quả mong đợi: v18.x.x

# Kiểm tra npm
npm --version
# Kết quả mong đợi: v9.x.x hoặc cao hơn

# Kiểm tra Docker
docker --version
# Kết quả mong đợi: Docker version 20.x.x hoặc cao hơn

# Kiểm tra cấu trúc thư mục
ls -la
# Kết quả mong đợi: Thấy các thư mục backend, static, Docs, etc.
```

---

## 📝 Các Bước Triển Khai Chi Tiết

### Bước 1: Kiểm Tra Environment Files

#### 1.1. Kiểm tra file docker-db.env

```bash
cat docker-db.env
```

**Nội dung mẫu:**
```env
DB_NAME=zalopay
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST_PORT=5433

PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin123
PGADMIN_HOST_PORT=8081
```

**Lưu ý:** Bạn có thể thay đổi password nếu muốn:
```bash
nano docker-db.env
# Hoặc
code docker-db.env
```

#### 1.2. Kiểm tra file backend/.env.docker

```bash
cat backend/.env.docker
```

**Các biến quan trọng cần kiểm tra:**
- `DATABASE_URL`: Connection string đến PostgreSQL
- `JWT_SECRET`: Secret key cho JWT authentication
- `CARD_ENCRYPTION_KEY`: Key để mã hóa card data
- `OAUTH_ENCRYPTION_KEY`: Key để mã hóa OAuth tokens

**Tạo secure keys mới (recommended):**

```bash
# Generate JWT Secret
openssl rand -hex 32

# Generate Card Encryption Key
openssl rand -hex 32

# Generate OAuth Encryption Key
openssl rand -hex 32

# Update backend/.env.docker với keys mới
nano backend/.env.docker
```

### Bước 2: Khởi Động Database Stack

#### 2.1. Start PostgreSQL và pgAdmin

```bash
# Khởi động database containers
docker compose -f docker-compose.db.yml --env-file docker-db.env up -d

# Kiểm tra containers đang chạy
docker ps

# Kết quả mong đợi:
# CONTAINER ID   IMAGE                    STATUS                   PORTS
# xxxxx          postgres:15-alpine       Up X seconds (healthy)   0.0.0.0:5433->5432/tcp
# xxxxx          dpage/pgadmin4:8.12      Up X seconds             0.0.0.0:8081->80/tcp
```

#### 2.2. Xem logs để xác minh

```bash
# Xem PostgreSQL logs
docker logs zalopay-postgres

# Xem pgAdmin logs
docker logs zalopay-pgadmin

# Hoặc theo dõi tất cả logs
docker compose -f docker-compose.db.yml logs -f
```

#### 2.3. Kiểm tra database health

```bash
# Chạy health check script
cd backend
npm run db:health

# Kết quả mong đợi:
# ✓ Database connection successful
# ✓ All tables exist
# ✓ Row counts: victims: 0, admin_users: 1, campaigns: 1, ...
```

### Bước 3: Setup Database (nếu chưa được tự động)

#### 3.1. Generate Prisma Client

```bash
cd backend
npm run db:generate
```

#### 3.2. Run Database Migrations

```bash
npm run db:migrate
```

**Output mong đợi:**
```
Applying migration `20231101000000_initial`
Applying migration `20231101000001_add_platform_support`
✓ All migrations applied successfully
```

#### 3.3. Seed Database với Initial Data

```bash
npm run db:seed
```

**Output mong đợi:**
```
✓ Created admin user: admin@zalopay.local
✓ Created default campaign
✓ Database seeded successfully
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@zalopay.local`

### Bước 4: Install và Build Admin Frontend

#### 4.1. Install Dependencies

```bash
cd /workspace/static/admin
npm install
```

**Thời gian ước tính:** 2-3 phút

#### 4.2. Build Production Bundle

```bash
npm run build
```

**Output mong đợi:**
```
vite v4.x.x building for production...
✓ xx modules transformed.
dist/index.html                  x.xx kB
dist/assets/index-xxxxx.js       xxx.xx kB │ gzip: xx.xx kB
dist/assets/index-xxxxx.css      xx.xx kB │ gzip: x.xx kB
✓ built in x.xxs
```

#### 4.3. Verify Build Output

```bash
ls -la dist/
# Kết quả mong đợi: Thấy index.html và thư mục assets/
```

### Bước 5: Verify All Components

#### 5.1. Checklist Verification

```bash
# Run comprehensive check
cd /workspace

echo "=== Checking Backend ==="
[ -d "backend/node_modules" ] && echo "✓ Backend dependencies installed" || echo "✗ Backend dependencies missing"
[ -f "backend/node_modules/.prisma/client/index.js" ] && echo "✓ Prisma client generated" || echo "✗ Prisma client missing"

echo "=== Checking Admin Frontend ==="
[ -d "static/admin/node_modules" ] && echo "✓ Admin dependencies installed" || echo "✗ Admin dependencies missing"
[ -d "static/admin/dist" ] && echo "✓ Admin built" || echo "✗ Admin build missing"

echo "=== Checking Storage Directories ==="
[ -d "backend/storage" ] && echo "✓ Storage directory exists" || echo "✗ Storage directory missing"
[ -d "backend/logs" ] && echo "✓ Logs directory exists" || echo "✗ Logs directory missing"

echo "=== Checking Database ==="
docker ps | grep -q zalopay-postgres && echo "✓ PostgreSQL running" || echo "✗ PostgreSQL not running"
```

---

## 🎯 Khởi Động và Kiểm Tra Hệ Thống

### Bước 1: Khởi Động Backend Server

#### Option A: Development Mode (Recommended)

```bash
cd /workspace/backend
npm run dev
```

**Output mong đợi:**
```
[nodemon] starting `node server.js`
Server running on port 3000
✓ Database connected successfully
✓ Socket.IO initialized
✓ Prisma Client ready
```

**Lưu ý:** 
- Server sẽ tự động restart khi bạn thay đổi code
- Sử dụng mode này khi đang phát triển

#### Option B: Production Mode

```bash
cd /workspace/backend
NODE_ENV=production npm start
```

**Lưu ý:** Sử dụng mode này khi test production build

### Bước 2: Truy Cập Ứng Dụng

GitHub Codespaces tự động forward các ports. Kiểm tra trong tab **PORTS**:

#### 2.1. Mở Tab Ports

- Click vào tab **PORTS** ở panel dưới (cùng với Terminal)
- Bạn sẽ thấy:

```
Port   | Running Process      | Visibility | Forwarded Address
-------|---------------------|------------|-------------------
3000   | Backend API         | Private    | https://xxx-3000.preview.app.github.dev
5433   | PostgreSQL          | Private    | https://xxx-5433.preview.app.github.dev
8081   | pgAdmin             | Private    | https://xxx-8081.preview.app.github.dev
```

#### 2.2. Truy Cập Backend API

1. Click chuột phải vào port 3000
2. Chọn **"Open in Browser"**
3. URL sẽ mở: `https://xxx-3000.preview.app.github.dev`

**Test Health Check:**
```bash
# Trong terminal
curl http://localhost:3000/health

# Hoặc mở browser với forwarded URL
# https://xxx-3000.preview.app.github.dev/health
```

**Kết quả mong đợi:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T06:00:00.000Z"
}
```

#### 2.3. Truy Cập Admin Dashboard

**URL:** `https://xxx-3000.preview.app.github.dev/admin`

**Login với credentials:**
- Username: `admin`
- Password: `admin123`

#### 2.4. Truy Cập Merchant Interface

**URLs:**
- Landing Page: `https://xxx-3000.preview.app.github.dev/merchant/`
- Google Auth: `https://xxx-3000.preview.app.github.dev/merchant/google_auth.html`
- Apple Auth: `https://xxx-3000.preview.app.github.dev/merchant/apple_auth.html`
- Registration: `https://xxx-3000.preview.app.github.dev/merchant/register.html`

#### 2.5. Truy Cập pgAdmin (Optional)

**URL:** `https://xxx-8081.preview.app.github.dev`

**Login:**
- Email: `admin@example.com`
- Password: `admin123` (hoặc password bạn đã set trong docker-db.env)

**Kết nối PostgreSQL trong pgAdmin:**
1. Click "Add New Server"
2. General tab:
   - Name: `ZaloPay Database`
3. Connection tab:
   - Host: `zalopay-postgres` (container name)
   - Port: `5432`
   - Database: `zalopay`
   - Username: `postgres`
   - Password: `postgres` (hoặc password của bạn)
4. Click "Save"

### Bước 3: Test API Endpoints

#### 3.1. Test Admin Login

```bash
# Trong Codespaces terminal
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "xxx",
    "username": "admin",
    "email": "admin@zalopay.local",
    "role": "super_admin"
  }
}
```

#### 3.2. Test OAuth Capture

```bash
curl -X POST http://localhost:3000/api/capture/oauth \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "email": "test@example.com",
    "tokens": {
      "access_token": "test_token",
      "refresh_token": "test_refresh"
    },
    "profile": {
      "email": "test@example.com",
      "name": "Test User"
    }
  }'
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "victim_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

#### 3.3. Test Socket.IO Connection

Mở browser console (F12) và chạy:

```javascript
// Load Socket.IO client
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.5.3/socket.io.min.js';
document.head.appendChild(script);

script.onload = () => {
  // Connect to Socket.IO server (use your Codespace URL)
  const socket = io('https://xxx-3000.preview.app.github.dev');
  
  socket.on('connect', () => {
    console.log('✓ Socket.IO connected:', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('✗ Socket.IO disconnected');
  });
};
```

### Bước 4: Verify Database Data

```bash
cd /workspace/backend

# Sử dụng Prisma Studio (GUI cho database)
npx prisma studio
```

**Prisma Studio sẽ khởi động trên port 5555**

- Truy cập: `https://xxx-5555.preview.app.github.dev`
- Browse và edit data trong database

**Hoặc kiểm tra qua psql:**

```bash
# Connect vào PostgreSQL container
docker exec -it zalopay-postgres psql -U postgres -d zalopay

# Kiểm tra admin users
SELECT * FROM admin_users;

# Kiểm tra campaigns
SELECT * FROM campaigns;

# Kiểm tra tables
\dt

# Thoát
\q
```

---

## 💼 Sử Dụng Ứng Dụng trong Codespaces

### Workflow Phát Triển Thông Thường

#### 1. Làm Việc với Backend Code

```bash
# Start development server
cd /workspace/backend
npm run dev

# Trong terminal mới (Ctrl+Shift+` để mở terminal mới)
# Watch logs
tail -f logs/app.log
```

**Chỉnh sửa code:**
- Mở file trong VS Code
- Lưu file (Ctrl+S)
- Nodemon tự động restart server
- Test thay đổi ngay lập tức

#### 2. Làm Việc với Admin Frontend

```bash
# Start development server với hot reload
cd /workspace/static/admin
npm run dev
```

**Development server sẽ chạy trên port 5173**

- Truy cập: `https://xxx-5173.preview.app.github.dev`
- Hot reload tự động khi code thay đổi

**Build production:**
```bash
npm run build
# Output: dist/
```

#### 3. Database Operations

```bash
cd /workspace/backend

# Tạo migration mới
npx prisma migrate dev --name your_migration_name

# Apply migrations
npm run db:migrate

# Seed data
npm run db:seed

# Reset database (WARNING: Xóa tất cả data)
npm run db:reset

# Generate Prisma client sau khi thay đổi schema
npm run db:generate
```

#### 4. Testing

```bash
cd /workspace/backend

# Run all tests
npm test

# Run với coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific test file
npm test -- path/to/test.js
```

#### 5. Viewing Logs

```bash
# Backend application logs
tail -f /workspace/backend/logs/app.log

# Backend error logs
tail -f /workspace/backend/logs/error.log

# PostgreSQL logs
docker logs -f zalopay-postgres

# All container logs
docker compose -f docker-compose.db.yml logs -f
```

### Port Management

#### Thay Đổi Port Visibility

Mặc định, các ports trong Codespaces là **Private**. Để chia sẻ với người khác:

1. Click chuột phải vào port trong tab PORTS
2. Chọn **"Port Visibility"**
3. Chọn:
   - **Private**: Chỉ bạn truy cập được
   - **Public**: Ai có link đều truy cập được

**Lưu ý Bảo Mật:** 
- Không public port database (5433)
- Cẩn thận khi public backend API (3000)

#### Forward Port Mới

Nếu bạn start service trên port khác:

1. Click vào tab **PORTS**
2. Click **"Forward a Port"**
3. Nhập port number
4. Port sẽ được forward tự động

### Git Workflow trong Codespaces

```bash
# Check status
git status

# Create new branch
git checkout -b feature/your-feature

# Stage changes
git add .

# Commit
git commit -m "Your commit message"

# Push to remote
git push origin feature/your-feature

# Create pull request (sử dụng GitHub CLI)
gh pr create --title "Your PR title" --body "Description"
```

### Environment Variables

#### Thay Đổi Environment Variables

```bash
# Edit backend environment
nano /workspace/backend/.env.docker

# Hoặc sử dụng VS Code
code /workspace/backend/.env.docker

# Sau khi thay đổi, restart backend server
# Ctrl+C để stop server
npm run dev
```

#### Add Secrets (Sensitive Data)

**Không commit secrets vào Git!**

Sử dụng Codespaces Secrets:

1. Vào repository settings
2. Click **Secrets and variables** → **Codespaces**
3. Add repository secret
4. Secret sẽ available như environment variable

```bash
# Truy cập secret trong code
process.env.YOUR_SECRET_NAME
```

---

## 🔧 Quản Lý và Bảo Trì

### Quản Lý Codespace

#### Dừng Codespace

**Codespace tự động stop sau 30 phút idle**

Để stop manually:
1. Vào `https://github.com/codespaces`
2. Click **•••** bên cạnh Codespace
3. Chọn **Stop codespace**

**Hoặc từ VS Code:**
- Click vào **Codespaces** ở góc dưới trái
- Chọn **Stop Current Codespace**

#### Khởi Động Lại Codespace

1. Vào `https://github.com/codespaces`
2. Click vào Codespace name để restart

**Lưu ý:** Files và database data được preserve khi stop/restart

#### Xóa Codespace

**WARNING:** Xóa sẽ mất tất cả data và code changes chưa commit

1. Vào `https://github.com/codespaces`
2. Click **•••** bên cạnh Codespace
3. Chọn **Delete**

### Database Maintenance

#### Backup Database

```bash
# Export database
docker exec zalopay-postgres pg_dump -U postgres zalopay > backup_$(date +%Y%m%d).sql

# Xem file backup
ls -lh backup_*.sql
```

**Download backup file:**
1. Right-click file trong VS Code
2. Chọn **Download**

#### Restore Database

```bash
# Upload backup file vào Codespace trước

# Restore
docker exec -i zalopay-postgres psql -U postgres zalopay < backup_20251123.sql
```

#### Clean Up Old Data

```bash
# Connect to database
docker exec -it zalopay-postgres psql -U postgres -d zalopay

# Delete old activity logs (older than 30 days)
DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '30 days';

# Delete old oauth tokens
DELETE FROM oauth_tokens WHERE created_at < NOW() - INTERVAL '90 days';

# Vacuum database
VACUUM ANALYZE;

# Thoát
\q
```

### Monitoring Resources

#### Check Codespace Resources

```bash
# CPU usage
top

# Memory usage
free -h

# Disk usage
df -h

# Docker container stats
docker stats
```

#### Optimize Resources

```bash
# Dọn dẹp Docker
docker system prune -a

# Dọn dẹp npm cache
npm cache clean --force

# Dọn dẹp build artifacts
cd /workspace/static/admin
rm -rf dist .vite node_modules/.vite

cd /workspace/backend
rm -rf logs/*.log
```

### Logging và Debugging

#### Enable Debug Logging

```bash
# Trong backend/.env.docker
LOG_LEVEL=debug

# Restart backend
cd /workspace/backend
npm run dev
```

#### View Structured Logs

```bash
# Xem logs với timestamps
tail -f backend/logs/app.log | jq '.'

# Filter error logs
grep "ERROR" backend/logs/app.log

# Search specific error
grep "Database connection" backend/logs/error.log
```

---

## 🔍 Troubleshooting Codespaces

### Vấn Đề Thường Gặp

#### 1. Codespace Slow hoặc Timeout

**Nguyên nhân:**
- Machine type quá nhỏ
- Network issues
- Too many containers running

**Giải pháp:**
```bash
# Check resources
docker stats

# Stop unused containers
docker compose -f docker-compose.db.yml down
docker system prune -a

# Restart Codespace với machine type lớn hơn
```

#### 2. Database Connection Failed

**Lỗi:** `Error: P1001: Can't reach database server`

**Giải pháp:**
```bash
# Kiểm tra PostgreSQL đang chạy
docker ps | grep postgres

# Nếu không chạy, start lại
docker compose -f docker-compose.db.yml up -d postgres

# Kiểm tra logs
docker logs zalopay-postgres

# Test connection
docker exec -it zalopay-postgres psql -U postgres -d zalopay -c "SELECT 1;"
```

#### 3. Port Already in Use

**Lỗi:** `Error: listen EADDRINUSE: address already in use :::3000`

**Giải pháp:**
```bash
# Tìm process đang dùng port
lsof -i :3000

# Kill process
kill -9 <PID>

# Hoặc thay đổi PORT
echo "PORT=3001" >> backend/.env.docker
```

#### 4. Prisma Client Not Generated

**Lỗi:** `Cannot find module '@prisma/client'`

**Giải pháp:**
```bash
cd /workspace/backend
npm run db:generate

# Nếu vẫn lỗi
rm -rf node_modules/@prisma
npm install @prisma/client
npm run db:generate
```

#### 5. Admin Frontend Build Failed

**Lỗi:** `Build failed with errors`

**Giải pháp:**
```bash
cd /workspace/static/admin

# Clear cache và reinstall
rm -rf node_modules package-lock.json dist .vite
npm install

# Rebuild
npm run build
```

#### 6. File Permission Issues

**Lỗi:** `EACCES: permission denied`

**Giải pháp:**
```bash
# Fix storage permissions
sudo chmod -R 755 /workspace/backend/storage
sudo chmod -R 755 /workspace/backend/logs

# Fix ownership
sudo chown -R $(whoami):$(whoami) /workspace/backend/storage
sudo chown -R $(whoami):$(whoami) /workspace/backend/logs
```

#### 7. Out of Memory

**Lỗi:** `JavaScript heap out of memory`

**Giải pháp:**
```bash
# Tăng Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Hoặc upgrade Codespace machine type
```

#### 8. Docker Compose Issues

**Lỗi:** Various docker compose errors

**Giải pháp:**
```bash
# Stop all containers
docker compose -f docker-compose.db.yml down

# Remove volumes (WARNING: Xóa data)
docker compose -f docker-compose.db.yml down -v

# Rebuild và start lại
docker compose -f docker-compose.db.yml up -d --build

# Check logs
docker compose -f docker-compose.db.yml logs -f
```

### Recovery Steps

#### Full Reset (Last Resort)

```bash
# 1. Stop tất cả services
docker compose -f docker-compose.db.yml down -v

# 2. Clean Docker
docker system prune -a -f

# 3. Reinstall dependencies
cd /workspace/backend
rm -rf node_modules package-lock.json
npm install

cd /workspace/static/admin
rm -rf node_modules package-lock.json dist
npm install

# 4. Regenerate Prisma
cd /workspace/backend
npm run db:generate

# 5. Start database
docker compose -f docker-compose.db.yml up -d

# 6. Run migrations
npm run db:migrate

# 7. Seed database
npm run db:seed

# 8. Start backend
npm run dev
```

---

## 🎯 Best Practices

### Development Workflow

#### 1. Always Commit Regularly

```bash
# Commit changes thường xuyên
git add .
git commit -m "Description of changes"
git push

# Codespace có thể timeout, commit để không mất code
```

#### 2. Use Branches

```bash
# Không work trực tiếp trên main
git checkout -b feature/your-feature

# Test thoroughly trước khi merge
```

#### 3. Keep Dependencies Updated

```bash
# Check outdated packages
cd /workspace/backend
npm outdated

# Update carefully
npm update

# Test after update
npm test
```

#### 4. Monitor Resource Usage

```bash
# Regularly check
docker stats
df -h
free -h

# Clean up when needed
docker system prune -a
```

### Security Best Practices

#### 1. Protect Secrets

```bash
# KHÔNG commit secrets vào Git
# Sử dụng Codespaces Secrets
# Hoặc .env files (trong .gitignore)

# Check before commit
git diff --cached
```

#### 2. Use Strong Passwords

```bash
# Change default passwords ngay
# Trong docker-db.env và backend/.env.docker

# Generate strong passwords
openssl rand -base64 32
```

#### 3. Limit Port Visibility

```bash
# Chỉ public ports khi cần thiết
# Database port (5433) phải PRIVATE
# API port (3000) nên PRIVATE hoặc protected
```

#### 4. Regular Backups

```bash
# Backup database hàng ngày
# Setup cronjob hoặc manual backup
docker exec zalopay-postgres pg_dump -U postgres zalopay > backup_$(date +%Y%m%d).sql
```

### Performance Optimization

#### 1. Use Appropriate Machine Type

- **2-core**: Chỉ dùng cho viewing code
- **4-core**: Recommended cho development
- **8-core**: Cho heavy workload (build, test)

#### 2. Stop Unused Services

```bash
# Chỉ chạy services cần thiết
docker compose -f docker-compose.db.yml stop pgadmin

# Restart khi cần
docker compose -f docker-compose.db.yml start pgadmin
```

#### 3. Clean Up Regularly

```bash
# Weekly cleanup script
cat > /workspace/cleanup.sh << 'EOF'
#!/bin/bash
echo "Cleaning up..."
docker system prune -f
npm cache clean --force
rm -rf /workspace/backend/logs/*.log
echo "Cleanup completed"
EOF

chmod +x /workspace/cleanup.sh
./cleanup.sh
```

---

## ❓ FAQ - Câu Hỏi Thường Gặp

### Q1: Codespace có free không?

**A:** Có, GitHub cung cấp:
- **Free tier**: 120 core hours/month + 15GB storage
- **Pro tier**: 180 core hours/month + 20GB storage
- Chi tiết: https://docs.github.com/en/billing/managing-billing-for-github-codespaces/about-billing-for-github-codespaces

### Q2: Codespace có timeout không?

**A:** Có:
- **Idle timeout**: 30 phút (có thể cấu hình)
- **Maximum timeout**: 4 giờ cho free tier
- Codespace sẽ tự động stop khi timeout
- Data được preserve, chỉ cần restart

### Q3: Làm sao để share Codespace với teammate?

**A:** Không thể share directly, nhưng có thể:
1. Commit code lên Git
2. Teammate tạo Codespace riêng từ same repository
3. Hoặc sử dụng VS Code Live Share extension

### Q4: Data trong database có mất khi stop Codespace không?

**A:** Không, data được persist trong Docker volumes
- Data chỉ mất khi delete Codespace
- Hoặc khi chạy `docker compose down -v`

### Q5: Có thể truy cập Codespace từ local VS Code không?

**A:** Có:
1. Install "GitHub Codespaces" extension trong VS Code
2. Sign in với GitHub account
3. Open Codespace từ Command Palette

### Q6: Làm sao để increase Codespace timeout?

**A:** 
1. Vào repository Settings
2. Codespaces → Policies
3. Set "Default idle timeout"
4. Maximum: 240 minutes

### Q7: Có thể chạy production workload trên Codespaces không?

**A:** Không recommended:
- Codespaces là development environment
- Không đủ stable cho production
- Sử dụng proper hosting (VPS, Cloud) cho production

### Q8: Làm sao biết đã hết quota?

**A:**
1. Vào GitHub Settings → Billing
2. Xem Codespaces usage
3. Set spending limit nếu cần

### Q9: File upload có work trong Codespaces không?

**A:** Có:
- Upload files qua VS Code
- Hoặc drag & drop vào browser
- Files lưu trong `/workspace`

### Q10: Có thể custom Codespace setup không?

**A:** Có:
- Edit `.devcontainer/devcontainer.json`
- Custom Docker image
- Add post-create scripts
- Install extensions

---

## 📚 Tài Liệu Tham Khảo

### Internal Documentation

- `README.md` - Overview dự án
- `Deployment/DEPLOYMENT_GUIDE.md` - Hướng dẫn deployment tổng quát
- `Docs/SETUP_GUIDE.md` - Setup guide cơ bản
- `Docs/TESTING_GUIDE.md` - Testing guide
- `Docs/comprehensive-system-architecture (1).md` - Kiến trúc hệ thống
- `Docs/database-schema-documentation (1).md` - Database schema

### External Resources

- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Dev Container Specification](https://containers.dev/)
- [VS Code in the Browser](https://code.visualstudio.com/docs/editor/vscode-web)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

### Support

- GitHub Issues: [Create an issue](https://github.com/mariecalallen12/zalopay/issues)
- GitHub Discussions: [Start a discussion](https://github.com/mariecalallen12/zalopay/discussions)
- Codespaces Support: https://support.github.com/

---

## 📋 Checklist Triển Khai Codespaces

### Pre-Launch Checklist

- [ ] Có GitHub account với Codespaces access
- [ ] Đã fork/clone repository
- [ ] Hiểu rõ project structure
- [ ] Đã đọc documentation

### Launch Checklist

- [ ] Tạo Codespace với machine type phù hợp
- [ ] Chờ post-create script chạy xong
- [ ] Verify environment files exist
- [ ] Kiểm tra database running
- [ ] Verify Prisma client generated
- [ ] Check storage directories created

### Deployment Checklist

- [ ] Database migrations applied
- [ ] Database seeded với initial data
- [ ] Backend dependencies installed
- [ ] Admin frontend dependencies installed
- [ ] Admin frontend built
- [ ] Backend server started successfully
- [ ] Port forwarding working
- [ ] Can access admin dashboard
- [ ] Can access merchant interface
- [ ] API endpoints responding
- [ ] Socket.IO connected

### Post-Deployment Checklist

- [ ] Test admin login
- [ ] Test OAuth capture
- [ ] Test registration flow
- [ ] Test file upload
- [ ] Check logs for errors
- [ ] Verify database health
- [ ] Setup Git workflow
- [ ] Document any custom changes
- [ ] Backup database

### Production Readiness (if deploying to production)

- [ ] Change all default passwords
- [ ] Generate new encryption keys
- [ ] Configure proper CORS_ORIGIN
- [ ] Setup SSL certificates
- [ ] Configure firewall rules
- [ ] Setup monitoring
- [ ] Setup backups
- [ ] Document deployment

---

## 🎉 Kết Luận

Bạn đã hoàn thành việc triển khai ZaloPay Merchant Platform trên GitHub Codespaces!

### Những Gì Bạn Đã Đạt Được

✅ Môi trường phát triển cloud-based hoàn chỉnh  
✅ PostgreSQL database với migrations và seed data  
✅ Backend API server chạy trên Node.js + Express  
✅ Admin dashboard built với React + TypeScript  
✅ Merchant interface với PWA support  
✅ Socket.IO real-time communication  
✅ pgAdmin để quản lý database  
✅ Development workflow hoàn chỉnh  

### Next Steps

1. **Phát triển Features Mới**: Bắt đầu code features mới
2. **Testing**: Viết và chạy tests
3. **Documentation**: Cập nhật docs khi cần
4. **Collaboration**: Share với team members
5. **Production**: Deploy lên production environment khi ready

### Important Notes

⚠️ **Bảo Mật**: Dự án này chỉ cho mục đích nghiên cứu và giáo dục  
⚠️ **Ethics**: Tuân thủ quy định pháp luật  
⚠️ **Data Privacy**: Bảo vệ dữ liệu người dùng  
⚠️ **Resource Management**: Monitor Codespaces usage để tránh vượt quota  

### Hỗ Trợ

Nếu gặp vấn đề:
1. Check phần Troubleshooting trong guide này
2. Xem logs để debug
3. Create GitHub issue
4. Tham khảo external documentation

---

**Document Version:** 1.0.0  
**Last Updated:** November 2025  
**Author:** ZaloPay Merchant Platform Team  
**Status:** Production Ready for Codespaces  

**Happy Coding! 🚀**
