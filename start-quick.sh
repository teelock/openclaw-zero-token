#!/bin/bash
# OpenClaw Zero-Token 快速启动（跳过编译和授权）
# 仅启动服务和 Web UI

set -e

echo "=========================================="
echo "  OpenClaw 快速启动"
echo "=========================================="
echo ""

# 检查 Chrome
if ! pgrep -f "chrome.*remote-debugging-port=9222" > /dev/null 2>&1; then
    echo "启动 Chrome 调试模式..."
    nohup bash start-chrome-debug.sh > /tmp/openclaw-chrome.log 2>&1 &
    sleep 5
fi

# 检查服务
if lsof -i:18789 > /dev/null 2>&1; then
    echo "服务已在运行"
else
    echo "启动服务..."
    nohup pnpm openclaw gateway run --bind loopback --port 18789 --force > /tmp/openclaw-gateway.log 2>&1 &
    sleep 3
fi

# 打开 UI
open http://127.0.0.1:18789

echo "完成！访问 http://127.0.0.1:18789"
