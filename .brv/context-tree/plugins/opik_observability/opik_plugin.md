---
title: Opik Plugin
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: "2026-03-31T13:24:55.341Z"
updatedAt: "2026-03-31T13:24:55.341Z"
---

## Raw Concept

**Task:**
Document Opik observability plugin configuration

**Files:**

- .openclaw-upstream-state/extensions/opik-openclaw/

**Timestamp:** 2026-03-31

**Author:** meowso

## Narrative

### Structure

Plugin installed at .openclaw-upstream-state/extensions/opik-openclaw/

### Dependencies

Requires OPIK_API_KEY environment variable provided in ~/.env

### Highlights

Tracks traces to Opik Cloud (free tier) in project "openclaw". Version 0.2.9.

### Rules

Configured in plugins.entries.opik-openclaw. Plugin is not in git and is reinstallable via npm pack.

## Facts

- **opik_version**: Opik plugin version is 0.2.9 [project]
- **opik_project**: Opik traces project is openclaw [project]
