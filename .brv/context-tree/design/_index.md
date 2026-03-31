---
children_hash: f2517fa740071703f682fdbc1c35820e9595244fae30f80c194bbb0ce910d18c
compression_ratio: 0.7431372549019608
condensation_order: 2
covers: [session_watchdog/_index.md]
covers_token_total: 510
summary_level: d2
token_count: 379
type: summary
---

# Session Watchdog System Summary

The Session Watchdog is an automated lifecycle management system designed to maintain persistent authentication for AI providers. It operates by monitoring session expiration and performing proactive refreshes to prevent authentication timeouts.

## Core Architecture

- **Service Layer (`src/zero-token/session-watchdog.ts`)**: Orchestrates the full lifecycle, including cookie evaluation and refresh coordination.
- **Gateway Integration (`src/hooks/bundled/session-watchdog/handler.ts`)**: Manages startup execution and periodic scheduling.
- **Dependencies**: Relies on `python3` for SQLite database interaction, `playwright-core` for CDP-based browser automation, and requires persistent access to Chrome user data directories.

## Operational Logic

- **Monitoring**: Operates on a scheduled interval (default 2 hours) or upon gateway initialization.
- **Database Access**: Queries the Chrome Cookies SQLite database; uses a temporary file copy to avoid file-locking conflicts.
- **Refresh Trigger**: Initiates a session extension via Playwright if a session is within the 6-hour expiration threshold.
- **Error Handling**: Leverages `web-stream-retry.ts` for automated reactive retries on failed refresh attempts.

## Key Constraints

- **Thresholds**: 6-hour expiry window for mandatory refresh.
- **Execution**: Mandatory component of the gateway startup sequence.

Refer to `context.md` for implementation details and `session_watchdog.md` for core technical specifications.
