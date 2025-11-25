#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════╗
# ║  Script kết nối SSH an toàn và ổn định                       ║
# ║  ZaloPay Remote Server Connection Manager                     ║
# ╚═══════════════════════════════════════════════════════════════╝

set -e

# Cấu hình màu sắc
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Cấu hình mặc định - có thể override bằng biến môi trường
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/ssh-config.env"
LOG_FILE="${SSH_LOG_FILE:-${SCRIPT_DIR}/../../logs/ssh-connection.log}"

# Cấu hình ứng dụng - có thể override bằng biến môi trường
APP_DIR="${APP_DIR:-/app}"
APP_PORT="${APP_PORT:-3000}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://localhost:${APP_PORT}/health}"
CONTAINER_PREFIX="${CONTAINER_PREFIX:-zalopay}"

# Load cấu hình từ file nếu tồn tại
if [ -f "$CONFIG_FILE" ]; then
    # shellcheck source=/dev/null
    source "$CONFIG_FILE"
fi

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

# Hiển thị trợ giúp
show_help() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  🔐 ZaloPay SSH Connection Manager                           ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Cách sử dụng: $0 [LỆNH] [TÙY CHỌN]"
    echo ""
    echo "Các lệnh:"
    echo "  connect <host>          Kết nối SSH đến host"
    echo "  auto-connect <host>     Kết nối với autossh (tự động reconnect)"
    echo "  tunnel <host> <port>    Tạo SSH tunnel cho port cụ thể"
    echo "  sync <host> <src> <dst> Đồng bộ file/thư mục qua rsync"
    echo "  deploy <host>           Deploy ứng dụng lên server"
    echo "  health <host>           Kiểm tra sức khỏe server"
    echo "  logs <host>             Xem logs từ server"
    echo "  keys                    Quản lý SSH keys"
    echo "  config                  Cấu hình kết nối"
    echo "  help                    Hiển thị trợ giúp này"
    echo ""
    echo "Ví dụ:"
    echo "  $0 connect zalopay-prod"
    echo "  $0 auto-connect zalopay-prod"
    echo "  $0 tunnel zalopay-prod 3000"
    echo "  $0 sync zalopay-prod ./backend/ /app/"
    echo "  $0 deploy zalopay-prod"
    echo ""
}

# Ghi log
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$timestamp] $message" >> "$LOG_FILE"
}

# Kiểm tra kết nối SSH
check_connection() {
    local host="$1"
    print_step "Kiểm tra kết nối đến $host..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$host" "exit" 2>/dev/null; then
        print_success "Kết nối thành công đến $host"
        log_message "SSH connection to $host: SUCCESS"
        return 0
    else
        print_error "Không thể kết nối đến $host"
        log_message "SSH connection to $host: FAILED"
        return 1
    fi
}

# Kết nối SSH thông thường
connect_ssh() {
    local host="$1"
    
    if [ -z "$host" ]; then
        print_error "Vui lòng cung cấp host để kết nối"
        echo "Cách dùng: $0 connect <host>"
        exit 1
    fi
    
    print_step "Đang kết nối đến $host..."
    log_message "Initiating SSH connection to $host"
    
    ssh -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -o Compression=yes \
        "$host"
}

# Kết nối với autossh (tự động reconnect)
auto_connect_ssh() {
    local host="$1"
    
    if [ -z "$host" ]; then
        print_error "Vui lòng cung cấp host để kết nối"
        echo "Cách dùng: $0 auto-connect <host>"
        exit 1
    fi
    
    if ! command -v autossh &> /dev/null; then
        print_error "autossh chưa được cài đặt. Chạy: ./install-ssh-tools.sh"
        exit 1
    fi
    
    print_step "Đang kết nối với autossh đến $host (tự động reconnect)..."
    log_message "Initiating autossh connection to $host"
    
    autossh -M 0 \
        -o "ServerAliveInterval=30" \
        -o "ServerAliveCountMax=3" \
        -o "ExitOnForwardFailure=yes" \
        -o "Compression=yes" \
        "$host"
}

# Tạo SSH tunnel
create_tunnel() {
    local host="$1"
    local port="$2"
    local local_port="${3:-$port}"
    
    if [ -z "$host" ] || [ -z "$port" ]; then
        print_error "Vui lòng cung cấp host và port"
        echo "Cách dùng: $0 tunnel <host> <port> [local_port]"
        exit 1
    fi
    
    print_step "Tạo tunnel: localhost:$local_port -> $host:$port"
    log_message "Creating SSH tunnel: localhost:$local_port -> $host:$port"
    
    echo -e "${YELLOW}Nhấn Ctrl+C để đóng tunnel${NC}"
    
    ssh -N -L "$local_port:localhost:$port" \
        -o ServerAliveInterval=30 \
        -o ServerAliveCountMax=3 \
        "$host"
}

# Đồng bộ file với rsync
sync_files() {
    local host="$1"
    local src="$2"
    local dst="$3"
    
    if [ -z "$host" ] || [ -z "$src" ] || [ -z "$dst" ]; then
        print_error "Vui lòng cung cấp đủ thông tin"
        echo "Cách dùng: $0 sync <host> <source> <destination>"
        exit 1
    fi
    
    if ! command -v rsync &> /dev/null; then
        print_error "rsync chưa được cài đặt. Chạy: ./install-ssh-tools.sh"
        exit 1
    fi
    
    print_step "Đồng bộ: $src -> $host:$dst"
    log_message "Syncing: $src -> $host:$dst"
    
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'logs' \
        --exclude '*.log' \
        -e "ssh -o Compression=yes" \
        "$src" "$host:$dst"
    
    print_success "Đồng bộ hoàn tất!"
}

# Deploy ứng dụng
deploy_app() {
    local host="$1"
    
    if [ -z "$host" ]; then
        print_error "Vui lòng cung cấp host để deploy"
        echo "Cách dùng: $0 deploy <host>"
        exit 1
    fi
    
    print_step "Bắt đầu deploy lên $host..."
    log_message "Starting deployment to $host"
    
    # Kiểm tra kết nối trước
    if ! check_connection "$host"; then
        exit 1
    fi
    
    # Thực hiện deploy
    echo -e "${YELLOW}Bạn có muốn tiếp tục deploy? (y/n)${NC}"
    read -r confirm
    
    if [ "$confirm" != "y" ]; then
        print_warning "Đã hủy deploy"
        exit 0
    fi
    
    ssh "$host" << DEPLOY_SCRIPT
        cd ${APP_DIR} || exit 1
        
        echo "🔄 Pulling latest changes..."
        git pull origin main
        
        echo "📦 Installing dependencies..."
        if [ -f "package.json" ]; then
            npm ci --production
        elif [ -f "requirements.txt" ]; then
            pip install -r requirements.txt
        fi
        
        echo "🔨 Running database migrations..."
        npm run db:migrate 2>/dev/null || echo "Bỏ qua migrations"
        
        echo "🔄 Restarting application..."
        docker compose -f docker-compose.production.yml up -d --build 2>/dev/null || \
        docker-compose -f docker-compose.production.yml up -d --build 2>/dev/null || \
        echo "Docker không khả dụng, vui lòng restart thủ công"
        
        echo "✅ Deploy completed!"
DEPLOY_SCRIPT
    
    print_success "Deploy hoàn tất trên $host"
    log_message "Deployment to $host completed successfully"
}

# Kiểm tra sức khỏe server
health_check() {
    local host="$1"
    
    if [ -z "$host" ]; then
        print_error "Vui lòng cung cấp host để kiểm tra"
        echo "Cách dùng: $0 health <host>"
        exit 1
    fi
    
    print_step "Kiểm tra sức khỏe server $host..."
    
    # Kiểm tra kết nối SSH
    if ! check_connection "$host"; then
        exit 1
    fi
    
    # Thực hiện kiểm tra
    ssh "$host" << HEALTH_SCRIPT
        echo "📊 Thông tin hệ thống:"
        echo "========================"
        
        echo -e "\n💻 CPU:"
        uptime
        
        echo -e "\n💾 Bộ nhớ:"
        free -h
        
        echo -e "\n💿 Ổ đĩa:"
        df -h /
        
        echo -e "\n🐳 Docker containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker không khả dụng"
        
        echo -e "\n🌐 Network:"
        curl -s -o /dev/null -w "Health endpoint: %{http_code}\n" ${HEALTH_ENDPOINT} 2>/dev/null || echo "API không phản hồi"
HEALTH_SCRIPT
    
    log_message "Health check for $host completed"
}

# Xem logs từ server
view_logs() {
    local host="$1"
    local service="${2:-backend}"
    
    if [ -z "$host" ]; then
        print_error "Vui lòng cung cấp host"
        echo "Cách dùng: $0 logs <host> [service]"
        exit 1
    fi
    
    print_step "Xem logs từ $host (service: $service)..."
    
    ssh "$host" "docker logs ${CONTAINER_PREFIX}-$service-prod -f --tail 100" 2>/dev/null || \
    ssh "$host" "tail -f ${APP_DIR}/logs/$service.log" 2>/dev/null || \
    ssh "$host" "journalctl -u $service -f"
}

# Quản lý SSH keys
manage_keys() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  🔑 Quản lý SSH Keys                                         ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "1. Tạo SSH key mới"
    echo "2. Liệt kê SSH keys"
    echo "3. Sao chép public key lên server"
    echo "4. Kiểm tra SSH agent"
    echo "5. Quay lại"
    echo ""
    echo -n "Chọn một tùy chọn: "
    read -r choice
    
    case "$choice" in
        1)
            print_step "Tạo SSH key mới..."
            print_warning "⚠️ Bạn nên đặt passphrase để bảo vệ private key!"
            ssh-keygen -t ed25519 -C "zalopay-$(date +%Y%m%d)"
            ;;
        2)
            print_step "Danh sách SSH keys:"
            ls -la ~/.ssh/*.pub 2>/dev/null || echo "Không có SSH key nào"
            ;;
        3)
            echo -n "Nhập host đích: "
            read -r target_host
            ssh-copy-id "$target_host"
            ;;
        4)
            print_step "Kiểm tra SSH agent..."
            ssh-add -l 2>/dev/null || echo "SSH agent chưa chạy hoặc không có key nào"
            ;;
        5)
            exit 0
            ;;
        *)
            print_error "Lựa chọn không hợp lệ"
            ;;
    esac
}

# Cấu hình kết nối
configure() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  ⚙️ Cấu hình SSH Connection                                   ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -n "Tên host (ví dụ: zalopay-prod): "
    read -r host_name
    
    echo -n "Địa chỉ IP hoặc hostname: "
    read -r host_address
    
    echo -n "Tên người dùng (mặc định: deploy): "
    read -r host_user
    host_user="${host_user:-deploy}"
    
    echo -n "Port SSH (mặc định: 22): "
    read -r host_port
    host_port="${host_port:-22}"
    
    # Thêm vào SSH config
    SSH_CONFIG="$HOME/.ssh/config"
    
    cat >> "$SSH_CONFIG" << EOF

# Cấu hình cho $host_name (được tạo tự động)
Host $host_name
    HostName $host_address
    User $host_user
    Port $host_port
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
EOF
    
    print_success "Đã thêm cấu hình cho $host_name vào $SSH_CONFIG"
    echo ""
    echo "Bây giờ bạn có thể kết nối bằng lệnh: ssh $host_name"
}

# Main
main() {
    local command="${1:-help}"
    shift 2>/dev/null || true
    
    case "$command" in
        connect)
            connect_ssh "$@"
            ;;
        auto-connect)
            auto_connect_ssh "$@"
            ;;
        tunnel)
            create_tunnel "$@"
            ;;
        sync)
            sync_files "$@"
            ;;
        deploy)
            deploy_app "$@"
            ;;
        health)
            health_check "$@"
            ;;
        logs)
            view_logs "$@"
            ;;
        keys)
            manage_keys
            ;;
        config)
            configure
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Lệnh không hợp lệ: $command"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
