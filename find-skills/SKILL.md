---
name: find-skills
description: 当用户问诸如"我如何做 X"、"为 X 找一个技能"、"有没有技能可以..."、"帮我找一个...的技能"或表达对扩展能力的兴趣时，帮助用户发现和安装代理技能。只要用户在查找特定功能，且该功能很可能存在于可安装技能中，就必须触发此技能。
---

# Find Skills

此技能帮助你从开放代理技能生态系统中发现和安装技能。

## 何时使用此技能

当用户执行以下操作时使用此技能：

- 询问"我如何做 X"，其中 X 可能是具有现有技能的常见任务
- 说"为 X 找一个技能"或"是否有技能用于 X"
- 询问"你能做 X 吗"，其中 X 是专门的功能
- 表达对扩展代理能力的兴趣
- 想要搜索工具、模板或工作流程
- 提到他们希望获得特定域（设计、测试、部署等）的帮助

## 什么是 Skills CLI？

Skills CLI (`npx skills`) 是开放代理技能生态系统的包管理器。技能是使用专门的知识、工作流程和工具扩展代理能力的模块化包。

**关键命令：**

- `npx skills find [query]` - 交互式或通过关键字搜索技能
- `npx skills add <package>` - 从 GitHub 或其他来源安装技能
- `npx skills check` - 检查技能更新
- `npx skills update` - 更新所有已安装的技能

**在以下位置浏览技能：** https://skills.sh/

## 如何帮助用户查找技能

### 步骤 1：了解他们需要什么

当用户在寻求某个方面的帮助时，识别：

1. 域（例如，React、测试、设计、部署）
2. 特定任务（例如，编写测试、创建动画、审查 PR）
3. 这是足够常见的任务，技能很可能存在

### 步骤 2：搜索技能

使用相关查询运行 find 命令：

```bash
npx skills find [query]
```

例如：

- 用户问"我如何让我的 React 应用程序更快？"→ `npx skills find react performance`
- 用户问"你能帮助我进行 PR 审查吗？"→ `npx skills find pr review`
- 用户问"我需要创建一个变更日志"→ `npx skills find changelog`

命令将返回如下结果：

```
使用 npx skills add <owner/repo@skill> 安装

vercel-labs/agent-skills@vercel-react-best-practices
└ https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices
```

### 步骤 3：向用户展示选项

当你找到相关技能时，向用户展示：

1. 技能名称和它的作用
2. 他们可以运行的安装命令
3. 用于了解更多信息的 skills.sh 链接

示例响应：

```
我找到了一个可能有帮助的技能！"vercel-react-best-practices" 技能提供了来自 Vercel 工程的 React 和 Next.js 性能优化指南。

要安装它：
npx skills add vercel-labs/agent-skills@vercel-react-best-practices

了解更多：https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices
```

### 步骤 4：提供安装

如果用户想要继续，你可以为他们安装技能：

```bash
npx skills add <owner/repo@skill> -g -y
```

`-g` 标志全局安装（用户级别），`-y` 跳过确认提示。

## 常见技能类别

搜索时，请考虑这些常见类别：

| 类别        | 示例查询                          |
| --------------- | ---------------------------------------- |
| Web 开发 | react、nextjs、typescript、css、tailwind |
| 测试         | testing、jest、playwright、e2e           |
| DevOps          | deploy、docker、kubernetes、ci-cd        |
| 文档   | docs、readme、changelog、api-docs        |
| 代码质量    | review、lint、refactor、best-practices   |
| 设计          | ui、ux、design-system、accessibility     |
| 生产力    | workflow、automation、git                |

## 有效搜索的提示

1. **使用特定的关键字**："react testing" 比仅仅使用 "testing" 更好
2. **尝试替代术语**：如果 "deploy" 不起作用，请尝试 "deployment" 或 "ci-cd"
3. **检查流行的来源**：许多技能来自 `vercel-labs/agent-skills` 或 `ComposioHQ/awesome-claude-skills`

## 未找到技能时

如果没有相关的技能存在：

1. 确认未找到现有技能
2. 提议使用你的一般能力直接帮助处理该任务
3. 建议用户可以使用 `npx skills init` 创建自己的技能

示例：

```
我搜索了与"xyz"相关的技能，但没有找到任何匹配项。
我仍然可以直接帮助你完成这个任务！你想让我继续吗？

如果你经常做这个，你可以创建自己的技能：
npx skills init my-xyz-skill
```
