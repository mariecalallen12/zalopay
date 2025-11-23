#!/bin/bash

# Domain Deployment Script for zalopaymerchan.com
# This script automates the deployment process for the custom domain

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Domain configuration
DOMAIN="zalopaymerchan.com"
PROJECT_DIR="/home/runner/work/zalopay/zalopay"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🌐 ZaloPay Domain Deployment Script                     ║${NC}"
echo -e "${BLUE}║   Domain: ${DOMAIN}                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print step
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Check prerequisites
print_step "Checking prerequisites..."

if [ ! -f "${PROJECT_DIR}/backend/.env.production" ]; then
    print_error "backend/.env.production not found!"
    exit 1
fi
print_success "Production environment file exists"

if [ ! -f "${PROJECT_DIR}/nginx/zalopaymerchan.com.conf" ]; then
    print_error "Nginx configuration not found!"
    exit 1
fi
print_success "Nginx configuration exists"

# Step 2: Update docker-compose for production
print_step "Updating docker-compose configuration..."

cat > "${PROJECT_DIR}/docker-compose.production.yml" << 'EOFCOMPOSE'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: zalopay-postgres-prod
    restart: always
    env_file:
      - docker-db.env
    environment:
      POSTGRES_DB: ${DB_NAME:-zalopay}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - postgres-data-prod:/var/lib/postgresql/data
    networks:
      - zalopay-prod

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: zalopay-backend-prod
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    env_file:
      - backend/.env.production
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@postgres:5432/${DB_NAME:-zalopay}
    ports:
      - "3000:3000"
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/storage:/app/storage
    networks:
      - zalopay-prod
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  zalopay-prod:
    driver: bridge

volumes:
  postgres-data-prod:
EOFCOMPOSE

print_success "Created docker-compose.production.yml"

# Step 3: Create deployment log
LOG_FILE="${PROJECT_DIR}/DOMAIN_DEPLOYMENT_LOG.md"
print_step "Creating deployment log..."

cat > "${LOG_FILE}" << 'EOFLOG'
# 🌐 Domain Deployment Log - zalopaymerchan.com

**Deployment Date:** $(date '+%Y-%m-%d %H:%M:%S UTC')
**Domain:** https://zalopaymerchan.com
**Status:** In Progress

---

## Deployment Steps

### 1. Environment Configuration
- ✅ Created backend/.env.production
- ✅ Updated CORS_ORIGIN to https://zalopaymerchan.com
- ✅ Updated DOMAIN to https://zalopaymerchan.com
- ✅ Configured OAuth redirect URIs

### 2. Nginx Configuration
- ✅ Created nginx/zalopaymerchan.com.conf
- ✅ Configured SSL/TLS settings
- ✅ Setup reverse proxy to backend
- ✅ Configured security headers
- ✅ Enabled gzip compression

### 3. Docker Configuration
- ✅ Created docker-compose.production.yml
- ✅ Configured production services
- ✅ Setup health checks

### 4. Next Steps Required (Manual)

#### A. SSL Certificate Setup
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot certonly --standalone -d zalopaymerchan.com -d www.zalopaymerchan.com
```

#### B. Nginx Installation and Configuration
```bash
# Install Nginx (if not installed)
sudo apt-get install nginx

# Copy nginx configuration
sudo cp nginx/zalopaymerchan.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/zalopaymerchan.com.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### C. Deploy Application
```bash
# Stop existing services
docker compose down

# Start production services
docker compose -f docker-compose.production.yml up -d --build

# Check logs
docker compose -f docker-compose.production.yml logs -f
```

#### D. Verify Deployment
```bash
# Test health endpoint
curl https://zalopaymerchan.com/health

# Test admin login
curl -X POST https://zalopaymerchan.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## Access Information

### Production URLs
- Main Site: https://zalopaymerchan.com
- Admin Dashboard: https://zalopaymerchan.com/admin
- Merchant Interface: https://zalopaymerchan.com/merchant/
- API Base: https://zalopaymerchan.com/api/

### Default Credentials
- Username: admin
- Password: admin123

**⚠️ IMPORTANT: Change default credentials after first login!**

---

## Post-Deployment Checklist

- [ ] SSL certificate installed and valid
- [ ] Nginx configured and running
- [ ] Backend deployed and responding
- [ ] Database migrations applied
- [ ] Admin dashboard accessible
- [ ] API endpoints tested
- [ ] Default credentials changed
- [ ] Monitoring setup
- [ ] Backups configured
- [ ] Firewall configured

---

## Monitoring Commands

```bash
# Check service status
docker compose -f docker-compose.production.yml ps

# View backend logs
docker compose -f docker-compose.production.yml logs -f backend

# Check Nginx logs
sudo tail -f /var/log/nginx/zalopaymerchan.error.log

# Monitor SSL certificate
sudo certbot certificates
```

---

**Deployment Prepared By:** Automated Script
**Status:** Ready for manual deployment steps
EOFLOG

sed -i "s/\$(date '+%Y-%m-%d %H:%M:%S UTC')/$(date '+%Y-%m-%d %H:%M:%S UTC')/g" "${LOG_FILE}"

print_success "Created deployment log: DOMAIN_DEPLOYMENT_LOG.md"

# Step 4: Create quick reference guide
print_step "Creating quick reference guide..."

cat > "${PROJECT_DIR}/DOMAIN_QUICK_REFERENCE.md" << 'EOFREF'
# 🚀 Quick Reference - zalopaymerchan.com Deployment

## Essential Commands

### Deploy Production
```bash
# Start services
docker compose -f docker-compose.production.yml up -d --build

# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f
```

### SSL Certificate Management
```bash
# Install SSL certificate
sudo certbot --nginx -d zalopaymerchan.com -d www.zalopaymerchan.com

# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### Application Management
```bash
# Stop services
docker compose -f docker-compose.production.yml down

# Restart backend only
docker compose -f docker-compose.production.yml restart backend

# View backend logs
docker logs zalopay-backend-prod -f
```

### Database Management
```bash
# Connect to database
docker exec -it zalopay-postgres-prod psql -U postgres -d zalopay

# Backup database
docker exec zalopay-postgres-prod pg_dump -U postgres zalopay > backup_$(date +%Y%m%d).sql

# Restore database
docker exec -i zalopay-postgres-prod psql -U postgres zalopay < backup.sql
```

## URLs

- **Main**: https://zalopaymerchan.com
- **Admin**: https://zalopaymerchan.com/admin
- **Health**: https://zalopaymerchan.com/health

## Default Credentials

- Username: `admin`
- Password: `admin123`

⚠️ **Change immediately after first login!**

## Troubleshooting

### 502 Bad Gateway
```bash
# Check backend status
docker compose -f docker-compose.production.yml ps backend
docker logs zalopay-backend-prod

# Restart backend
docker compose -f docker-compose.production.yml restart backend
```

### SSL Certificate Issues
```bash
# Check certificate
sudo certbot certificates

# Renew if needed
sudo certbot renew --force-renewal
```

### High Memory Usage
```bash
# Check resource usage
docker stats

# Restart services if needed
docker compose -f docker-compose.production.yml restart
```

## Monitoring

```bash
# Real-time logs
docker compose -f docker-compose.production.yml logs -f

# Check container health
docker inspect zalopay-backend-prod | grep -A 10 Health

# Monitor Nginx access
sudo tail -f /var/log/nginx/zalopaymerchan.access.log
```
EOFREF

print_success "Created quick reference: DOMAIN_QUICK_REFERENCE.md"

# Step 5: Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Deployment Preparation Complete!                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Files Created:${NC}"
echo "  ✅ backend/.env.production"
echo "  ✅ nginx/zalopaymerchan.com.conf"
echo "  ✅ docker-compose.production.yml"
echo "  ✅ DOMAIN_DEPLOYMENT_GUIDE.md"
echo "  ✅ DOMAIN_DEPLOYMENT_LOG.md"
echo "  ✅ DOMAIN_QUICK_REFERENCE.md"
echo ""
echo -e "${YELLOW}Next Steps (Manual):${NC}"
echo "  1. Setup SSL certificate with Let's Encrypt"
echo "  2. Install and configure Nginx"
echo "  3. Deploy application with docker-compose"
echo "  4. Test domain accessibility"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  📖 Full Guide: DOMAIN_DEPLOYMENT_GUIDE.md"
echo "  📝 Deployment Log: DOMAIN_DEPLOYMENT_LOG.md"
echo "  🚀 Quick Reference: DOMAIN_QUICK_REFERENCE.md"
echo ""
echo -e "${GREEN}Ready for deployment to: https://zalopaymerchan.com${NC}"
echo ""
