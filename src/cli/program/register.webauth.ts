import type { Command } from "commander";
import { runOnboardWebAuth } from "../../commands/onboard-web-auth.js";

export function registerWebauthCommand(program: Command): void {
  program
    .command("webauth")
    .description("Authorize Web AI models (Claude, ChatGPT, DeepSeek, etc.)")
    .action(async () => {
      await runOnboardWebAuth();
    });
}
