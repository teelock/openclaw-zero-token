---
children_hash: 5483b26d488c91cde877520aeb4979c73772d25f9c81bcb85f7f96f8e7ec2039
compression_ratio: 0.7761194029850746
condensation_order: 2
covers: [lossless_claw/_index.md, opik_observability/_index.md]
covers_token_total: 536
summary_level: d2
token_count: 416
type: summary
---

# Structural Summary: Plugin Architecture

This summary provides a structural overview of the OpenClaw plugin ecosystem, covering the Lossless-Claw context engine and Opik observability integration.

## Lossless-Claw Plugin

Refer to `lossless_claw_plugin.md` for complete configuration and implementation details.

- **Primary Function**: Acts as the system’s primary context engine (`plugins.slots.contextEngine`).
- **Architecture**: Operates via a systemd gateway service (`~/.config/systemd/user/openclaw-gateway.service`) and is configured through `.openclaw-upstream-state/extensions/lossless-claw/openclaw.plugin.json`.
- **Configuration Requirements**: Must be explicitly enabled in `plugins.allow`. Utilizes `~/.env` for credential management via `EnvironmentFile`.
- **Key Capabilities**: Supports advanced context management including incremental compaction, configurable depth/thresholds, and model/provider overrides.
- **Schema Parameters**: Includes `contextThreshold`, `incrementalMaxDepth`, `freshTailCount`, and `dbPath`.

## Opik Observability Plugin

Refer to `opik_plugin.md` for integration and tracking specifications.

- **Primary Function**: Provides observability by tracking traces to the "openclaw" project on Opik Cloud.
- **Installation & Management**: Located at `.openclaw-upstream-state/extensions/opik-openclaw/` and managed via `plugins.entries.opik-openclaw`. Maintenance is handled via `npm pack` with the plugin excluded from git.
- **Operational Requirements**: Version 0.2.9 requires `OPIK_API_KEY` to be defined in `~/.env`.
- **Scope**: Specifically targets the free tier of Opik Cloud for trace telemetry.
