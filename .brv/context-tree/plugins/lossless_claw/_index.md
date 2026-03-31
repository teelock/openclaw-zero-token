---
children_hash: 575185c2a0ad3241f1184e069a2e07bfef86e355db770476f2a988cb408661a0
compression_ratio: 0.80625
condensation_order: 1
covers: [lossless_claw_plugin.md]
covers_token_total: 320
summary_level: d1
token_count: 258
type: summary
---

# Structural Summary: Plugins

This summary covers the plugin architecture and the configuration of the Lossless-Claw component.

## Lossless-Claw Plugin

Refer to `lossless_claw_plugin.md` for full configuration details.

- **Role**: Serves as the primary context engine (`plugins.slots.contextEngine`).
- **Configuration**: Schema-driven via `.openclaw-upstream-state/extensions/lossless-claw/openclaw.plugin.json`.
- **Architectural Requirements**:
  - Must be explicitly enabled in `plugins.allow` alongside `opik-openclaw`.
  - Relies on a systemd gateway service located at `~/.config/systemd/user/openclaw-gateway.service`.
- **Key Features**: Supports configurable context thresholds, incremental compaction, and provider/model overrides for summarization tasks.
- **Operational Facts**:
  - Plugin schema includes parameters for `contextThreshold`, `incrementalMaxDepth`, `freshTailCount`, and `dbPath`.
  - Gateway services utilize `EnvironmentFile=/home/t/.env` for secure credential management.
