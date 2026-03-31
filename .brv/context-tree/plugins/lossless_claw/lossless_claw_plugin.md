---
title: Lossless-Claw Plugin
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: "2026-03-31T13:23:25.647Z"
updatedAt: "2026-03-31T13:23:25.647Z"
---

## Raw Concept

**Task:**
Document Lossless-Claw plugin configuration and integration

**Changes:**

- Initial documentation of plugin schema and configuration

**Files:**

- .openclaw-upstream-state/extensions/lossless-claw/openclaw.plugin.json

**Timestamp:** 2026-03-31

## Narrative

### Structure

Lossless-claw acts as the context engine (plugins.slots.contextEngine). Configuration is schema-driven via openclaw.plugin.json.

### Dependencies

Requires opik-openclaw in plugins.allow. Gateway service defined at ~/.config/systemd/user/openclaw-gateway.service.

### Highlights

Supports context threshold, incremental compaction, and provider/model overrides for summarization and expansion.

### Rules

Both lossless-claw and opik-openclaw must be explicitly defined in the plugins.allow array.

## Facts

- **context_engine**: Lossless-claw is the designated context engine [project]
- **plugin_config**: Plugin schema supports contextThreshold, incrementalMaxDepth, freshTailCount, dbPath, etc. [project]
- **gateway_secrets**: Gateway service uses EnvironmentFile=/home/t/.env for secrets [environment]
