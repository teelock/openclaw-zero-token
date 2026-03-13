#!/bin/bash
# setup-scrapling.sh - 安装 Scrapling MCP 集成
#
# 用法: ./scripts/setup-scrapling.sh

set -e

echo "=== Scrapling MCP 安装脚本 ==="
echo

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "错误: 需要 Python 3"
    exit 1
fi

echo "[1/5] 安装 Scrapling 及依赖..."
pip3 install scrapling mcp curl_cffi browserforge msgspec patchright markdownify --quiet

echo "[2/5] 检查 acpx 插件依赖..."
if [ -d "extensions/acpx" ]; then
    cd extensions/acpx
    pnpm install --silent
    cd ../..
    echo "  - acpx 依赖已安装"
else
    echo "  警告: 未找到 extensions/acpx 目录，跳过"
fi

echo "[3/5] 配置 OpenClaw MCP Server..."

# 配置文件路径
CONFIG_FILE="$HOME/.openclaw/openclaw.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "错误: 未找到 OpenClaw 配置文件 ($CONFIG_FILE)"
    exit 1
fi

# 检查是否已配置 scrapling
if grep -q '"scrapling"' "$CONFIG_FILE" 2>/dev/null; then
    echo "  - Scrapling MCP 已配置"
else
    # 使用 Python 添加配置
    python3 << 'PYTHON_SCRIPT'
import json
import os

config_file = os.path.expanduser("~/.openclaw/openclaw.json")

with open(config_file, "r") as f:
    config = json.load(f)

# 确保 plugins.entries 存在
if "plugins" not in config:
    config["plugins"] = {"entries": {}}
if "entries" not in config["plugins"]:
    config["plugins"]["entries"] = {}

# 添加 acpx 配置
config["plugins"]["entries"]["acpx"] = {
    "enabled": True,
    "config": {
        "mcpServers": {
            "scrapling": {
                "command": "scrapling",
                "args": ["mcp"]
            }
        }
    }
}

# 确保 browser.profiles.chrome.color 存在
if "browser" not in config:
    config["browser"] = {"profiles": {"chrome": {}}}
elif "profiles" not in config["browser"]:
    config["browser"]["profiles"] = {"chrome": {}}
elif "chrome" not in config["browser"]["profiles"]:
    config["browser"]["profiles"]["chrome"] = {}

if "color" not in config["browser"]["profiles"]["chrome"]:
    config["browser"]["profiles"]["chrome"]["color"] = "007AFF"

with open(config_file, "w") as f:
    json.dump(config, f, indent=2)

print("  - 配置已更新")
PYTHON_SCRIPT
fi

echo "[4/5] 验证安装..."
if command -v scrapling &> /dev/null; then
    echo "  - scrapling 命令可用"
else
    echo "  错误: scrapling 命令未找到"
    exit 1
fi

echo "[5/5] 完成!"
echo
echo "=== 下一步 ==="
echo "1. 重启 OpenClaw Gateway:"
echo "   pnpm openclaw gateway run --bind loopback --port 18789 --force"
echo
echo "2. 在 OpenClaw 中使用自然语言调用:"
echo '   "使用 scrapling 获取 https://example.com"'
echo '   "用 scrapling 抓取 https://x.com/..."'
echo
echo "=== 可用工具 ==="
echo "  - get: 基本 HTTP 请求"
echo "  - fetch: Playwright 浏览器抓取"
echo "  - stealthy_fetch: Cloudflare 绕过抓取"
echo
