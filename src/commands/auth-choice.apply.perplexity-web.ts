import { loginPerplexityWeb } from "../zero-token/providers/perplexity-web-auth.js";
import type { ApplyAuthChoiceParams, ApplyAuthChoiceResult } from "./auth-choice.apply.js";
import { applyPerplexityWebConfig } from "./onboard-auth.config-core.js";
import { setPerplexityWebCookie } from "./onboard-auth.credentials.js";
import { openUrl } from "./onboard-helpers.js";

export async function applyAuthChoicePerplexityWeb(
  params: ApplyAuthChoiceParams,
): Promise<ApplyAuthChoiceResult | null> {
  if (params.authChoice !== "perplexity-web") {
    return null;
  }

  const { prompter, runtime, config, agentDir, opts } = params;
  let cookie = opts?.perplexityWebCookie?.trim();

  if (!cookie) {
    const mode = await prompter.select({
      message: "Perplexity Auth Mode",
      options: [
        {
          value: "auto",
          label: "Automated Login (Recommended)",
          hint: "Opens browser to capture login automatically",
        },
        { value: "manual", label: "Manual Paste", hint: "Paste cookies manually" },
      ],
    });

    if (mode === "auto") {
      const spin = prompter.progress("Preparing automated login...");
      try {
        const result = await loginPerplexityWeb({
          onProgress: (msg) => spin.update(msg),
          openUrl: async (url) => {
            await openUrl(url);
            return true;
          },
        });
        spin.stop("Login captured successfully!");
        const authData = JSON.stringify({ cookie: result.cookie, userAgent: result.userAgent });
        await setPerplexityWebCookie({ cookie: authData }, agentDir);
        cookie = authData;
      } catch (err) {
        spin.stop("Automated login failed.");
        runtime.error(String(err));
        const retryManual = await prompter.confirm({
          message: "Would you like to try manual paste instead?",
          initialValue: true,
        });
        if (!retryManual) {
          throw err;
        }
      }
    }

    if (!cookie) {
      await prompter.note(
        [
          "To use Perplexity Browser, you need cookies from perplexity.ai.",
          "1. Login to https://www.perplexity.ai in your browser",
          "2. Open DevTools (F12) -> Application -> Cookies",
          "3. Copy all cookies",
        ].join("\n"),
        "Perplexity Login",
      );
      cookie = await prompter.text({
        message: "Paste cookies",
        placeholder: "...",
        validate: (value) => (value.trim().length > 0 ? undefined : "Required"),
      });
      const authData = JSON.stringify({ cookie, userAgent: "Mozilla/5.0" });
      await setPerplexityWebCookie({ cookie: authData }, agentDir);
    }
  } else {
    await setPerplexityWebCookie({ cookie }, agentDir);
  }

  const nextConfig = applyPerplexityWebConfig(config);
  return { config: nextConfig };
}
