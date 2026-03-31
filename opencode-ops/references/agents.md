# OpenCode & OmO Agent 系统

## OpenCode 内置 Agent 模式

### Build 模式（默认）

完整工具权限，可读写文件、执行命令。

```bash
# 在 TUI 中直接使用（默认模式）
opencode
```

### Plan 模式（只读规划）

禁用文件修改，只提出方案供用户审核后执行。

```bash
<Tab>  # TUI 中切换到 Plan 模式
# 再次 <Tab> 切换回 Build 模式
```

### 自定义 Agent

在 `opencode.json` 中定义，或在 `.opencode/agents/` 目录放置 Markdown 文件。

```jsonc
{
  "agent": {
    "security-reviewer": {
      "description": "安全代码审查，关注注入漏洞和权限问题",
      "model": "anthropic/claude-opus-4-6",
      "prompt": "You are a security expert. Look for injection, auth, and privilege issues.",
      "tools": { "write": false, "edit": false, "bash": false }
    }
  }
}
```

默认 Agent 设置：
```jsonc
{ "default_agent": "plan" }  // 默认进入规划模式
```

---

## Oh-My-OpenAgent Agent 系统

### 架构概述

```
用户请求
  ↓
[IntentGate] — 分析真实意图，防止字面误解
  ↓
[Sisyphus] — 主编排器：规划、委派、驱动完成
  ├─→ [Prometheus]    策略规划师
  ├─→ [Atlas]         执行指挥官
  ├─→ [Oracle]        架构顾问（只读）
  ├─→ [Hephaestus]    深度自主工作者
  ├─→ [Librarian]     文档/代码研究员
  ├─→ [Explore]       快速代码 grep
  ├─→ [Metis]         计划缺口分析师
  ├─→ [Momus]         计划严格审查员
  └─→ [Multimodal Looker]  视觉/截图分析
```

---

### 各 Agent 职责详解

#### Sisyphus（主编排器）

> "推石头的西西弗斯——永不停歇，永不放弃。"

**职责**：接收用户任务 → 分析意图 → 拆解并委派子任务 → 并行驱动完成 → 独立验证结果

**推荐模型**：
- **Claude Opus 4.6**（最佳体验，为 Claude 优化）
- **Claude Sonnet 4.6**（成本效益平衡）
- **Kimi K2.5**（优秀的 Claude-like 替代）
- **GLM 5**（Z.ai 可用）

**触发方式**：直接对话或输入 `ultrawork` / `ulw`

---

#### Hephaestus（深度自主工作者）

> "真正的工匠——GPT 原生，端到端执行。"

**职责**：接收目标（非步骤），自主探索代码库、研究模式、端到端实现

**推荐模型**：GPT-5.4（深度编码推理）

**使用场景**：
- 复杂多文件架构重构
- 跨域知识综合调试
- 需要 GPT-5.4 特有深度推理的任务
- 作为 Anthropic 封锁后的主力 GPT 工作者

**显式切换**：`@hephaestus 你的任务`

---

#### Prometheus（策略规划师）

> "盗火的普罗米修斯——在编写任何代码前先建立完整计划。"

**职责**：采访模式 → 识别范围和歧义 → 构建详细计划 → 移交给 Atlas 执行

**推荐模型**：Claude Opus 4.6 / Kimi K2.5 / GLM 5

**使用方式**：
```bash
<Tab>               # TUI 切换到 Prometheus 模式
@plan "你的任务"    # 在 Sisyphus 中委派给 Prometheus
```

**适用场景**：多天项目、关键生产变更、复杂重构、需要决策追踪时

---

#### Atlas（执行指挥官）

**职责**：接收 Prometheus 计划 → 分发任务给专业子 Agent → 跨任务积累经验 → 独立验证完成

**使用方式**：
```bash
/start-work  # 在 Prometheus 生成计划后激活 Atlas
```

---

#### Oracle（架构顾问）

**职责**：只读高智商顾问，处理架构决策和复杂调试

**推荐模型**：GPT-5.4（高变体）

**使用场景**：不熟悉的模式、安全顾虑、多系统权衡
```bash
@oracle "这个微服务应该如何处理分布式事务？"
```

---

#### Librarian（文档/代码研究员）

**职责**：文档搜索、OSS 代码搜索、保持对库 API 的最新了解

**内置 MCP**：Exa（网络搜索）、Context7（官方文档）、Grep.app（GitHub 搜索）

---

#### Explore（快速代码 grep）

**推荐模型**：Grok Code Fast 1（速度优先）

**职责**：快速代码库模式发现，轻量级搜索任务

---

#### Metis & Momus（计划质量守门）

- **Metis**：识别 Prometheus 计划中遗漏的内容
- **Momus**：严格审查计划的清晰度、可验证性和上下文充分性

---

## 工作模式

### Ultrawork 模式（自动驾驶）

```bash
ultrawork   # 或简写 ulw
```

执行流程：
1. IntentGate 分析意图
2. Sisyphus 探索代码库
3. 研究相关模式
4. 并行委派实现
5. 验证诊断结果
6. 持续直到完成（Todo Enforcer 保证不中途放弃）

**适合**：常规功能开发、重构、Bug 修复、"去做吧"式任务

---

### Prometheus 模式（精确控制）

```bash
<Tab>          # 进入 Prometheus 采访模式
# Prometheus 会问你澄清问题，建立详细计划
/start-work    # Atlas 接管并执行
```

**适合**：多天项目、关键生产变更、需要文档化决策轨迹、复杂跨系统工作

---

### Ralph Loop（自我循环直到 100% 完成）

```bash
/ulw-loop  # 自我引用循环，不达目标不停止
```

---

## 关键工具特性

### Hash-Anchored Edit Tool（零陈旧行错误）

每次编辑使用内容哈希（`LINE#ID`）验证，防止基于过期行号的编辑错误。

### LSP + AST-Grep 集成

- 工作区重命名（符号级别）
- 预构建诊断
- AST 感知重写（IDE 级别精度）

### Background Agents（并行执行）

同时启动 5+ 专业 Agent，上下文保持精简，结果就绪后汇报。

### Tmux 集成

完整交互式终端：REPL、调试器、TUI 工具全部实时运行。

### /init-deep（深度初始化）

```bash
/init-deep  # 自动生成层级 AGENTS.md 文件
```

在项目各子目录生成 AGENTS.md，提高 Agent 的代码理解精度并节省 token。

### Comment Checker（代码注释守卫）

自动检测并拒绝"AI 味"的注释，确保代码注释像高级开发者写的。
