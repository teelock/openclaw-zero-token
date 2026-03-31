# Session Watchdog — Web Provider Auto-Refresh

Automatically keeps web provider browser sessions alive. Two layers:

1. **Proactive Watchdog** — periodically checks Chrome cookie expiry via SQLite, silently visits provider sites via CDP to renew cookies before they expire, updates `openclaw.json`.
2. **Reactive Retry** — wraps web stream factories to intercept 401/403 auth errors, refreshes session via CDP, retries the request once.

## Quick Commands

```typescript
// Check all provider cookie status
import { checkAllProviderCookies } from "./src/zero-token/session-watchdog.js";
const statuses = await checkAllProviderCookies(); // returns CookieStatus[]

// Refresh a single provider session
import { refreshWebProviderSession } from "./src/zero-token/session-watchdog.js";
const newApiKey = await refreshWebProviderSession("claude-web"); // returns string | null

// Run full watchdog (refresh all expired/expiring providers)
import { runSessionWatchdog } from "./src/zero-token/session-watchdog.js";
const { refreshed, failed, skipped } = await runSessionWatchdog();

// Get stream factory with auto-retry on auth errors
import { getWebStreamFactoryWithRetry } from "./src/zero-token/streams/web-stream-factories.js";
const factory = await getWebStreamFactoryWithRetry("claude-web", configReloader);
```

## Supported Providers (13)

| Provider ID    | Site                    | Cookie Domains               |
| -------------- | ----------------------- | ---------------------------- |
| deepseek-web   | chat.deepseek.com       | deepseek.com                 |
| claude-web     | claude.ai               | claude.ai                    |
| chatgpt-web    | chatgpt.com             | chatgpt.com, chat.openai.com |
| doubao-web     | www.doubao.com          | doubao.com                   |
| qwen-web       | chat.qwen.ai            | qwen.ai                      |
| kimi-web       | www.kimi.com            | kimi.com                     |
| gemini-web     | gemini.google.com       | gemini.google.com            |
| grok-web       | grok.com                | grok.com                     |
| glm-web        | chatglm.cn              | chatglm.cn                   |
| glm-intl-web   | chat.z.ai               | chat.z.ai                    |
| perplexity-web | www.perplexity.ai       | perplexity.ai                |
| qwen-cn-web    | chat2.qianwen.com       | qianwen.com                  |
| xiaomimo-web   | aistudio.xiaomimimo.com | xiaomimimo.com               |

## Files

| File                                              | Purpose                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/zero-token/session-watchdog.ts`              | Core: cookie DB read (python3 sqlite3), CDP refresh (playwright), config update |
| `src/zero-token/session-watchdog.test.ts`         | Unit tests for domain mapping (5 tests)                                         |
| `src/zero-token/streams/web-stream-retry.ts`      | Stream wrapper: detects auth errors, calls refresh, retries once                |
| `src/zero-token/streams/web-stream-retry.test.ts` | Auth error pattern tests (4 tests)                                              |
| `src/zero-token/streams/web-stream-factories.ts`  | Added `getWebStreamFactoryWithRetry()`, `isWebStreamApiId()`                    |
| `src/agents/web-stream-factories.ts`              | Re-exports for core (attempt.ts/compact.ts)                                     |
| `src/hooks/bundled/session-watchdog/handler.ts`   | Gateway hook: runs on startup, repeats every 2h                                 |
| `src/hooks/bundled/session-watchdog/HOOK.md`      | Hook documentation                                                              |

## How Refresh Works

1. Copies Chrome Cookies SQLite DB (`~/.openclaw/browser/openclaw/user-data/Default/Cookies`) to temp
2. Queries cookie expiry per provider via `python3 -c "import sqlite3..."`
3. For expired/expiring: connects to Chrome via CDP (`playwright-core chromium.connectOverCDP`)
4. Opens provider URL in background tab, waits 3s for cookie renewal
5. Re-captures cookies from browser context
6. Merges into existing apiKey JSON (preserves bearer/sessionKey/etc)
7. Writes to `openclaw.json` via `writeConfigFile()`

## Auth Error Patterns

Detected in stream error messages (case-insensitive):

- `"Authentication failed"`, `"re-run onboarding"`, `"session expired"`, `"session invalid"`
- Chinese: `"认证失败"`, `"请重新运行"`

## Gateway Hook Config

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "session-watchdog": {
          "enabled": true,
          "intervalMs": 7200000,
          "expiryThresholdSec": 21600
        }
      }
    }
  }
}
```

Default: checks every 2 hours, refreshes cookies expiring within 6 hours.

## Design Notes

- **No new npm deps** — uses existing playwright + CDP infra from `extensions/browser/`
- **All heavy imports lazy-loaded** — playwright, browser helpers, config I/O loaded via dynamic `import()` only when refresh is actually needed
- **Cookie DB is read-only** — never writes to Chrome's DB; visits pages to let Chrome renew naturally
- **Safe fallback** — if Chrome isn't running or CDP fails, logs warning and skips (no crash)
- **Pre-existing test issue** — `web-stream-factories.test.ts` fails in vitest due to `openclaw/plugin-sdk/browser-support` resolution; unrelated to this feature
