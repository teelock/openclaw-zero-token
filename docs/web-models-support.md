# Web Models 支持 (Zero-Token)

本文档说明 OpenClaw Web 模型支持的架构设计。

## 概述

OpenClaw Zero-Token 项目支持使用 Web 模型（如 ChatGPT Web、Claude Web、DeepSeek Web 等），通过浏览器会话进行认证，无需 API Key。

## 架构设计

### 插件架构

Web 模型支持采用插件架构，核心代码与 OpenClaw/OpenClaw 仓库保持同步，Web 模型相关代码独立维护。

```
┌─────────────────────────────────────────────────────────────┐
│ OpenClaw 核心 (与上游同步)                                   │
│ • buildXxxWebProvider() 函数                                 │
│ • *-web-stream.ts (流处理)                                  │
│ • resolveImplicitProviders() (加载插件 + 硬编码 providers)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ web-models 插件 (独立维护: extensions/web-models/)           │
│ • 注册 provider (id, label, models, auth)                   │
│ • 当用户认证后，provider 会被加载                           │
└─────────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件                                         | 说明                                |
| -------------------------------------------- | ----------------------------------- |
| `extensions/web-models/index.ts`             | 插件主代码，注册 12 个 Web provider |
| `extensions/web-models/openclaw.plugin.json` | 插件清单                            |
| `src/plugin-sdk/web-models.ts`               | plugin-sdk 类型导出                 |
| `src/agents/models-config.providers.ts`      | 核心加载逻辑修改                    |

### 支持的 Provider

| Provider ID  | 名称                |
| ------------ | ------------------- |
| chatgpt-web  | ChatGPT Web         |
| claude-web   | Claude Web          |
| deepseek-web | DeepSeek Web        |
| doubao-web   | Doubao Web          |
| gemini-web   | Gemini Web          |
| glm-web      | GLM Web (国内)      |
| glm-intl-web | GLM Web (国际)      |
| grok-web     | Grok Web            |
| kimi-web     | Kimi Web            |
| qwen-web     | Qwen Web (阿里国内) |
| qwen-cn-web  | Qwen Web (阿里国际) |
| manus-api    | Manus API           |

## 认证流程

### 方式一：webauth 命令

```bash
# 启动 Chrome 调试模式
./start-chrome-debug.sh

# 运行授权命令
pnpm openclaw webauth
```

### 方式二：onboard 命令

```bash
pnpm openclaw onboard
```

### Chrome 调试模式配置

确保 `~/.openclaw/openclaw.json` 中配置正确的 CDP 端口：

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "defaultProfile": "chrome",
    "profiles": {
      "chrome": {
        "cdpPort": 9222,
        "attachOnly": true
      }
    }
  }
}
```

## 与上游同步

由于 Web 模型代码已移至插件，与 OpenClaw/OpenClaw 仓库同步时：

1. **核心代码**：可直接同步，无需修改
2. **Web 模型插件**：`extensions/web-models/` 目录独立维护
3. **plugin-sdk**：添加新的类型导出需要更新 `src/plugin-sdk/web-models.ts`

## 故障排除

### Chrome 未找到

运行 `start-chrome-debug.sh` 时如果提示未找到 Chrome，检查：

- Chrome 是否已安装
- 脚本中的路径检测是否覆盖了你的安装位置

### 授权失败 - token expired

如果看到 "Session detected but token expired" 错误，说明浏览器会话存在但 API token 已过期。需要重新登录。

### 端口错误

如果看到 "Failed to resolve Chrome WebSocket URL" 错误，检查：

- 配置文件中的 `cdpPort` 是否与启动的 Chrome 调试端口一致
- Chrome 调试端口默认为 9222

## 开发指南

### 添加新的 Web Provider

1. 在 `extensions/web-models/index.ts` 的 `WEB_PROVIDERS` 数组中添加新 provider
2. 在 `createWebModels()` 函数中添加模型定义
3. 创建对应的认证文件（如 `src/providers/xxx-web-auth.ts`）
4. 创建对应的流处理文件（如 `src/agents/xxx-web-stream.ts`）
5. 在 `src/commands/onboard-web-auth.ts` 中注册登录函数

---

## AskOnce 插件

### 概述

AskOnce 是一个独立插件，提供一次提问获取所有大模型答案的功能。

### 插件结构

```
extensions/askonce/
├── openclaw.plugin.json
├── package.json
└── src/
    ├── index.ts          # 插件主入口，注册 CLI
    ├── cli.ts            # CLI 命令实现
    └── askonce/          # 核心逻辑
        ├── query-orchestrator.ts
        ├── concurrent-engine.ts
        ├── adapters/      # 模型适配器
        ├── formatters/   # 输出格式化
        ├── types.ts
        ├── constants.ts
        └── index.ts
```

### 使用方式

```bash
# 提问
pnpm openclaw askonce "你的问题"

# 指定模型
pnpm openclaw askonce "你的问题" -m claude-web,deepseek-web

# 列出可用模型
pnpm openclaw askonce --list

# 输出 Markdown
pnpm openclaw askonce "你的问题" -o markdown

# 输出 JSON
pnpm openclaw askonce "你的问题" -o json
```

### 与上游同步

1. **核心代码**：可直接同步，无需修改
2. **AskOnce 插件**：`extensions/askonce/` 目录独立维护
3. **plugin-sdk**：添加新的类型导出需要更新 `src/plugin-sdk/askonce.ts`
