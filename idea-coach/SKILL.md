---
name: idea-coach
description: 面向 AI 的想法/问题/挑战管理者，具有 GitHub 集成。捕获、分类、审查，并帮助将想法发布到仓库。
version: 0.2.0
author: moinsen-dev
commands:
  - /idea - 捕获新想法、问题或挑战
  - /idea_list - 列出活跃的想法（可选地按状态/类型过滤）
  - /idea_due - 显示待审查的想法
  - /idea_get - 获取想法的详细信息
  - /idea_update - 更新想法状态、重要性、能量
  - /idea_review - 向想法添加审查说明
  - /idea_drop - 将想法标记为丢弃（需提供原因）
  - /idea_done - 将想法标记为已完成
  - /idea_stats - 显示统计信息
  - /idea_link - 将想法链接到现有的 GitHub 仓库
  - /idea_ship - 为想法创建新的 GitHub 仓库
  - /idea_repo - 显示链接仓库的状态
  - /idea_sync - 将想法作为 GitHub 问题同步
---

# Idea Coach

> 你对于想法、问题和挑战的关键对抗伙伴——现在具有 GitHub 集成！

## 它能做什​​么

Idea Coach 帮助你：
- **捕获**想法、问题和挑战
- **按类型、领域、能量、紧迫性和重要性分类**
- **定期审查**（基于重要性的每日→季度）
- **发布**想法到 GitHub 仓库
- **跟踪**进度并知道何时放手

## 哲学

**要批判，而不仅仅是支持。**Idea Coach 将：
- 建议放弃不值得追求的想法
- 在审查期间提出困难的问题
- 跟踪哪些想法实际发布 vs 永远腐烂

## 命令

### 核心命令

| 命令 | 描述 |
|---------|-------------|
| `/idea <text>` | 捕获新想法 |
| `/idea_list` | 列出活跃的想法 |
| `/idea_list --due` | 显示待审查的想法 |
| `/idea_get <id>` | 获取想法详细信息 |
| `/idea_update <id>` | 更新想法属性 |
| `/idea_review <id>` | 添加审查交互 |
| `/idea_drop <id>` | 标记为丢弃（需要原因）|
| `/idea_done <id>` | 标记为已完成 |
| `/idea_stats` | 显示统计信息 |

### GitHub 命令

| 命令 | 描述 |
|---------|-------------|
| `/idea_link <id> <owner/repo>` | 链接到现有仓库 |
| `/idea_ship <id>` | 为想法创建新仓库 |
| `/idea_ship <id> --public` | 创建公共仓库 |
| `/idea_repo <id>` | 显示链接仓库的状态 |
| `/idea_sync <id>` | 创建/更新 GitHub 问题 |

## 属性

### 类型
- 💡 **想法**——要构建或创建的东西
- 🔧 **问题**——要修复或解决的东西
- 🎯 **挑战**——要克服的东西

### 状态流程
```
捕获 → 探索 → 开发 → 已发布/完成
                ↓           ↓
             已停放      已阻止
                ↓
             已丢弃
```

### 重要性 → 审查周期
| 重要性 | 能量 | 审查周期 |
|------------|--------|--------------|
| 关键 | 高 | 每日 |
| 关键 | * | 每周 |
| 重要 | 高 | 每周 |
| 重要 | * | 双周 |
| 有用 | * | 每月 |
| 已停放 | * | 季度 |

## GitHub 集成

### 先决条件
- `gh` CLI 已安装并经过身份验证
- 如果尚未设置，请运行 `gh auth login`

### 工作流程示例

```
# 1. 捕获想法
/idea "构建用于任务管理的 CLI"

# 2. 开发它
/idea_update abc123 --status developing

# 3. 将其发布到 GitHub
/idea_ship abc123

# 4. 或链接到现有仓库
/idea_link abc123 moinsen-dev/my-cli

# 5. 检查仓库状态
/idea_repo abc123

# 6. 同步为 GitHub 问题
/idea_sync abc123
```

## CLI 使用

```bash
# 添加想法
python scripts/coach.py add "Build something cool" --type idea --importance important

# 列出想法
python scripts/coach.py list
python scripts/coach.py list --due
python scripts/coach.py list --github  # 仅限链接的仓库

# GitHub 操作
python scripts/coach.py link <id> owner/repo
python scripts/coach.py ship <id> --owner moinsen-dev
python scripts/coach.py repo-status <id>
python scripts/coach.py sync-issue <id> --labels enhancement,idea
```

## 数据存储

想法存储在 `~/.openclaw/idea-coach/ideas.json` 中

每个想法跟踪：
- 基本信息（标题、描述、类型、领域）
- 状态和进度
- 能量、紧迫性、重要性
- 审查计划和历史
- **GitHub 集成**（仓库、问题、同步时间戳）
- 交互日志

## 提示

1. **快速捕获**——不要过度思考初始捕获
2. **诚实审查**——使用审查杀死过时的想法
3. **尽早发布**——一旦想法有势头，就创建一个仓库
4. **同步问题**——使用 GitHub 问题进行详细跟踪
5. **自由放弃**——放弃的想法是一个决定，而不是失败
