---
children_hash: 6e40ac591054cf34816e7b99ac5a06560f641431153ba524143248b985062ff6
compression_ratio: 0.6940298507462687
condensation_order: 0
covers: [lossless_claw_configuration.md]
covers_token_total: 268
summary_level: d0
token_count: 186
type: summary
---

# Lossless Claw Configuration Summary

The Lossless Claw plugin manages conversation summarization and session lifecycle management. Refer to [lossless_claw_configuration.md](lossless_claw_configuration.md) for full implementation details.

### Key Configuration Parameters

- **Fresh Tail Count**: Increased to 64 (from 10).
- **Incremental Depth**: Set to 1.
- **Summary Model**: Configured to `gpt-4` via `chatgpt-web`.
- **Session Idle Timeout**: Reset window set to 7 days (10,080 minutes).
- **Database Path**: Located at `~/.openclaw/lcm.db`.

### Architectural Constraints

- **Ignore Patterns**: The system explicitly ignores session patterns matching `agent:*:cron:**` to prevent interference with scheduled background tasks.
