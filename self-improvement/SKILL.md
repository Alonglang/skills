---
name: self-improvement
description: 捕获学习、错误和更正以实现持续改进。当以下情况时使用：(1) 命令或操作意外失败，(2) 用户更正Claude（"不，那错了..."、"实际上..."），(3) 用户请求不存在的功能，(4) 外部 API 或工具失败，(5) 意识到知识过时或不正确，(6) 发现针对重复任务的更好方法。在主要任务之前还要回顾学习内容。
---

# 自我改进技能

将学习和错误记录到 markdown 文件中以实现持续改进。编码代理稍后可以将这些内容处理为修复，重要的学习内容会被提升到项目记忆中。

## 快速参考

| 情况 | 操作 |
|-----------|--------|
| 命令/操作失败 | 记录到 `.learnings/ERRORS.md` |
| 用户更正你 | 将类别为 `correction` 记录到 `.learnings/LEARNINGS.md` |
| 用户想要缺失的功能 | 记录到 `.learnings/FEATURE_REQUESTS.md` |
| API/外部工具失败 | 记录到 `.learnings/ERRORS.md`（包含集成详细信息）|
| 知识过时 | 将类别为 `knowledge_gap` 记录到 `.learnings/LEARNINGS.md` |
| 发现更好方法 | 将类别为 `best_practice` 记录到 `.learnings/LEARNINGS.md` |
| 与现有条目相似 | 使用 `**See Also**` 链接，考虑提升优先级 |
| 广泛适用的学习 | 提升到 `CLAUDE.md`、`AGENTS.md` 和/或 `.github/copilot-instructions.md` |
| 工作流改进 | 提升到 `AGENTS.md`（OpenClaw 工作区）|
| 工具陷阱 | 提升到 `TOOLS.md`（OpenClaw 工作区）|
| 行为模式 | 提升到 `SOUL.md`（OpenClaw 工作区）|

## OpenClaw 设置（推荐）

OpenClaw 是此技能的主要平台。它使用基于工作区的提示注入和自动技能加载。

### 安装

**通过 ClawdHub（推荐）：**
```bash
clawdhub install self-improving-agent
```

**手动安装：**
```bash
git clone https://github.com/peterskoett/self-improving-agent.git ~/.openclaw/skills/self-improving-agent
```

### 工作区结构

OpenClaw 将这些文件注入到每个会话中：

```
~/.openclaw/workspace/
├── AGENTS.md          # 多代理工作流、委派模式
├── SOUL.md            # 行为指南、个性、原则
├── TOOLS.md           # 工具能力、集成陷阱
├── MEMORY.md          # 长期记忆（仅主会话）
├── memory/            # 每日记忆文件
│   └── YYYY-MM-DD.md
└── .learnings/        # 此技能的日志文件
    ├── LEARNINGS.md
    ├── ERRORS.md
    └── FEATURE_REQUESTS.md
```

### 创建学习文件

```bash
mkdir -p ~/.openclaw/workspace/.learnings
```

然后创建日志文件（或从 `assets/` 复制）：
- `LEARNINGS.md` — 更正、知识差距、最佳实践
- `ERRORS.md` — 命令失败、异常
- `FEATURE_REQUESTS.md` — 用户请求的功能

### 提升目标

当学习内容被广泛适用时，将其提升到工作区文件：

| 学习类型 | 提升到 | 示例 |
|---------------|------------|---------|
| 行为模式 | `SOUL.md` | "保持简洁，避免免责声明" |
| 工作流改进 | `AGENTS.md` | "为长任务生成子代理" |
| 工具陷阱 | `TOOLS.md` | "Git 推送需要先配置身份验证" |

### 会话间通信

OpenClaw 提供工具跨会话共享学习：

- **sessions_list** — 查看活动/最近的会话
- **sessions_history** — 读取另一个会话的转录
- **sessions_send** — 向另一个会话发送学习
- **sessions_spawn** — 为后台工作生成子代理

### 可选：启用 Hook

以便在会话开始时自动提醒：

```bash
# 将 hook 复制到 OpenClaw hooks 目录
cp -r hooks/openclaw ~/.openclaw/hooks/self-improvement

# 启用它
openclaw hooks enable self-improvement
```

详细信息请参阅 `references/openclaw-integration.md`。

---

## 通用设置（其他代理）

对于 Claude Code、Codex、Copilot 或其他代理，在项目中创建 `.learnings/`：

```bash
mkdir -p .learnings
```

从 `assets/` 复制模板或创建带有标题的文件。

## 日志格式

### 学习条目

追加到 `.learnings/LEARNINGS.md`：

```markdown
## [LRN-YYYYMMDD-XXX] category

**Logged**: ISO-8601 timestamp
**Priority**: low | medium | high | critical
**Status**: pending
**Area**: frontend | backend | infra | tests | docs | config

### Summary
学习了什么的一行描述

### Details
完整上下文：发生了什么，什么错了，什么是对的

### Suggested Action
要进行的特定修复或改进

### Metadata
- Source: conversation | error | user_feedback
- Related Files: path/to/file.ext
- Tags: tag1, tag2
- See Also: LRN-20250110-001 (如果与现有条目相关)

---
```

### 错误条目

追加到 `.learnings/ERRORS.md`：

```markdown
## [ERR-YYYYMMDD-XXX] skill_or_command_name

**Logged**: ISO-8601 timestamp
**Priority**: high
**Status**: pending
**Area**: frontend | backend | infra | tests | docs | config

### Summary
失败的简要描述

### Error
```
实际错误消息或输出
```

### Context
- 尝试的命令/操作
- 使用的输入或参数
- 相关的环境详细信息

### Suggested Fix
如果可识别，可能会解决此问题的方法

### Metadata
- Reproducible: yes | no | unknown
- Related Files: path/to/file.ext
- See Also: ERR-20250110-001 (如果是重复出现的)

---
```

### 功能请求条目

追加到 `.learnings/FEATURE_REQUESTS.md`：

```markdown
## [FEAT-YYYYMMDD-XXX] capability_name

**Logged**: ISO-8601 timestamp
**Priority**: medium
**Status**: pending
**Area**: frontend | backend | infra | tests | docs | config

### Requested Capability
用户想要做什么

### User Context
为什么他们需要它，他们正在解决什么问题

### Complexity Estimate
简单 | 中等 | 复杂

### Suggested Implementation
如何构建它，它可能扩展什么

### Metadata
- Frequency: first_time | recurring
- Related Features: existing_feature_name

---
```

## ID 生成

格式：`TYPE-YYYYMMDD-XXX`
- TYPE: `LRN`（学习）、`ERR`（错误）、`FEAT`（功能）
- YYYYMMDD: 当前日期
- XXX: 顺序号或随机 3 个字符（例如，`001`、`A7B`）

示例：`LRN-20250115-001`、`ERR-20250115-A3F`、`FEAT-20250115-002`

## 解决条目

当问题得到修复时，更新条目：

1. 将 `**Status**: pending` 更改为 `**Status**: resolved`
2. 在 Metadata 后添加解决块：

```markdown
### Resolution
- **Resolved**: 2025-01-16T09:00:00Z
- **Commit/PR**: abc123 或 #42
- **Notes**: 所做内容的简要描述
```

其他状态值：
- `in_progress` - 正在积极处理
- `wont_fix` - 决定不处理（在解决说明中添加原因）
- `promoted` - 提升到 CLAUDE.md、AGENTS.md 或 .github/copilot-instructions.md

## 提升到项目记忆

当学习内容被广泛适用（不是一次性修复）时，将其提升到永久项目记忆。

### 何时提升

- 学习适用于多个文件/功能
- 任何贡献者（人类或 AI）都应该知道的知识
- 防止重复错误
- 记录项目特定惯例

### 提升目标

| 目标 | 适合的内容 |
|--------|--------------------|
| `CLAUDE.md` | 所有 Claude 交互的项目事实、惯例、陷阱 |
| `AGENTS.md` | 代理特定工作流、工具使用模式、自动化规则 |
| `.github/copilot-instructions.md` | GitHub Copilot 的项目上下文和惯例 |
| `SOUL.md` | 行为指南、沟通风格、原则（OpenClaw 工作区）|
| `TOOLS.md` | 工具能力、使用模式、集成陷阱（OpenClaw 工作区）|

### 如何提升

1. **提炼** 学习内容为简洁的规则或事实
2. **添加** 到目标文件的适当部分（如果需要则创建文件）
3. **更新** 原始条目：
   - 将 `**Status**: pending` 更改为 `**Status**: promoted`
   - 添加 `**Promoted**: CLAUDE.md`、`AGENTS.md` 或 `.github/copilot-instructions.md`

### 提升示例

**学习**（详细）：
> 项目使用 pnpm workspaces。尝试 `npm install` 但失败了。
> 锁文件是 `pnpm-lock.yaml`。必须使用 `pnpm install`。

**在 CLAUDE.md 中**（简洁）：
```markdown
## Build & Dependencies
- 包管理器：pnpm（不是 npm）- 使用 `pnpm install`
```

**学习**（详细）：
> 修改 API 端点时，必须重新生成 TypeScript 客户端。
> 忘记这一步会导致运行时类型不匹配。

**在 AGENTS.md 中**（可操作）：
```markdown
## API 更改后
1. 重新生成客户端：`pnpm run generate:api`
2. 检查类型错误：`pnpm tsc --noEmit`
```

## 重复模式检测

如果记录的内容与现有条目相似：

1. **先搜索**：`grep -r "keyword" .learnings/`
2. **链接条目**：在 Metadata 中添加 `**See Also**: ERR-20250110-001`
3. **提升优先级**（如果问题持续出现）
4. **考虑系统性修复**：重复出现的问题通常表明：
   - 缺少文档（→ 提升到 CLAUDE.md 或 .github/copilot-instructions.md）
   - 缺少自动化（→ 添加到 AGENTS.md）
   - 架构问题（→ 创建技术债务票）

## 定期审查

在自然中断点审查 `.learnings/`：

### 何时审查
- 开始新的主要任务之前
- 完成功能之后
- 在有过去学习的领域工作时
- 活跃开发期间每周

### 快速状态检查
```bash
# 统计待处理项目
grep -h "Status\*\*: pending" .learnings/*.md | wc -l

# 列出待处理的高优先级项目
grep -B5 "Priority\*\*: high" .learnings/*.md | grep "^## \["

# 查找特定领域的学习
grep -l "Area\*\*: backend" .learnings/*.md
```

### 审查操作
- 解决已修复的项目
- 提升适用的学习
- 链接相关条目
- 升级重复出现的问题

## 检测触发器

当你注意到以下情况时自动记录：

**更正**（→ 类别 `correction` 的学习）：
- "不，那不对..."
- "实际上，应该是..."
- "你关于...错了"
- "那过时了..."

**功能请求**（→ 功能请求）：
- "你也可以..."
- "我希望你能..."
- "有方法可以..."
- "为什么你不能..."

**知识差距**（→ 类别 `knowledge_gap` 的学习）：
- 用户提供你不知道的信息
- 引用的文档已过时
- API 行为与你的理解不同

**错误**（→ 错误条目）：
- 命令返回非零退出代码
- 异常或堆栈跟踪
- 意外的输出或行为
- 超时或连接失败

## 优先级指南

| 优先级 | 何时使用 |
|----------|-------------|
| `critical` | 阻塞核心功能、数据丢失风险、安全问题 |
| `high` | 重大影响、影响常见工作流、重复出现的问题 |
| `medium` | 适中影响、存在变通方法 |
| `low` | 轻微不便、边缘情况、锦上添花 |

## 区域标签

用于按代码库区域过滤学习：

| 区域 | 范围 |
|------|-------|
| `frontend` | UI、组件、客户端代码 |
| `backend` | API、服务、服务器端代码 |
| `infra` | CI/CD、部署、Docker、云 |
| `tests` | 测试文件、测试实用程序、覆盖率 |
| `docs` | 文档、注释、README |
| `config` | 配置文件、环境、设置 |

## 最佳实践

1. **立即记录** - 问题发生后上下文最新
2. **具体明确** - 未来的代理需要快速理解
3. **包含重现步骤** - 特别是对于错误
4. **链接相关文件** - 使修复更容易
5. **建议具体修复** - 不仅仅是"调查"
6. **使用一致的类别** - 启用过滤
7. **积极提升** - 如果有疑问，添加到 CLAUDE.md 或 .github/copilot-instructions.md
8. **定期审查** - 陈旧的学习会失去价值

## Gitignore 选项

**保持学习本地**（每位开发者独立）：
```gitignore
.learnings/
```

**在仓库中跟踪学习**（团队共享）：
不要添加到 .gitignore - 学习变成共享知识。

**混合**（跟踪模板，忽略条目）：
```gitignore
.learnings/*.md
!.learnings/.gitkeep
```

## Hook 集成

通过代理 hook 启用自动提醒。这是**可选的** - 你必须显式配置 hooks。

### 快速设置（Claude Code / Codex）

在项目中创建 `.claude/settings.json`：

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "./skills/self-improvement/scripts/activator.sh"
      }]
    }]
  }
}
```

这在每个提示后注入学习评估提醒（~50-100 token 开销）。

### 完整设置（带错误检测）

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "./skills/self-improvement/scripts/activator.sh"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "./skills/self-improvement/scripts/error-detector.sh"
      }]
    }]
  }
}
```

### 可用的 Hook 脚本

| 脚本 | Hook 类型 | 目的 |
|--------|-----------|---------|
| `scripts/activator.sh` | UserPromptSubmit | 提醒在任务后评估学习 |
| `scripts/error-detector.sh` | PostToolUse (Bash) | 在命令错误时触发 |

详细配置和故障排除请参阅 `references/hooks-setup.md`。

## 自动技能提取

当学习内容足够有价值成为可重用技能时，使用提供的辅助工具进行提取。

### 技能提取标准

当以下任何条件适用时，学习内容有资格进行技能提取：

| 标准 | 描述 |
|-----------|-------------|
| **重复出现** | 有 2+ 个类似问题的 `See Also` 链接 |
| **已验证** | 状态为 `resolved` 并有可工作的修复 |
| **不明显** | 需要实际调试/调查才能发现 |
| **广泛适用** | 不是项目特定的；跨代码库有用 |
| **用户标记** | 用户说"将其保存为技能"或类似的 |

### 提取工作流

1. **识别候选**：学习内容符合提取标准
2. **运行辅助工具**（或手动创建）：
   ```bash
   ./skills/self-improvement/scripts/extract-skill.sh skill-name --dry-run
   ./skills/self-improvement/scripts/extract-skill.sh skill-name
   ```
3. **自定义 SKILL.md**：用学习内容填充模板
4. **更新学习**：将状态设置为 `promoted_to_skill`，添加 `Skill-Path`
5. **验证**：在新会话中读取技能以确保它是自包含的

### 手动提取

如果你更愿意手动创建：

1. 创建 `skills/<skill-name>/SKILL.md`
2. 使用 `assets/SKILL-TEMPLATE.md` 中的模板
3. 遵循 [Agent Skills 规范](https://agentskills.io/specification)：
   - 带有 `name` 和 `description` 的 YAML frontmatter
   - Name 必须与文件夹名称匹配
   - 技能文件夹内没有 README.md

### 提取检测触发器

注意这些表明学习应该成为技能的信号：

**在对话中：**
- "将其保存为技能"
- "我一直遇到这个问题"
- "这对其他项目也会有用"
- "记住这个模式"

**在学习条目中：**
- 多个 `See Also` 链接（重复出现的问题）
- 高优先级 + 已解决状态
- 类别：具有广泛适用性的 `best_practice`
- 称赞解决方案的用户反馈

### 技能质量关卡

提取前，验证：

- [ ] 解决方案已经过测试并正常工作
- [ ] 在没有原始上下文的情况下描述清晰
- [ ] 代码示例是自包含的
- [ ] 没有项目特定的硬编码值
- [ ] 遵循技能命名约定（小写、连字符）

## 多代理支持

此技能跨不同 AI 编码代理工作，具有特定代理激活。

### Claude Code

**激活**：Hooks (UserPromptSubmit, PostToolUse)
**设置**：带有 hook 配置的 `.claude/settings.json`
**检测**：通过 hook 脚本自动进行

### Codex CLI

**激活**：Hooks（与 Claude Code 相同的模式）
**设置**：带有 hook 配置的 `.codex/settings.json`
**检测**：通过 hook 脚本自动进行

### GitHub Copilot

**激活**：手动（无 hook 支持）
**设置**：添加到 `.github/copilot-instructions.md`：

```markdown
## 自我改进

解决非明显问题后，考虑使用自我改进技能格式记录到 `.learnings/`：
1. 使用自我改进技能的格式
2. 使用 See Also 链接相关条目
3. 将高价值学习提升到技能

在聊天中询问："我应该将其记录为学习吗？"
```

**检测**：会话结束时手动审查

### OpenClaw

**激活**：工作区注入 + 代理间消息
**设置**：请参阅上面的"OpenClaw 设置"部分
**检测**：通过会话工具和工作区文件

### 代理无关指南

无论使用何种代理，执行自我改进时：

1. **发现非显而易见的内容** - 解决方案不是立即可见的
2. **纠正自己** - 最初的方法是错误的
3. **学习项目约定** - 发现未记录的模式
4. **遇到意外错误** - 特别是如果诊断困难
5. **找到更好的方法** - 改进了你最初的解决方案

### Copilot Chat 集成

对于 Copilot 用户，在相关时将其添加到提示中：

> 完成此任务后，评估是否有任何学习应该使用自我改进技能格式记录到 `.learnings/`。

或使用快速提示：
- "将其记录到学习中"
- "从此解决方案创建技能"
- "检查 .learnings/ 中的相关问题"
