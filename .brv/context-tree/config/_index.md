---
children_hash: 14f86d6318aeac2220a42a203e20ccdf1af2c97094c7eb726a15f52bfae4d4bb
compression_ratio: 0.7017543859649122
condensation_order: 2
covers: [web_providers/_index.md]
covers_token_total: 342
summary_level: d2
token_count: 240
type: summary
---

# Web Provider API Configuration Summary (d2)

This domain documents the integration of zero-token, browser-based web provider APIs, utilizing the Chrome DevTools Protocol (CDP) to route model requests and minimize reliance on direct API keys.

## Key Architecture

- **Routing Mechanism:** Requests are routed via CDP to model endpoints, enabling browser-based provider sessions.
- **Core Configuration:** Defined in `src/config/types.models.ts` via the `MODEL_APIS` list. Supported providers include DeepSeek, Claude, ChatGPT, Doubao, Qwen, Kimi, Gemini, Grok, GLM, Perplexity, Xiaomimo, and Manus.
- **Consistency Requirements:** Schema integrity is managed through synchronization with `schema.base.generated.ts`.

## Architectural Constraints

- **Validation Rule:** All modifications to `MODEL_APIS` require a mandatory update to `schema.base.generated.ts`.

For comprehensive implementation details, refer to the entry: `web_provider_api_configuration.md`.
