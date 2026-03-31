---
name: opencode-ops
description: opencode 和 oh-my-opencode（oh-my-openagent / OmO）运维参考技能。遇到以下话题时必须先调用此技能：安装/升级 opencode、opencode.json 或 tui.json 配置、opencode 接入 LLM Provider（Anthropic/OpenAI/Gemini/Copilot/Kimi/GLM/Bedrock）、ultrawork 或 ulw 命令、oh-my-opencode 安装（bunx flags）、oh-my-openagent.json 的 agents 或 categories 配置、Sisyphus/Hephaestus/Oracle/Prometheus/Atlas 等 Agent 介绍或使用、opencode MCP 服务器和插件（Hooks/Events）、opencode 命令（/init-deep /connect /undo /redo /share /start-work）、opencode 或 OmO 故障排查（doctor 报错/legacy警告）。只要用户消息含 opencode、oh-my-opencode、oh-my-openagent、OmO、ultrawork、ulw、Sisyphus、Hephaestus 任一词，必须立即触发此技能。
---

# OpenCode & Oh-My-OpenAgent 运维技能

OpenCode 是开源 AI 编码 Agent（终端/桌面/IDE），支持 75+ LLM Provider。
Oh-My-OpenAgent（OmO，包名 `oh-my-opencode`）是其多模型 Agent 编排增强层，核心词：`ultrawork`。

---

## 架构速览

```
用户输入
  │
  ▼
[IntentGate] ← 分析真实意图
  │
  ▼
[Sisyphus] ← 主编排器（Claude Opus 4.6 / Kimi K2.5 / GLM 5）
  │
  ├─→ [Prometheus]   策略规划，Press Tab 进入
  ├─→ [Atlas]        执行计划，/start-work 触发
  ├─→ [Oracle]       架构咨询（GPT-5.4，只读）
  ├─→ [Hephaestus]   深度自主工作者（GPT-5.4）
  ├─→ [Librarian]    文档/代码搜索
  └─→ [Explore]      快速 grep（Grok Code Fast 1）

OpenCode 核心工具层（LSP + AST-Grep + Tmux + Hash-Anchored Edit）
```

---

## 运维任务导航

| 场景 | 参考文档 | 核心内容 |
|------|---------|---------|
| 🚀 安装/升级 OpenCode + OmO | [install.md](references/install.md) | 一键脚本、bunx flags、doctor 验证 |
| ⚙️ opencode.json / tui.json 配置 | [config.md](references/config.md) | 完整 schema、优先级、常用示例 |
| 🔌 接入 LLM Provider | [providers.md](references/providers.md) | /connect、Antigravity OAuth、多账号 |
| 🤖 OpenCode Agents 与 OmO Agent 系统 | [agents.md](references/agents.md) | 各 Agent 职责、ultrawork、Prometheus模式 |
| 📋 oh-my-openagent.json 配置 | [omo_config.md](references/omo_config.md) | agents/categories 配置、命名迁移 |
| 🎯 OmO 模型匹配与 Provider 分配 | [omo_models.md](references/omo_models.md) | 模型家族、Fallback链、按订阅配置 |
| 🔌 MCP 服务器 / 插件 / Hooks / CLI | [mcp_plugins.md](references/mcp_plugins.md) | MCP 配置、OAuth、Plugin 事件钩子、CLI 命令 |
| 🔧 故障排查 | [troubleshoot.md](references/troubleshoot.md) | doctor、legacy警告、认证失败、卡住 |

---

## 快速速查

### 安装（一行命令）

```bash
# OpenCode
curl -fsSL https://opencode.ai/install | bash
# 或 npm install -g opencode-ai / brew install anomalyco/tap/opencode

# OmO（让 Agent 帮你安装是推荐方式）
bunx oh-my-opencode install --no-tui \
  --claude=yes --openai=yes --gemini=no --copilot=no

# 验证
opencode --version          # 需 ≥ 1.0.150（OmO 要求）
bunx oh-my-opencode doctor  # 检查配置和模型解析
```

### OmO 核心用法

```bash
# 启动 OpenCode
cd /your/project && opencode

# 一键全自动（OmO 必杀技）
ultrawork   # 或简写 ulw

# 计划模式 → 执行模式
<Tab>        # 切换到 Prometheus（计划）模式
/start-work  # 让 Atlas 执行计划

# 深度初始化（生成层级 AGENTS.md）
/init-deep

# 复原变更
/undo   # 撤销
/redo   # 重做

# 分享会话
/share  # 生成链接并复制到剪贴板
```

### 最小 opencode.json

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-6",
  "autoupdate": true,
  "permission": {
    "edit": "ask",
    "bash": "ask"
  }
}
```

### 最小 oh-my-openagent.json

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-openagent.schema.json",
  "agents": {
    "sisyphus": { "model": "anthropic/claude-opus-4-6" },
    "oracle":   { "model": "openai/gpt-5.4" }
  }
}
```

---

## 关键版本信息（截至 2026-03）

| 组件 | 最新版本 | 说明 |
|------|---------|------|
| OpenCode | v1.3.6 | 2026-03-29 发布 |
| Oh-My-OpenAgent | v3.14.0+ | 包名仍为 `oh-my-opencode` |
| 包名迁移 | 进行中 | `opencode.json` 中改用 `oh-my-openagent` 插件名 |

> ⚠️ **重要**：OmO 包名（`oh-my-opencode`）与插件注册名（`oh-my-openagent`）不同。运行 `bunx oh-my-opencode doctor` 会提示如何迁移。
