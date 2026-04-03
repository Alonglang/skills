# Errors Log

Command failures, exceptions, and unexpected behaviors.

---
## [ERR-20260327-001] compat-proxy-streaming-regression
**Logged**: 2026-03-27T19:08:05Z
**Priority**: high
**Status**: in_progress
**Area**: infra

### Summary
User reported the new compatibility proxy introduced a regression where tool-call-like content is printed and stream behavior is inconsistent.

### Error

```
Compat proxy added to normalize finish_reason caused side effects in streaming behavior and output formatting.
```

### Context
- Change introduced: opencode_compat_proxy.py fronting LiteLLM on port 2840
- Symptom appeared after my modification

### Suggested Fix
Verify SSE framing and minimize proxy side effects; prefer only rewriting parsed SSE data while preserving valid event framing.

### Metadata
- Reproducible: yes
- Related Files: /volume2/docker/litellm/opencode_compat_proxy.py, /volume2/docker/litellm/docker-compose.yml
---
