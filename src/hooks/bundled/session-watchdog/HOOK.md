---
name: session-watchdog
description: "Proactively refresh web provider browser sessions before they expire"
homepage: https://docs.openclaw.ai/automation/hooks#session-watchdog
metadata:
  {
    "openclaw":
      {
        "emoji": "🔄",
        "events": ["gateway:startup"],
        "requires": { "config": ["browser"] },
        "install": [{ "id": "bundled", "kind": "bundled", "label": "Bundled with OpenClaw" }],
      },
  }
---

# Session Watchdog Hook

Automatically keeps web provider browser sessions alive by refreshing cookies before they expire.

## What It Does

On gateway startup, starts a periodic background task that:

1. **Checks cookie expiry** — reads Chrome's Cookies SQLite DB for all configured web providers
2. **Identifies at-risk sessions** — finds providers with cookies expiring within the threshold (default: 6 hours)
3. **Silently refreshes** — connects to Chrome via CDP, visits the provider's site in a background tab, and re-captures updated cookies
4. **Updates config** — writes the refreshed credentials back to `openclaw.json`

## Supported Providers

All zero-token web providers: claude-web, chatgpt-web, deepseek-web, doubao-web, gemini-web, glm-web, glm-intl-web, grok-web, kimi-web, perplexity-web, qwen-web, qwen-cn-web, xiaomimo-web.

## Requirements

- Chrome must be running with CDP enabled (`start-chrome-debug.sh`)
- Web providers must have been initially authorized via `onboard`

## Configuration

| Option               | Type   | Default | Description                                    |
| -------------------- | ------ | ------- | ---------------------------------------------- |
| `intervalMs`         | number | 7200000 | Check interval in milliseconds (default: 2h)   |
| `expiryThresholdSec` | number | 21600   | Refresh cookies expiring within N seconds (6h) |

Example:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "session-watchdog": {
          "enabled": true,
          "intervalMs": 3600000,
          "expiryThresholdSec": 10800
        }
      }
    }
  }
}
```

## Disabling

```bash
openclaw hooks disable session-watchdog
```
