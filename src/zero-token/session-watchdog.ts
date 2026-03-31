/**
 * Web provider session watchdog.
 *
 * Proactively checks browser cookie expiry for web providers and silently
 * refreshes sessions by visiting provider sites via CDP before they expire.
 * Also exports helpers consumed by the on-demand retry layer.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("session-watchdog");

// Chrome epoch: microseconds since 1601-01-01
const CHROME_EPOCH_OFFSET = 11_644_473_600n;

interface ProviderDomainEntry {
  id: string;
  baseUrl: string;
  cookieDomains: string[];
}

const PROVIDER_DOMAINS: ProviderDomainEntry[] = [
  {
    id: "deepseek-web",
    baseUrl: "https://chat.deepseek.com",
    cookieDomains: ["chat.deepseek.com", "deepseek.com"],
  },
  { id: "claude-web", baseUrl: "https://claude.ai", cookieDomains: ["claude.ai"] },
  {
    id: "chatgpt-web",
    baseUrl: "https://chatgpt.com",
    cookieDomains: ["chatgpt.com", "chat.openai.com"],
  },
  {
    id: "doubao-web",
    baseUrl: "https://www.doubao.com",
    cookieDomains: ["www.doubao.com", "doubao.com"],
  },
  { id: "qwen-web", baseUrl: "https://chat.qwen.ai", cookieDomains: ["chat.qwen.ai", "qwen.ai"] },
  { id: "kimi-web", baseUrl: "https://www.kimi.com", cookieDomains: ["www.kimi.com", "kimi.com"] },
  { id: "gemini-web", baseUrl: "https://gemini.google.com", cookieDomains: ["gemini.google.com"] },
  { id: "grok-web", baseUrl: "https://grok.com", cookieDomains: ["grok.com"] },
  { id: "glm-web", baseUrl: "https://chatglm.cn", cookieDomains: ["chatglm.cn"] },
  { id: "glm-intl-web", baseUrl: "https://chat.z.ai", cookieDomains: ["chat.z.ai"] },
  {
    id: "perplexity-web",
    baseUrl: "https://www.perplexity.ai",
    cookieDomains: ["www.perplexity.ai", "perplexity.ai"],
  },
  {
    id: "qwen-cn-web",
    baseUrl: "https://chat2.qianwen.com",
    cookieDomains: ["chat2.qianwen.com", "qianwen.com"],
  },
  {
    id: "xiaomimo-web",
    baseUrl: "https://aistudio.xiaomimimo.com",
    cookieDomains: ["aistudio.xiaomimimo.com"],
  },
];

export function getProviderDomainEntry(providerId: string): ProviderDomainEntry | undefined {
  return PROVIDER_DOMAINS.find((e) => e.id === providerId);
}

function resolveCookiesDbPath(): string {
  const stateDir = process.env.OPENCLAW_STATE_DIR || path.join(os.homedir(), ".openclaw");
  return path.join(stateDir, "browser", "openclaw", "user-data", "Default", "Cookies");
}

function chromeTimestampToUnix(chromeTs: bigint): number {
  if (chromeTs === 0n) {
    return 0;
  }
  return Number(chromeTs / 1_000_000n - CHROME_EPOCH_OFFSET);
}

export interface CookieStatus {
  providerId: string;
  cookieCount: number;
  earliestExpiry: number | null; // unix seconds, null = session-only
  expiredCount: number;
  status: "active" | "expiring_soon" | "expired" | "no_session";
}

/**
 * Check cookie expiry status for all configured web providers.
 * Reads the Chrome Cookies SQLite DB (read-only copy to avoid lock).
 */
export async function checkAllProviderCookies(params?: {
  expiryThresholdSec?: number;
}): Promise<CookieStatus[]> {
  const thresholdSec = params?.expiryThresholdSec ?? 6 * 3600; // 6 hours
  const dbPath = resolveCookiesDbPath();

  if (!fs.existsSync(dbPath)) {
    log.warn("Chrome Cookies DB not found", { path: dbPath });
    return [];
  }

  // Copy DB to temp to avoid SQLite lock contention with Chrome
  const tmpDb = path.join(os.tmpdir(), `openclaw-cookies-check-${Date.now()}.db`);
  fs.copyFileSync(dbPath, tmpDb);

  const results: CookieStatus[] = [];
  const nowSec = Math.floor(Date.now() / 1000);

  try {
    const { execSync } = await import("node:child_process");

    // Build a single python3 script that queries all providers at once
    const allDomainClauses = PROVIDER_DOMAINS.map((entry) => {
      const clause = entry.cookieDomains.map((d) => `host_key LIKE '%${d}%'`).join(" OR ");
      return `"${entry.id}": "${clause}"`;
    }).join(", ");

    const script = `
import sqlite3, json
conn = sqlite3.connect("${tmpDb}")
cur = conn.cursor()
providers = {${allDomainClauses}}
result = {}
for pid, clause in providers.items():
    cur.execute(f"SELECT name, expires_utc FROM cookies WHERE {clause}")
    result[pid] = cur.fetchall()
conn.close()
print(json.dumps(result))
`;

    const out = execSync(`python3 -c ${JSON.stringify(script)}`, {
      encoding: "utf-8",
      timeout: 10_000,
    }).trim();

    const allRows = JSON.parse(out) as Record<string, [string, number][]>;

    for (const entry of PROVIDER_DOMAINS) {
      const rows = allRows[entry.id] ?? [];

      if (rows.length === 0) {
        results.push({
          providerId: entry.id,
          cookieCount: 0,
          earliestExpiry: null,
          expiredCount: 0,
          status: "no_session",
        });
        continue;
      }

      let earliestExpiry: number | null = null;
      let expiredCount = 0;

      for (const [, expiresUtc] of rows) {
        const expUnix = chromeTimestampToUnix(BigInt(expiresUtc));
        if (expUnix === 0) {
          continue;
        }
        if (expUnix < nowSec) {
          expiredCount++;
        }
        if (earliestExpiry === null || expUnix < earliestExpiry) {
          earliestExpiry = expUnix;
        }
      }

      let status: CookieStatus["status"];
      if (expiredCount === rows.length) {
        status = "expired";
      } else if (earliestExpiry !== null && earliestExpiry - nowSec < thresholdSec) {
        status = "expiring_soon";
      } else {
        status = "active";
      }

      results.push({
        providerId: entry.id,
        cookieCount: rows.length,
        earliestExpiry,
        expiredCount,
        status,
      });
    }
  } catch (err) {
    log.error("Failed to read Cookies DB", { error: String(err) });
  } finally {
    try {
      fs.unlinkSync(tmpDb);
    } catch {
      // ignore cleanup errors
    }
  }

  return results;
}

/**
 * Refresh a single web provider session by visiting its site via CDP.
 * Returns the updated apiKey JSON string, or null if refresh failed.
 */
export async function refreshWebProviderSession(providerId: string): Promise<string | null> {
  const entry = PROVIDER_DOMAINS.find((e) => e.id === providerId);
  if (!entry) {
    log.warn("Unknown web provider", { providerId });
    return null;
  }

  log.info("Refreshing web provider session", { providerId });

  // Lazy-import heavy deps to avoid pulling playwright at module load time
  const [
    { chromium },
    { getHeadersWithAuth },
    { getChromeWebSocketUrl },
    { resolveBrowserConfig, resolveProfile },
    { loadConfig },
  ] = await Promise.all([
    import("playwright-core"),
    import("../../extensions/browser/src/browser/cdp.helpers.js"),
    import("../../extensions/browser/src/browser/chrome.js"),
    import("../../extensions/browser/src/browser/config.js"),
    import("../config/io.js"),
  ]);

  let config: import("../config/config.js").OpenClawConfig;
  try {
    config = loadConfig();
  } catch {
    log.error("Failed to load config");
    return null;
  }

  const browserConfig = resolveBrowserConfig(config.browser, config);
  const profile = resolveProfile(browserConfig, browserConfig.defaultProfile);
  if (!profile) {
    log.warn("No browser profile resolved");
    return null;
  }

  const cdpUrl = profile.cdpUrl || `http://127.0.0.1:${profile.cdpPort}`;
  let wsUrl: string | null = null;

  try {
    wsUrl = await getChromeWebSocketUrl(cdpUrl, 3000);
  } catch {
    log.warn("Chrome not reachable via CDP", { cdpUrl });
    return null;
  }

  if (!wsUrl) {
    log.warn("Failed to get Chrome WebSocket URL", { cdpUrl });
    return null;
  }

  let browser;
  try {
    browser = await chromium.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl),
    });
  } catch (err) {
    log.warn("Failed to connect to Chrome", { error: String(err) });
    return null;
  }

  try {
    const context = browser.contexts()[0];
    if (!context) {
      log.warn("No browser context available");
      return null;
    }

    // Open target URL in a new tab, wait for cookies to refresh
    const page = await context.newPage();
    try {
      log.debug("Visiting provider site", { url: entry.baseUrl });
      await page.goto(entry.baseUrl, { timeout: 30_000, waitUntil: "domcontentloaded" });

      // Wait a bit for cookie refresh / redirects to settle
      await page.waitForTimeout(3000);

      // Collect cookies
      const cookieUrls = entry.cookieDomains.map((d) => `https://${d}`);
      const cookies = await context.cookies(cookieUrls);

      if (cookies.length === 0) {
        log.warn("No cookies after refresh visit", { providerId });
        return null;
      }

      const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

      // Re-read existing apiKey to merge (preserve bearer, sessionKey, etc.)
      const existingApiKey = config.models?.providers?.[providerId]?.apiKey;
      let updatedApiKey: string;

      if (typeof existingApiKey === "string" && existingApiKey.startsWith("{")) {
        try {
          const parsed = JSON.parse(existingApiKey);
          parsed.cookie = cookieString;
          updatedApiKey = JSON.stringify(parsed);
        } catch {
          updatedApiKey = JSON.stringify({ cookie: cookieString });
        }
      } else {
        updatedApiKey = JSON.stringify({ cookie: cookieString });
      }

      // Write back to config (re-load to avoid clobbering concurrent changes)
      const { loadConfig: reloadCfg, writeConfigFile: writeCfg } = await import("../config/io.js");
      const freshConfig = reloadCfg();
      if (!freshConfig.models) {
        freshConfig.models = {};
      }
      if (!freshConfig.models.providers) {
        freshConfig.models.providers = {};
      }
      if (!freshConfig.models.providers[providerId]) {
        (freshConfig.models.providers as Record<string, unknown>)[providerId] = {
          baseUrl: entry.baseUrl,
          api: providerId,
        };
      }
      const provider = freshConfig.models.providers[providerId] as Record<string, unknown>;
      provider.apiKey = updatedApiKey;

      await writeCfg(freshConfig);
      log.info("Session refreshed and config updated", { providerId });
      return updatedApiKey;
    } finally {
      await page.close().catch(() => {});
    }
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * Run the session watchdog once: check all providers and refresh those
 * that are expired or expiring soon.
 */
export async function runSessionWatchdog(params?: {
  expiryThresholdSec?: number;
}): Promise<{ refreshed: string[]; failed: string[]; skipped: string[] }> {
  const statuses = await checkAllProviderCookies(params);
  const refreshed: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];

  // Only check providers that are configured in the config
  let config: import("../config/config.js").OpenClawConfig;
  try {
    const { loadConfig } = await import("../config/io.js");
    config = loadConfig();
  } catch {
    log.error("Failed to load config for watchdog");
    return { refreshed, failed, skipped };
  }

  const configuredProviders = new Set(Object.keys(config.models?.providers ?? {}));

  for (const status of statuses) {
    if (!configuredProviders.has(status.providerId)) {
      continue; // skip unconfigured providers
    }

    if (status.status === "active") {
      skipped.push(status.providerId);
      continue;
    }

    if (status.status === "no_session") {
      skipped.push(status.providerId);
      continue;
    }

    // expired or expiring_soon: attempt refresh
    log.info("Attempting session refresh", {
      providerId: status.providerId,
      status: status.status,
    });

    try {
      const result = await refreshWebProviderSession(status.providerId);
      if (result) {
        refreshed.push(status.providerId);
      } else {
        failed.push(status.providerId);
      }
    } catch (err) {
      log.error("Session refresh failed", {
        providerId: status.providerId,
        error: String(err),
      });
      failed.push(status.providerId);
    }
  }

  log.info("Watchdog run complete", {
    refreshed: refreshed.length,
    failed: failed.length,
    skipped: skipped.length,
  });

  return { refreshed, failed, skipped };
}

/** Returns the list of all known web provider IDs with their domain mappings. */
export function getProviderDomains(): readonly ProviderDomainEntry[] {
  return PROVIDER_DOMAINS;
}
