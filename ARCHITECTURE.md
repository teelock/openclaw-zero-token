# OpenClaw 架构流程图

## Web UI 模型列表的完整数据来源

---

## 第一阶段：浏览器环境准备

### start-chrome-debug.sh

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   start-chrome-debug.sh                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│   1. 检测操作系统 (mac/win/wsl/linux)                                                        │
│      └─→ 自动查找 Chrome/Chromium 路径                                                       │
│                                                                                             │
│   2. 检查端口 9222                                                                          │
│      └─→ 若已占用 → 关闭旧进程                                                               │
│                                                                                             │
│   3. 启动 Chrome 调试模式                                                                    │
│      chrome --remote-debugging-port=9222 \                                                  │
│             --user-data-dir=~/.config/chrome-openclaw-debug \                               │
│             --remote-allow-origins=*                                                        │
│                                                                                             │
│   4. 打开各平台登录页：                                                                      │
│      • https://claude.ai/new                                                                │
│      • https://chatgpt.com                                                                  │
│      • https://www.doubao.com/chat/                                                         │
│      • https://chat.qwen.ai                                                                 │
│      • https://www.kimi.com                                                                 │
│      • https://gemini.google.com/app                                                        │
│      • https://grok.com                                                                     │
│      • https://chatglm.cn                                                                   │
│                                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │   Chrome 调试模式运行中       │
                     │   端口: 9222                 │
                     │   CDP URL: http://127.0.0.1:9222
                     │                              │
                     │   用户在浏览器中登录各平台    │
                     │   (建立登录会话/cookies)     │
                     └──────────────┬───────────────┘
```

---

## 第二阶段：认证捕获

### onboard.sh

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      onboard.sh                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│   $ ./onboard.sh webauth                                                                  │
│                                                                                             │
│   1. 设置环境变量                                                                           │
│      OPENCLAW_CONFIG_PATH=.openclaw-state/openclaw.json                                     │
│      OPENCLAW_STATE_DIR=.openclaw-state                                                     │
│                                                                                             │
│   2. 运行 dist/index.mjs onboard                                                           │
│      └─→ 显示平台选择菜单                                                                    │
│                                                                                             │
│   用户选择平台 (如 deepseek-web)                                                             │
│                                                                                             │
│   3. 执行认证流程                                                                            │
│      ┌──────────────────────────────────────────────────────────────────────┐               │
│      │  src/providers/{provider}-auth.ts                                    │               │
│      │                                                                       │               │
│      │  • 连接 Chrome CDP (http://127.0.0.1:9222)                           │               │
│      │  • 导航到平台页面                                                     │               │
│      │  • 等待用户登录 (检测登录 cookie)                                     │               │
│      │  • 提取 cookies + userAgent                                          │               │
│      └──────────────────────────────────────────────────────────────────────┘               │
│                                                                                             │
│   4. 保存认证信息                                                                            │
│      ┌──────────────────────────────────────────────────────────────────────┐               │
│      │  src/commands/onboard-auth.credentials.ts                            │               │
│      │    → upsertAuthProfile()                                             │               │
│      │                                                                       │               │
│      │  写入: .openclaw-state/agents/main/agent/auth-profiles.json          │               │
│      │                                                                       │               │
│      │  {                                                                    │               │
│      │    "profiles": {                                                      │               │
│      │      "deepseek-web:default": {                                       │               │
│      │        "key": { "cookie": "...", "userAgent": "..." }                │               │
│      │      }                                                                │               │
│      │    }                                                                  │               │
│      │  }                                                                    │               │
│      └──────────────────────────────────────────────────────────────────────┘               │
│                                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────────────────────┘
                                    │
                                    │ 对每个平台重复
                                    ▼
                     ┌──────────────────────────────┐
                     │  auth-profiles.json 已填充   │
                     │  (包含所有平台的认证信息)    │
                     └──────────────────────────────┘
```

---

## 第三阶段：启动 Gateway

### server.sh

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      server.sh                                              │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│   $ ./server.sh start                                                                       │
│                                                                                             │
│   1. 设置环境变量                                                                           │
│      OPENCLAW_CONFIG_PATH=.openclaw-state/openclaw.json                                      │
│      OPENCLAW_STATE_DIR=.openclaw-state                                                     │
│      OPENCLAW_GATEWAY_PORT=3001                                                             │
│                                                                                             │
│   2. 启动 Gateway 进程                                                                       │
│      nohup node dist/index.mjs gateway --port 3001                                          │
│                                                                                             │
│   3. 等待就绪 (curl http://127.0.0.1:3001/)                                                 │
│                                                                                             │
│   4. 打开浏览器                                                                              │
│      http://127.0.0.1:3001/#token=xxx                                                       │
│                                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │   Gateway 进程启动           │
                     │   端口: 3001                 │
                     └──────────────────────────────┘
```

---

## 第四阶段：Gateway 初始化 → 生成模型目录

### dist/index.mjs gateway

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              dist/index.mjs gateway                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│   Gateway 启动时执行：                                                                       │
│                                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│   │  src/agents/models-config.ts                                                        │   │
│   │                                                                                     │   │
│   │  ensureOpenClawModelsJson(cfg)                                                      │   │
│   │                                                                                     │   │
│   │  1. 读取 openclaw.json 中的 models.providers                                        │   │
│   │     ┌─────────────────────────────────────────────────────────────────────────┐     │   │
│   │     │  .openclaw-state/openclaw.json                                           │     │   │
│   │     │                                                                           │     │   │
│   │     │  models.providers:                                                        │     │   │
│   │     │    deepseek-web:  { baseUrl, api, models: [...] }                        │     │   │
│   │     │    claude-web:    { baseUrl, api, models: [...] }                        │     │   │
│   │     │    chatgpt-web:   { baseUrl, api, models: [...] }                        │     │   │
│   │     │    doubao-web:    { baseUrl, api, models: [...] }                        │     │   │
│   │     │    gemini-web:    { baseUrl, api, models: [...] }                        │     │   │
│   │     │    grok-web:      { baseUrl, api, models: [...] }                        │     │   │
│   │     │    kimi-web:      { baseUrl, api, models: [...] }                        │     │   │
│   │     │    manus-api:     { baseUrl, api, models: [...] }                        │     │   │
│   │     │    qwen-web:      { baseUrl, api, models: [...] }                        │     │   │
│   │     │    glm-web:         { baseUrl, api, models: [...] }                        │     │   │
│   │     └─────────────────────────────────────────────────────────────────────────┘     │   │
│   │                                                                                     │   │
│   │  2. resolveImplicitProviders() - 解析隐式 providers (检查 auth-profiles.json)      │   │
│   │     ┌─────────────────────────────────────────────────────────────────────────┐     │   │
│   │     │  .openclaw-state/agents/main/agent/auth-profiles.json                    │     │   │
│   │     │                                                                           │     │   │
│   │     │  为已认证的 provider 设置 apiKey 字段                                      │     │   │
│   │     └─────────────────────────────────────────────────────────────────────────┘     │   │
│   │                                                                                     │   │
│   │  3. mergeProviders() - 合并显式 + 隐式 providers                                    │   │
│   │                                                                                     │   │
│   │  4. 写入 models.json                                                                │   │
│   │     ┌─────────────────────────────────────────────────────────────────────────┐     │   │
│   │     │  .openclaw-state/agents/main/agent/models.json                           │     │   │
│   │     │                                                                           │     │   │
│   │     │  providers:                                                               │     │   │
│   │     │    deepseek-web:  { apiKey: "...", models: [...] }                       │     │   │
│   │     │    claude-web:    { apiKey: "...", models: [...] }                       │     │   │
│   │     │    ...                                                                      │     │   │
│   │     └─────────────────────────────────────────────────────────────────────────┘     │   │
│   │                                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 第五阶段：Web UI 请求模型列表

```
┌──────────────┐     RPC: models.list {}      ┌──────────────────────────────────────────────┐
│              │ ─────────────────────────►   │  src/gateway/server-methods/models.ts        │
│   Web UI     │                              │                                              │
│  (浏览器)     │                              │  modelsHandlers["models.list"]               │
│              │                              │    → context.loadGatewayModelCatalog()       │
│              │ ◄─────────────────────────   │                                              │
│              │   { models: [...] }          └───────────────────┬──────────────────────────┘
└──────────────┘                                                   │
                                                                   ▼
                        ┌──────────────────────────────────────────────────────────────────┐
                        │  src/gateway/server-model-catalog.ts                            │
                        │                                                                  │
                        │  loadGatewayModelCatalog()                                       │
                        │    → loadModelCatalog({ config: loadConfig() })                  │
                        │                                                                  │
                        └───────────────────────────┬──────────────────────────────────────┘
                                                    │
                                                    ▼
                        ┌──────────────────────────────────────────────────────────────────┐
                        │  src/agents/model-catalog.ts                                    │
                        │                                                                  │
                        │  loadModelCatalog()                                             │
                        │                                                                  │
                        │  ┌────────────────────────────────────────────────────────────┐  │
                        │  │  1. ensureOpenClawModelsJson(cfg)                           │  │
                        │  │     → 确保 models.json 存在且是最新的                        │  │
                        │  │                                                             │  │
                        │  │  2. ensurePiAuthJsonFromAuthProfiles()                      │  │
                        │  │     → 同步 auth-profiles.json → auth.json                   │  │
                        │  │                                                             │  │
                        │  │  3. new ModelRegistry(authStorage, "models.json")           │  │
                        │  │     → pi-coding-agent 读取 models.json                      │  │
                        │  │     → 返回所有发现的模型 (~800 个，来自 20+ providers)       │  │
                        │  │                                                             │  │
                        │  │  4. ★ 关键过滤步骤 ★                                        │  │
                        │  │     configuredProviders = Set(                              │  │
                        │  │       Object.keys(cfg.models?.providers ?? {})              │  │
                        │  │         .map(p => p.toLowerCase())                          │  │
                        │  │     )                                                       │  │
                        │  │                                                             │  │
                        │  │     for (entry of registry.getAll()) {                     │  │
                        │  │       if (!configuredProviders.has(entry.provider)) {      │  │
                        │  │         continue  // 跳过未在 openclaw.json 中配置的         │  │
                        │  │       }                                                     │  │
                        │  │       models.push(entry)                                    │  │
                        │  │     }                                                       │  │
                        │  │                                                             │  │
                        │  │  5. 返回过滤后的 ModelCatalogEntry[] (~23 个模型)           │  │
                        │  └────────────────────────────────────────────────────────────┘  │
                        │                                                                  │
                        └──────────────────────────────────────────────────────────────────┘
```

---

## 完整数据流总结

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                             │
│  ┌─────────────────────┐                                                                    │
│  │ start-chrome-debug.sh│──► Chrome :9222 ──► 用户登录各平台                                │
│  └─────────────────────┘                                             │                      │
│                                                                      │                      │
│                                                                      ▼                      │
│  ┌─────────────────────┐                                   ┌─────────────────────┐           │
│  │    onboard.sh       │──► 连接 Chrome :9222 ────────────►│ 提取 cookies        │           │
│  └─────────────────────┘                                   └─────────┬───────────┘           │
│                                                                      │                      │
│                                                                      ▼                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                        .openclaw-state/agents/main/agent/                            │   │
│  │                                                                                      │   │
│  │   auth-profiles.json          models.json              auth.json                     │   │
│  │   ┌─────────────────┐        ┌─────────────────┐      ┌─────────────────┐            │   │
│  │   │ profiles: {     │        │ providers: {    │      │ (pi-coding-agent │            │   │
│  │   │   "deepseek-web │        │   deepseek-web  │      │  内部格式)       │            │   │
│  │   │   :default": {  │        │   claude-web    │      │                 │            │   │
│  │   │     key: {      │        │   chatgpt-web   │      │ 同步自          │            │   │
│  │   │       cookie    │ ────── │   ...           │ ◄──  │ auth-profiles   │            │   │
│  │   │     }           │  生成   │   glm-web         │      │ .json           │            │   │
│  │   │   }             │        │ }               │      │                 │            │   │
│  │   │ }               │        └─────────────────┘      └─────────────────┘            │   │
│  │   └─────────────────┘                                                                │   │
│  │          ▲                                    │                                      │   │
│  └──────────│────────────────────────────────────│──────────────────────────────────────┘   │
│             │                                    │                                          │
│  ┌──────────┴─────────┐                          │                                          │
│  │ .openclaw-state/   │                          │                                          │
│  │ openclaw.json      │                          │                                          │
│  │                    │                          │                                          │
│  │ models.providers:  │──────────────────────────┘                                          │
│  │   定义要使用的      │        (配置 + 认证 → models.json)                                  │
│  │   10 个 providers  │                                                                     │
│  │                    │                                                                     │
│  │ agents.defaults.   │                                                                     │
│  │ models:            │                                                                     │
│  │   定义模型别名      │                                                                     │
│  └────────────────────┘                                                                     │
│             │                                                                               │
│             │ server.sh 读取配置启动 Gateway                                                 │
│             ▼                                                                               │
│  ┌─────────────────────┐                                                                    │
│  │     server.sh       │──► Gateway :3001 ──► Web UI                                        │
│  └─────────────────────┘                           │                                         │
│                                                    │                                         │
│                                                    ▼                                         │
│                                           ┌─────────────────┐                                │
│                                           │ /models 命令    │                                │
│                                           │                 │                                │
│                                           │ 只显示配置的    │                                │
│                                           │ 10 个 providers │                                │
│                                           │ 23 个模型       │                                │
│                                           └─────────────────┘                                │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 文件关系图

```
                    ┌────────────────────────────────────────────────────────────┐
                    │                    用户操作                                │
                    │                                                            │
                    │  ./start-chrome-debug.sh  ──►  ./onboard.sh webauth  ──►  ./server.sh start
                    │        │                           │                      │     │
                    │        ▼                           ▼                      ▼     │
                    │   Chrome :9222              auth-profiles.json       Gateway   │
                    │                                    │                   :3001     │
                    │                                    │                     │       │
                    └────────────────────────────────────┼─────────────────────┼───────┘
                                                         │                     │
                    ┌────────────────────────────────────┼─────────────────────┼───────┐
                    │                    配置文件        │                     │       │
                    │                                    ▼                     ▼       │
                    │  openclaw.json ◄───────────┬── models.json ◄──── ModelRegistry │
                    │       │                     │        │                          │
                    │       │                     │        │                          │
                    │       ▼                     │        ▼                          │
                    │  providers 配置             │    过滤后模型                     │
                    │  (10 个)                    │    (只保留配置的)                 │
                    │                             │                                  │
                    │                             ▼                                  │
                    │                       auth-profiles.json                       │
                    │                             │                                  │
                    │                             ▼                                  │
                    │                       auth.json                                │
                    │                       (pi-agent 格式)                          │
                    │                                                                    │
                    └────────────────────────────────────────────────────────────────────┘
```

---

## 三个脚本的作用

| 脚本                    | 作用                            | 输出                       |
| ----------------------- | ------------------------------- | -------------------------- |
| `start-chrome-debug.sh` | 启动 Chrome 调试模式            | Chrome 进程监听 9222 端口  |
| `onboard.sh`            | 连接 Chrome，提取各平台 cookies | `auth-profiles.json`       |
| `server.sh`             | 启动 Gateway 服务               | Gateway 进程监听 3001 端口 |

---

## 关键源码文件

| 文件                                   | 作用                                          |
| -------------------------------------- | --------------------------------------------- |
| `src/providers/{provider}-auth.ts`     | 各平台的认证逻辑（连接 Chrome，提取 cookies） |
| `src/agents/models-config.ts`          | 合并配置，生成 `models.json`                  |
| `src/agents/model-catalog.ts`          | 加载模型目录，**过滤只保留配置的 providers**  |
| `src/gateway/server-methods/models.ts` | RPC `models.list` 处理器                      |
| `src/gateway/server-model-catalog.ts`  | Gateway 模型目录加载入口                      |

---

## 过滤逻辑详解

位置：`src/agents/model-catalog.ts`

```typescript
// 获取配置中定义的 providers
const configuredProviders = new Set(
  Object.keys(cfg.models?.providers ?? {}).map((p) => p.toLowerCase()),
);

// 遍历 ModelRegistry 返回的所有模型
for (const entry of registry.getAll()) {
  // 过滤：只保留配置中定义的 providers
  if (!configuredProviders.has(entry.provider.toLowerCase())) {
    continue; // 跳过未配置的 provider
  }
  models.push(entry);
}
```

**效果**：虽然 pi-coding-agent 的 `ModelRegistry` 会发现 ~800 个模型（来自 20+ 内置 providers），但最终只返回 `openclaw.json` 中配置的 10 个 providers 的 ~23 个模型。
