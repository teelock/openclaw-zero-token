/**
 * Web Model Auth Onboard
 *
 * Standalone web model authorization module.
 * Supports authorizing multiple web models at once.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { resolveOpenClawAgentDir } from "../agents/agent-paths.js";
import { ensureAuthProfileStore, saveAuthProfileStore } from "../agents/auth-profiles.js";
import { ensureOpenClawModelsJson } from "../agents/models-config.js";
import type { OpenClawConfig } from "../config/config.js";
import { loadConfig, writeConfigFile } from "../config/io.js";
import { resolveAgentModelPrimaryValue } from "../config/model-input.js";
import type { WizardStep } from "../wizard/types.js";
import { loginChatGPTWeb } from "../zero-token/providers/chatgpt-web-auth.js";
// 导入各个 web 模型的登录函数
import { loginClaudeWeb } from "../zero-token/providers/claude-web-auth.js";
import { loginDeepseekWeb } from "../zero-token/providers/deepseek-web-auth.js";
import { loginDoubaoWeb } from "../zero-token/providers/doubao-web-auth.js";
import { loginGeminiWeb } from "../zero-token/providers/gemini-web-auth.js";
import { loginGlmIntlWeb } from "../zero-token/providers/glm-intl-web-auth.js";
import { loginZWeb } from "../zero-token/providers/glm-web-auth.js";
import { loginGrokWeb } from "../zero-token/providers/grok-web-auth.js";
import { loginKimiWeb } from "../zero-token/providers/kimi-web-auth.js";
import { loginPerplexityWeb } from "../zero-token/providers/perplexity-web-auth.js";
import { loginQwenCNWeb } from "../zero-token/providers/qwen-cn-web-auth.js";
import { loginQwenWeb } from "../zero-token/providers/qwen-web-auth.js";
import { loginXiaomiMimoWeb } from "../zero-token/providers/xiaomimo-web-auth.js";
import { applyAgentDefaultModelPrimary } from "./onboard-auth.config-shared.js";

// Save web model credentials to auth store
async function saveWebModelCredentials(providerId: string, credentials: unknown): Promise<void> {
  const store = ensureAuthProfileStore();
  const profileId = `${providerId}:default`;

  store.profiles[profileId] = {
    type: "token",
    provider: providerId,
    token: JSON.stringify(credentials),
  };

  saveAuthProfileStore(store);
  console.log(`  > Credentials saved to auth-profiles.json`);
}

// Update model whitelist in config
async function addModelToWhitelist(providerId: string, modelIds: string[]): Promise<void> {
  const config = loadConfig();

  // Initialize models field if missing
  if (!config.agents.defaults.models) {
    config.agents.defaults.models = {};
  }

  // Model alias mapping
  const modelAliases: Record<string, Record<string, string>> = {
    "claude-web": {
      "claude-sonnet-4-6": "Claude Web",
      "claude-opus-4-6": "Claude Opus",
      "claude-haiku-4-6": "Claude Haiku",
    },
    "chatgpt-web": {
      "gpt-4": "ChatGPT Web",
    },
    "deepseek-web": {
      "deepseek-chat": "DeepSeek V3",
      "deepseek-reasoner": "DeepSeek R1",
    },
    "doubao-web": {
      "doubao-seed-2.0": "Doubao Browser",
    },
    "gemini-web": {
      "gemini-pro": "Gemini Pro",
      "gemini-ultra": "Gemini Ultra",
    },
    "glm-web": {
      "glm-4-plus": "GLM Web",
    },
    "glm-intl-web": {
      "glm-4-plus": "GLM-4 Plus (International)",
      "glm-4-think": "GLM-4 Think",
    },
    "grok-web": {
      "grok-2": "Grok Web",
    },
    "kimi-web": {
      "moonshot-v1-32k": "Kimi Web",
    },
    "perplexity-web": {
      "perplexity-web": "Perplexity Web",
    },
    "qwen-web": {
      "qwen3.5-plus": "Qwen Web",
    },
    "qwen-cn-web": {
      "qwen-turbo": "Qwen CN Web",
    },
  };

  // Add models to whitelist
  for (const modelId of modelIds) {
    const modelKey = `${providerId}/${modelId}`;
    const alias = modelAliases[providerId]?.[modelId] || modelId;
    config.agents.defaults.models[modelKey] = { alias };
  }

  await writeConfigFile(config);
  console.log(`  > Model whitelist updated in openclaw.json`);
}

/**
 * Sync providers from agent models.json into openclaw.json.
 * Prevents first-run errors when openclaw.json models.providers is empty,
 * which causes resolveConfiguredModelRef to fall back to anthropic.
 */
async function syncModelsProvidersToConfig(): Promise<void> {
  const config = loadConfig();
  await ensureOpenClawModelsJson(config);

  const agentDir = resolveOpenClawAgentDir();
  const modelsPath = path.join(agentDir, "models.json");

  let providers: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(modelsPath, "utf8");
    const parsed = JSON.parse(raw) as { providers?: Record<string, unknown> };
    if (parsed?.providers && typeof parsed.providers === "object") {
      providers = parsed.providers;
    }
  } catch {
    return;
  }

  // Filter out web providers — they are handled by zero-token bridge, not upstream config
  const webProviderIds = new Set(WEB_MODEL_PROVIDERS.map((p) => p.id));
  const filtered = Object.fromEntries(
    Object.entries(providers).filter(([k]) => !webProviderIds.has(k)),
  );
  providers = filtered;

  if (Object.keys(providers).length === 0) {
    return;
  }

  let nextConfig: OpenClawConfig = {
    ...config,
    models: {
      ...config.models,
      mode: config.models?.mode ?? "merge",
      providers: { ...config.models?.providers, ...providers },
    },
    // Preserve existing agents.defaults.models whitelist — do NOT overwrite it.
    agents: config.agents,
  };

  // If no primary model set, use first web provider's first model to avoid anthropic fallback
  if (!resolveAgentModelPrimaryValue(config.agents?.defaults?.model)) {
    const firstEntry = Object.entries(providers).find(
      ([, p]) =>
        p &&
        typeof p === "object" &&
        Array.isArray((p as { models?: unknown[] }).models) &&
        (p as { models: { id?: string }[] }).models.length > 0,
    );
    if (firstEntry) {
      const [providerId, provider] = firstEntry;
      const firstModel = (provider as { models: { id: string }[] }).models[0];
      if (firstModel?.id) {
        nextConfig = applyAgentDefaultModelPrimary(nextConfig, `${providerId}/${firstModel.id}`);
        console.log(`  > Default model set: ${providerId}/${firstModel.id}`);
      }
    }
  }

  await writeConfigFile(nextConfig);
  console.log(`  > Synced models.providers to openclaw.json`);
}

// Web model provider definitions
interface WebModelProvider {
  id: string;
  name: string;
  loginFn: (params: {
    onProgress: (msg: string) => void;
    openUrl: (url: string) => Promise<boolean>;
  }) => Promise<unknown>;
}

const WEB_MODEL_PROVIDERS: WebModelProvider[] = [
  { id: "claude-web", name: "Claude Web", loginFn: loginClaudeWeb },
  { id: "chatgpt-web", name: "ChatGPT Web", loginFn: loginChatGPTWeb },
  { id: "deepseek-web", name: "DeepSeek Web", loginFn: loginDeepseekWeb },
  { id: "doubao-web", name: "Doubao Web", loginFn: loginDoubaoWeb },
  { id: "gemini-web", name: "Gemini Web", loginFn: loginGeminiWeb },
  { id: "glm-web", name: "GLM Web (China)", loginFn: loginZWeb },
  { id: "glm-intl-web", name: "GLM Web (International)", loginFn: loginGlmIntlWeb },
  { id: "grok-web", name: "Grok Web", loginFn: loginGrokWeb },
  { id: "kimi-web", name: "Kimi Web", loginFn: loginKimiWeb },
  { id: "perplexity-web", name: "Perplexity Web", loginFn: loginPerplexityWeb },
  { id: "qwen-web", name: "Qwen Web International (chat.qwen.ai)", loginFn: loginQwenWeb },
  { id: "qwen-cn-web", name: "Qwen Web China (qianwen.com)", loginFn: loginQwenCNWeb },
  { id: "xiaomimo-web", name: "Xiaomi Mimo Web", loginFn: loginXiaomiMimoWeb },
];

export async function runOnboardWebAuth(): Promise<void> {
  console.log("\n🦞 Web Model Auth Onboard\n");

  // Show already-authorized models
  const store = ensureAuthProfileStore();
  const authorizedModels = Object.keys(store.profiles).filter(
    (key) => key.endsWith("-web") || key.includes("-web:"),
  );

  if (authorizedModels.length > 0) {
    console.log("Authorized Web models:");
    for (const model of authorizedModels) {
      console.log(`  - ${model}`);
    }
    console.log("");
  }

  // Select models to authorize
  console.log("Select Web models to authorize (comma-separated):\n");

  for (let i = 0; i < WEB_MODEL_PROVIDERS.length; i++) {
    const provider = WEB_MODEL_PROVIDERS[i];
    const isAuthorized = authorizedModels.some((m) => m.startsWith(provider.id));
    const status = isAuthorized ? " ✓ Authorized" : "";
    console.log(`  ${i + 1}. ${provider.name}${status}`);
  }

  console.log("\n  0. Exit");
  console.log("  a. Authorize all models");
  console.log("");

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  const input = await question("Enter selection: ");

  rl.close();

  if (input.trim() === "0" || input.trim() === "") {
    console.log("Exited.");
    return;
  }

  let selectedProviders: WebModelProvider[] = [];

  if (input.trim() === "a") {
    selectedProviders = WEB_MODEL_PROVIDERS;
  } else {
    const indices = input.split(",").map((s) => parseInt(s.trim()) - 1);
    selectedProviders = indices
      .filter((i) => i >= 0 && i < WEB_MODEL_PROVIDERS.length)
      .map((i) => WEB_MODEL_PROVIDERS[i]);
  }

  if (selectedProviders.length === 0) {
    console.log("No models selected.");
    return;
  }

  console.log(`\nAuthorizing: ${selectedProviders.map((p) => p.name).join(", ")}`);

  // Model IDs for each web provider
  const providerModelIds: Record<string, string[]> = {
    "claude-web": ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-6"],
    "chatgpt-web": ["gpt-4"],
    "deepseek-web": ["deepseek-chat", "deepseek-reasoner"],
    "doubao-web": ["doubao-seed-2.0"],
    "gemini-web": ["gemini-pro", "gemini-ultra"],
    "glm-web": ["glm-4-plus"],
    "glm-intl-web": ["glm-4-plus", "glm-4-think"],
    "grok-web": ["grok-2"],
    "kimi-web": ["moonshot-v1-32k"],
    "perplexity-web": ["perplexity-web"],
    "qwen-web": ["qwen3.5-plus"],
    "qwen-cn-web": ["qwen-turbo"],
    "xiaomimo-web": ["xiaomimo-chat"],
  };

  for (const provider of selectedProviders) {
    console.log(`\nAuthorizing ${provider.name}...`);
    try {
      const result = await provider.loginFn({
        onProgress: (msg) => console.log(`  > ${msg}`),
        openUrl: async (url) => {
          console.log(`  > Opening browser: ${url}`);
          return true;
        },
      });

      if (result && typeof result === "object") {
        await saveWebModelCredentials(provider.id, result);
      }

      const modelIds = providerModelIds[provider.id] || [];
      if (modelIds.length > 0) {
        await addModelToWhitelist(provider.id, modelIds);
      }

      console.log(`  ✓ ${provider.name} authorized!`);
    } catch (error) {
      console.error(`  ✗ ${provider.name} authorization failed:`, error);
    }
  }

  if (selectedProviders.length > 0) {
    await syncModelsProvidersToConfig();
  }

  console.log("\nAuthorization complete!");
  console.log("You can now use these models in the Web UI.");
}

// Register as CLI command
export const ONBOARD_WEB_AUTH_STEP: WizardStep = {
  title: "Web Model Auth",
  description: "Authorize Web AI models (Claude, ChatGPT, DeepSeek, etc.)",
  run: async () => {
    await runOnboardWebAuth();
  },
};
