/**
 * On-demand retry wrapper for web stream factories.
 *
 * Intercepts auth errors (401/403) from web provider streams, attempts a
 * silent session refresh via the watchdog, then retries with fresh credentials.
 */

import type { StreamFn } from "@mariozechner/pi-agent-core";
import {
  createAssistantMessageEventStream,
  type AssistantMessageEventStream,
} from "@mariozechner/pi-ai";
import { createSubsystemLogger } from "../../logging/subsystem.js";
import { refreshWebProviderSession } from "../session-watchdog.js";
import { getWebStreamFactory, type WebStreamApiId } from "./web-stream-factories.js";

const log = createSubsystemLogger("web-stream-retry");

// Patterns that indicate an auth failure in error messages from web providers
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

export type ConfigReloader = () => string | undefined;

/**
 * Create a stream factory that wraps a web provider's stream with auth retry.
 *
 * On first auth failure:
 *   1. Calls refreshWebProviderSession() to silently visit the provider site
 *   2. Gets fresh credentials via configReloader
 *   3. Creates a new stream factory and retries
 *
 * If the retry also fails, the original error is surfaced.
 */
export function createWebStreamFnWithRetry(
  api: WebStreamApiId,
  cookie: string,
  configReloader: ConfigReloader,
): StreamFn {
  const baseFactory = getWebStreamFactory(api);
  if (!baseFactory) {
    throw new Error(`No web stream factory for api: ${api}`);
  }

  const baseFn = baseFactory(cookie);

  const wrappedFn: StreamFn = (model, context, streamOptions) => {
    const outerStream = createAssistantMessageEventStream();

    const run = async () => {
      const innerStream = baseFn(model, context, streamOptions);
      let gotAuthError = false;
      let authErrorMessage = "";

      // Pipe inner stream to outer, watching for auth errors
      for await (const event of innerStream) {
        if (event.type === "error") {
          const errMsg = (event as { error?: { errorMessage?: string } }).error?.errorMessage ?? "";
          if (isAuthError(errMsg)) {
            gotAuthError = true;
            authErrorMessage = errMsg;
            break;
          }
        }
        outerStream.push(event);
      }

      if (!gotAuthError) {
        outerStream.end();
        return;
      }

      // Auth error detected — attempt refresh + retry
      log.info("Auth error detected, attempting session refresh", { api, error: authErrorMessage });

      try {
        const refreshedApiKey = await refreshWebProviderSession(api);
        if (!refreshedApiKey) {
          // Try config-based reload as fallback
          const reloadedCookie = configReloader();
          if (!reloadedCookie) {
            log.warn("Session refresh failed and no config fallback", { api });
            outerStream.push({
              type: "error",
              reason: "error",
              error: {
                role: "assistant",
                content: [],
                stopReason: "error",
                errorMessage: authErrorMessage,
                api: model.api,
                provider: model.provider,
                model: model.id,
                usage: {
                  input: 0,
                  output: 0,
                  cacheRead: 0,
                  cacheWrite: 0,
                  totalTokens: 0,
                  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
                },
                timestamp: Date.now(),
              },
            } as unknown as Parameters<typeof outerStream.push>[0]);
            outerStream.end();
            return;
          }

          // Retry with config-reloaded cookie
          log.info("Retrying with config-reloaded cookie", { api });
          const retryFactory = getWebStreamFactory(api);
          if (!retryFactory) {
            outerStream.end();
            return;
          }
          const retryFn = retryFactory(reloadedCookie);
          await pipeStream(retryFn(model, context, streamOptions), outerStream);
          return;
        }

        // Retry with refreshed session
        log.info("Retrying with refreshed session", { api });
        const retryFactory = getWebStreamFactory(api);
        if (!retryFactory) {
          outerStream.end();
          return;
        }
        const retryFn = retryFactory(refreshedApiKey);
        await pipeStream(retryFn(model, context, streamOptions), outerStream);
      } catch (retryErr) {
        log.error("Retry after refresh failed", { api, error: String(retryErr) });
        outerStream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage: `Session refresh retry failed: ${String(retryErr)}`,
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
            },
            timestamp: Date.now(),
          },
        } as unknown as Parameters<typeof outerStream.push>[0]);
        outerStream.end();
      }
    };

    queueMicrotask(() => void run());
    return outerStream;
  };

  return wrappedFn;
}

async function pipeStream(
  source: AssistantMessageEventStream,
  target: AssistantMessageEventStream,
): Promise<void> {
  for await (const event of source) {
    target.push(event);
  }
  target.end();
}

/** Check whether an error message string indicates an auth/session failure. */
export { isAuthError };
