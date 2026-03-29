/**
 * xAI / Grok OpenAI-compatible stacks sometimes need stream-level tool-call fixes.
 * Centralize provider detection so runner code can gate wrappers without importing
 * provider-specific modules.
 */
export function isXaiProvider(provider: string, modelId: string): boolean {
  const pid = provider.trim().toLowerCase();
  if (pid === "xai" || pid === "grok" || pid === "grok-web") {
    return true;
  }
  const mid = modelId.trim().toLowerCase();
  return mid.startsWith("grok-") || mid.includes("/grok-");
}
