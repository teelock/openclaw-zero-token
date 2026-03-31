/**
 * Session watchdog hook handler.
 *
 * Runs periodic web provider session refresh on gateway startup.
 * Checks browser cookie expiry and silently visits provider sites
 * via CDP to renew sessions before they expire.
 */

import { createSubsystemLogger } from "../../../logging/subsystem.js";
import { resolveHookConfig } from "../../config.js";
import type { HookHandler } from "../../hooks.js";

const log = createSubsystemLogger("hooks/session-watchdog");

const DEFAULT_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const DEFAULT_EXPIRY_THRESHOLD_SEC = 6 * 3600; // 6 hours

let watchdogTimer: ReturnType<typeof setInterval> | null = null;

async function runWatchdogCycle(expiryThresholdSec: number): Promise<void> {
  try {
    const { runSessionWatchdog } = await import("../../../zero-token/session-watchdog.js");
    const result = await runSessionWatchdog({ expiryThresholdSec });

    if (result.refreshed.length > 0) {
      log.info("Sessions refreshed", { providers: result.refreshed });
    }
    if (result.failed.length > 0) {
      log.warn("Session refresh failed for providers", { providers: result.failed });
    }
  } catch (err) {
    log.error("Watchdog cycle failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

const sessionWatchdogHandler: HookHandler = async (event) => {
  if (event.type !== "gateway" || event.action !== "startup") {
    return;
  }

  const cfg = event.context?.cfg as import("../../../config/config.js").OpenClawConfig | undefined;
  const hookConfig = resolveHookConfig(cfg, "session-watchdog");

  const intervalMs =
    typeof hookConfig?.intervalMs === "number" && hookConfig.intervalMs > 0
      ? hookConfig.intervalMs
      : DEFAULT_INTERVAL_MS;

  const expiryThresholdSec =
    typeof hookConfig?.expiryThresholdSec === "number" && hookConfig.expiryThresholdSec > 0
      ? hookConfig.expiryThresholdSec
      : DEFAULT_EXPIRY_THRESHOLD_SEC;

  log.info("Starting session watchdog", {
    intervalMs,
    expiryThresholdSec,
  });

  // Run initial check after a short delay (let gateway fully start)
  setTimeout(() => void runWatchdogCycle(expiryThresholdSec), 10_000);

  // Clear any existing timer (in case of gateway restart)
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
  }

  watchdogTimer = setInterval(() => void runWatchdogCycle(expiryThresholdSec), intervalMs);
};

export default sessionWatchdogHandler;
