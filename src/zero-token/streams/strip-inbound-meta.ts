/**
 * Strip inbound metadata blocks injected by OpenClaw into user messages.
 * Web models have no knowledge of OpenClaw internals and will produce
 * garbage when they see these metadata blocks.
 */
export function stripInboundMeta(text: string): string {
  return text
    .replace(
      /(?:Conversation info|Sender|Thread starter|Replied message|Forwarded message context|Chat history since last reply)\s*\(untrusted[^)]*\):\s*```json\n[\s\S]*?```\s*/g,
      "",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
