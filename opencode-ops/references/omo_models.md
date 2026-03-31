# OmO 模型匹配与 Provider 分配

## 模型家族分类

### Claude-like 模型（结构化输出、指令遵循强）

| 模型 | Provider | 特点 |
|------|---------|------|
| Claude Opus 4.6 | anthropic | Sisyphus 首选，最强编排 |
| Claude Sonnet 4.6 | anthropic | 能力/成本均衡 |
| Claude Haiku 4.5 | anthropic | 快速轻量任务 |
| Kimi K2.5 | kimi-for-coding | Claude-like 行为，大量用户选择 |
| GLM 5 | z.ai | Claude-like，Z.ai 可用 |
| GLM 4.6v | z.ai | 视觉增强版 GLM |

> Sisyphus 为 Claude 家族优化，Kimi 和 GLM 是优秀的无 Anthropic 替代方案。

---

### GPT 模型（原则驱动推理、深度代码理解）

| 模型 | Provider | 特点 |
|------|---------|------|
| GPT-5.4 | openai | Hephaestus/Oracle 首选，深度推理 |
| GPT-5.4-mini | openai | 超快速轻量任务 |
| GPT-5-Nano | openai | 极廉价工具任务 |

> 不推荐将旧版 GPT 模型用于 Sisyphus——它们效果差，应路由到 Hephaestus。

---

### Google Gemini（视觉/前端任务优秀）

| 模型 | 特点 |
|------|------|
| gemini-3.1-pro | 视觉工程首选，前端任务出色 |
| gemini-3-flash | 快速轻量，Librarian 使用 |
| antigravity-gemini-3-pro | 免费额度版，variants: low/high |
| antigravity-gemini-3-flash | 免费额度版，多种 variant |

---

### 速度优先模型

| 模型 | Provider | 用途 |
|------|---------|------|
| Grok Code Fast 1 | github-copilot | Explore Agent，代码搜索 |
| MiniMax M2.7 | opencode-go | 快速通用任务 |
| MiniMax M2.7-highspeed | opencode-go | 超高速工具任务 |

---

## 各 Agent 默认模型与 Fallback 链

### Sisyphus

| 优先级 | Provider | 模型 |
|--------|---------|------|
| 1（最佳） | anthropic | claude-opus-4-6 |
| 2 | kimi-for-coding | k2p5 |
| 3 | z.ai | glm-5 |
| 4（Copilot 备用） | github-copilot | claude-opus-4.6 |

### Hephaestus

| 优先级 | Provider | 模型 |
|--------|---------|------|
| 1（最佳） | openai | gpt-5.4 |
| 2 | github-copilot | gpt-5.4 |

### Oracle

| 优先级 | Provider | 模型 |
|--------|---------|------|
| 1 | openai | gpt-5.4（variant: high） |
| 2 | github-copilot | gpt-5.4 |
| 3 | anthropic | claude-sonnet-4-6 |

### Atlas

| 优先级 | Provider | 模型 |
|--------|---------|------|
| 1 | anthropic | claude-sonnet-4-6 |
| 2 | github-copilot | claude-sonnet-4.6 |
| 3 | kimi-for-coding | k2p5 |

### Prometheus

| 优先级 | Provider | 模型 |
|--------|---------|------|
| 1 | anthropic | claude-opus-4-6 |
| 2 | kimi-for-coding | k2p5 |
| 3 | z.ai | glm-5 |

### Librarian

| 优先级 | Provider | 模型 |
|--------|---------|------|
| 1 | google | gemini-3-flash |
| 2 | z.ai | glm-5（若配置了 --zai-coding-plan） |
| 3 | openai | gpt-5.4-mini |

### Explore

| 优先级 | Provider | 模型 |
|--------|---------|------|
| 1 | github-copilot | grok-code-fast-1 |
| 2 | openai | gpt-5.4-mini |
| 3 | anthropic | claude-haiku-4-5 |

---

## Categories 系统

Categories 允许按任务类型自动路由，而非手动选择模型。

| Category | 用途 | 默认模型 |
|----------|------|---------|
| `visual-engineering` | UI/CSS/前端/截图分析 | Gemini 3.1 Pro（high） |
| `ultrabrain` | 极深度推理、复杂算法 | GPT-5.4（xhigh） |
| `deep` | 通用复杂任务 | Claude Sonnet 4.6 |
| `unspecified-high` | 高质量通用工作 | Claude Opus 4.6（max） |
| `quick` | 快速简单任务 | GPT-5.4-mini |
| `minimal` | 极轻量工具任务 | Gemini Flash（minimal） |

---

## 按订阅的最优配置方案

### 方案 A：全套订阅（最强）

```
Claude Max20 + ChatGPT Plus + Gemini（Antigravity） + Copilot
```

```jsonc
{
  "agents": {
    "sisyphus": { "model": "anthropic/claude-opus-4-6", "ultrawork": { "variant": "max" } },
    "hephaestus": { "model": "openai/gpt-5.4" },
    "oracle": { "model": "openai/gpt-5.4", "variant": "high" },
    "librarian": { "model": "google/antigravity-gemini-3-flash" },
    "explore": { "model": "github-copilot/grok-code-fast-1" },
    "multimodal-looker": { "model": "google/antigravity-gemini-3-flash" }
  },
  "categories": {
    "visual-engineering": { "model": "google/antigravity-gemini-3-pro", "variant": "high" },
    "ultrabrain": { "model": "openai/gpt-5.4", "variant": "xhigh" },
    "quick": { "model": "openai/gpt-5.4-mini" }
  }
}
```

### 方案 B：Claude + OpenAI（推荐日常方案）

```
Claude Pro + ChatGPT Plus
```

```jsonc
{
  "agents": {
    "sisyphus": { "model": "anthropic/claude-opus-4-6" },
    "hephaestus": { "model": "openai/gpt-5.4" },
    "oracle": { "model": "openai/gpt-5.4", "variant": "high" }
  },
  "categories": {
    "ultrabrain": { "model": "openai/gpt-5.4", "variant": "xhigh" },
    "quick": { "model": "openai/gpt-5.4-mini" }
  }
}
```

### 方案 C：Kimi + GPT（无 Anthropic）

```
OpenCode Go（Kimi）+ ChatGPT Plus
```

```jsonc
{
  "agents": {
    "sisyphus": { "model": "kimi-for-coding/k2p5" },
    "prometheus": { "model": "kimi-for-coding/k2p5" },
    "hephaestus": { "model": "openai/gpt-5.4" },
    "oracle": { "model": "openai/gpt-5.4", "variant": "high" }
  }
}
```

### 方案 D：GitHub Copilot 单一订阅（最经济）

```
仅 GitHub Copilot
```

```jsonc
{
  "agents": {
    "sisyphus": { "model": "github-copilot/claude-opus-4.6" },
    "oracle": { "model": "github-copilot/gpt-5.4" },
    "explore": { "model": "github-copilot/grok-code-fast-1" },
    "atlas": { "model": "github-copilot/claude-sonnet-4.6" }
  }
}
```

> ⚠️ Copilot 单订阅下，Librarian 可能无法正常工作（需要其他 Provider）。

### 方案 E：OpenCode Go（全经济型，$10/月）

```
仅 OpenCode Go（GLM-5 + Kimi K2.5 + MiniMax M2.7）
```

```jsonc
{
  "agents": {
    "sisyphus": { "model": "kimi-for-coding/k2p5" },
    "hephaestus": { "model": "kimi-for-coding/k2p5" },
    "oracle": { "model": "kimi-for-coding/k2p5" },
    "librarian": { "model": "z.ai/glm-5" },
    "explore": { "model": "opencode-go/minimax-m2.7-highspeed" }
  }
}
```

---

## Fallback 链机制

OmO 在运行时自动尝试 Fallback：

1. Agent 尝试第一优先级 Provider
2. 如果不可用（速率限制/认证失败）→ 自动切换下一 Provider
3. 所有 Fallback 耗尽 → 报错并提示用户配置更多 Provider

**Fallback 是 Agent 级别的**，每个 Agent 有独立的 Fallback 链，不是全局统一优先级。
