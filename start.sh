#!/bin/bash
# OpenClaw Zero-Token 一键启动脚本
# 包含：编译 -> 启动 Chrome 调试 -> 自动打开平台 -> 授权 -> 启动服务 -> 打开 Web UI

set -e

echo "=========================================="
echo "  OpenClaw Zero-Token 一键启动"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "${BLUE}[步骤 $1]${NC} $2"; }
success() { echo -e "${GREEN}[成功]${NC} $1"; }
warn() { echo -e "${YELLOW}[警告]${NC} $1"; }
error() { echo -e "${RED}[错误]${NC} $1"; exit 1; }

check_chrome() { pgrep -f "chrome.*remote-debugging-port=9222" > /dev/null 2>&1; }
check_page() { curl -s http://127.0.0.1:9222/json/list 2>/dev/null | grep -q "$1"; }

# 平台列表
PLATFORMS=(
    "claude:Claude:https://claude.ai/new"
    "chatgpt:ChatGPT:https://chatgpt.com"
    "deepseek:DeepSeek:https://chat.deepseek.com"
    "doubao:Doubao:https://www.doubao.com/chat/"
    "qwen:Qwen:https://chat.qwen.ai"
    "kimi:Kimi:https://www.kimi.com"
    "gemini:Gemini:https://gemini.google.com/app"
    "grok:Grok:https://grok.com"
    "glm:GLM:https://chatglm.cn"
)

# ==========================================
# 主流程
# ==========================================

# 1. 编译
step "1/6" "编译 OpenClaw..."
pnpm build && success "编译完成" || error "编译失败"

# 2. 启动 Chrome
step "2/6" "启动 Chrome 调试模式..."
if check_chrome; then
    warn "Chrome 已在运行"
else
    bash start-chrome-debug.sh &
    for i in {1..15}; do
        curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1 && break
        sleep 1
    done
    success "Chrome 已启动"
fi

# 3. 打开平台页面
step "3/6" "打开平台页面..."
for platform in "${PLATFORMS[@]}"; do
    IFS=':' read -r id name url <<< "$platform"
    if check_page "$url"; then
        echo "  ✓ $name 已打开"
    else
        echo "  → 打开 $name"
        osascript -e "tell application \"Google Chrome\" to open location \"$url\"" 2>/dev/null || true
        sleep 1
    fi
done
success "平台页面就绪"

# 4. 提示用户登录
echo ""
echo -e "${YELLOW}==========================================${NC}"
echo -e "${YELLOW}  请在浏览器中登录需要使用的平台${NC}"
echo -e "${YELLOW}  登录完成后，按回车继续...${NC}"
echo -e "${YELLOW}==========================================${NC}"
read

# 5. Web 授权
step "5/6" "进行 Web 授权..."
echo "现在运行授权命令，请选择要授权的平台："
echo ""
echo "  1. Claude Web"
echo "  2. ChatGPT Web"
echo "  3. DeepSeek Web"
echo "  4. Doubao Web"
echo "  5. Gemini Web"
echo "  6. GLM Web (国内)"
echo "  7. GLM Web (国际)"
echo "  8. Grok Web"
echo "  9. Kimi Web"
echo " 10. Qwen Web (阿里国内)"
echo " 11. Qwen Web (阿里国际)"
echo ""
echo "输入数字选择（如 3），或输入 a 授权所有"
echo ""

# 运行授权命令（交互式）
pnpm openclaw webauth

# 6. 启动服务
step "6/6" "启动服务..."
if lsof -i:18789 > /dev/null 2>&1; then
    warn "服务已在运行"
else
    pnpm openclaw gateway run --bind loopback --port 18789 --force &
    sleep 3
    success "服务已启动: http://127.0.0.1:18789"
fi

# 打开 Web UI
open http://127.0.0.1:18789 2>/dev/null || xdg-open http://127.0.0.1:18789 2>/dev/null || echo "请手动打开: http://127.0.0.1:18789"

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  启动完成！${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "服务地址: http://127.0.0.1:18789"
