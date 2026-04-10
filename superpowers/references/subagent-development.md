# Subagent-Driven Development Reference

Source: obra/superpowers subagent-driven-development skill
适用于多种 Agent（Claude Code、Copilot、OpenCode、OpenClaw 等）

## Core Principle

Fresh sub-agent per task + two-stage review (spec then quality) = high quality, fast iteration.

## 子代理调度模式

使用你的 agent 对应的子代理工具（Task/sessions_spawn 等）。传递结构化提示：

```
GOAL: [one sentence — what outcome]
CONTEXT: [plan file path + relevant background]
FILES: [specific paths to touch]
CONSTRAINTS: [TDD mandatory, no scope creep, no untested code]
VERIFY: [test command + expected output]
TASK: [paste full task text from plan doc]
```

## Per-Task Loop

For each task in the plan:

1. **Dispatch implementer sub-agent** (via Task/sessions_spawn)
   - Include: full task text, plan file path, TDD constraint
   - Wait for completion announcement

2. **Dispatch spec-reviewer sub-agent** (via Task/sessions_spawn)
   - Include: what was implemented, plan requirements, git diff
   - Must confirm: code matches spec exactly
   - If gaps found → dispatch implementer again to fix

3. **Dispatch code-quality reviewer sub-agent** (via Task/sessions_spawn)
   - Include: git diff, description of implementation
   - Must approve: clean code, no dead code, DRY, YAGNI
   - If issues found → dispatch implementer to fix, re-review

4. Mark task complete, move to next task

## After All Tasks Complete

1. Dispatch final overall reviewer sub-agent (full diff, all tasks)
2. Fix any critical/important issues found
3. Hand off to finishing-branch phase

## Implementer Sub-Agent Prompt Template

```
## 任务：<task name>

### 目标
<one sentence>

### 上下文
<why this matters, relevant background>

### 计划文件
<path to plan document>

### 文件约束
- 必须修改：<files>
- 禁止修改：<files>
- 遵循：<specific patterns or conventions>

### 验证方式
运行以下命令确认成功：
```bash
<test command>
```
期望输出：<expected output>

### TDD 约束
1. 先写失败的测试
2. 实现代码使测试通过
3. 重构（如果需要）
4. 确保所有测试通过后再提交

### 任务详情
<paste full task text from plan>
```

## Spec Reviewer Prompt Template

```
## 规范审查：<feature name>

### 实现概述
<description of what was implemented>

### 计划要求
<requirements from plan document>

### 检查清单
- [ ] 代码符合所有计划要求
- [ ] 没有遗漏的功能点
- [ ] 边界情况已处理
- [ ] 错误处理适当

### 问题
如果发现问题，详细描述：
- 位置：<file:line>
- 问题：<description>
- 建议：<how to fix>

### 结论
[ ] 批准
[ ] 需要修改
```

## Code Quality Reviewer Prompt Template

```
## 代码质量审查：<feature name>

### 实现摘要
<brief description>

### 检查清单
- [ ] 代码清晰易读
- [ ] 无死代码
- [ ] 遵循 DRY 原则
- [ ] 遵循 YAGNI 原则
- [ ] 适当错误处理
- [ ] 无硬编码敏感信息
- [ ] 测试覆盖充分

### 具体问题
列出发现的问题（如果有）

### 结论
[ ] 批准
[ ] 需要修改
```

## Tips

- **保持子代理单一职责**：每个子代理只做一件事
- **提供足够的上下文**：计划文件路径 + 相关背景
- **明确验证方式**：告诉子代理如何确认成功
- **使用结构化提示**：清晰的格式便于子代理理解
- **等待完成宣布**：不要假设子代理会立即完成
- **两阶段审查**：先规范审查，再质量审查