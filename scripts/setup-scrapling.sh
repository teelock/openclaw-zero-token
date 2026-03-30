#!/bin/bash
# setup-scrapling.sh - Install Scrapling MCP integration
#
# Usage: ./scripts/setup-scrapling.sh

set -e

echo "=== Scrapling MCP Setup Script ==="
echo

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required"
    exit 1
fi

echo "[1/5] Installing Scrapling and dependencies..."
pip3 install scrapling mcp curl_cffi browserforge msgspec patchright markdownify --quiet

echo "[2/5] Checking acpx plugin dependencies..."
if [ -d "extensions/acpx" ]; then
    cd extensions/acpx
    pnpm install --silent
    cd ../..
    echo "  - acpx dependencies installed"
else
    echo "  Warning: extensions/acpx directory not found, skipping"
fi

echo "[3/5] Configuring OpenClaw MCP Server..."

# Config file path
CONFIG_FILE="$HOME/.openclaw/openclaw.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: OpenClaw config file not found ($CONFIG_FILE)"
    exit 1
fi

# Check if scrapling is already configured
if grep -q '"scrapling"' "$CONFIG_FILE" 2>/dev/null; then
    echo "  - Scrapling MCP already configured"
else
    # Use Python to add config
    python3 << 'PYTHON_SCRIPT'
import json
import os

config_file = os.path.expanduser("~/.openclaw/openclaw.json")

with open(config_file, "r") as f:
    config = json.load(f)

# Ensure plugins.entries exists
if "plugins" not in config:
    config["plugins"] = {"entries": {}}
if "entries" not in config["plugins"]:
    config["plugins"]["entries"] = {}

# Add acpx config
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

# Ensure browser.profiles.chrome.color exists
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

print("  - Config updated")
PYTHON_SCRIPT
fi

echo "[4/5] Verifying installation..."
if command -v scrapling &> /dev/null; then
    echo "  - scrapling command available"
else
    echo "  Error: scrapling command not found"
    exit 1
fi

echo "[5/5] Done!"
echo
echo "=== Next Steps ==="
echo "1. Restart OpenClaw Gateway:"
echo "   pnpm openclaw gateway run --bind loopback --port 18789 --force"
echo
echo "2. Use natural language in OpenClaw to invoke:"
echo '   "Use scrapling to fetch https://example.com"'
echo '   "Scrape https://x.com/... with scrapling"'
echo
echo "=== Available Tools ==="
echo "  - get: Basic HTTP request"
echo "  - fetch: Playwright browser scraping"
echo "  - stealthy_fetch: Cloudflare bypass scraping"
echo
