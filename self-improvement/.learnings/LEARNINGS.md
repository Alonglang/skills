# Learnings Log

Captured learnings, corrections, and discoveries. Review before major tasks.

---

## [LRN-20260409-001] correction

**Logged**: 2026-04-09T06:32:00Z
**Priority**: high
**Status**: resolved

### Summary
不要在未确认的情况下删除 Docker 镜像——用户可能用于其他模型

### Details
执行"清理"任务时删除了 `vllm/vllm-openai:cu130-nightly`（21.8GB），理由是"部署失败的备用镜像"。但用户明确说还要用它起别的模型。Docker 镜像的用途往往超出当前任务范围，不能仅凭当前任务判断其价值。

### Suggested Action
清理 Docker 镜像前，必须先列出所有镜像并询问用户哪些可以删除，而不是自主判断。

### Metadata
- Source: user_feedback
- Tags: docker, cleanup, destructive-operation
- Area: infra

### Resolution
- **Resolved**: 2026-04-09T06:35:00Z
- **Notes**: 通过光纤从 xpark2 重新传输，已恢复到 xpark1

---
