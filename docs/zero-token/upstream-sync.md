# 与上游 OpenClaw 同步（Zero Token）

## 改动面清单（合并时优先检查）

以下路径相对 [openclaw/openclaw](https://github.com/openclaw/openclaw) 通常为 **有意差异**，`git merge` / `git rebase` 时需人工过一遍：

### Zero Token 实现树（主体）

- **`src/zero-token/providers/`** — 各站 Web 客户端、`login*Web`、浏览器自动化
- **`src/zero-token/streams/`** — `*-web-stream.ts`、`web-stream-factories.ts`（`model.api` → `StreamFn`）
- **`src/zero-token/bridge/web-providers.ts`** — Web 的 baseUrl、默认模型、`build*WebProvider` / `discover*WebModels`
- **`src/zero-token/extensions/askonce/`** — 捆绑 AskOnce 插件（`@openclaw/askonce`）
- **`start-chrome-debug.sh`、`onboard.sh`、`server.sh`**（若存在）
- **`docs/zero-token/zero-token-requirements.md`**、**`docs/zero-token/web-models-support.md`**、**`docs/zero-token/web-models-browser-modes.md`**、**`docs/zero-token/upstream-sync.md`**（本文档）、**`docs/zero-token/index.md`**

### Agent 与 Web 流式（薄集成）

- **`src/agents/web-stream-factories.ts`** — 对 `zero-token/streams/web-stream-factories` 的 **re-export**（`attempt` / `compact` 稳定 import）
- **`src/agents/pi-embedded-runner/run/attempt.ts`** — Web 分支应 **仅** 调用 `getWebStreamFactory`，勿再内联站点协议
- **`src/agents/pi-embedded-runner/compact.ts`** — 同上
- **`src/agents/models-config.providers.ts`** — `resolveImplicitProviders` 合并各 `*-web` provider（调用 bridge 的 `build*`）

### CLI / 引导 / 认证入口

- **`src/commands/onboard-web-auth.ts`**、`src/commands/auth-choice.apply.*-web.ts` — 登录向导（内部 `import ../zero-token/providers/*-auth`）
- **`src/commands/onboard-auth.config-core.ts`** — Web 默认模型 / allowlist 等（常量从 `zero-token/bridge/web-providers` 引用）

### 配置与插件发现 / 打包

- **`src/config/types.models.ts`** — `ModelApi` 含各 `*-web`
- **`src/plugins/bundled-dir.ts`**、**`src/plugins/discovery.ts`** — 扫描 `extensions/` 与 **`src/zero-token/extensions/`**；`discoverOpenClawPlugins` 使用传入的 `env` 解析 bundled / config 目录
- **`pnpm-workspace.yaml`** — 含 `src/zero-token/extensions/*`
- **`package.json` `files`** — 含 `src/zero-token/extensions/`
- **`Dockerfile`** — 运行时 COPY `src/zero-token/extensions`
- **`scripts/sync-plugin-versions.ts`**、**`scripts/release-check.ts`** — 遍历 `extensions/` 与 `src/zero-token/extensions/`

## 根目录 README（强制保留本 fork）

仓库根目录的 **`README.md`**、**`README.zh-CN.md`** 必须 **始终使用本 fork（Zero Token）版本**，不得被上游 OpenClaw 的同名文件覆盖。

已在 **`.gitattributes`** 中为上述两文件设置 **`merge=ours`**：对 `git merge upstream/main` 时，若双方均修改过这两个文件，Git 会 **自动保留当前分支（本 fork）的版本**，无需每次手工 `checkout --ours`。

**注意：**

- 若你**有意**合并上游对 README 的某段通用修正，请在上游发布后 **手动把对应段落拷贝进本 fork README**；不要依赖 merge 自动带入整文件。
- **`git rebase upstream/main`** 时若出现 README 冲突，仍应 **保留本 fork 文案**；`merge=ours` 主要保障常规 **merge** 场景。
- 切勿对根 README 使用会丢弃本方版本的合并策略（例如误用全盘 `-X theirs`）。

## 推荐同步步骤

1. `git fetch upstream`（将 `openclaw/openclaw` 配为 `upstream`）
2. `git merge upstream/main`（或 `rebase`，按团队习惯）
3. 按本节清单解决冲突；**优先保留**上游对通用子系统的修复，再重新应用 Zero Token 的 Web 相关 hunk
4. `pnpm install && pnpm build`
5. `OPENCLAW_TEST_PROFILE=low pnpm test`（或全量 `pnpm test`，视机器资源）

## 非目标

- 不要求与上游文件级一致；要求 **行为回归**（Web 模型对话、onboard 授权）可验证。
