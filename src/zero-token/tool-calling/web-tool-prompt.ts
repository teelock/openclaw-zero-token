/**
 * Per-model tool calling prompt templates.
 *
 * Reference:
 * - Paper: https://arxiv.org/html/2407.04997v1
 * - ComfyUI LLM Party: https://github.com/heshengtao/comfyui_LLM_party
 */

import { toolDefsJson } from "./web-tool-defs.js";

const TOOL_DEFS = toolDefsJson();

const EN_TEMPLATE = `Tools: ${TOOL_DEFS}
Use tool? Reply ONLY: \`\`\`tool_json
{"tool":"name","parameters":{"k":"v"}}
\`\`\`
No tool? Answer directly.

`;

const EN_STRICT_TEMPLATE = `Tools: ${TOOL_DEFS}
Use tool? Reply ONLY: \`\`\`tool_json
{"tool":"name","parameters":{"k":"v"}}
\`\`\`
No extra text. No tool? Answer directly.

`;

const CN_TEMPLATE = `工具: ${TOOL_DEFS}
用工具则只回复: \`\`\`tool_json
{"tool":"名","parameters":{"键":"值"}}
\`\`\`
不用则直接答。

`;

/** Models that use raw API and have native tool calling — skip prompt injection */
const NATIVE_TOOL_MODELS = new Set(["claude-web", "deepseek-web", "glm-web"]);

/** Models excluded from tool calling entirely */
const EXCLUDED_MODELS = new Set(["perplexity-web"]);

/** Chinese-language models */
const CN_MODELS = new Set(["doubao-web", "qwen-cn-web", "kimi-web", "xiaomimo-web"]);

/** Models that tend to add extra text after JSON */
const STRICT_MODELS = new Set(["chatgpt-web"]);

export function shouldInjectToolPrompt(api: string): boolean {
  return !NATIVE_TOOL_MODELS.has(api) && !EXCLUDED_MODELS.has(api);
}

export function getToolPrompt(api: string): string {
  if (STRICT_MODELS.has(api)) {
    return EN_STRICT_TEMPLATE;
  }
  if (CN_MODELS.has(api)) {
    return CN_TEMPLATE;
  }
  return EN_TEMPLATE;
}

/** Format tool result for feedback to the model */
export function formatToolResult(toolName: string, result: string): string {
  return `Tool ${toolName} returned: ${result}\nPlease continue answering based on this result.`;
}
