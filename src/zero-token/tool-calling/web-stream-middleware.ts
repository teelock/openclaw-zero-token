/**
 * Web Stream Middleware — unified input/output processing for all web models.
 *
 * Input:  extract last user message → strip metadata → inject tool prompt
 * Output: parse tool calls from response → emit ToolCall events
 *
 * This middleware replaces the per-stream prompt manipulation that was
 * previously duplicated across 13 stream files.
 */

import type { StreamFn } from "@mariozechner/pi-agent-core";
import {
  createAssistantMessageEventStream,
  type AssistantMessage,
  type AssistantMessageEvent,
  type TextContent,
  type ToolCall,
} from "@mariozechner/pi-ai";
import { stripInboundMeta } from "../streams/strip-inbound-meta.js";
import { extractToolCall } from "./web-tool-parser.js";
import { shouldInjectToolPrompt, getToolPrompt } from "./web-tool-prompt.js";

/**
 * Wrap a web stream function with tool calling middleware.
 * - Rewrites context: only sends last user message + optional tool prompt
 * - Parses response: extracts tool_call JSON → emits ToolCall events
 */
export function wrapWithToolCalling(streamFn: StreamFn, api: string): StreamFn {
  return (model, context, options) => {
    const injectTools = shouldInjectToolPrompt(api) && (context.tools?.length ?? 0) > 0;

    // --- Input rewriting ---
    const messages = context.messages || [];
    const lastMsg = messages[messages.length - 1];

    // Check if this is a tool result feedback (agent loop returning tool execution results)
    if (lastMsg?.role === "toolResult") {
      const tr = lastMsg as unknown as {
        toolCallId?: string;
        toolName?: string;
        content?: Array<{ type: string; text?: string }>;
      };
      let resultText = "";
      if (Array.isArray(tr.content)) {
        for (const part of tr.content) {
          if (part.type === "text" && part.text) {
            resultText += part.text;
          }
        }
      }
      // Format tool result as a user message for web models
      const feedbackPrompt = `Tool ${tr.toolName || "unknown"} returned: ${resultText}\nPlease answer the original question based on this tool result.`;

      const feedbackContext = Object.assign({}, context, {
        messages: [{ role: "user" as const, content: feedbackPrompt }],
        tools: [] as typeof context.tools,
        systemPrompt: "",
      });
      console.log(`[WebStreamMiddleware] tool result feedback, len=${feedbackPrompt.length}`);
      return streamFn(model, feedbackContext, options);
    }

    // Extract just the last user message (web models can't handle full context)
    let userMessage = "";
    const lastUserMsg = [...messages].toReversed().find((m) => m.role === "user");
    if (lastUserMsg) {
      if (typeof lastUserMsg.content === "string") {
        userMessage = lastUserMsg.content;
      } else if (Array.isArray(lastUserMsg.content)) {
        userMessage = (lastUserMsg.content as TextContent[])
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("");
      }
    }

    // Strip OpenClaw metadata
    userMessage = stripInboundMeta(userMessage);

    if (!userMessage) {
      return streamFn(model, context, options);
    }

    // Build the prompt: tool prompt (if applicable) + user message
    const prompt = injectTools ? getToolPrompt(api) + userMessage : userMessage;

    console.log(
      `[WebStreamMiddleware] api=${api} injectTools=${injectTools} promptLen=${prompt.length} userMsgLen=${userMessage.length}`,
    );

    // Create modified context with just the user message.
    // Spread the original context to preserve the full type, then override.
    const modifiedContext = Object.assign({}, context, {
      messages: [{ role: "user" as const, content: prompt }],
      tools: [] as typeof context.tools,
      systemPrompt: "",
    });

    if (!injectTools) {
      // No tool calling — just pass through with cleaned context
      return streamFn(model, modifiedContext, options);
    }

    // --- With tool calling: wrap the output stream ---
    const originalStreamOrPromise = streamFn(model, modifiedContext, options);
    const wrappedStream = createAssistantMessageEventStream();

    // Process events from original stream
    const processEvents = async () => {
      try {
        const originalStream = await Promise.resolve(originalStreamOrPromise);
        let accumulatedText = "";
        let toolCallEmitted = false;

        for await (const event of originalStream) {
          // On stream completion, check final message for tool calls
          if (event.type === "done") {
            // Use final message content (already deduplicated by stream parser)
            // instead of accumulating text_delta events which may contain duplicates
            const finalMsg = event.message;
            if (finalMsg && Array.isArray(finalMsg.content)) {
              for (const part of finalMsg.content) {
                if (part.type === "text" && part.text) {
                  accumulatedText = part.text;
                }
              }
            }

            const toolCall = extractToolCall(accumulatedText);

            if (toolCall) {
              toolCallEmitted = true;
              const toolId = `web_tool_${Date.now()}`;

              // Emit tool call events
              const toolCallPart: ToolCall = {
                type: "toolCall",
                id: toolId,
                name: toolCall.tool,
                arguments: toolCall.parameters,
              };

              const toolMsg: AssistantMessage = {
                role: "assistant",
                content: [toolCallPart],
                stopReason: "toolUse",
                api: model.api,
                provider: model.provider,
                model: model.id,
                usage: finalMsg?.usage ?? {
                  input: 0,
                  output: 0,
                  cacheRead: 0,
                  cacheWrite: 0,
                  totalTokens: 0,
                  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
                },
                timestamp: Date.now(),
              };

              wrappedStream.push({
                type: "toolcall_start",
                contentIndex: 0,
                partial: toolMsg,
              });
              wrappedStream.push({
                type: "toolcall_end",
                contentIndex: 0,
                toolCall: toolCallPart,
                partial: toolMsg,
              });
              wrappedStream.push({
                type: "done",
                reason: "toolUse",
                message: toolMsg,
              });
            } else {
              // No tool call — forward the done event as-is
              wrappedStream.push(event);
            }
          } else if (!toolCallEmitted) {
            // Forward non-done events as-is
            wrappedStream.push(event);
          }
        }
      } catch (err) {
        wrappedStream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage: err instanceof Error ? err.message : String(err),
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
        } as AssistantMessageEvent);
      } finally {
        wrappedStream.end();
      }
    };

    queueMicrotask(() => void processEvents());
    return wrappedStream;
  };
}
