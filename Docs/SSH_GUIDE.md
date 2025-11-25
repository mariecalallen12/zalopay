# 🔐 Hướng dẫn SSH cho ZaloPay Deployment

## Giới thiệu

Tài liệu này mô tả các công cụ và cách sử dụng SSH để truy cập máy chủ từ xa một cách ổn định và chính xác trong dự án ZaloPay.

## 📦 Công cụ đã cài đặt

### Công cụ chính

| Công cụ | Mô tả | Mục đích sử dụng |
|---------|-------|-----------------|
| `openssh-client` | Client SSH tiêu chuẩn | Kết nối SSH cơ bản |
| `autossh` | SSH tự động reconnect | Kết nối ổn định, tự động kết nối lại |
| `rsync` | Đồng bộ file | Sao chép/đồng bộ file nhanh chóng |
| `mosh` | Mobile Shell | Kết nối di động, chịu được mất mạng |
| `sshpass` | SSH với mật khẩu | Tự động nhập mật khẩu (không khuyến nghị) |
| `tmux` | Terminal multiplexer | Quản lý nhiều session |
| `screen` | Terminal multiplexer | Alternative cho tmux |

### Script quản lý

| Script | Mô tả |
|--------|-------|
| `install-ssh-tools.sh` | Cài đặt tất cả công cụ SSH |
| `ssh-manager.sh` | Quản lý kết nối SSH |

## 🚀 Cài đặt

### Cài đặt tự động

```bash
cd scripts/ssh
chmod +x install-ssh-tools.sh
./install-ssh-tools.sh
```

### Cài đặt thủ công (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y openssh-client autossh rsync mosh sshpass tmux screen
```

### Cài đặt trên macOS

```bash
brew install openssh autossh rsync mosh sshpass tmux screen
```

## 📖 Hướng dẫn sử dụng

### 1. Kết nối SSH cơ bản

```bash
# Kết nối trực tiếp
ssh user@server-ip

# Kết nối với cổng tùy chỉnh
ssh -p 2222 user@server-ip

# Kết nối với key cụ thể
ssh -i ~/.ssh/my_key user@server-ip
```

### 2. Sử dụng SSH Manager

```bash
cd scripts/ssh
chmod +x ssh-manager.sh

# Kết nối SSH
./ssh-manager.sh connect zalopay-prod

# Kết nối với autossh (tự động reconnect)
./ssh-manager.sh auto-connect zalopay-prod

# Tạo SSH tunnel
./ssh-manager.sh tunnel zalopay-prod 3000

# Đồng bộ file
./ssh-manager.sh sync zalopay-prod ./backend/ /app/

# Deploy ứng dụng
./ssh-manager.sh deploy zalopay-prod

# Kiểm tra sức khỏe server
./ssh-manager.sh health zalopay-prod

# Xem logs
./ssh-manager.sh logs zalopay-prod

# Quản lý SSH keys
./ssh-manager.sh keys

# Cấu hình kết nối mới
./ssh-manager.sh config
```

### 3. Kết nối ổn định với Autossh

Autossh tự động kết nối lại khi mất kết nối:

```bash
# Kết nối cơ bản với autossh
autossh -M 0 -o "ServerAliveInterval 30" user@server-ip

# Kết nối với port forwarding
autossh -M 0 -o "ServerAliveInterval 30" -L 3000:localhost:3000 user@server-ip

# Chạy trong nền
autossh -f -M 0 -o "ServerAliveInterval 30" -N -L 3000:localhost:3000 user@server-ip
```

### 4. Kết nối di động với Mosh

Mosh giữ kết nối ổn định khi di chuyển hoặc mạng không ổn định:

```bash
# Kết nối với mosh
mosh user@server-ip

# Kết nối với cổng SSH tùy chỉnh
mosh --ssh="ssh -p 2222" user@server-ip
```

### 5. Đồng bộ file với Rsync

```bash
# Đồng bộ thư mục lên server
rsync -avz --progress ./local-folder/ user@server:/remote-folder/

# Đồng bộ với loại trừ
rsync -avz --exclude 'node_modules' --exclude '.git' ./project/ user@server:/app/

# Đồng bộ ngược (server về local)
rsync -avz user@server:/remote-folder/ ./local-folder/
```

### 6. SSH Tunneling (Port Forwarding)

```bash
# Local port forwarding (truy cập remote service từ local)
ssh -L 3000:localhost:3000 user@server-ip
# Truy cập: http://localhost:3000

# Remote port forwarding (expose local service ra remote)
ssh -R 8080:localhost:3000 user@server-ip

# Dynamic port forwarding (SOCKS proxy)
ssh -D 1080 user@server-ip
```

## ⚙️ Cấu hình SSH

### File cấu hình SSH (~/.ssh/config)

```bash
# Cấu hình mặc định cho tất cả host
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    AddKeysToAgent yes
    Compression yes
    ControlMaster auto
    ControlPath ~/.ssh/sockets/%r@%h-%p
    ControlPersist 600

# Cấu hình server ZaloPay Production
Host zalopay-prod
    HostName your-production-server-ip
    User deploy
    Port 22
    IdentityFile ~/.ssh/zalopay_deploy_key

# Cấu hình server ZaloPay Staging
Host zalopay-staging
    HostName your-staging-server-ip
    User deploy
    Port 22
    IdentityFile ~/.ssh/zalopay_deploy_key
```

### Tạo SSH Key

```bash
# Tạo key Ed25519 (khuyến nghị)
ssh-keygen -t ed25519 -C "zalopay-deployment"

# Tạo key RSA (tương thích cao)
ssh-keygen -t rsa -b 4096 -C "zalopay-deployment"
```

### Sao chép key lên server

```bash
ssh-copy-id user@server-ip
```

## 🔒 Bảo mật SSH

### Khuyến nghị bảo mật

1. **Sử dụng SSH key thay vì mật khẩu**
   ```bash
   # Tắt đăng nhập bằng mật khẩu trong /etc/ssh/sshd_config
   PasswordAuthentication no
   ```

2. **Thay đổi cổng SSH mặc định**
   ```bash
   # Trong /etc/ssh/sshd_config
   Port 2222
   ```

3. **Sử dụng fail2ban để chống brute force**
   ```bash
   sudo apt-get install fail2ban
   ```

4. **Giới hạn người dùng có thể SSH**
   ```bash
   # Trong /etc/ssh/sshd_config
   AllowUsers deploy admin
   ```

5. **Sử dụng firewall**
   ```bash
   sudo ufw allow ssh
   sudo ufw enable
   ```

## 📋 Các lệnh hay dùng

### Kiểm tra kết nối

```bash
# Kiểm tra kết nối SSH
ssh -o ConnectTimeout=5 -o BatchMode=yes user@server exit && echo "OK" || echo "FAIL"

# Kiểm tra SSH key
ssh-add -l

# Xem fingerprint của key
ssh-keygen -lf ~/.ssh/id_ed25519.pub
```

### Debug kết nối

```bash
# Verbose mode
ssh -v user@server-ip

# Very verbose mode
ssh -vv user@server-ip

# Maximum verbose
ssh -vvv user@server-ip
```

### Quản lý session

```bash
# Liệt kê các kết nối đang mở
ls ~/.ssh/sockets/

# Đóng kết nối multiplexing
ssh -O exit zalopay-prod
```

## 🐛 Khắc phục sự cố

### Lỗi "Connection refused"

```bash
# Kiểm tra SSH service trên server
sudo systemctl status sshd

# Kiểm tra firewall
sudo ufw status
```

### Lỗi "Permission denied"

```bash
# Kiểm tra quyền file key
chmod 600 ~/.ssh/id_ed25519
chmod 700 ~/.ssh

# Kiểm tra authorized_keys trên server
cat ~/.ssh/authorized_keys
```

### Lỗi "Connection timed out"

```bash
# Sử dụng autossh để tự động reconnect
autossh -M 0 -o "ServerAliveInterval 30" user@server-ip

# Kiểm tra kết nối mạng
ping server-ip
```

## 📚 Tài liệu tham khảo

- [OpenSSH Manual](https://www.openssh.com/manual.html)
- [SSH Config Documentation](https://linux.die.net/man/5/ssh_config)
- [Autossh Manual](https://linux.die.net/man/1/autossh)
- [Mosh Documentation](https://mosh.org/)
- [Rsync Manual](https://linux.die.net/man/1/rsync)

---

**Được tạo bởi:** ZaloPay DevOps Team
**Cập nhật lần cuối:** 2024
