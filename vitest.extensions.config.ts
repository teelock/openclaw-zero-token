import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export default createScopedVitestConfig([
  "extensions/**/*.test.ts",
  "src/zero-token/extensions/**/*.test.ts",
]);
