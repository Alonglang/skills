---
name: web-design-guidelines
description: 按照 Web 界面指南审查 UI 代码，检查可访问性、设计合规性和 UX 最佳实践。当被要求"审查我的 UI"、"检查可访问性"、"审计设计"、"审查 UX"或"针对最佳实践检查我的站点"时，必须触发此技能。
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web 界面指南

审查文件是否符合 Web 界面指南。

## 工作原理

1. 从下面的源 URL 获取最新指南
2. 读取指定文件（或提示用户提供文件/模式）
3. 对照获取的指南中的所有规则进行检查
4. 以简洁的 `file:line` 格式输出发现结果

## 指南来源

每次审查前获取最新指南：

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

使用 WebFetch 检索最新规则。获取的内容包含所有规则和输出格式指令。

## 使用方法

当用户提供文件或模式参数时：
1. 从上面的源 URL 获取指南
2. 读取指定文件
3. 应用获取的指南中的所有规则
4. 使用指南中指定的格式输出发现结果

如果未指定文件，请询问用户要审查哪些文件。
