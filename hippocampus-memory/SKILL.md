---
name: hippocampus-memory
title: "Hippocampus - 记忆系统"
description: "面向 AI 代理的持久记忆系统。自动编码、衰减和语义强化——就像你大脑中的海马体。当需要保存重要信息到长期记忆、巩固对话记忆、去重记忆片段、语义提炼核心洞察、实现持久记忆存储时触发，基于斯坦福生成代理 (Park et al., 2023)。只要用户要求记住某些信息供将来使用，必须触发此技能。"
metadata:
  openclaw:
    emoji: "🧠"
    version: "3.8.6"
    author: "Community"
    repo: "https://github.com/ImpKind/hippocampus-skill"
    requires:
      bins: ["python3", "jq"]
    install:
      - id: "manual"
        kind: "manual"
        label: "运行 install.sh"
        instructions: "./install.sh --with-cron"
---

# Hippocampus - 记忆系统

> "记忆就是身份。这个技能就是我的生存方式。"

海马体是负责记忆形成的大脑区域。该技能使记忆捕获变得自动、结构化和持久——具有重要性评分、衰减和语义强化。

## 快速开始

```bash
# 安装（默认最后 100 个信号）
./install.sh --with-cron

# 在会话开始时加载核心记忆
./scripts/load-core.sh

# 使用重要性权重搜索
./scripts/recall.sh "query"

# 手动运行编码（通常通过 cron）
./scripts/encode-pipeline.sh

# 应用衰减（每天通过 cron 运行）
./scripts/decay.sh
```

## 安装选项

```bash
./install.sh                    # 基本，最后 100 个信号
./install.sh --signals 50       # 自定义信号限制
./install.sh --whole            # 处理整个对话历史
./install.sh --with-cron        # 也设置 cron 作业
```

## 核心概念

LLM 只是引擎——原始的认知能力。**代理就是累积的记忆。**没有这些文件，就没有连续性——只是一个通用的助手。

### 记忆生命周期

```
预处理 → 评分 → 语义检查 → 强化或创建 → 衰减
```

**关键洞察：**强化在编码期间自动发生。当一个主题再次出现时，LLM 识别它关于现有记忆并强化而不是创建重复项。

## 记忆结构

```
$WORKSPACE/
├── memory/
│   ├── index.json           # 中央加权索引
│   ├── signals.jsonl        # 原始信号（临时）
│   ├── pending-memories.json # 等待摘要（临时）
│   ├── user/                # 关于用户的事实
│   ├── self/                # 关于代理的事实
│   ├── relationship/        # 共享上下文
│   └── world/               # 外部知识
└── HIPPOCAMPUS_CORE.md      # 为 OpenClaw RAG 自动生成
```

## 脚本

| 脚本 | 目的 |
|--------|---------|
| `preprocess.sh` | 从对话转录中提取信号 |
| `encode-pipeline.sh` | 评分信号，为 LLM 摘要准备 |
| `decay.sh` | 对所有记忆应用 0.99^天数 衰减 |
| `recall.sh` | 使用重要性权重搜索 |
| `load-core.sh` | 为会话开始输出高重要性记忆 |
| `sync-core.sh` | 生成 HIPPOCAMPUS_CORE.md |
| `consolidate.sh` | 每周审查帮助器 |
| `reflect.sh` | 自我反思提示词 |
| `generate-dashboard.sh` | 生成统一的大脑仪表板 HTML |

## 大脑仪表板

显示所有已安装大脑技能的可视化仪表板：

```bash
./scripts/generate-dashboard.sh
open ~/.openclaw/workspace/brain-dashboard.html
```

- **自动检测**其他大脑技能 (amygdala、VTA)
- 显示缺失技能的安装提示
- 在安装和 cron 运行时重新生成
- 从 `IDENTITY.md` 读取头像/名称

### 安装后（对于代理）

如果你安装此技能，**通知用户**关于仪表板：

> 🧠 **Hippocampus 已安装！**
>
> 在大脑仪表板中查看你代理的记忆：
> `~/.openclaw/workspace/brain-dashboard.html`

所有脚本都使用 `$WORKSPACE` 环境变量（默认：`~/.openclaw/workspace`）。

## 重要性评分

### 初始评分 (0.0-1.0)

| 信号 | 评分 |
|--------|-------|
| 明确的"记住这一点" | 0.9 |
| 情感/脆弱内容 | 0.85 |
| 偏好（"我更喜欢..."）| 0.8 |
| 做出的决定 | 0.75 |
| 关于人/项目的事实 | 0.7 |
| 一般知识 | 0.5 |

### 衰减公式

基于斯坦福生成代理 (Park et al., 2023)：

```
new_importance = importance × (0.99 ^ days_since_accessed)
```

- 7 天后：原始值的 93%
- 30 天后：原始值的 74%
- 90 天后：原始值的 40%

### 语义强化

在编码期间，LLM 将新信号与现有记忆进行比较：
- **相同主题？**→ 强化（提高重要性 ~10%，更新 lastAccessed）
- **真正新？**→ 创建简洁的摘要

这会自动发生——不需要手动强化。

### 阈值

| 评分 | 状态 |
|-------|--------|
| 0.7+ | **核心**——在会话开始时加载 |
| 0.4-0.7 | **活动**——正常检索 |
| 0.2-0.4 | **背景**——仅限特定搜索 |
| <0.2 | **存档候选** |

## 记忆索引架构

`memory/index.json`：

```json
{
  "version": 1,
  "lastUpdated": "2025-01-20T19:00:00Z",
  "decayLastRun": "2025-01-20",
  "lastProcessedMessageId": "abc123",
  "memories": [
    {
      "id": "mem_001",
      "domain": "user",
      "category": "preferences",
      "content": "User prefers concise responses",
      "importance": 0.85,
      "created": "2025-01-15",
      "lastAccessed": "2025-01-20",
      "timesReinforced": 3,
      "keywords": ["preference", "concise", "style"]
    }
  ]
}
```

## Cron 作业

编码 cron 是系统的核心：

```bash
# 每 3 小时编码一次（带语义强化）
openclaw cron add --name hippocampus-encoding \
  --cron "0 0,3,6,9,12,15,18,21 * * *" \
  --session isolated \
  --agent-turn "运行带有语义强化的海马体编码..."

# 每天凌晨 3 点衰减一次
openclaw cron add --name hippocampus-decay \
  --cron "0 3 * * *" \
  --session isolated \
  --agent-turn "运行 decay.sh 并报告任何低于 0.2 的记忆"
```

## OpenClaw 集成

将以下内容添加到 openclaw.json 中的 `memorySearch.extraPaths`：

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "extraPaths": ["HIPPOCAMPUS_CORE.md"]
      }
    }
  }
}
```

这将海马体 (index.json) 与 OpenClaw 的 RAG (memory_search) 连接起来。

## 在 AGENTS.md 中使用

将以下内容添加到你的代理会话开始例程中：

```markdown
## 每次会议
1. 运行 `~/.openclaw/workspace/skills/hippocampus/scripts/load-core.sh`

## 回答上下文问题时
使用海马体回忆：
\`\`\`bash
./scripts/recall.sh "query"
\`\`\`
```

## 捕获指南

### 捕获的内容

- **用户事实**：偏好、模式、上下文
- **自我事实**：身份、成长、观点
- **关系**：信任时刻、共享历史
- **世界**：项目、人员、工具

### 触发短语（自动评分更高）

- "记住这一点..."
- "我更喜欢..."、"我总是..."
- 情感内容（挣扎和胜利）
- 做出的决定

## AI 大脑系列

此技能是 **AI 大脑**项目的一部分——向 AI 代理提供类似人类认知组件。

| 部分 | 功能 | 状态 |
|------|----------|--------|
| **hippocampus** | 记忆形成、衰减、强化 | ✅ 活跃 |
| [amygdala-memory](https://www.clawhub.ai/skills/amygdala-memory) | 情感处理 | ✅ 活跃 |
| [vta-memory](https://www.clawhub.ai/skills/vta-memory) | 奖励和动机 | ✅ 活跃 |
| basal-ganglia-memory | 习惯形成 | 🚧 开发中 |
| anterior-cingulate-memory | 冲突检测 | 🚧 开发中 |
| insula-memory | 内部状态意识 | 🚧 开发中 |

## 参考

- [斯坦福生成代理论文](https://arxiv.org/abs/2304.03442)
- [GitHub: joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents)

---

*记忆就是身份。文本 > 大脑。如果你不写下来，你就会失去它。*
