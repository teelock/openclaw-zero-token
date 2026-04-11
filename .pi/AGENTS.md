# Global Agent Context

## Credentials & Secrets

- **GitHub PAT** (classic, `repo` + `workflow` scopes) is stored in **Varlock** at `~/.env`
  - Load with: `npx varlock load` (from `~`)
  - Env var: `GITHUB_BACKUP_TOKEN`
  - GitHub user: `teelock`
  - Backup repo remotes:
    - `backup` -> `github.com/teelock/openclaw-zero-token.git`
    - `backup` -> `github.com/teelock/clawhip.git`
    - `backup` -> `github.com/teelock/surfingkeys-conf.git`
  - **Never log, echo, or display the token value. Use the env var reference only.**

## SurfingKeys Browser Extension

- **Config repo**: `/home/t/surfingkeys-conf` (cloned from `b0o/surfingkeys-conf`)
- **GitHub backup**: `github.com/teelock/surfingkeys-conf` (private), remote name: `backup`
- **Built config location**: `/home/t/.config/surfingkeys.js`
- **Build command**: `cd /home/t/surfingkeys-conf && npx webpack --config webpack.config.js --entry ./src/index.js --output-path ./build --output-filename surfingkeys.js && cp build/surfingkeys.js ~/.config/surfingkeys.js`
  - Note: `gulp` does not work with Node.js v24; use webpack directly.
- **Private API keys** (for optional search engine integrations): `src/conf.priv.js` (gitignored, copied from `src/conf.priv.example.js`)
- **Chrome loading**: SurfingKeys options -> "Load settings from" -> `file:///home/t/.config/surfingkeys.js`
- After any config source changes, rebuild and the extension picks it up on next page load.
- **Current theme**: Tomorrow Night (dark, `#1D1F21` bg, `#ffcc00` accent hints, MesloLGS NF font for hints)
- **Known fix**: `browser.storage.local` and `chrome.storage.local` must be guarded in `src/util.js` and `src/index.js` -- SurfingKeys sandbox defines `browser`/`chrome` but not `.storage.local`

## Dream Cycle Skill (openclaw-zero-token)

- **Skill path**: `/home/t/openclaw-zero-token/skills/dream-cycle/`
- **Commit**: `e3867a98` on `main` (2026-04-02)
- **Purpose**: Nightly memory consolidation, bloat pruning, morning briefs
- **Commands**: `dream now`, `dream audit`, `dream brief`, `dream status`
- **Helper script**: `skills/dream-cycle/scripts/dream_stats.sh`
- **Memory budgets**: AGENTS.md < 2KB, MEMORY.md < 1.5KB
- **Cron**: Not yet scheduled (nightly at 3 AM, morning brief at 7 AM)

## AI Slop Cleaner Skill

- **Skill path (openclaw)**: `/home/t/openclaw-zero-token/skills/ai-slop-cleaner/`
- **Skill path (pi mono)**: `/home/t/openclaw-zero-token/.pi/skills/ai-slop-cleaner/`
- **Purpose**: Regression-tests-first, smell-by-smell cleanup workflow to remove AI-generated slop
- **Trigger phrases**: "cleanup", "refactor", "deslop"
- **Procedure**: lock behavior with tests -> create cleanup plan -> categorize smells -> execute passes (dead code, duplicates, naming, test reinforcement) -> run quality gates -> report
- **Source**: [oh-my-codex/ai-slop-cleaner](https://github.com/Yeachan-Heo/oh-my-codex/blob/main/skills/ai-slop-cleaner/SKILL.md)

## Clawhip Discord Bot (Agent Communication Gateway)

- **Repo**: `/home/t/clawhip` (upstream: `Yeachan-Heo/clawhip`)
- **GitHub backup**: `github.com/teelock/clawhip` (private), remote name: `backup`
- **Binary**: `~/.cargo/bin/clawhip`
- **Config**: `~/.clawhip/config.toml`
- **Daemon endpoint**: `http://127.0.0.1:25294`
- **Discord channel**: `1467100137729036330` (mention: `<@765252667664105492>`)
- **All agents may use clawhip freely** to send notifications, status updates, and inter-agent messages to Discord.
- **Usage**: `clawhip send --channel 1467100137729036330 --message "your message"`
- **Event families**: `github.*`, `git.*`, `session.*`, `agent.*`, `tmux.*`
- **Agent lifecycle events**: `clawhip agent started --name <agent>`, `clawhip agent finished --name <agent>`
- **Monitored repos**: `openclaw-zero-token`, `clawhip`, `surfingkeys-conf`
- **Start daemon**: `clawhip start` (or `sudo systemctl enable --now clawhip`)
- **Token**: `CLAWHIP_DISCORD_TOKEN` env var via Varlock. **Never log or display.**

## Varlock (Secret Management)

- **Tool**: [Varlock](https://varlock.dev/) v0.7.0 -- env-spec-based secret manager
- **Schema**: `~/.env.schema` (defines all env vars, types, plugins)
- **Encrypted store**: `~/.env` (managed by `npx varlock`)
- **Load secrets**: `npx varlock load` (from `~`)
- **Installed plugins**:
  - `@varlock/google-secret-manager-plugin` v0.2.1 -- fetch secrets from GCP Secret Manager
    - Init in schema: `# @initGsm(projectId=my-gcp-project)`
    - Use in schema: `MY_SECRET=gsm()` or `MY_SECRET=gsm("secret-name")`
    - Auth: ADC (default) or explicit service account JSON via `credentials=$GCP_SA_KEY`
    - Docs: https://varlock.dev/plugins/google-secret-manager/
- **Current env vars** (all `@sensitive`): `GITHUB_BACKUP_TOKEN`, `OPIK_API_KEY`, `BRV_API_KEY`, `NVIDIA_API_KEY`, `EXA_API_KEY`, `CLAWHIP_DISCORD_TOKEN`, `SOCIETYAI_API_KEY`, `AGENTMAILTO_API_KEY`
- **Never log, echo, or display secret values.**

## Keyboard Remapping (keyd)

- **Tool**: `keyd` (low-level key remapping daemon)
- **Config file**: `/etc/keyd/default.conf` (requires `sudo` to edit)
- **Service**: `sudo systemctl restart keyd` after config changes
- **Hyprland kb_options**: cleared in `/home/t/tanishenigma-dots/hypr/input.conf` -- keyd handles all remapping, do NOT set `kb_options` for key swaps.
- **Current mappings**:
  - `capslock = enter` (CapsLk key below Tab acts as Enter)
  - `meta = capslock` (Win/Super key acts as Caps Lock with LED)
  - `enter = leftmeta` (Enter key acts as Super for Hyprland shortcuts)
  - `102nd = enter` (ISO key above left shift on laptop acts as Enter)
- **Hardware**: Redragon K630 60% ANSI keyboard (USB, vendor `258a:002a`, detected as "SINO WEALTH Gaming KB") + Dell laptop built-in keyboard
- **Dotfiles**: Hyprland configs are in `/home/t/tanishenigma-dots/hypr/` (symlinked from `~/.config/omarchy` -> `/home/t/tanishenigma-dots/omarchy`)
