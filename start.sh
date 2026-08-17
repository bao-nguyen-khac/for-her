#!/bin/bash

# ==============================================================================
# Script khởi động đồng thời 3 services: Backend, Admin và Frontend
# ==============================================================================

# Lấy thư mục gốc chứa script
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Định nghĩa màu sắc hiển thị cho log
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}🚀 Đang khởi động toàn bộ services dự án Forever...${NC}"
echo -e "${CYAN}====================================================${NC}"

# Hàm kiểm tra và cài đặt dependencies nếu chưa có node_modules
check_dependencies() {
    local service_dir=$1
    local service_name=$2

    if [ ! -d "$PROJECT_DIR/$service_dir/node_modules" ]; then
        echo -e "${YELLOW}⚠️  Chưa tìm thấy node_modules trong [${service_name}]. Đang tự động chạy npm install...${NC}"
        (cd "$PROJECT_DIR/$service_dir" && npm install)
    fi
}

check_dependencies "backend" "Backend"
check_dependencies "admin" "Admin"
check_dependencies "frontend" "Frontend"

# Khai báo mảng lưu PID của các tiến trình con
PIDS=()

# Hàm dọn dẹp khi nhấn Ctrl+C hoặc tắt script
cleanup() {
    echo ""
    echo -e "${RED}🛑 Đang dừng tất cả các services...${NC}"
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
        fi
    done
    wait 2>/dev/null
    echo -e "${GREEN}✅ Đã tắt tất cả services thành công.${NC}"
    exit 0
}

# Bắt tín hiệu ngắt (Ctrl+C, SIGTERM, EXIT)
trap cleanup SIGINT SIGTERM

# 1. Khởi động Backend
echo -e "${GREEN}▶️  Đang chạy Backend (Port: 4000)...${NC}"
(cd "$PROJECT_DIR/backend" && npm run dev) &
PIDS+=($!)

# 2. Khởi động Admin
echo -e "${BLUE}▶️  Đang chạy Admin...${NC}"
(cd "$PROJECT_DIR/admin" && npm run dev) &
PIDS+=($!)

# 3. Khởi động Frontend
echo -e "${YELLOW}▶️  Đang chạy Frontend...${NC}"
(cd "$PROJECT_DIR/frontend" && npm run dev) &
PIDS+=($!)

echo -e "${CYAN}----------------------------------------------------${NC}"
echo -e "${GREEN}✨ Tất cả 3 services đã được khởi động!${NC}"
echo -e "${CYAN}👉 Nhấn [Ctrl + C] để dừng toàn bộ services cùng lúc.${NC}"
echo -e "${CYAN}----------------------------------------------------${NC}"

# Đợi tất cả các tiến trình chạy ngầm
wait "${PIDS[@]}"
