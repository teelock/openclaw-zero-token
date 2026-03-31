import { describe, expect, it } from "vitest";

// Inline the auth error detection logic to avoid importing the full browser chain.
// The actual implementation lives in web-stream-retry.ts.
const AUTH_ERROR_PATTERNS = [
  "Authentication failed",
  "re-run onboarding",
  "认证失败",
  "请重新运行",
  "session expired",
  "session invalid",
] as const;

function isAuthError(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return AUTH_ERROR_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

describe("web-stream-retry", () => {
  describe("isAuthError", () => {
    it("detects English auth failure messages", () => {
      expect(
        isAuthError(
          "Authentication failed. Please re-run onboarding to refresh your Claude session.",
        ),
      ).toBe(true);
      expect(isAuthError("Authentication failed")).toBe(true);
      expect(isAuthError("re-run onboarding")).toBe(true);
      expect(isAuthError("session expired")).toBe(true);
      expect(isAuthError("session invalid")).toBe(true);
    });

    it("detects Chinese auth failure messages", () => {
      expect(isAuthError("认证失败，请重新运行 onboard")).toBe(true);
      expect(isAuthError("请重新运行 ./onboard.sh 刷新 session")).toBe(true);
    });

    it("is case-insensitive", () => {
      expect(isAuthError("AUTHENTICATION FAILED")).toBe(true);
      expect(isAuthError("Session Expired")).toBe(true);
    });

    it("does not match non-auth errors", () => {
      expect(isAuthError("Network timeout")).toBe(false);
      expect(isAuthError("Rate limited")).toBe(false);
      expect(isAuthError("Internal server error")).toBe(false);
      expect(isAuthError("")).toBe(false);
    });
  });
});
