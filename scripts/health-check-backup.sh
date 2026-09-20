#!/bin/bash
# Backup health-check and failure mechanism for openclaw-zero-token
# Idempotent: safe to run multiple times; exits non-zero on failure

set -euo pipefail

REPO_DIR="/home/t/openclaw-zero-token"
BACKUP_MANIFEST="/tmp/safety-manifest-$(date +%Y%m%d-%H%M%S).json"
ERRORS=0

echo "=== Backup Health Check ==="
echo "Repo: $REPO_DIR"
echo "Branch: $(cd $REPO_DIR && git branch --show-current)"
echo "Remote (backup): $(cd $REPO_DIR && git remote get-url backup 2>/dev/null || echo 'NOT SET')"
echo "---"

# Check 1: Agent settings include package
echo "Check 1: Agent package registered"
if grep -q 'HazAT/pi-interactive-subagents' /home/t/.pi/agent/settings.json 2>/dev/null; then
    echo "  PASS: HazAT/pi-interactive-subagents in agent settings"
else
    echo "  FAIL: Package missing from agent settings"
    ERRORS=$((ERRORS+1))
fi

# Check 2: Secret preserved (not exposed in .env.schema / .env incorrectly)
echo "Check 2: Secret preserved"
if grep -q 'OPENROUTER_API_KEY=' /home/t/.config/shell-secrets/.env.schema; then
    echo "  PASS: .env.schema has OPENROUTER_API_KEY declaration"
else
    echo "  FAIL: .env.schema missing OPENROUTER_API_KEY declaration"
    ERRORS=$((ERRORS+1))
fi
if grep -q 'OPENROUTER_API_KEY=sk-or-' /home/t/.config/shell-secrets/.env 2>/dev/null; then
    echo "  PASS: .env has secret value (not exposed here)"
else
    echo "  FAIL: .env missing secret value"
    ERRORS=$((ERRORS+1))
fi

# Check 3: Herdr vars come from runtime (not stored in .env.schema/.env)
echo "Check 3: Herdr runtime vars"
if [ -z "${HERDR_ENV:-}" ]; then
    echo "  FAIL: HERDR_ENV not set in runtime"
    ERRORS=$((ERRORS+1))
else
    echo "  PASS: HERDR_ENV=${HERDR_ENV}"
fi
if [ -z "${HERDR_PANE_ID:-}" ]; then
    echo "  FAIL: HERDR_PANE_ID not set in runtime"
    ERRORS=$((ERRORS+1))
else
    echo "  PASS: HERDR_PANE_ID=${HERDR_PANE_ID}"
fi

# Check 4: .env.schema does NOT store HERDR vars (reverted correctly)
echo "Check 4: .env.schema reverted (no HERDR storage)"
if grep -q 'HERDR' /home/t/.config/shell-secrets/.env.schema 2>/dev/null; then
    echo "  FAIL: .env.schema still contains HERDR vars"
    ERRORS=$((ERRORS+1))
else
    echo "  PASS: No HERDR vars stored in .env.schema"
fi

# Check 5: .env does NOT store HERDR vars
echo "Check 5: .env reverted (no HERDR storage)"
if grep -q '^HERDR' /home/t/.config/shell-secrets/.env 2>/dev/null; then
    echo "  FAIL: .env still contains HERDR vars"
    ERRORS=$((ERRORS+1))
else
    echo "  PASS: .env has no HERDR vars"
fi

# Check 6: Systemd timer exists and enabled
echo "Check 6: Systemd timer enabled"
if [ -L "/home/t/.config/systemd/user/timers.target.wants/openclaw-zero-token-backup.timer" ]; then
    echo "  PASS: openclaw-zero-token-backup.timer enabled"
else
    echo "  FAIL: Timer not enabled"
    ERRORS=$((ERRORS+1))
fi

# Check 7: Safety backup archive exists
SAFE_BACKUP="/tmp/safety-backup.tar.gz"
if [ -f "$SAFE_BACKUP" ]; then
    echo "  PASS: Safety backup archive exists ($(stat -c%s "$SAFE_BACKUP") bytes)"
else
    echo "  FAIL: Safety backup archive missing"
    ERRORS=$((ERRORS+1))
fi

# Check 8: Restore documentation exists
echo "Check 8: Restore documentation"
if [ -f "/home/t/openclaw-zero-token/docs/backup/RESTORE.md" ]; then
    echo "  PASS: RESTORE.md exists"
else
    echo "  FAIL: RESTORE.md missing"
    ERRORS=$((ERRORS+1))
fi

# Check 9: cmux.ts Herdr patch intact
echo "Check 9: cmux.ts Herdr patch"
HERDR_COUNT=$(grep -c 'if (backend === "herdr")' /home/t/.pi/agent/git/github.com/HazAT/pi-interactive-subagents/pi-extension/subagents/cmux.ts 2>/dev/null || echo 0)
if [ "$HERDR_COUNT" -ge 7 ]; then
    echo "  PASS: $HERDR_COUNT herdr branches in cmux.ts"
else
    echo "  FAIL: Only $HERDR_COUNT herdr branches (expected >=7)"
    ERRORS=$((ERRORS+1))
fi

echo "---"
if [ $ERRORS -eq 0 ]; then
    echo "HEALTH CHECK PASSED (0 errors)"
    exit 0
else
    echo "HEALTH CHECK FAILED ($ERRORS errors)"
    exit 1
fi
