/**
 * Thin re-export: Web stream factories live under `src/zero-token/streams/`.
 * Core import sites (e.g. attempt.ts, compact.ts) keep this stable path.
 */
export {
  getWebStreamFactory,
  listWebStreamApiIds,
  type WebStreamApiId,
} from "../zero-token/streams/web-stream-factories.js";
