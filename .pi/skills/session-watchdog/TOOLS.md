# Session Watchdog — Tools & CLI Reference

## Checking Session Status (Manual)

### Via Python (direct cookie DB query)

```bash
python3 -c "
import sqlite3, json, time, os, shutil
db = os.path.expanduser('~/.openclaw/browser/openclaw/user-data/Default/Cookies')
tmp = '/tmp/oc-cookies.db'
shutil.copy2(db, tmp)
conn = sqlite3.connect(tmp)
cur = conn.cursor()

providers = {
  'deepseek-web': ['chat.deepseek.com', 'deepseek.com'],
  'claude-web': ['claude.ai'],
  'chatgpt-web': ['chatgpt.com', 'chat.openai.com'],
  'doubao-web': ['www.doubao.com', 'doubao.com'],
  'qwen-web': ['chat.qwen.ai', 'qwen.ai'],
  'kimi-web': ['www.kimi.com', 'kimi.com'],
  'gemini-web': ['gemini.google.com'],
  'grok-web': ['grok.com'],
  'perplexity-web': ['www.perplexity.ai', 'perplexity.ai'],
  'glm-web': ['chatglm.cn'],
  'glm-intl-web': ['chat.z.ai'],
  'qwen-cn-web': ['chat2.qianwen.com', 'qianwen.com'],
  'xiaomimo-web': ['aistudio.xiaomimimo.com'],
}

EPOCH = 11644473600
now = time.time()

for pid, domains in providers.items():
    clause = ' OR '.join([f\"host_key LIKE '%{d}%'\" for d in domains])
    cur.execute(f'SELECT name, expires_utc FROM cookies WHERE {clause}')
    rows = cur.fetchall()
    if not rows:
        print(f'{pid:<20} NO SESSION')
        continue
    expired = sum(1 for _, e in rows if e > 0 and (e/1e6 - EPOCH) < now)
    status = 'EXPIRED' if expired == len(rows) else 'ACTIVE' if expired == 0 else 'PARTIAL'
    print(f'{pid:<20} {status:<10} cookies={len(rows)} expired={expired}')

conn.close()
os.unlink(tmp)
"
```

### Via Node (using the watchdog module)

```bash
cd ~/openclaw-zero-token
node --loader tsx -e "
import { checkAllProviderCookies } from './src/zero-token/session-watchdog.js';
const statuses = await checkAllProviderCookies();
for (const s of statuses) {
  console.log(s.providerId.padEnd(20), s.status.padEnd(15), 'cookies=' + s.cookieCount);
}
"
```

### Via Node (run full watchdog)

```bash
cd ~/openclaw-zero-token
node --loader tsx -e "
import { runSessionWatchdog } from './src/zero-token/session-watchdog.js';
const r = await runSessionWatchdog();
console.log('Refreshed:', r.refreshed);
console.log('Failed:', r.failed);
console.log('Skipped:', r.skipped);
"
```

## Key Paths

| Path                                                     | What                                       |
| -------------------------------------------------------- | ------------------------------------------ |
| `~/.openclaw/browser/openclaw/user-data/Default/Cookies` | Chrome Cookies SQLite DB                   |
| `~/.openclaw/openclaw.json`                              | Config with `models.providers.<id>.apiKey` |
| `~/.openclaw/agents/main/agent/auth-profiles.json`       | Auth profiles store                        |

## Config apiKey Format

Each web provider's apiKey in `openclaw.json` is a JSON string:

```json
{
  "models": {
    "providers": {
      "claude-web": {
        "apiKey": "{\"sessionKey\":\"sk-ant-sid01-...\",\"cookie\":\"sessionKey=sk-ant-...; ...\"}"
      },
      "chatgpt-web": {
        "apiKey": "{\"accessToken\":\"eyJh...\",\"cookie\":\"...\"}"
      },
      "deepseek-web": {
        "apiKey": "{\"cookie\":\"aws-waf-token=...\",\"bearer\":\"...\"}"
      }
    }
  }
}
```

The watchdog refreshes the `cookie` field while preserving other fields (bearer, sessionKey, accessToken).

## Running Tests

```bash
# Requires @vitest/browser-playwright + src/test-helpers/lit-warnings.setup.ts stub
pnpm exec vitest run --project unit \
  src/zero-token/session-watchdog.test.ts \
  src/zero-token/streams/web-stream-retry.test.ts
# Expected: 9 tests pass (5 watchdog + 4 retry)
```

## Troubleshooting

- **"Chrome not reachable via CDP"** — Chrome must be running with remote debugging. Run `./start-chrome-debug.sh` or start Chrome with `--remote-debugging-port=9222`.
- **"No cookies after refresh visit"** — The browser session is fully expired. Need manual re-login via `openclaw-zt onboard web-auth`.
- **"Failed to read Cookies DB"** — python3 not available or Cookies DB doesn't exist (Chrome never opened).
