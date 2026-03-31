---
children_hash: da1dae7de5f36a48fd8cdbf5a92175f9c85309b680604f98216571a7d48285ad
compression_ratio: 0.8814102564102564
condensation_order: 1
covers: [web_provider_api_configuration.md]
covers_token_total: 312
summary_level: d1
token_count: 275
type: summary
---

# Web Provider API Configuration Summary

This domain tracks the integration of zero-token, browser-based web provider APIs into the core model configuration.

## Overview

The architecture enables model access through browser-based sessions, significantly reducing reliance on direct API keys by routing requests via the Chrome DevTools Protocol (CDP).

## Key Components

- **Configuration Source:** `src/config/types.models.ts` contains the `MODEL_APIS` list, which has been expanded to support a wide range of providers including DeepSeek, Claude, ChatGPT, Doubao, Qwen, Kimi, Gemini, Grok, GLM, Perplexity, Xiaomimo, and Manus.
- **Data Flow:** Browser-based provider sessions are routed through CDP to the respective model endpoints.
- **Schema Management:** Changes require synchronization with `schema.base.generated.ts` to maintain consistency.

## Architectural Constraints

- **Validation Rule:** Any addition to `MODEL_APIS` necessitates a corresponding schema update in `schema.base.generated.ts`.

For further details, refer to the full documentation in `web_provider_api_configuration.md`.
