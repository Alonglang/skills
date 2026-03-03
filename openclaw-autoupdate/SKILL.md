---
name: openclaw-autoupdate
description: OpenClaw静默更新技能。安全自动化更新OpenClaw到最新版本。
---

# OpenClaw 静默更新

## 功能

- 检查当前版本
- 获取最新版本  
- 执行更新
- 重启Gateway
- 验证服务状态

## 使用方式

```bash
~/.openclaw/workspace/skills/openclaw-autoupdate/scripts/silent-update.sh
```

## 配置文件

无需额外配置，脚本直接使用系统已有的openclaw CLI。

## 安全说明

本技能仅使用安全的命令：
- npm/pnpm 包管理
- openclaw CLI命令
- 纯文件读写操作
