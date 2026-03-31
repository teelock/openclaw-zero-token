---
children_hash: 9a494546b3d3e3c868c159b49dab9e5ffdbdbbd4f062737758db22b1b6380c1d
compression_ratio: 0.6852173913043478
condensation_order: 1
covers: [lossless_claw_plugin.md, lossless_claw_plugin/_index.md]
covers_token_total: 575
summary_level: d1
token_count: 394
type: summary
---

# Lossless-Claw Plugin Summary

The Lossless-Claw plugin functions as the primary context engine (`plugins.slots.contextEngine`) for the OpenClaw system, handling conversation summarization and session lifecycle management. Implementation details are defined in `lossless_claw_configuration.md` and the plugin schema, while architectural documentation is maintained in `lossless_claw_plugin.md`.

## Configuration Overview

The plugin relies on schema-driven configuration via `.openclaw-upstream-state/extensions/lossless-claw/openclaw.plugin.json`. Key parameters include:

- **Summarization**: Uses `gpt-4` via `chatgpt-web` with an incremental depth of 1.
- **Session Lifecycle**: Fresh tail count is set to 64; session idle timeout is 7 days (10,080 minutes).
- **Storage**: Database located at `~/.openclaw/lcm.db`.
- **Exclusions**: Explicitly ignores session patterns matching `agent:*:cron:**` to protect background tasks.

## Architectural Requirements

- **Integration**: Requires `opik-openclaw` to be defined in `plugins.allow`.
- **Gateway**: The system depends on the gateway service defined at `~/.config/systemd/user/openclaw-gateway.service`, which sources secrets from `/home/t/.env`.
- **Plugin Schema**: Supports configurable thresholds for context, incremental compaction, and provider/model overrides.

## Key Facts

- Lossless-claw is the designated context engine.
- Plugin schema supports `contextThreshold`, `incrementalMaxDepth`, `freshTailCount`, and `dbPath`.
- Plugin definitions must be explicitly declared in the system's `plugins.allow` array.
