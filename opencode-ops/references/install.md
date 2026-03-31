# 安装与升级指南

## OpenCode 安装

### 推荐方式（自动脚本）

```bash
curl -fsSL https://opencode.ai/install | bash
```

### 包管理器

```bash
# Node.js / npm
npm install -g opencode-ai

# Bun
bun install -g opencode-ai

# macOS / Linux - Homebrew（推荐 tap，更新更及时）
brew install anomalyco/tap/opencode
# 官方 formula（更新较慢，不推荐）
brew install opencode

# Arch Linux
sudo pacman -S opencode           # 稳定版
paru -S opencode-bin              # AUR 最新版

# Windows
choco install opencode            # Chocolatey
scoop install opencode            # Scoop
npm install -g opencode-ai        # npm
mise use -g github:anomalyco/opencode  # Mise

# Docker
docker run -it --rm ghcr.io/anomalyco/opencode
```

### 验证安装

```bash
opencode --version  # 查看版本（OmO 要求 ≥ 1.0.150）
```

---

## Oh-My-OpenAgent（OmO）安装

### 推荐：让 Agent 帮你安装

将以下内容粘贴到你的 LLM Agent 会话（Claude Code、AmpCode、Cursor 等）：

```
Install and configure oh-my-opencode by following the instructions here:
https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md
```

### 手动安装

#### 第零步：回答订阅问题（CLI flags）

| 问题 | Flag |
|------|------|
| 有 Claude Pro/Max 订阅？普通 | `--claude=yes` |
| 有 Claude Pro/Max 订阅？max20 模式 | `--claude=max20` |
| 无 Claude 订阅 | `--claude=no` |
| 有 ChatGPT Plus 订阅？ | `--openai=yes / no` |
| 使用 Google Gemini？ | `--gemini=yes / no` |
| 有 GitHub Copilot 订阅？ | `--copilot=yes / no` |
| 有 OpenCode Zen 访问权？ | `--opencode-zen=yes / no` |
| 有 Z.ai Coding Plan？ | `--zai-coding-plan=yes / no` |
| 有 OpenCode Go 订阅（$10/月，GLM-5/Kimi K2.5/MiniMax）？ | `--opencode-go=yes / no` |

> ⚠️ 若无 Claude 订阅，Sisyphus 工作效果会下降。建议至少配置 Claude 或 Kimi。

#### 示例命令

```bash
# 全订阅用户（Claude max20 + OpenAI + Gemini）
bunx oh-my-opencode install --no-tui --claude=max20 --openai=yes --gemini=yes --copilot=no

# 只有 Claude
bunx oh-my-opencode install --no-tui --claude=yes --gemini=no --copilot=no

# 只有 GitHub Copilot
bunx oh-my-opencode install --no-tui --claude=no --gemini=no --copilot=yes

# 只有 OpenCode Go（经济实惠）
bunx oh-my-opencode install --no-tui --claude=no --openai=no --gemini=no --copilot=no --opencode-go=yes

# 无任何订阅（使用免费额度）
bunx oh-my-opencode install --no-tui --claude=no --gemini=no --copilot=no
```

---

## 验证与诊断

```bash
# 验证 OpenCode 版本
opencode --version          # 需 ≥ 1.0.150

# 运行 OmO 健康检查
bunx oh-my-opencode doctor
```

`doctor` 检查内容：
- 系统环境（OpenCode 版本、Node/Bun 版本）
- 配置文件（opencode.json 插件注册、oh-my-openagent.json）
- 工具可用性（bunx、tmux 等）
- 模型解析（各 Agent 的模型链是否可解析）
- **legacy package name 警告**：若看到 "Using legacy package name"，需将 `opencode.json` 中插件名从 `oh-my-opencode` 改为 `oh-my-openagent`

---

## 升级

```bash
# 升级 OpenCode
curl -fsSL https://opencode.ai/install | bash
# 或
npm update -g opencode-ai

# OpenCode 自动更新（默认开启，可在 opencode.json 中控制）
# "autoupdate": true | false | "notify"

# 升级 OmO
bunx oh-my-opencode@latest install --no-tui --claude=yes ...  # 重新运行安装器
```

---

## Provider 认证（安装后）

安装完成后，根据 OmO 安装器提示完成 Provider 认证，详见 [providers.md](providers.md)。
