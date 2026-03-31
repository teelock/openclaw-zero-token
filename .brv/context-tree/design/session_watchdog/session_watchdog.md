---
title: Session Watchdog
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: "2026-03-31T13:22:53.966Z"
updatedAt: "2026-03-31T13:22:53.966Z"
---

## Raw Concept

**Task:**
Document Session Watchdog

**Files:**

- src/zero-token/session-watchdog.ts
- src/hooks/bundled/session-watchdog/handler.ts

**Flow:**
Gateway startup -> Hook handler triggers watchdog -> Check Chrome cookies (SQLite) -> Identify expiring/expired sessions -> Refresh sessions via CDP (Playwright) -> Update config

**Timestamp:** 2026-03-31

**Author:** OpenClaw Team

## Narrative

### Structure

The watchdog consists of a core service (session-watchdog.ts) and a gateway hook (handler.ts). The core service maintains a list of providers (deepseek, claude, etc.) and performs cookie checks and session refreshes.

### Dependencies

Requires python3 for cookie database queries, playwright-core for browser automation, and access to Chrome user data.

### Highlights

Proactive session management prevents authentication timeouts for web-based AI providers. Reactive retries are handled by web-stream-retry.ts.

### Rules

Rule 1: Watchdog runs at gateway startup.
Rule 2: Expiry threshold defaults to 6 hours.
Rule 3: Refresh involves visiting the provider URL to trigger cookie updates.

### Examples

Cookie check uses a temporary copy of the Cookies SQLite DB to avoid file locks.

## Facts

- **session_watchdog_purpose**: Session watchdog refreshes web provider browser sessions via CDP. [project]
- **watchdog_interval**: It runs a gateway hook every 2 hours by default. [convention]
- **cookie_check_mechanism**: Chrome cookies are checked via a python3 script querying the SQLite database. [project]
- **refresh_mechanism**: Playwright is used for CDP interactions to refresh sessions. [project]
