---
children_hash: 0f97ebf52fd70c4abf40db42313ad537790d5b810d1ff787bd1d51cde33320dd
compression_ratio: 0.4791021671826625
condensation_order: 3
covers: [config/_index.md, design/_index.md, plugins/_index.md]
covers_token_total: 1292
summary_level: d3
token_count: 619
type: summary
---

# Structural Summary: System Configuration, Design, and Plugins

This overview consolidates the core architectural domains of the OpenClaw system, covering API configuration, session lifecycle management, and plugin extensibility.

### 1. Web Provider API Configuration (config/)

Managed within `config/web_providers/`, this domain handles browser-based model request routing via the Chrome DevTools Protocol (CDP) to minimize direct API key exposure.

- **Core Architecture**: Requests are routed through model-specific endpoints defined in `src/config/types.models.ts` via the `MODEL_APIS` list.
- **Integrity**: Schema consistency is strictly maintained against `schema.base.generated.ts`.
- **Constraint**: Any modification to `MODEL_APIS` requires a corresponding update to the generated schema.
- **Reference**: See `web_provider_api_configuration.md` for implementation details.

### 2. Session Watchdog System (design/)

The Session Watchdog, defined in `design/session_watchdog/`, is a mandatory gateway component that ensures persistent authentication for AI providers.

- **Lifecycle Management**: Orchestrates cookie evaluation and session refreshing via `src/zero-token/session-watchdog.ts`.
- **Operational Logic**: Uses `playwright-core` to perform proactive refreshes for sessions within a 6-hour expiration threshold. Database access is performed on temporary SQLite copies to prevent file-locking during scheduled intervals (default 2 hours).
- **Error Handling**: Implements automated retries via `web-stream-retry.ts`.
- **Reference**: See `context.md` and `session_watchdog.md` for technical specifications.

### 3. Plugin Architecture (plugins/)

The system utilizes a modular plugin registry defined in `plugins/`, focusing on context management and observability.

- **Lossless-Claw Plugin**: Acts as the primary context engine (`plugins.slots.contextEngine`). It manages conversation summarization parameters (e.g., `contextThreshold`, `freshTailCount: 64`) and uses a SQLite database (`lcm.db`). It excludes `agent:*:cron:**` patterns to preserve background tasks.
- **Opik Observability Plugin**: Provides trace tracking to Opik Cloud. Requires `OPIK_API_KEY` in `~/.env` and is versioned at 0.2.9.
- **Integration**: Plugins are coupled via the `plugins.allow` configuration and share a common secret management strategy through `~/.env`.
- **Reference**: See `lossless_claw_configuration.md` and `opik_plugin.md` for specific logic and trace tracking.
