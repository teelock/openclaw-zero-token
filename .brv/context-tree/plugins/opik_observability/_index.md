---
children_hash: d7b3372bcb14a4df36bdb68f238e58871a9aeaa51bb8d0951cc12c683f040291
compression_ratio: 0.7142857142857143
condensation_order: 1
covers: [opik_plugin.md]
covers_token_total: 217
summary_level: d1
token_count: 155
type: summary
---

# Opik Plugin Overview

The Opik Plugin facilitates observability for OpenClaw by tracking traces to the "openclaw" project on Opik Cloud.

## Configuration and Management

- **Installation Path:** `.openclaw-upstream-state/extensions/opik-openclaw/`
- **Configuration:** Managed via `plugins.entries.opik-openclaw`
- **Environment:** Requires `OPIK_API_KEY` set in `~/.env`
- **Maintenance:** The plugin is excluded from git and is maintained via `npm pack`.

## Key Details

- **Version:** 0.2.9
- **Scope:** Tracks traces to the free tier of Opik Cloud.
- **Drill-down:** For further details, refer to `opik_plugin.md`.
