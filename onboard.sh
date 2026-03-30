#!/bin/bash
# OpenClaw onboard wizard launcher
# Supports official onboard and webauth (web model authorization)
# Compatible with macOS / Linux (incl. Deepin) / Windows (Git Bash / WSL)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_DIR="$SCRIPT_DIR/.openclaw-upstream-state"
CONFIG_FILE="$STATE_DIR/openclaw.json"

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
  # Common Windows paths
  for p in \
    "$PROGRAMFILES/nodejs/node.exe" \
    "$LOCALAPPDATA/Programs/nodejs/node.exe"; do
    [ -f "$p" ] && echo "$p" && return
  done
  echo ""
}

OS=$(detect_os)
NODE=$(detect_node)

if [ -z "$NODE" ]; then
  echo "✗ Node not found, please install Node.js: https://nodejs.org"
  exit 1
fi

echo "System: $OS  |  Node: $($NODE --version 2>/dev/null)"

# ─── Initialize Directory and Config ─────────────────────────
mkdir -p "$STATE_DIR"

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

export OPENCLAW_CONFIG_PATH="$CONFIG_FILE"
export OPENCLAW_STATE_DIR="$STATE_DIR"
export OPENCLAW_GATEWAY_PORT=3001

echo "Config: $OPENCLAW_CONFIG_PATH"
echo "State dir: $OPENCLAW_STATE_DIR"
echo "Port: $OPENCLAW_GATEWAY_PORT"
echo ""

# ─── Help ─────────────────────────────────────────────────────
show_help() {
  echo "Usage: $0 [command] [options]"
  echo ""
  echo "Commands:"
  echo "  onboard         Launch official onboarding wizard (port, token, API key, etc.)"
  echo "  webauth         Launch web model authorization wizard (Claude, ChatGPT, DeepSeek, etc.)"
  echo "  configure       Interactive configuration wizard"
  echo "  gateway         Start Gateway service"
  echo ""
  echo "Options:"
  echo "  -h, --help      Show help"
  echo ""
  echo "Examples:"
  echo "  $0                  # Show help"
  echo "  $0 onboard          # Official onboarding"
  echo "  $0 webauth          # Web model authorization"
  echo "  $0 configure       # Interactive configuration"
}

# ─── Run ──────────────────────────────────────────────────────
case "${1:-}" in
  -h|--help)
    show_help
    ;;
  webauth)
    echo "Starting web model authorization wizard..."
    echo ""
    echo "⚠️  Note: Make sure Chrome debug mode is running (./start-chrome-debug.sh)"
    echo ""
    "$NODE" "$SCRIPT_DIR/openclaw.mjs" onboard webauth
    ;;
  onboard)
    echo "Starting official onboard wizard..."
    "$NODE" "$SCRIPT_DIR/openclaw.mjs" onboard "${@:2}"
    ;;
  configure)
    echo "Starting configuration wizard..."
    "$NODE" "$SCRIPT_DIR/openclaw.mjs" configure "${@:2}"
    ;;
  gateway)
    echo "Starting Gateway..."
    "$NODE" "$SCRIPT_DIR/openclaw.mjs" gateway "${@:2}"
    ;;
  "")
    show_help
    ;;
  *)
    "$NODE" "$SCRIPT_DIR/openclaw.mjs" "$@"
    ;;
esac
