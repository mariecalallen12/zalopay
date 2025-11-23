# Database Setup Guide

## Prerequisites

1. PostgreSQL database running
2. `DATABASE_URL` environment variable set in `.env` file
3. Node.js and npm installed

## Setup Steps

### 1. Generate Prisma Client

```bash
npm run db:generate
```

or

```bash
npx prisma generate
```

### 2. Run Database Migrations

If using Prisma migrations:

```bash
npm run db:migrate
```

or

```bash
npx prisma migrate deploy
```

If you have SQL migration files in `migrations/` directory, you can run them manually:

```bash
psql $DATABASE_URL -f migrations/001_initial_schema.sql
psql $DATABASE_URL -f migrations/002_add_platform_support.sql
```

### 3. Seed Initial Data

```bash
npm run db:seed
```

or

```bash
node prisma/seed.js
```

This will create:
- Default admin user (username: `admin`, password: `admin123` or from `ADMIN_PASSWORD` env var)
- Default campaign (`DEFAULT-2024`)

### 4. Verify Database

Check that all tables exist:

```bash
npx prisma studio
```

Or manually verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/zalopay_db"
ADMIN_PASSWORD="admin123"
JWT_SECRET="your-secret-key-here"
ENCRYPTION_KEY="your-32-byte-encryption-key-here"
```

## Troubleshooting

### Migration Errors

If migrations fail, you can reset the database:

```bash
npm run db:reset
```

**Warning:** This will delete all data!

### Connection Errors

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` is correct
3. Ensure database exists: `CREATE DATABASE zalopay_db;`

### Prisma Client Errors

If you see "PrismaClient is not initialized", run:

```bash
npm run db:generate
```

## Default Credentials

After seeding:

- **Username:** `admin`
- **Password:** `admin123` (or value from `ADMIN_PASSWORD` env var)
- **Email:** `admin@zalopay.local`
- **Role:** `super_admin`

## Next Steps

After database setup:

1. Start the backend server: `npm start` or `npm run dev`
2. Access admin portal at: `http://localhost:5000/admin`
3. Login with default credentials
4. Create additional campaigns and admin users as needed
