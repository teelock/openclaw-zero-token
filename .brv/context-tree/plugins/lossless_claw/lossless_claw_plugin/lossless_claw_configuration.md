---
title: Lossless Claw Configuration
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: "2026-03-31T13:32:25.561Z"
updatedAt: "2026-03-31T13:32:25.561Z"
---

## Raw Concept

**Task:**
Update Lossless-claw configuration parameters

**Changes:**

- Increased freshTailCount to 64 (from 10)
- Set incrementalMaxDepth to 1
- Configured summaryModel to gpt-4 via chatgpt-web
- Set session reset idle window to 7 days (10080 min)

**Timestamp:** 2026-03-31

## Narrative

### Structure

The Lossless-claw plugin configuration manages conversation summarization and session lifecycle.

### Highlights

Configuration includes ignore patterns for cron jobs, database location, and session idle timeout.

### Rules

Ignore session patterns: ['agent:*:cron:**']

## Facts

- **fresh_tail_count**: Lossless-claw freshTailCount is 64 [project]
- **session_idle_window**: Lossless-claw session reset idle window is 7 days [project]
- **summary_model**: Lossless-claw summary model is gpt-4 [project]
- **lcm_db_path**: LCM database path is ~/.openclaw/lcm.db [project]
