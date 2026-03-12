// Narrow plugin-sdk surface for the bundled web-models plugin.
// Keep this list additive and scoped to symbols used under extensions/web-models.

export { emptyPluginConfigSchema } from "../plugins/config-schema.js";
export { buildOauthProviderAuthResult } from "./provider-auth-result.js";
export type {
  OpenClawPluginApi,
  ProviderAuthContext,
  ProviderAuthResult,
} from "../plugins/types.js";
export type { ModelDefinitionConfig } from "../config/types.models.js";
