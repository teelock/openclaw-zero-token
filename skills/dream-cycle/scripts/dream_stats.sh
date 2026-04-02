#!/usr/bin/env bash
# dream_stats.sh — Gather memory file stats for the dream cycle.
# Usage: bash dream_stats.sh [workspace_dir]
#
# workspace_dir defaults to ~/.openclaw/workspace

set -euo pipefail

WORKSPACE="${1:-${OPENCLAW_WORKSPACE:-$HOME/.openclaw/workspace}}"

echo "Dream Cycle Stats"
echo "================="
echo "Workspace: $WORKSPACE"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

file_size() {
  local f="$1"
  if [ -f "$f" ]; then
    wc -c < "$f" | tr -d ' '
  else
    echo "0"
  fi
}

budget_check() {
  local name="$1" size="$2" budget="$3"
  if [ "$size" -eq 0 ]; then
    echo "$name: not found"
  elif [ "$size" -le "$budget" ]; then
    echo "$name: ${size} bytes (ok, budget ${budget})"
  else
    local over=$((size - budget))
    echo "$name: ${size} bytes (OVER budget by ${over} bytes, budget ${budget})"
  fi
}

echo "--- Tier 1 Files ---"
agents_size=$(file_size "$WORKSPACE/AGENTS.md")
memory_size=$(file_size "$WORKSPACE/MEMORY.md")
user_size=$(file_size "$WORKSPACE/USER.md")
soul_size=$(file_size "$WORKSPACE/SOUL.md")

budget_check "AGENTS.md" "$agents_size" 2000
budget_check "MEMORY.md" "$memory_size" 1500
budget_check "USER.md"   "$user_size"   2000
budget_check "SOUL.md"   "$soul_size"   3000

tier1_total=$((agents_size + memory_size + user_size + soul_size))
echo "Total Tier 1: ${tier1_total} bytes"
echo ""

echo "--- Daily Logs (memory/) ---"
memory_dir="$WORKSPACE/memory"
if [ -d "$memory_dir" ]; then
  total_files=$(find "$memory_dir" -maxdepth 1 -name '*.md' -type f 2>/dev/null | wc -l | tr -d ' ')
  recent_files=$(find "$memory_dir" -maxdepth 1 -name '*.md' -type f -mtime -7 2>/dev/null | wc -l | tr -d ' ')
  total_bytes=0
  recent_bytes=0
  while IFS= read -r f; do
    s=$(wc -c < "$f" | tr -d ' ')
    total_bytes=$((total_bytes + s))
  done < <(find "$memory_dir" -maxdepth 1 -name '*.md' -type f 2>/dev/null)
  while IFS= read -r f; do
    s=$(wc -c < "$f" | tr -d ' ')
    recent_bytes=$((recent_bytes + s))
  done < <(find "$memory_dir" -maxdepth 1 -name '*.md' -type f -mtime -7 2>/dev/null)
  echo "Total daily logs: $total_files files, $total_bytes bytes"
  echo "Recent (7 days):  $recent_files files, $recent_bytes bytes"

  oldest=$(find "$memory_dir" -maxdepth 1 -name '????-??-??.md' -type f 2>/dev/null | sort | head -1)
  newest=$(find "$memory_dir" -maxdepth 1 -name '????-??-??.md' -type f 2>/dev/null | sort | tail -1)
  if [ -n "$oldest" ]; then
    echo "Date range: $(basename "$oldest" .md) to $(basename "$newest" .md)"
  fi

  stale_count=$(find "$memory_dir" -maxdepth 1 -name '*.md' -type f -mtime +14 2>/dev/null | wc -l | tr -d ' ')
  if [ "$stale_count" -gt 0 ]; then
    echo "Stale (>14 days): $stale_count files (candidates for consolidation)"
  fi
else
  echo "memory/ directory not found"
fi
echo ""

echo "--- Memory Search ---"
if command -v openclaw >/dev/null 2>&1; then
  openclaw memory status 2>/dev/null || echo "Memory status unavailable"
else
  echo "openclaw CLI not found; skipping memory search status"
fi
