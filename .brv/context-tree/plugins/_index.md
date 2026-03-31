---
children_hash: 9dd687f880f88bd06d9beaa10e6be3d746e6c8478f2e21ad64230d12943949f9
compression_ratio: 0.6896046852122987
condensation_order: 2
covers: [lossless_claw/_index.md, opik_observability/_index.md]
covers_token_total: 683
summary_level: d2
token_count: 471
type: summary
---

# OpenClaw Plugin Architecture Summary

This summary covers the primary extension modules for the OpenClaw system, specifically the context engine and observability framework.

## Lossless-Claw Plugin

The Lossless-Claw plugin serves as the primary context engine (`plugins.slots.contextEngine`), managing conversation summarization and session lifecycles.

- **Configuration**: Defined in `.openclaw-upstream-state/extensions/lossless-claw/openclaw.plugin.json`.
- **Parameterization**: Supports `contextThreshold`, `incrementalMaxDepth` (set to 1), `freshTailCount` (64), and a 7-day session idle timeout.
- **Storage**: Database path defaults to `~/.openclaw/lcm.db`.
- **Architectural Dependencies**: Requires `opik-openclaw` in `plugins.allow`. Relies on the gateway service at `~/.config/systemd/user/openclaw-gateway.service` with secrets sourced from `~/.env`.
- **Exclusions**: Pattern matching `agent:*:cron:**` is ignored to protect background tasks.
- **Drill-down**: See `lossless_claw_plugin.md` and `lossless_claw_configuration.md` for implementation details.

## Opik Observability Plugin

The Opik plugin provides observability by tracking OpenClaw traces to the Opik Cloud platform.

- **Configuration**: Managed via `plugins.entries.opik-openclaw` within the plugin system.
- **Installation**: Located at `.openclaw-upstream-state/extensions/opik-openclaw/`.
- **Environment**: Requires `OPIK_API_KEY` present in `~/.env`.
- **Maintenance**: Version 0.2.9; excluded from git and managed via `npm pack`.
- **Drill-down**: See `opik_plugin.md` for specific trace tracking logic.

## System Integration

The plugins are tightly coupled through the `plugins.allow` configuration. The Lossless-Claw context engine relies on the presence of the Opik plugin, and both utilize the central `~/.env` for secret management and the `plugins` registry for lifecycle orchestration.
