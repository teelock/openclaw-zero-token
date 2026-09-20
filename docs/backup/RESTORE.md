# OpenClaw Zero-Token Restore Procedure

## Scope

This document covers restoration of the openclaw-zero-token repository and its associated state.

## What is backed up (reproducible / safe for GitHub)

- Source code (`.pi/skills/`, `.pi/extensions/`, `.brv/`, `.env.schema` without secrets)
- Documentation (`docs/`, `README.md`)
- Build/config scripts (`.gitignore`, `backup.sh`)
- Agent customization (`.pi/prompts/`, `.pi/AGENTS.md` if non-sensitive)

## What is NOT backed up (local browser auth / session material — NEVER commit)

- `.env` (contains `OPENROUTER_API_KEY` and other secrets)
- `.openclaw-upstream-state/openclaw.json` (contains browser profile auth, session tokens)
- `.openclaw-upstream-state/*.bak`, `*.clobbered.*`
- `.openclaw-upstream-state/identity/`, `devices/`, `logs/`, `agents/`
- `.pi/sessions/droid/*` (session settings with auth state)
- Browser cookies / SQLite cookie stores
- Any file matching `.agent/*.json` (credentials)

## Restore Steps

1. Clone the repository: `git clone https://github.com/teelock/openclaw-zero-token.git`
2. Restore workspace settings if backed up separately (NOT from `.env` — recreate manually)
3. Re-authenticate browser providers manually (do NOT restore `.env` or `.openclaw-upstream-state/openclaw.json` from a committed source; these must remain local)
4. Re-run session watchdog if needed (`openclaw session watchdog` or manual refresh)
5. Verify systemd timers are enabled: `systemctl --user enable --now openclaw-zero-token-backup.timer`

## Health Check Command

```bash
/home/t/openclaw-zero-token/scripts/health-check-backup.sh
```

## Safety Notes

- Never restore `.env` or `.openclaw-upstream-state/openclaw.json` from a public source
- Always create a new `.env.schema` and `.env` locally after restore
- Browser session cookies expire; manual re-auth is required after restore
