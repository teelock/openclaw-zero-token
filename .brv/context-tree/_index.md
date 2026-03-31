---
children_hash: 1bf9b9a180b80306c1924d858108585bfbccea7c4592a68d461c73439b3f6230
compression_ratio: 0.3851132686084142
condensation_order: 3
covers: [config/_index.md, design/_index.md, plugins/_index.md]
covers_token_total: 1236
summary_level: d3
token_count: 476
type: summary
---

# System Structural Summary (d3)

This summary synthesizes the architectural domains of the OpenClaw system, encompassing API configuration, session lifecycle management, and the plugin ecosystem.

## Web Provider API Configuration

- **Architecture**: Utilizes Chrome DevTools Protocol (CDP) for browser-based routing to bypass direct API key reliance.
- **Core Logic**: Defined in `src/config/types.models.ts` via `MODEL_APIS`.
- **Integrity**: Schema synchronization with `schema.base.generated.ts` is mandatory for all model modifications.
- **Reference**: `web_provider_api_configuration.md`

## Session Watchdog System

- **Function**: Automated lifecycle management for AI provider authentication via proactive session refreshing.
- **Implementation**:
  - Service: `src/zero-token/session-watchdog.ts`
  - Gateway: `src/hooks/bundled/session-watchdog/handler.ts`
- **Operational Constraints**:
  - 6-hour expiration threshold for mandatory refresh.
  - Requires `python3` and `playwright-core` with persistent Chrome data access.
  - Uses temporary SQLite file copies to prevent locking.
- **References**: `context.md`, `session_watchdog.md`

## Plugin Architecture

The system supports extensible functionality via the following modules:

### Lossless-Claw Plugin

- **Role**: Primary context engine (`plugins.slots.contextEngine`).
- **Deployment**: Managed via systemd service and configured in `.openclaw-upstream-state/extensions/lossless-claw/openclaw.plugin.json`.
- **Features**: Supports incremental compaction and model overrides.
- **Reference**: `lossless_claw_plugin.md`

### Opik Observability Plugin

- **Role**: Trace telemetry provider for the "openclaw" project on Opik Cloud.
- **Integration**: Located in `.openclaw-upstream-state/extensions/opik-openclaw/`; requires `OPIK_API_KEY` in `~/.env`.
- **Reference**: `opik_plugin.md`
