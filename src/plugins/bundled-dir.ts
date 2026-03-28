import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Primary bundled extensions directory (`extensions/` at package root).
 * Kept for callers that need a single “stock” root (e.g. table display).
 */
export function resolveBundledPluginsDir(env?: NodeJS.ProcessEnv): string | undefined {
  const dirs = resolveBundledPluginSearchDirs(env);
  return dirs[0];
}

/**
 * All directories scanned for bundled plugins (stock `extensions/` plus
 * `src/zero-token/extensions/` when present).
 */
export function resolveBundledPluginSearchDirs(env?: NodeJS.ProcessEnv): string[] {
  const envSource = env ?? process.env;
  const override = envSource.OPENCLAW_BUNDLED_PLUGINS_DIR?.trim();
  if (override) {
    return [override];
  }

  const dirs: string[] = [];

  // bun --compile: ship sibling layout next to the executable.
  try {
    const execDir = path.dirname(process.execPath);
    const sibling = path.join(execDir, "extensions");
    if (fs.existsSync(sibling)) {
      dirs.push(sibling);
      const zeroTokenSibling = path.join(execDir, "src", "zero-token", "extensions");
      if (fs.existsSync(zeroTokenSibling)) {
        dirs.push(zeroTokenSibling);
      }
      return dirs;
    }
  } catch {
    // ignore
  }

  // npm/dev: walk up from this module to find `extensions/` at the package root.
  try {
    let cursor = path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 6; i += 1) {
      const extensionsDir = path.join(cursor, "extensions");
      if (fs.existsSync(extensionsDir)) {
        dirs.push(extensionsDir);
        const zeroTokenExt = path.join(cursor, "src", "zero-token", "extensions");
        if (fs.existsSync(zeroTokenExt)) {
          dirs.push(zeroTokenExt);
        }
        return dirs;
      }
      const parent = path.dirname(cursor);
      if (parent === cursor) {
        break;
      }
      cursor = parent;
    }
  } catch {
    // ignore
  }

  return dirs;
}
