// Narrow plugin-sdk surface for the bundled askonce plugin.
// Keep this list additive and scoped to symbols used under extensions/askonce.

import type { Command } from "commander";
export { emptyPluginConfigSchema } from "../plugins/config-schema.js";
export type { OpenClawPluginApi } from "../plugins/types.js";

// Re-export CLI context type
export type OpenClawPluginCliContext = {
  program: Command;
  config: import("../config/config.js").OpenClawConfig;
  workspaceDir?: string;
  logger: import("../plugins/types.js").PluginLogger;
};
