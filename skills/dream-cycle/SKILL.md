---
name: dream-cycle
description: |
  Nightly "dream cycle" for memory consolidation, workspace cleanup, and morning briefs.
  Use when: user wants automated memory maintenance, bloat reduction, nightly memory
  review, or a concise morning summary. Trigger on "dream now", "dream audit",
  "dream brief", "dream status", or requests for memory hygiene/compaction scheduling.
metadata: { "openclaw": { "emoji": "🌙", "requires": { "bins": ["wc", "stat", "find"] } } }
---

# Dream Cycle

Nightly memory consolidation, bloat pruning, and morning briefs for OpenClaw agents.
Based on Ray Fernando's dream cycle concept.

## Overview

The dream cycle is a periodic process where the agent:

1. **Dreams** (nightly): reviews memories, connects patterns, prunes bloat, updates QMD index.
2. **Briefs** (morning): delivers a concise summary of recent activity, patterns, and memory health.

This keeps Tier 1 memory lightweight while maintaining searchability via memory search / QMD.

## Three-Tier Memory Model

| Tier       | Cost                        | Contents                                                                |
| ---------- | --------------------------- | ----------------------------------------------------------------------- |
| **Tier 1** | ~600 tokens/turn            | `AGENTS.md`, `SOUL.md`, `USER.md` — core identity, loaded every session |
| **Tier 2** | 0 tokens (search on demand) | `MEMORY.md`, `memory/*.md` — indexed via memory search / QMD            |
| **Tier 3** | Tool tokens only            | Full disk reads — rarely needed                                         |

**Budget targets:**

- `AGENTS.md`: under 2,000 bytes
- `MEMORY.md`: under 1,500 bytes
- Daily logs (`memory/YYYY-MM-DD.md`): consolidate after 7 days

## Commands

### `dream now`

Run the full dream cycle immediately:

1. Gather stats: `bash {baseDir}/scripts/dream_stats.sh`
2. Read and audit all Tier 1 files for bloat.
3. Identify redundant, stale, or duplicated content in `MEMORY.md` and recent daily logs.
4. Consolidate: merge related entries, remove duplicates, archive stale facts to daily logs.
5. Verify Tier 1 files are within budget after changes.
6. Run `openclaw memory index --force` to refresh the search index.
7. Produce a Dream Audit Report (see template below).

### `dream audit`

Read-only audit — no changes applied:

1. Run `bash {baseDir}/scripts/dream_stats.sh`
2. Analyze each Tier 1 file for bloat, staleness, and redundancy.
3. Report findings and recommendations without modifying any files.

### `dream brief`

Generate a morning brief without running the full cycle:

1. Run `bash {baseDir}/scripts/dream_stats.sh` for current stats.
2. Read today's and yesterday's daily log (`memory/YYYY-MM-DD.md`).
3. Read `MEMORY.md` for durable context.
4. Produce a Morning Brief (see template below).

### `dream status`

Show current memory health stats:

```bash
bash {baseDir}/scripts/dream_stats.sh
```

## Dream Cycle Steps (detailed)

When running the full cycle (`dream now`), follow this order:

### 1. Gather baseline stats

```bash
bash {baseDir}/scripts/dream_stats.sh
```

### 2. Review Tier 1 files

Read `AGENTS.md`, `MEMORY.md`, `USER.md`, and `SOUL.md` (if they exist).
For each file, check:

- **Size**: is it within budget?
- **Staleness**: are there facts that are no longer true or relevant?
- **Redundancy**: is the same information repeated across files?
- **Specificity**: are there overly detailed entries that belong in daily logs instead?

### 3. Review recent daily logs

Read daily logs from the past 7 days (`memory/YYYY-MM-DD.md`).
Look for:

- Patterns and recurring themes worth promoting to `MEMORY.md`.
- One-off entries that can be dropped or consolidated.
- Cross-references between daily logs and Tier 1 files.

### 4. Consolidate and prune

Apply changes in this priority order:

1. Remove exact or near-duplicate entries across all files.
2. Move overly specific details from `MEMORY.md` / `AGENTS.md` into the relevant daily log.
3. Promote recurring patterns from daily logs into `MEMORY.md` (concisely).
4. Trim verbose entries into single-line summaries where possible.
5. Archive daily logs older than 14 days by ensuring they are indexed, then leave them on disk (do not delete).

**Always ask for confirmation before modifying `SOUL.md` or `AGENTS.md`.**
**Never delete daily log files — only consolidate their content.**

### 5. Refresh search index

```bash
openclaw memory index --force
```

### 6. Post-cycle stats

```bash
bash {baseDir}/scripts/dream_stats.sh
```

Compare before/after sizes and report savings.

## Templates

### Morning Brief

```
Morning Brief - {date}

Today: {current tasks or goals from recent memory}

Recent Activity:
- {yesterday's key events from daily log}

Patterns Noticed:
- {recurring themes from recent logs, if any}

Suggested Focus:
- {recommendations based on patterns and open items}

Memory Stats:
- AGENTS.md: {size} bytes ({over/under budget})
- MEMORY.md: {size} bytes ({over/under budget})
- Daily logs (7d): {count} files, {total_size} bytes
- Indexed chunks: {count from memory status}
```

### Dream Audit Report

```
Dream Cycle Audit - {date}

Files Analyzed:
- AGENTS.md: {size} bytes -> {ok / over budget by N bytes}
- MEMORY.md: {size} bytes -> {ok / over budget by N bytes}
- USER.md: {size} bytes -> {ok / recommend trim}
- SOUL.md: {size} bytes -> {no changes recommended}

Bloat Detected:
- {list of bloated sections with file and line range}

Actions Taken:
- {list of optimizations applied, or "audit only — no changes"}

Memory Search Status:
- Provider: {active provider}
- Indexed files: {count}
- Last index: {timestamp}

Before/After:
- Total Tier 1: {before} bytes -> {after} bytes ({delta})
```

## Cron Setup

After the first manual run, set up cron jobs for automated cycles.

### Dream Job (nightly at 3 AM)

```bash
openclaw cron add \
  --name "dream-cycle:nightly" \
  --schedule "0 3 * * *" \
  --session isolated \
  --message "Run dream cycle: dream now" \
  --delivery none
```

### Morning Brief (daily at 7 AM)

```bash
openclaw cron add \
  --name "dream-cycle:morning-brief" \
  --schedule "0 7 * * *" \
  --session isolated \
  --message "Generate morning brief: dream brief" \
  --delivery announce \
  --channel last
```

### Verify cron jobs

```bash
openclaw cron list
```

If jobs already exist, update them instead:

```bash
openclaw cron list | grep dream-cycle
# If found, use: openclaw cron edit <id> ...
```

## Notes

- The dream cycle is designed to be safe: it consolidates and trims but never deletes files.
- `SOUL.md` is treated as read-only unless the user explicitly asks for changes.
- All modifications are logged in the Dream Audit Report for review.
- If QMD backend is enabled (`memory.backend = "qmd"`), the cycle also runs `qmd update && qmd embed`.
- Memory search must be configured for the index refresh step to work.
