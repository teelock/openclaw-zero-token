---
name: clawhip
description: |
  Daemon-first Discord notification router. Sends event notifications
  (GitHub, git, tmux, agent lifecycle) to Discord without polluting gateway sessions.
  Use when: user wants to send Discord notifications, monitor repos, track agent sessions,
  or set up tmux keyword alerts. Trigger on "clawhip", "notify discord", "send notification",
  "monitor repo", "tmux alert".
metadata: { "openclaw": { "emoji": "🔔", "requires": { "bins": ["clawhip"] } } }
---

# clawhip

Daemon-first event-to-channel notification router. Bypasses gateway sessions to avoid context pollution.

## Daemon

- Binary: `~/.cargo/bin/clawhip`
- Config: `~/.clawhip/config.toml`
- Endpoint: `http://127.0.0.1:25294`
- Source repo: `/home/t/clawhip`

## Quick commands

```bash
clawhip status                    # health check
clawhip send --channel <id> --message "text"  # send custom notification
clawhip github issue-opened ...   # GitHub event
clawhip git commit ...            # git event
clawhip agent started --name <n>  # agent lifecycle
clawhip tmux new -s <sess> --channel <id> --keywords "error,complete" -- cmd
clawhip tmux watch -s <sess> --channel <id> --keywords "error,complete"
```

## Monitored repos

- `openclaw-zero-token` at `/home/t/openclaw-zero-token`
- `clawhip` at `/home/t/clawhip`

## Configured routes

All notifications route to Discord channel `1467100137729036330` with mention `<@765252667664105492>`.

Event families:

- `github.*` -- issue/PR events filtered by repo
- `git.*` -- commit/branch events filtered by repo
- `session.*` -- OMC/OMX session lifecycle
- `agent.*` -- agent started/blocked/finished/failed
- `tmux.*` -- keyword and stale alerts

## Starting the daemon

```bash
clawhip start        # foreground
clawhip start &      # background
# or systemd: sudo systemctl enable --now clawhip
```
