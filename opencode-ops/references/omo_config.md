# oh-my-openagent.json 配置详解

## 配置文件位置

| 优先级 | 路径 |
|--------|------|
| 用户全局 | `~/.config/opencode/oh-my-openagent.json[c]` |
| 项目级 | `.opencode/oh-my-openagent.json[c]` |
| 兼容旧名 | `oh-my-opencode.json[c]`（两处同样识别） |

> 支持 JSONC（带注释的 JSON）格式。

---

## Schema 引用

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-openagent.schema.json"
}
```

---

## 完整配置结构

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-openagent.schema.json",

  // ─── Agent 模型覆盖 ───────────────────────────────────────
  "agents": {

    // 主编排器（Claude-like 模型效果最佳）
    "sisyphus": {
      "model": "anthropic/claude-opus-4-6",
      // ultrawork 模式下使用不同配置
      "ultrawork": {
        "model": "anthropic/claude-opus-4-6",
        "variant": "max"
      }
    },

    // GPT 原生深度工作者
    "hephaestus": { "model": "openai/gpt-5.4" },

    // 策略规划师
    "prometheus": {
      "model": "anthropic/claude-opus-4-6"
      // 替代：kimi-for-coding/k2p5 或 z.ai/glm-5
    },

    // 执行指挥官
    "atlas": { "model": "anthropic/claude-sonnet-4-6" },

    // 架构顾问（只读，GPT-5.4 高推理效果佳）
    "oracle": {
      "model": "openai/gpt-5.4",
      "variant": "high"
    },

    // 文档/代码研究员
    "librarian": { "model": "google/gemini-3-flash" },

    // 快速 grep（速度优先）
    "explore": { "model": "github-copilot/grok-code-fast-1" },

    // 计划缺口分析
    "metis": { "model": "anthropic/claude-sonnet-4-6" },

    // 计划严格审查
    "momus": { "model": "anthropic/claude-sonnet-4-6" },

    // 视觉/多模态分析
    "multimodal-looker": {
      "model": "google/antigravity-gemini-3-flash"
    }
  },

  // ─── Categories（任务分类模型映射）───────────────────────
  "categories": {

    // 前端/视觉工作（Gemini 擅长视觉任务）
    "visual-engineering": {
      "model": "google/gemini-3.1-pro",
      "variant": "high"
    },

    // 通用高强度任务
    "unspecified-high": {
      "model": "anthropic/claude-opus-4-6",
      "variant": "max"
    },

    // 快速轻量任务（成本优先）
    "quick": { "model": "openai/gpt-5.4-mini" },

    // 深度推理任务（GPT-5.4 极限）
    "ultrabrain": {
      "model": "openai/gpt-5.4",
      "variant": "xhigh"
    },

    // 中等强度
    "deep": { "model": "anthropic/claude-sonnet-4-6" }
  }
}
```

---

## 配置字段说明

### model 字段格式

```
provider/model-name
```

示例：
- `anthropic/claude-opus-4-6`
- `openai/gpt-5.4`
- `google/gemini-3.1-pro`
- `kimi-for-coding/k2p5`
- `github-copilot/claude-opus-4.6`
- `github-copilot/gpt-5.4`
- `z.ai/glm-5`

### variant 字段（模型变体）

部分模型支持变体控制推理强度/成本：

| variant | 含义 |
|---------|------|
| `low` | 轻量，快速，低成本 |
| `medium` | 平衡 |
| `high` | 高质量推理 |
| `max` | 最大推理（Claude 扩展思考） |
| `xhigh` | 超高（GPT-5.4 极限） |
| `minimal` | 极轻量（Gemini Flash） |

---

## 与 opencode.json 的关系

OmO 作为 OpenCode 的**插件**注册：

```jsonc
// opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["oh-my-openagent"],  // 新名称（推荐）
  // 或旧名称（仍可用，会产生警告）：
  // "plugin": ["oh-my-opencode"]
}
```

OmO 配置独立于 opencode.json，放在单独的 `oh-my-openagent.json` 文件中。

---

## 包名迁移说明（2026）

| 内容 | 旧名称 | 新名称 |
|------|--------|--------|
| npm 包名 / CLI 命令 | `oh-my-opencode` | 仍为 `oh-my-opencode`（暂不变） |
| opencode.json 插件注册 | `"oh-my-opencode"` | `"oh-my-openagent"`（推荐） |
| 配置文件名 | `oh-my-opencode.json[c]` | `oh-my-openagent.json[c]`（推荐） |

**迁移步骤**：
1. 将 `opencode.json` 中 `"plugin"` 数组的 `"oh-my-opencode"` 改为 `"oh-my-openagent"`
2. 可选：将 `oh-my-opencode.json` 重命名为 `oh-my-openagent.json`（兼容层会识别两者）
3. 运行 `bunx oh-my-opencode doctor` 确认无 legacy 警告

---

## 最小配置示例（按订阅组合）

### 只有 Claude

```jsonc
{
  "agents": {
    "sisyphus": { "model": "anthropic/claude-opus-4-6" },
    "prometheus": { "model": "anthropic/claude-opus-4-6" },
    "atlas": { "model": "anthropic/claude-sonnet-4-6" },
    "oracle": { "model": "anthropic/claude-sonnet-4-6" },
    "hephaestus": { "model": "anthropic/claude-sonnet-4-6" },
    "librarian": { "model": "anthropic/claude-haiku-4-5" },
    "explore": { "model": "anthropic/claude-haiku-4-5" }
  }
}
```

### Claude + OpenAI（推荐组合）

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

### 只有 GitHub Copilot

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

### Kimi + GPT（无 Anthropic）

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
