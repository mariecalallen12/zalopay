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
