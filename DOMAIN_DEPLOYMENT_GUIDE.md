# 🌐 Hướng Dẫn Triển Khai Domain: zalopaymerchan.com

**Domain:** https://zalopaymerchan.com  
**Ngày triển khai:** 2025-11-23  
**Trạng thái:** ✅ Domain đã được GitHub chấp nhận

---

## 📋 Tổng Quan Quy Trình

Để triển khai dự án trên domain custom `zalopaymerchan.com`, cần thực hiện các bước sau:

### 1. Cấu Hình Backend
### 2. Cấu Hình CORS
### 3. Cấu Hình Nginx/Reverse Proxy
### 4. Cập Nhật Environment Variables
### 5. Deploy và Kiểm Tra

---

## 🔧 BƯỚC 1: Cấu Hình Backend Environment

### Cập nhật backend/.env.production

```env
NODE_ENV=production
PORT=3000

# Domain Configuration
CORS_ORIGIN=https://zalopaymerchan.com
DOMAIN=https://zalopaymerchan.com

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/zalopay

# Security
JWT_SECRET=<your-secure-jwt-secret>
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10

# Encryption Keys
CARD_ENCRYPTION_KEY=<your-card-encryption-key>
OAUTH_ENCRYPTION_KEY=<your-oauth-encryption-key>

# OAuth Callbacks
GOOGLE_REDIRECT_URI=https://zalopaymerchan.com/api/admin/gmail/callback

# SSL Configuration
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

---

## 🔧 BƯỚC 2: Cấu Hình Nginx Reverse Proxy

Tạo file nginx configuration:

```nginx
# /etc/nginx/sites-available/zalopaymerchan.com

server {
    listen 80;
    server_name zalopaymerchan.com www.zalopaymerchan.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zalopaymerchan.com www.zalopaymerchan.com;

    # SSL Certificate (from GitHub Pages or Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/zalopaymerchan.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zalopaymerchan.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Proxy to Backend API
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support for Socket.IO
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static Files (if served separately)
    location /static/ {
        alias /var/www/zalopaymerchan/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health Check Endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

---

## 🔧 BƯỚC 3: Cấu Hình SSL với Let's Encrypt

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL Certificate
sudo certbot --nginx -d zalopaymerchan.com -d www.zalopaymerchan.com

# Auto-renewal (test)
sudo certbot renew --dry-run

# Add cron job for auto-renewal
echo "0 0,12 * * * root certbot renew --quiet" | sudo tee -a /etc/crontab > /dev/null
```

---

## 🔧 BƯỚC 4: Cập Nhật Docker Compose

Cập nhật `docker-compose.yml` để sử dụng production environment:

```yaml
services:
  backend:
    environment:
      - NODE_ENV=production
      - CORS_ORIGIN=https://zalopaymerchan.com
      - DOMAIN=https://zalopaymerchan.com
```

---

## 🔧 BƯỚC 5: Deploy Application

```bash
# 1. Stop existing services
docker compose down

# 2. Pull latest changes
git pull origin main

# 3. Build and start with production config
docker compose up -d --build

# 4. Check logs
docker compose logs -f backend

# 5. Verify deployment
curl https://zalopaymerchan.com/health
```

---

## ✅ Checklist Triển Khai Domain

### Pre-Deployment
- [x] Domain đã được GitHub chấp nhận
- [ ] DNS records đã được cấu hình đúng
- [ ] SSL certificate sẵn sàng (Let's Encrypt hoặc GitHub)

### Configuration
- [ ] Cập nhật backend/.env.production với domain mới
- [ ] Cấu hình CORS_ORIGIN với domain
- [ ] Cập nhật OAuth redirect URIs
- [ ] Tạo Nginx configuration
- [ ] Cấu hình SSL certificates

### Deployment
- [ ] Deploy backend với production config
- [ ] Start Nginx reverse proxy
- [ ] Verify backend accessible qua domain
- [ ] Test SSL certificate
- [ ] Test API endpoints qua domain
- [ ] Test admin dashboard qua domain
- [ ] Test WebSocket connections (Socket.IO)

### Post-Deployment
- [ ] Monitor logs cho errors
- [ ] Setup monitoring và alerting
- [ ] Configure backups
- [ ] Document access credentials
- [ ] Update documentation với domain mới

---

## 🧪 Testing & Verification

### 1. Test Domain Resolution
```bash
# Check DNS
nslookup zalopaymerchan.com
dig zalopaymerchan.com

# Test HTTP redirect to HTTPS
curl -I http://zalopaymerchan.com

# Test HTTPS
curl -I https://zalopaymerchan.com
```

### 2. Test Backend API
```bash
# Health check
curl https://zalopaymerchan.com/health

# Admin login
curl -X POST https://zalopaymerchan.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. Test in Browser
- Navigate to: https://zalopaymerchan.com
- Test admin dashboard: https://zalopaymerchan.com/admin
- Test merchant interface: https://zalopaymerchan.com/merchant/
- Check browser console for errors
- Verify SSL certificate (padlock icon)

---

## 🔒 Security Considerations

### 1. Update All URLs
```bash
# Update in database
UPDATE campaigns SET landing_url = REPLACE(landing_url, 'localhost:3000', 'zalopaymerchan.com');
UPDATE campaigns SET callback_url = REPLACE(callback_url, 'localhost:3000', 'zalopaymerchan.com');
```

### 2. Configure Firewall
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny direct access to backend port from outside
sudo ufw deny from any to any port 3000
```

### 3. Update CORS Configuration
```javascript
// backend/config/cors.js
const allowedOrigins = [
  'https://zalopaymerchan.com',
  'https://www.zalopaymerchan.com'
];
```

---

## 📊 Monitoring & Maintenance

### Setup Monitoring
```bash
# Install monitoring tools
npm install -g pm2

# Start backend with PM2
pm2 start npm --name "zalopay-backend" -- start
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs zalopay-backend
```

### Regular Maintenance
```bash
# Weekly: Check SSL certificate expiry
sudo certbot certificates

# Weekly: Check logs for errors
sudo tail -f /var/log/nginx/error.log
docker compose logs --tail=100 backend

# Monthly: Update dependencies
cd /path/to/project
npm update
docker compose pull
docker compose up -d --build
```

---

## 🚨 Troubleshooting

### Issue 1: Domain không accessible
```bash
# Check DNS propagation
dig zalopaymerchan.com

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# Check backend status
docker compose ps
docker compose logs backend
```

### Issue 2: SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew --force-renewal

# Check certificate
sudo certbot certificates

# Restart Nginx
sudo systemctl restart nginx
```

### Issue 3: CORS Errors
- Verify CORS_ORIGIN in backend/.env.production
- Check Nginx proxy_set_header configuration
- Clear browser cache
- Check browser console for specific CORS errors

---

## 📝 Environment Variables Summary

### Required Environment Variables for Domain Deployment

```env
# Domain Configuration
CORS_ORIGIN=https://zalopaymerchan.com
DOMAIN=https://zalopaymerchan.com

# OAuth Callbacks
GOOGLE_REDIRECT_URI=https://zalopaymerchan.com/api/admin/gmail/callback

# Security (Production)
NODE_ENV=production
DATABASE_SSL=true
```

---

## 🎯 Expected Results After Deployment

### Accessible URLs:
- ✅ Main domain: https://zalopaymerchan.com
- ✅ Admin dashboard: https://zalopaymerchan.com/admin
- ✅ Merchant interface: https://zalopaymerchan.com/merchant/
- ✅ API endpoints: https://zalopaymerchan.com/api/*
- ✅ Health check: https://zalopaymerchan.com/health

### Security Features:
- ✅ HTTPS enabled với valid SSL certificate
- ✅ HTTP auto-redirects to HTTPS
- ✅ CORS configured for domain
- ✅ Security headers in place
- ✅ Firewall configured

### Performance:
- ✅ Gzip compression enabled
- ✅ Static file caching
- ✅ WebSocket support for Socket.IO
- ✅ Reverse proxy optimization

---

## 📞 Support

Nếu gặp vấn đề trong quá trình deployment:
1. Check logs: `docker compose logs -f`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify DNS: `nslookup zalopaymerchan.com`
4. Test locally first: `curl http://localhost:3000/health`

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-11-23  
**Status:** Ready for Deployment  
**Domain:** https://zalopaymerchan.com
