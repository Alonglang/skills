---
name: active-maintenance
description: OpenClaw的自动化系统健康和记忆代谢管理。当需要清理OpenClaw临时文件、检查磁盘使用、运行夜间优化、去重记忆片段、压缩上下文、自动维护系统健康时使用，必须在用户提及清理、维护、磁盘空间不足、去重、记忆代谢、OpenClaw优化时触发。
---

# 主动维护技能

**OpenClaw的自动化系统健康和记忆代谢管理。**

受 `ClawIntelligentMemory` 项目启发，此技能确保Kim Assistant的环境保持清洁，记忆保持紧凑。

---

## 功能

1. **系统健康检查**: 监控磁盘使用和关键资源
2. **自动清理**: 删除旧的临时文件和工件
3. **记忆代谢 (M3)**:
   - 记忆片段的精确去重
   - 资源蒸馏：将紧凑笔记总结为核心洞察
4. **决策日志**: 每个维护周期都记录在 `MEMORY/DECISIONS/` 中以便审计

---

## 使用方法

### 运行完整维护
```bash
python3 /root/.openclaw/workspace/scripts/nightly_optimizer.py
```

### 记录决策
```python
from decision_logger import log_decision
log_decision(title="示例", ...)
```

---

## 配置

配置位于 `scripts/nightly_optimizer.py`:
- `TEMP_DIRS`: 要清理的目录列表
- `threshold`: 触发警告的磁盘使用百分比
- `days`: 要清理的文件天数

---

*创建时间: 2026-02-12 | 由Kim Assistant创建*
