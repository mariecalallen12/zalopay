# ⚡ Quick Start: ZaloPay trên GitHub Codespaces

**Thời gian setup: 5 phút** | **Không cần cài đặt gì!**

---

## 🚀 Bắt Đầu Ngay (3 Bước)

### Bước 1: Tạo Codespace (1 phút)

1. Vào repository trên GitHub
2. Click nút **`Code`** (màu xanh)
3. Tab **`Codespaces`** → **`Create codespace on main`**
4. Chọn **4-core, 16GB RAM** (recommended)
5. Click **`Create codespace`**

### Bước 2: Chờ Auto-Setup (2-3 phút)

Codespace sẽ tự động:
- ✅ Install Node.js 18 và dependencies
- ✅ Setup PostgreSQL database
- ✅ Run migrations và seed data
- ✅ Build admin frontend
- ✅ Configure environment

**Không cần làm gì, chờ thông báo "Setup completed!"**

### Bước 3: Start Backend (1 phút)

```bash
cd backend
npm run dev
```

**Xong!** 🎉

---

## 📱 Truy Cập Ứng Dụng

### Kiểm Tra Ports (Tab PORTS dưới Terminal)

Bạn sẽ thấy:
- **Port 3000**: Backend API
- **Port 5433**: PostgreSQL
- **Port 8081**: pgAdmin

### Mở Ứng Dụng

Click chuột phải vào **port 3000** → **"Open in Browser"**

URLs có dạng: `https://xxx-3000.preview.app.github.dev`

---

## 🔑 Login Credentials

### Admin Dashboard
- **URL**: `https://xxx-3000.preview.app.github.dev/admin`
- **Username**: `admin`
- **Password**: `admin123`

### pgAdmin (Optional)
- **URL**: `https://xxx-8081.preview.app.github.dev`
- **Email**: `admin@example.com`
- **Password**: `admin123`

---

## ✅ Verify Everything Works

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```
Kết quả: `{"status":"ok"}`

### Test 2: Admin Login
1. Mở admin dashboard
2. Login với credentials ở trên
3. Thấy dashboard → ✅ Success!

### Test 3: Merchant Interface
Mở: `https://xxx-3000.preview.app.github.dev/merchant/`

---

## 🛠️ Common Commands

```bash
# Start backend (development mode)
cd backend && npm run dev

# View logs
tail -f backend/logs/app.log

# Check database
npm run db:health

# Run tests
npm test

# Build admin UI
cd static/admin && npm run build

# Database backup
docker exec zalopay-postgres pg_dump -U postgres zalopay > backup.sql
```

---

## 🔍 Troubleshooting

### Backend không start?
```bash
# Check database
docker ps | grep postgres

# Restart database nếu cần
docker compose -f docker-compose.db.yml restart postgres
```

### Port không forward?
1. Mở tab **PORTS**
2. Click **"Forward a Port"**
3. Nhập port number (e.g., 3000)

### Lỗi dependencies?
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run db:generate
```

---

## 📚 Đọc Thêm

- **Chi tiết đầy đủ**: [CODESPACES_GUIDE.md](./CODESPACES_GUIDE.md)
- **Checklist 211 tasks**: [CODESPACES_DEPLOYMENT_CHECKLIST.md](./CODESPACES_DEPLOYMENT_CHECKLIST.md)
- **Deployment tổng quát**: [Deployment/DEPLOYMENT_GUIDE.md](./Deployment/DEPLOYMENT_GUIDE.md)

---

## 💡 Pro Tips

1. **Save costs**: Stop Codespace khi không dùng (tự động sau 30 phút)
2. **Commit thường xuyên**: `git add . && git commit -m "message"`
3. **Monitor resources**: `docker stats` và `free -h`
4. **Clean up**: `docker system prune -f` khi hết disk space
5. **Use branches**: `git checkout -b feature/your-feature`

---

## ⚠️ Important Notes

- 🔒 **Bảo mật**: Chỉ dùng cho nghiên cứu và giáo dục
- 📊 **Quota**: Free tier có 120 core-hours/month
- 💾 **Data**: Được lưu khi stop Codespace, mất khi delete
- 🔐 **Passwords**: Đổi default passwords trong production

---

**Happy Coding on Codespaces! 🚀**

Need help? → [Create an issue](https://github.com/mariecalallen12/zalopay/issues)
