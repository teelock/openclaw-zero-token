---
title: Web Provider API Configuration
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: "2026-03-31T13:24:00.515Z"
updatedAt: "2026-03-31T13:24:00.515Z"
---

## Raw Concept

**Task:**
Add zero-token browser-based web provider APIs

**Changes:**

- Added deepseek-web, claude-web, chatgpt-web, doubao-web, qwen-web, qwen-cn-web, kimi-web, gemini-web, grok-web, glm-web, glm-intl-web, perplexity-web, xiaomimo-web, manus-api to MODEL_APIS

**Files:**

- src/config/types.models.ts

**Flow:**
Browser-based provider -> CDP -> model endpoint

**Timestamp:** 2026-03-31

## Narrative

### Structure

The MODEL_APIS list in src/config/types.models.ts now includes zero-token web providers.

### Highlights

These providers leverage browser-based sessions routed through CDP, enabling model access without direct API keys.

### Rules

Ensure any new web-based provider added to MODEL_APIS also has corresponding schema updates in schema.base.generated.ts.

## Facts

- **web_providers**: Added zero-token browser-based web provider APIs to MODEL_APIS [project]
- **web_providers_routing**: Web provider APIs route through CDP [project]
- **files_modified**: Modified src/config/types.models.ts and schema.base.generated.ts [project]
