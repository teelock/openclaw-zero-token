#!/bin/bash
# OpenClaw Gateway service launcher
# Compatible with macOS / Linux (incl. Deepin) / Windows (Git Bash / WSL)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_DIR="$SCRIPT_DIR/.openclaw-upstream-state"
CONFIG_FILE="$STATE_DIR/openclaw.json"
PID_FILE="$SCRIPT_DIR/.gateway.pid"
PORT=3001

# Log file prefix (distinguish different instances)
LOG_PREFIX="openclaw-upstream"

# ─── Environment Detection ───────────────────────────────────
detect_os() {
  case "$OSTYPE" in
    darwin*)  echo "mac" ;;
    msys*|cygwin*|mingw*) echo "win" ;;
    *)
      if grep -qi microsoft /proc/version 2>/dev/null; then
        echo "wsl"
      else
        echo "linux"
      fi
      ;;
  esac
}

detect_node() {
  if command -v node >/dev/null 2>&1; then
    echo "$(command -v node)"
    return
  fi
  for p in \
    "$PROGRAMFILES/nodejs/node.exe" \
    "$LOCALAPPDATA/Programs/nodejs/node.exe"; do
    [ -f "$p" ] && echo "$p" && return
  done
  echo ""
}

# Find PID occupying a given port (cross-platform)
port_pid() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti:"$port" 2>/dev/null
  elif command -v ss >/dev/null 2>&1; then
    ss -tlnp 2>/dev/null | awk -v p="$port" '$4 ~ ":"p"$" {match($6,/pid=([0-9]+)/,a); if(a[1]) print a[1]}'
  elif command -v netstat >/dev/null 2>&1; then
    # Git Bash / Windows netstat fallback
    netstat -ano 2>/dev/null | awk -v p="$port" '$2 ~ ":"p"$" && $4=="LISTENING" {print $5; exit}'
  fi
}

# Open browser (cross-platform)
open_browser() {
  local url=$1
  case "$OS" in
    mac) open "$url" ;;
    win) start "" "$url" 2>/dev/null || cmd.exe /c start "" "$url" 2>/dev/null ;;
    wsl) cmd.exe /c start "" "$url" 2>/dev/null ;;
    linux)
      if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$url" 2>/dev/null &
      else
        echo "Please open manually in browser: $url"
      fi
      ;;
  esac
}

# Temp log path (Windows may not have /tmp)
tmp_log() {
  if [ -d /tmp ]; then
    echo "/tmp/openclaw-upstream-gateway.log"
  else
    echo "$SCRIPT_DIR/logs/openclaw-upstream-gateway.log"
  fi
}

OS=$(detect_os)
NODE=$(detect_node)
LOG_FILE="$SCRIPT_DIR/logs/openclaw-upstream.log"
TMP_LOG=$(tmp_log)

if [ -z "$NODE" ]; then
  echo "✗ Node not found, please install Node.js: https://nodejs.org"
  exit 1
fi

# ─── Initialization ───────────────────────────────────────────
mkdir -p "$STATE_DIR"
mkdir -p "$SCRIPT_DIR/logs"

EXAMPLE_CONFIG="$SCRIPT_DIR/.openclaw-state.example/openclaw.json"
if [ ! -f "$CONFIG_FILE" ]; then
  if [ -f "$EXAMPLE_CONFIG" ]; then
    cp "$EXAMPLE_CONFIG" "$CONFIG_FILE"
    echo "Copied example config: $EXAMPLE_CONFIG -> $CONFIG_FILE"
  else
    echo '{}' > "$CONFIG_FILE"
    echo "Created empty config: $CONFIG_FILE (recommend copying from .openclaw-state.example/openclaw.json)"
  fi
fi

# Read token from config file, fallback to environment variable
GATEWAY_TOKEN=$(jq -r '.gateway.auth.token // empty' "$CONFIG_FILE" 2>/dev/null)
if [ -z "$GATEWAY_TOKEN" ]; then
  GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-}"
fi

# ─── Functions ────────────────────────────────────────────────
stop_gateway() {
  if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
      echo "Stopping old process (PID: $OLD_PID)..."
      kill "$OLD_PID" 2>/dev/null
      sleep 1
      if kill -0 "$OLD_PID" 2>/dev/null; then
        kill -9 "$OLD_PID" 2>/dev/null
      fi
    fi
    rm -f "$PID_FILE"
  fi

  PORT_PID=$(port_pid "$PORT")
  if [ -n "$PORT_PID" ]; then
    echo "Stopping process occupying port $PORT (PID: $PORT_PID)..."
    kill "$PORT_PID" 2>/dev/null
    sleep 1
  fi
}

start_gateway() {
  export OPENCLAW_CONFIG_PATH="$CONFIG_FILE"
  export OPENCLAW_STATE_DIR="$STATE_DIR"
  export OPENCLAW_GATEWAY_PORT="$PORT"

  echo "System: $OS  |  Node: $($NODE --version 2>/dev/null)"
  echo "Starting Gateway service..."
  echo "Config: $OPENCLAW_CONFIG_PATH"
  echo "State dir: $OPENCLAW_STATE_DIR"
  echo "Log file: $TMP_LOG"
  echo "Port: $PORT"
  echo ""

  nohup "$NODE" "$SCRIPT_DIR/openclaw.mjs" gateway --port "$PORT" > "$TMP_LOG" 2>&1 &
  GATEWAY_PID=$!
  echo "$GATEWAY_PID" > "$PID_FILE"

  echo "Waiting for Gateway to be ready..."
  WEBUI_READY=0
  i=0
  while [ $i -lt 30 ]; do
    i=$((i + 1))
    if curl -s -o /dev/null --connect-timeout 1 "http://127.0.0.1:$PORT/" 2>/dev/null; then
      echo "Gateway ready (${i}s)"
      WEBUI_READY=1
      break
    fi
    if ! kill -0 $GATEWAY_PID 2>/dev/null; then
      echo "Gateway process exited, startup failed"
      cat "$TMP_LOG"
      rm -f "$PID_FILE"
      exit 1
    fi
    sleep 1
  done

  if kill -0 $GATEWAY_PID 2>/dev/null; then
    if [ "$WEBUI_READY" -eq 0 ]; then
      echo "⚠ curl check failed, Gateway may not be ready yet, please open Web UI manually later"
    fi
    WEBUI_URL="http://127.0.0.1:$PORT/#token=${GATEWAY_TOKEN}"
    echo "Gateway service started (PID: $GATEWAY_PID)"
    echo "Web UI: $WEBUI_URL"
    if [ "$WEBUI_READY" -eq 1 ]; then
      echo "Opening browser..."
      open_browser "$WEBUI_URL"
    else
      echo "Please open the above URL manually in your browser"
    fi
  else
    echo "Gateway service failed to start, check logs:"
    cat "$TMP_LOG"
    rm -f "$PID_FILE"
    exit 1
  fi
}

update_cookie() {
  echo "Updating Claude Web Cookie..."

  if [ -z "$2" ]; then
    echo "Error: please provide the full cookie string"
    echo "Usage: $0 update-cookie \"full-cookie-string\""
    echo ""
    echo "How to get cookies from browser:"
    echo "1. Open https://claude.ai"
    echo "2. Press F12 to open DevTools"
    echo "3. Switch to Network tab"
    echo "4. Send a message"
    echo "5. Find the completion request"
    echo "6. Copy the full cookie value from Request Headers"
    exit 1
  fi

  COOKIE_STRING="$2"
  AUTH_FILE="$STATE_DIR/agents/main/agent/auth-profiles.json"

  SESSION_KEY=$(echo "$COOKIE_STRING" | grep -oP 'sessionKey=\K[^;]+' || echo "")

  if [ -z "$SESSION_KEY" ]; then
    echo "Error: sessionKey not found in cookie"
    exit 1
  fi

  JSON_DATA=$(cat <<EOF
{
  "sessionKey": "$SESSION_KEY",
  "cookie": "$COOKIE_STRING",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
EOF
)

  if [ -f "$AUTH_FILE" ]; then
    jq --arg key "$JSON_DATA" '.profiles["claude-web:default"].key = $key' "$AUTH_FILE" > "$AUTH_FILE.tmp" && mv "$AUTH_FILE.tmp" "$AUTH_FILE"
    echo "✓ Claude Web cookie updated"
    echo "✓ SessionKey: ${SESSION_KEY:0:50}..."
    echo ""
    echo "Now restart the service:"
    echo "  $0 restart"
  else
    echo "Error: auth-profiles.json does not exist, please run ./onboard.sh first"
    exit 1
  fi
}

# ─── Entry Point ──────────────────────────────────────────────
case "${1:-start}" in
  start)
    stop_gateway
    start_gateway
    ;;
  stop)
    stop_gateway
    echo "Gateway service stopped"
    ;;
  restart)
    stop_gateway
    start_gateway
    ;;
  status)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        echo "Gateway service running (PID: $PID)"
        echo "Web UI: http://127.0.0.1:$PORT/#token=${GATEWAY_TOKEN}"
      else
        echo "Gateway service not running (PID file exists but process exited)"
      fi
    else
      PORT_PID=$(port_pid "$PORT")
      if [ -n "$PORT_PID" ]; then
        echo "Port $PORT is occupied by process $PORT_PID, but not started by this script"
      else
        echo "Gateway service not running"
      fi
    fi
    ;;
  update-cookie)
    update_cookie "$@"
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|update-cookie}"
    echo ""
    echo "Commands:"
    echo "  start         - Start Gateway service"
    echo "  stop          - Stop Gateway service"
    echo "  restart       - Restart Gateway service"
    echo "  status        - Check service status"
    echo "  update-cookie - Update Claude Web cookie"
    echo ""
    echo "Example:"
    echo "  $0 update-cookie \"sessionKey=sk-ant-...; anthropic-device-id=...\""
    exit 1
    ;;
esac
