import { describe, expect, it } from "vitest";
import {
  getProviderDomainEntry,
  getProviderDomains,
  type CookieStatus,
} from "./session-watchdog.js";

const EXPECTED_WEB_API_IDS = [
  "chatgpt-web",
  "claude-web",
  "deepseek-web",
  "doubao-web",
  "gemini-web",
  "glm-intl-web",
  "glm-web",
  "grok-web",
  "kimi-web",
  "perplexity-web",
  "qwen-cn-web",
  "qwen-web",
  "xiaomimo-web",
] as const;

describe("session-watchdog", () => {
  it("has domain entries for every known web stream api id", () => {
    for (const id of EXPECTED_WEB_API_IDS) {
      const entry = getProviderDomainEntry(id);
      expect(entry, `missing domain entry for ${id}`).toBeDefined();
      expect(entry!.cookieDomains.length).toBeGreaterThan(0);
      expect(entry!.baseUrl).toMatch(/^https?:\/\//);
    }
  });

  it("returns undefined for unknown provider", () => {
    expect(getProviderDomainEntry("openai")).toBeUndefined();
    expect(getProviderDomainEntry("nonexistent")).toBeUndefined();
  });

  it("getProviderDomains returns all entries", () => {
    const domains = getProviderDomains();
    expect(domains.length).toBeGreaterThanOrEqual(13);
    const ids = domains.map((d) => d.id);
    expect(ids).toContain("claude-web");
    expect(ids).toContain("chatgpt-web");
    expect(ids).toContain("deepseek-web");
  });

  it("domain entries have unique provider IDs", () => {
    const domains = getProviderDomains();
    const ids = domains.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("CookieStatus type has correct shape", () => {
    const status: CookieStatus = {
      providerId: "claude-web",
      cookieCount: 5,
      earliestExpiry: Math.floor(Date.now() / 1000) + 3600,
      expiredCount: 0,
      status: "active",
    };
    expect(status.status).toBe("active");
  });
});
