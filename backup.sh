#!/bin/bash
set -e

export PATH="/home/t/.local/share/mise/installs/node/25.8.0/bin:/home/t/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

cd /home/t/openclaw-zero-token

TOKEN="${GITHUB_BACKUP_CLASSIC_KEY:-${GH_TOKEN:-$(gh auth token 2>/dev/null)}}"

if [ -z "$TOKEN" ]; then
    echo "Error: No GitHub token found. Set GITHUB_BACKUP_CLASSIC_KEY, GH_TOKEN, or login with gh auth"
    exit 1
fi

git add -A

if [ -n "$(git status --porcelain)" ]; then
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    git commit -m "Backup - $timestamp"

    git remote set-url backup "https://${TOKEN}@github.com/teelock/openclaw-zero-token.git" 2>/dev/null || \
        git remote add backup "https://${TOKEN}@github.com/teelock/openclaw-zero-token.git"
    git push backup main
    # Restore clean remote URL (no token in git config)
    git remote set-url backup "https://github.com/teelock/openclaw-zero-token.git"
    echo "Backup completed: $timestamp"
else
    echo "No changes to backup"
fi
