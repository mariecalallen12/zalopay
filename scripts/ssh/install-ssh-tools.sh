#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════╗
# ║  Script cài đặt công cụ SSH cho ZaloPay Deployment           ║
# ║  Dùng để truy cập máy chủ từ xa một cách ổn định và chính xác ║
# ╚═══════════════════════════════════════════════════════════════╝

set -e  # Dừng khi có lỗi

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔐 Cài đặt Công cụ SSH cho ZaloPay                          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Hàm in thông báo
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Kiểm tra hệ điều hành
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    elif [ -f /etc/lsb-release ]; then
        . /etc/lsb-release
        OS=$DISTRIB_ID
        VERSION=$DISTRIB_RELEASE
    else
        OS=$(uname -s)
        VERSION=$(uname -r)
    fi
    echo -e "Hệ điều hành: ${GREEN}$OS $VERSION${NC}"
}

# Cài đặt các công cụ SSH trên Debian/Ubuntu
install_debian() {
    print_step "Cập nhật danh sách gói..."
    sudo apt-get update -qq
    
    print_step "Cài đặt các công cụ SSH..."
    sudo apt-get install -y \
        openssh-client \
        openssh-server \
        autossh \
        sshpass \
        rsync \
        mosh \
        tmux \
        screen
    
    print_success "Đã cài đặt thành công trên Debian/Ubuntu"
}

# Cài đặt các công cụ SSH trên CentOS/RHEL
install_rhel() {
    print_step "Cập nhật danh sách gói..."
    sudo yum update -y -q
    
    print_step "Cài đặt các công cụ SSH..."
    sudo yum install -y \
        openssh-clients \
        openssh-server \
        autossh \
        sshpass \
        rsync \
        mosh \
        tmux \
        screen
    
    print_success "Đã cài đặt thành công trên CentOS/RHEL"
}

# Cài đặt các công cụ SSH trên macOS
install_macos() {
    print_step "Kiểm tra Homebrew..."
    if ! command -v brew &> /dev/null; then
        print_error "Homebrew chưa được cài đặt. Vui lòng cài đặt Homebrew trước."
        exit 1
    fi
    
    print_step "Cài đặt các công cụ SSH..."
    brew install \
        openssh \
        autossh \
        sshpass \
        rsync \
        mosh \
        tmux \
        screen
    
    print_success "Đã cài đặt thành công trên macOS"
}

# Kiểm tra công cụ đã cài đặt
check_tools() {
    echo ""
    print_step "Kiểm tra các công cụ đã cài đặt..."
    echo ""
    
    tools=("ssh" "ssh-keygen" "ssh-agent" "ssh-add" "autossh" "sshpass" "rsync" "mosh" "tmux" "screen")
    
    for tool in "${tools[@]}"; do
        if command -v $tool &> /dev/null; then
            version=$($tool --version 2>&1 | head -1 || $tool -V 2>&1 | head -1 || echo "đã cài đặt")
            print_success "$tool: $version"
        else
            print_warning "$tool: Chưa được cài đặt"
        fi
    done
}

# Tạo cấu hình SSH mặc định
create_ssh_config() {
    print_step "Tạo cấu hình SSH..."
    
    SSH_DIR="$HOME/.ssh"
    mkdir -p "$SSH_DIR"
    chmod 700 "$SSH_DIR"
    
    # Tạo file config nếu chưa có
    if [ ! -f "$SSH_DIR/config" ]; then
        cat > "$SSH_DIR/config" << 'EOF'
# ╔═══════════════════════════════════════════════════════════════╗
# ║  Cấu hình SSH cho ZaloPay Deployment                         ║
# ╚═══════════════════════════════════════════════════════════════╝

# Cấu hình mặc định cho tất cả các host
Host *
    # Giữ kết nối SSH ổn định
    ServerAliveInterval 60
    ServerAliveCountMax 3
    
    # Tự động thêm host key
    StrictHostKeyChecking ask
    
    # Sử dụng SSH agent
    AddKeysToAgent yes
    
    # Nén dữ liệu
    Compression yes
    
    # Multiplexing để tăng tốc độ kết nối
    ControlMaster auto
    ControlPath ~/.ssh/sockets/%r@%h-%p
    ControlPersist 600

# Ví dụ cấu hình server ZaloPay Production
# Host zalopay-prod
#     HostName your-server-ip
#     User deploy
#     Port 22
#     IdentityFile ~/.ssh/zalopay_deploy_key

# Ví dụ cấu hình server ZaloPay Staging
# Host zalopay-staging
#     HostName your-staging-ip
#     User deploy
#     Port 22
#     IdentityFile ~/.ssh/zalopay_deploy_key
EOF
        chmod 600 "$SSH_DIR/config"
        print_success "Đã tạo file cấu hình SSH: $SSH_DIR/config"
    else
        print_warning "File cấu hình SSH đã tồn tại: $SSH_DIR/config"
    fi
    
    # Tạo thư mục sockets cho ControlMaster
    mkdir -p "$SSH_DIR/sockets"
    chmod 700 "$SSH_DIR/sockets"
}

# Tạo SSH key nếu chưa có
create_ssh_key() {
    print_step "Kiểm tra SSH key..."
    
    SSH_KEY="$HOME/.ssh/id_ed25519"
    
    if [ ! -f "$SSH_KEY" ]; then
        print_step "Tạo SSH key mới (Ed25519)..."
        ssh-keygen -t ed25519 -C "zalopay-deployment" -f "$SSH_KEY" -N ""
        print_success "Đã tạo SSH key: $SSH_KEY"
        echo ""
        echo -e "${YELLOW}Public key của bạn:${NC}"
        cat "${SSH_KEY}.pub"
        echo ""
    else
        print_warning "SSH key đã tồn tại: $SSH_KEY"
    fi
}

# Hiển thị hướng dẫn sử dụng
show_usage() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  📖 Hướng dẫn sử dụng                                        ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}1. Kết nối SSH cơ bản:${NC}"
    echo "   ssh user@server-ip"
    echo ""
    echo -e "${GREEN}2. Kết nối với cấu hình đã lưu:${NC}"
    echo "   ssh zalopay-prod"
    echo ""
    echo -e "${GREEN}3. Kết nối tự động reconnect (autossh):${NC}"
    echo "   autossh -M 0 -o \"ServerAliveInterval 30\" user@server-ip"
    echo ""
    echo -e "${GREEN}4. Kết nối với mosh (di động tốt hơn):${NC}"
    echo "   mosh user@server-ip"
    echo ""
    echo -e "${GREEN}5. Đồng bộ file với rsync:${NC}"
    echo "   rsync -avz --progress ./source/ user@server:/destination/"
    echo ""
    echo -e "${GREEN}6. Port forwarding:${NC}"
    echo "   ssh -L 3000:localhost:3000 user@server-ip"
    echo ""
    echo -e "${GREEN}7. Sao chép public key lên server:${NC}"
    echo "   ssh-copy-id user@server-ip"
    echo ""
}

# Main
main() {
    detect_os
    echo ""
    
    case "$OS" in
        ubuntu|debian)
            install_debian
            ;;
        centos|rhel|fedora)
            install_rhel
            ;;
        darwin)
            install_macos
            ;;
        *)
            print_warning "Hệ điều hành không được hỗ trợ tự động. Vui lòng cài đặt thủ công."
            ;;
    esac
    
    check_tools
    create_ssh_config
    create_ssh_key
    show_usage
    
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ Hoàn tất cài đặt công cụ SSH!                            ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
}

# Chạy script
main "$@"
