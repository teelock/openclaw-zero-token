/**
 * Core tool definitions for web models.
 * Kept minimal (~350 chars total) to avoid triggering rate limits.
 */

export interface WebToolDef {
  name: string;
  description: string;
  parameters: Record<string, string>;
}

export const WEB_CORE_TOOLS: WebToolDef[] = [
  { name: "web_search", description: "Search the web", parameters: { query: "search query" } },
  { name: "web_fetch", description: "Fetch URL content", parameters: { url: "URL to fetch" } },
  { name: "exec", description: "Run shell command", parameters: { command: "shell command" } },
  { name: "read", description: "Read file contents", parameters: { path: "file path" } },
  {
    name: "write",
    description: "Write to file",
    parameters: { path: "file path", content: "file content" },
  },
  {
    name: "message",
    description: "Send message",
    parameters: { text: "message text", channel: "channel name" },
  },
];

/** Compact JSON string of tool definitions */
export function toolDefsJson(): string {
  return JSON.stringify(
    WEB_CORE_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
  );
}
