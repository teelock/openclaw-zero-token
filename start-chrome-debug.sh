#!/bin/bash
# Launch Chrome in debug mode (for OpenClaw connection)
# Compatible with macOS / Linux (incl. Deepin) / Windows (Git Bash / WSL)
# Single instance: kills existing debug Chrome before restarting

echo "=========================================="
echo "  Launch Chrome Debug Mode"
echo "=========================================="
echo ""

# ─── Environment Detection ───────────────────────────────────
detect_os() {
  # Using uname for more reliable detection
  case "$(uname -s)" in
    Darwin*)  echo "mac" ;;
    MINGW*|MSYS*|CYGWIN*) echo "win" ;;
    *)
      if grep -qi microsoft /proc/version 2>/dev/null; then
        echo "wsl"
      else
        echo "linux"
      fi
      ;;
  esac
}

detect_chrome() {
  # Linux: check paths in priority order
  local linux_paths=(
    "/opt/apps/cn.google.chrome-pre/files/google/chrome/google-chrome"  # Deepin
    "/opt/google/chrome/google-chrome"
    "/usr/bin/google-chrome"
    "/usr/bin/google-chrome-stable"
    "/usr/bin/chromium"
    "/usr/bin/chromium-browser"
    "/snap/bin/chromium"
  )
  local mac_paths=(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    "/Applications/Chromium.app/Contents/MacOS/Chromium"
  )
  local win_paths=(
    "$PROGRAMFILES/Google/Chrome/Application/chrome.exe"
    "$PROGRAMFILES (x86)/Google/Chrome/Application/chrome.exe"
    "$LOCALAPPDATA/Google/Chrome/Application/chrome.exe"
    "$PROGRAMFILES/Chromium/Application/chrome.exe"
  )

  case "$OS" in
    mac)
      # macOS: use open command for Chrome.app
      if [ -d "/Applications/Google Chrome.app" ]; then
        echo "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        return
      fi
      if [ -d "/Applications/Chromium.app" ]; then
        echo "/Applications/Chromium.app/Contents/MacOS/Chromium"
        return
      fi
      # Also try command-based lookup
      command -v google-chrome >/dev/null 2>&1 && echo "google-chrome" && return
      ;;
    win)  # Pure Windows (Git Bash) uses Windows paths
      for p in "${win_paths[@]}"; do
        [ -f "$p" ] && echo "$p" && return
      done
      ;;
    wsl|linux)  # WSL and Linux share the same paths
      for p in "${linux_paths[@]}"; do
        [ -f "$p" ] && echo "$p" && return
      done
      # Fallback to command lookup
      for cmd in google-chrome google-chrome-stable chromium chromium-browser; do
        command -v "$cmd" >/dev/null 2>&1 && echo "$cmd" && return
      done
      ;;
  esac
  echo ""
}

detect_user_data_dir() {
  case "$OS" in
    mac)  echo "$HOME/Library/Application Support/Chrome-OpenClaw-Debug" ;;
    win)  echo "$LOCALAPPDATA/Chrome-OpenClaw-Debug" ;;
    wsl)  echo "$HOME/.config/chrome-openclaw-debug" ;;
    *)    echo "$HOME/.config/chrome-openclaw-debug" ;;
  esac
}

OS=$(detect_os)
CHROME_PATH=$(detect_chrome)
USER_DATA_DIR=$(detect_user_data_dir)

echo "System: $OS"

if [ -z "$CHROME_PATH" ]; then
  echo "✗ Chrome / Chromium not found, please install first"
  echo ""
  case "$OS" in
    linux) echo "  Ubuntu/Debian: sudo apt install google-chrome-stable" ;;
    mac)   echo "  Download: https://www.google.com/chrome/" ;;
    win)   echo "  Download: https://www.google.com/chrome/" ;;
  esac
  exit 1
fi

echo "Chrome: $CHROME_PATH"
echo "User data dir: $USER_DATA_DIR"
echo ""

# ─── Single Instance: Kill existing debug Chrome ─────────────
if pgrep -f "chrome.*remote-debugging-port=9222" > /dev/null 2>&1; then
  echo "Existing debug Chrome detected, shutting down..."
  pkill -f "chrome.*remote-debugging-port=9222" 2>/dev/null
  sleep 2

  if pgrep -f "chrome.*remote-debugging-port=9222" > /dev/null 2>&1; then
    echo "Graceful shutdown failed, force killing..."
    pkill -9 -f "chrome.*remote-debugging-port=9222" 2>/dev/null
    sleep 1
  fi

  if pgrep -f "chrome.*remote-debugging-port=9222" > /dev/null 2>&1; then
    echo "✗ Cannot kill existing Chrome, please run manually: pkill -9 -f 'chrome.*remote-debugging-port=9222'"
    exit 1
  fi
  echo "✓ Stopped"
  echo ""
fi

# ─── Launch Chrome ────────────────────────────────────────────
TMP_LOG="/tmp/chrome-debug.log"
[ ! -d /tmp ] && TMP_LOG="$HOME/chrome-debug.log"

echo "Starting Chrome in debug mode..."
echo "Port: 9222"
echo ""

"$CHROME_PATH" \
  --remote-debugging-port=9222 \
  --user-data-dir="$USER_DATA_DIR" \
  --no-first-run \
  --no-default-browser-check \
  --disable-background-networking \
  --disable-sync \
  --disable-translate \
  --disable-features=TranslateUI \
  --remote-allow-origins=* \
  > "$TMP_LOG" 2>&1 &

CHROME_PID=$!
echo "Chrome log: $TMP_LOG"

# ─── Wait for Startup ────────────────────────────────────────
echo "Waiting for Chrome to start..."
for i in {1..15}; do
  if curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
    break
  fi
  echo -n "."
  sleep 1
done
echo ""
echo ""

# ─── Check Result ─────────────────────────────────────────────
if curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
  VERSION_INFO=$(curl -s http://127.0.0.1:9222/json/version | jq -r '.Browser' 2>/dev/null || echo "unknown version")

  echo "✓ Chrome debug mode started successfully!"
  echo ""
  echo "Chrome PID: $CHROME_PID"
  echo "Chrome version: $VERSION_INFO"
  echo "Debug port: http://127.0.0.1:9222"
  echo "User data dir: $USER_DATA_DIR"
  echo ""
  echo "Opening web platform login pages (for authorization)..."

  WEB_URLS=(
    "https://claude.ai/new"
    "https://chatgpt.com"
    "https://www.doubao.com/chat/"
    "https://chat.qwen.ai"
    "https://www.kimi.com"
    "https://gemini.google.com/app"
    "https://grok.com"
    "https://chat.deepseek.com/"
    "https://chatglm.cn"
    "https://chat.z.ai/"
    "https://manus.im/app"
  )
  for url in "${WEB_URLS[@]}"; do
    "$CHROME_PATH" --remote-debugging-port=9222 --user-data-dir="$USER_DATA_DIR" "$url" > /dev/null 2>&1 &
    sleep 0.5
  done

  echo "✓ Opened: Claude, ChatGPT, Doubao, Qwen, Kimi, Gemini, Grok, GLM (DeepSeek login in step 5)"
  echo ""
  echo "=========================================="
  echo "Next Steps:"
  echo "=========================================="
  echo "1. Log in to each platform in the opened tabs"
  echo "2. Ensure config has browser.attachOnly=true and browser.cdpUrl=http://127.0.0.1:9222"
  echo "3. Run ./onboard.sh webauth to authorize platforms (reuses this browser)"
  echo ""
  echo "To stop debug mode:"
  echo "  pkill -f 'chrome.*remote-debugging-port=9222'"
  echo "=========================================="
else
  echo "✗ Chrome failed to start"
  echo ""
  echo "Please check:"
  echo "  1. Chrome path: $CHROME_PATH"
  echo "  2. Port 9222 in use: lsof -i:9222"
  echo "  3. User data dir permissions: $USER_DATA_DIR"
  echo "  4. Startup log: $TMP_LOG"
  echo ""
  echo "Try starting manually:"
  echo "  \"$CHROME_PATH\" --remote-debugging-port=9222 --user-data-dir=\"$USER_DATA_DIR\""
  exit 1
fi
