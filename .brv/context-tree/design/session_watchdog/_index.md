---
children_hash: 2dd6cce4541a702b2f59fef4dc340d5eef636438aacfb2e4a823c0b59e88d627
compression_ratio: 0.9024390243902439
condensation_order: 1
covers: [context.md, session_watchdog.md]
covers_token_total: 492
summary_level: d1
token_count: 444
type: summary
---

# Session Watchdog Structural Summary

The Session Watchdog is an automated system designed to maintain persistent authentication for web-based AI providers by proactively managing session lifecycles. It prevents authentication timeouts through scheduled monitoring and CDP-based refreshes.

## Core Components

- **Core Service (`src/zero-token/session-watchdog.ts`)**: Manages the provider session lifecycle, including cookie evaluation and refresh workflow coordination.
- **Gateway Hook (`src/hooks/bundled/session-watchdog/handler.ts`)**: Triggers the watchdog process during gateway startup and at regular intervals.

## Operational Workflow

1. **Startup/Interval Execution**: The system initiates at gateway startup and runs periodically (default 2-hour interval).
2. **Cookie Inspection**: Queries browser session status by accessing the Chrome Cookies SQLite database. To prevent file locking issues, the system operates on a temporary copy of the database.
3. **Session Refresh**: If a session is within the 6-hour expiry threshold, the watchdog uses Playwright (CDP) to interact with the provider URL, refreshing cookies to extend the session.

## Architectural Requirements

- **Dependencies**: Requires `python3` for database queries, `playwright-core` for browser automation, and access to Chrome user data.
- **Error Handling**: Reactive retries for failed sessions are managed by `web-stream-retry.ts`.

## Key Rules & Conventions

- **Expiry Threshold**: Sessions are flagged for refresh if they are within 6 hours of expiry.
- **Execution Rules**: The watchdog is a required component of the gateway startup sequence.

For detailed implementation and configuration, refer to the source documentation in `context.md` and the `session_watchdog.md` specification.
