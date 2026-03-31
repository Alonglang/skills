# LLM Provider 接入指南

## 通用流程

```bash
opencode      # 启动 OpenCode
/connect      # 选择 Provider 并输入 API Key
/models       # 查看可用模型并切换
```

凭证存储路径：`~/.local/share/opencode/auth.json`

---

## OpenCode 官方订阅

### OpenCode Zen（精选模型，经过测试）

```bash
/connect   # 选择 "OpenCode Zen"
# 前往 opencode.ai/zen 注册并获取 API Key
# 粘贴 API Key
/models    # 查看推荐模型列表
```

### OpenCode Go（$10/月，经济型）

提供 GLM-5、Kimi K2.5、MiniMax M2.7 等高性价比模型。

```bash
/connect   # 选择 "OpenCode Go"
# 前往 opencode.ai/zen 注册订阅
# 粘贴 API Key
```

---

## 主流 Provider 接入

### Anthropic（Claude）

```bash
/connect   # 选择 "Anthropic"
# 支持两种认证方式：
# 1. Claude Pro/Max 订阅 → 选择 "Claude Pro/Max" → 浏览器 OAuth
# 2. API Key → 直接粘贴
```

> ⚠️ **重要**：Anthropic 明确禁止通过第三方插件使用 Claude Pro/Max 订阅（OAuth 旁路）。OpenCode v1.3.0 起已移除相关插件。官方支持方式：
> - 直接 API Key（付费使用）
> - Claude Pro/Max OAuth（官方支持）

配置示例（API Key 手动配置）：

```jsonc
{
  "provider": {
    "anthropic": {
      "options": {
        "apiKey": "sk-ant-..."  // 或使用 ANTHROPIC_API_KEY 环境变量
      }
    }
  }
}
```

---

### OpenAI（ChatGPT）

```bash
/connect   # 选择 "OpenAI" 或搜索 "ChatGPT"
# ChatGPT Plus 订阅：选择 "ChatGPT Plus" → 浏览器 OAuth
# API Key：直接粘贴 sk-...
```

支持 ChatGPT Plus 订阅在 OpenCode 中使用（Zero setup）。

---

### Google Gemini

**方式 1：标准 API Key**

```bash
/connect   # 选择 "Google"
# 前往 aistudio.google.com 获取 API Key
```

**方式 2：Antigravity OAuth（免费额度，OmO 推荐）**

先添加插件：
```jsonc
{
  "plugin": ["oh-my-openagent", "opencode-antigravity-auth@latest"]
}
```

然后认证：
```bash
/connect
# 选择 "Google" → 选择 "OAuth with Google (Antigravity)"
# 在浏览器完成登录（自动检测）
```

可用的 Antigravity 模型：
- `google/antigravity-gemini-3-pro`（variants: `low`, `high`）
- `google/antigravity-gemini-3-flash`（variants: `minimal`, `low`, `medium`, `high`）
- `google/antigravity-claude-sonnet-4-6`
- `google/antigravity-claude-sonnet-4-6-thinking`（variants: `low`, `max`）
- `google/antigravity-claude-opus-4-5-thinking`（variants: `low`, `max`）

Gemini CLI 配额模型：
- `google/gemini-2.5-flash`, `google/gemini-2.5-pro`, `google/gemini-3-flash-preview`, `google/gemini-3.1-pro-preview`

**多账号负载均衡**：最多支持 10 个 Google 账号，某账号达到速率限制时自动切换。

---

### GitHub Copilot（备用 Provider）

Copilot 作为**备用 Provider**，模型映射如下：

| Agent | 映射模型 |
|-------|---------|
| Sisyphus | `github-copilot/claude-opus-4.6` |
| Oracle | `github-copilot/gpt-5.4` |
| Explore | `github-copilot/grok-code-fast-1` |
| Atlas | `github-copilot/claude-sonnet-4.6` |

```bash
/connect   # 选择 "GitHub Copilot" → 浏览器 OAuth
# 支持 Copilot Pro、Business、Enterprise
```

Zero setup 支持（与 ChatGPT Plus、GitLab Duo 同等）。

---

### GitHub Copilot（备用 Provider）

```bash
/connect   # 选择 "GitHub Copilot"
```

---

### GitLab Duo

```bash
/connect   # 选择 "GitLab Duo"
```

Zero setup 支持。2026 新增完整 GitLab Agent 平台集成（WebSocket 原生自动化）。

---

### Kimi（月之暗面，OmO 推荐）

通过 OmO 安装器 `--opencode-go=yes` 或直接接入。Kimi K2.5 是 Sisyphus 的推荐替代模型（Claude-like 行为）。

```bash
# 通过 OpenCode Go 订阅接入
/connect   # 选择 "OpenCode Go"
```

模型：`kimi-for-coding/k2p5`、`kimi-for-coding/k2.5`

---

### Z.ai（GLM，智谱）

提供 GLM-5 / GLM-4.6v，与 Claude 行为相似。

```bash
# 通过 OmO 安装器
bunx oh-my-opencode install --no-tui --zai-coding-plan=yes ...

# 或手动
/connect   # 选择 "Z.ai" 或 "GLM"
```

Z.ai Coding Plan（$10/月）：GLM-5 和 GLM-4.6v，适合 Sisyphus 和 Librarian。

---

### Azure OpenAI

```bash
/connect   # 搜索 "Azure"
# 输入 API Key
export AZURE_RESOURCE_NAME=my-resource  # 设置资源名
```

配置（opencode.json）：
```jsonc
{
  "provider": {
    "azure": {
      "options": {
        "apiKey": "YOUR_AZURE_API_KEY"
      }
    }
  }
}
```

---

### Amazon Bedrock

```bash
# 方式 1：环境变量
AWS_ACCESS_KEY_ID=XXX AWS_SECRET_ACCESS_KEY=YYY opencode
AWS_PROFILE=my-profile opencode

# 方式 2：配置文件（推荐）
```

配置（opencode.json）：
```jsonc
{
  "provider": {
    "amazon-bedrock": {
      "options": {
        "region": "us-east-1",
        "profile": "my-aws-profile",
        "endpoint": "https://bedrock-runtime.us-east-1.vpce-xxxxx.amazonaws.com"  // VPC 端点
      }
    }
  }
}
```

认证优先级：Bearer Token → AWS 凭证链 → IAM 角色 → Web Identity Token（EKS IRSA）

---

### Ollama（本地模型）

```bash
# 先启动 Ollama 服务
ollama pull llama3.2

# 在 OpenCode 中连接
/connect   # 选择 "Ollama"
# 自动检测 localhost:11434
```

配置：
```jsonc
{
  "provider": {
    "ollama": {
      "options": {
        "baseURL": "http://localhost:11434"
      }
    }
  }
}
```

---

## 自定义 Base URL（代理/企业端点）

```jsonc
{
  "provider": {
    "anthropic": {
      "options": {
        "baseURL": "https://my-proxy.example.com/anthropic"
      }
    }
  }
}
```
