# Zero Token (Web models)

This directory holds **browser-based / cookie-based “web” model** implementations for the Zero Token fork.

**Documentation (product + sync + browser modes):** see **`docs/zero-token/`** ([index](../../docs/zero-token/index.md)). **Claude Web in chat:** use `/model claude-web/claude-sonnet-4-6` (full id); see [web-models-support](../../docs/zero-token/web-models-support).

## Layout

- **`providers/`** — Site clients and auth helpers (`*-web-client*.ts`, `*-web-auth.ts`).
- **`streams/`** — `StreamFn` factories and `web-stream-factories.ts` (`model.api` → factory).
- **`extensions/askonce/`** — Bundled AskOnce plugin (multi-model “ask once” CLI); workspace package `@openclaw/askonce`.

## Bridge modules (under `bridge/`)

- **`bridge/web-providers.ts`** — Web `baseUrl` / default model id exports, `discover*WebModels`, and `build*WebProvider` implementations. `models-config.providers.ts` imports these for `resolveImplicitProviders` and re-exports the public symbols for existing importers (e.g. `onboard-auth.config-core.ts`).

## Core bridge (outside this folder)

- `src/agents/web-stream-factories.ts` re-exports `getWebStreamFactory` / `listWebStreamApiIds` so `attempt.ts` / `compact.ts` keep a stable import path.
- `src/agents/models-config.providers.ts` merges implicit providers; it delegates web catalog logic to `bridge/web-providers.ts`.
- `src/commands/onboard-web-auth.ts` and `auth-choice.apply.*-web.ts` import login helpers from `../zero-token/providers/`.

Prefer adding new web providers under this tree, then wiring a thin import or re-export in the files above.
