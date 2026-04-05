/**
 * Parse tool calls from web model text responses.
 *
 * Supports three formats (tried in order):
 * 1. Fenced: ```tool_json\n{"tool":"...","parameters":{...}}\n```
 * 2. Bare JSON: {"tool":"...","parameters":{...}}
 * 3. XML: <tool_call>{"name":"...","arguments":{...}}</tool_call>
 */

export interface ParsedToolCall {
  tool: string;
  parameters: Record<string, unknown>;
}

// Fenced code block format (most reliable)
const FENCED_REGEX = /```tool_json\s*\n?\s*(\{[\s\S]*?\})\s*\n?\s*```/;

// Bare JSON format
const BARE_JSON_REGEX = /\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"parameters"\s*:\s*(\{[\s\S]*?\})\s*\}/;

// XML tool_call format (DeepSeek compat)
const XML_TOOL_REGEX = /<tool_call[^>]*>([\s\S]*?)<\/tool_call>/;

export function extractToolCall(text: string): ParsedToolCall | null {
  // 1. Try fenced format
  const fenced = FENCED_REGEX.exec(text);
  if (fenced) {
    return parseToolJson(fenced[1]);
  }

  // 2. Try bare JSON
  const bare = BARE_JSON_REGEX.exec(text);
  if (bare) {
    try {
      const params = JSON.parse(bare[2]);
      return { tool: bare[1], parameters: params };
    } catch {
      return null;
    }
  }

  // 3. Try XML format
  const xml = XML_TOOL_REGEX.exec(text);
  if (xml) {
    return parseToolJson(xml[1]);
  }

  return null;
}

function parseToolJson(raw: string): ParsedToolCall | null {
  try {
    const cleaned = raw.trim();
    const obj = JSON.parse(cleaned);

    // ComfyUI LLM Party format: {"tool":"name","parameters":{...}}
    if (obj.tool && typeof obj.tool === "string") {
      return {
        tool: obj.tool,
        parameters: obj.parameters ?? {},
      };
    }

    // OpenAI format: {"name":"...","arguments":{...}}
    if (obj.name && typeof obj.name === "string") {
      return {
        tool: obj.name,
        parameters: obj.arguments ?? {},
      };
    }

    return null;
  } catch {
    return null;
  }
}

/** Check if text contains a tool call (quick check without full parsing) */
export function hasToolCall(text: string): boolean {
  return FENCED_REGEX.test(text) || BARE_JSON_REGEX.test(text) || XML_TOOL_REGEX.test(text);
}
