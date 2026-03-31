# 故障排查手册

## 快速诊断

```bash
# 首先运行 doctor
bunx oh-my-opencode doctor
```

Doctor 检查项：
- 系统环境（OpenCode 版本、Node/Bun）
- 配置文件语法和结构
- 工具可用性（tmux、bunx等）
- 模型解析（各 Agent 的 Provider 能否解析）
- legacy 包名警告

---

## 常见问题

### 1. Legacy 包名警告

**症状**：`doctor` 输出 "Using legacy package name 'oh-my-opencode'"

**原因**：`opencode.json` 的 `plugin` 数组中使用了旧插件名

**解决**：

```jsonc
// opencode.json - 修改 plugin 数组
{
  "plugin": ["oh-my-openagent"]  // ✅ 新名称
  // "plugin": ["oh-my-opencode"]  // ❌ 旧名称（会产生警告）
}
```

---

### 2. OpenCode 版本过低

**症状**：OmO 安装后部分功能不可用，或 doctor 报错版本不足

**解决**：
```bash
opencode --version  # 检查版本，需 ≥ 1.0.150
curl -fsSL https://opencode.ai/install | bash  # 升级
```

---

### 3. Sisyphus 工作不正常

**症状**：Sisyphus 中途放弃、理解错误、输出质量差

**原因**：可能使用了非 Claude-like 模型（旧版 GPT 不适合 Sisyphus）

**解决方案**：

a) 确保 Sisyphus 使用正确模型：
```jsonc
{
  "agents": {
    "sisyphus": { "model": "anthropic/claude-opus-4-6" }
    // 替代：kimi-for-coding/k2p5 或 z.ai/glm-5
  }
}
```

b) 若无 Claude 订阅，配置 Kimi 或 GLM 作为替代：
```bash
bunx oh-my-opencode install --no-tui --claude=no --opencode-go=yes
```

c) 检查 Claude 认证是否正常：
```bash
opencode auth login  # 重新认证
```

---

### 4. ultrawork 卡住/中断

**症状**：输入 `ultrawork` 后 Agent 停止响应或中途停止

**可能原因及解决**：

a) **Provider 速率限制**：
```bash
# 检查模型 Fallback 链是否配置
bunx oh-my-opencode doctor
# 添加更多 Provider 作为备用
```

b) **上下文窗口溢出**：
```jsonc
// opencode.json 启用自动压缩
{
  "compaction": { "auto": true, "prune": true, "reserved": 10000 }
}
```

c) **Todo Enforcer 未生效**：确认 OmO 版本是最新的
```bash
bunx oh-my-opencode@latest install --no-tui ...  # 重装最新版
```

d) **手动重启循环**：
```bash
/ulw-loop  # Ralph Loop，强制持续直到完成
```

---

### 5. Provider 认证失败

**Anthropic**：
```bash
opencode auth login
# 选择 Anthropic → Claude Pro/Max OAuth
# 或手动输入 API Key
```

**OpenAI / ChatGPT Plus**：
```bash
opencode auth login
# 选择 OpenAI → ChatGPT Plus OAuth（or API Key）
```

**Google Gemini**：
```bash
# 确保安装了 opencode-antigravity-auth 插件（若使用 Antigravity）
opencode auth login
# 选择 Google → OAuth with Google (Antigravity)
```

**症状**：`401 Unauthorized` 或 `Provider not found`

**解决**：
```bash
# 查看已存储的认证
cat ~/.local/share/opencode/auth.json

# 重新连接特定 Provider
/connect  # 在 TUI 中选择对应 Provider

# 检查 API Key 是否过期/失效
```

---

### 6. Gemini Antigravity 认证问题

**症状**：Antigravity OAuth 完成后模型不可用

**解决**：

确认插件已正确加载：
```jsonc
// opencode.json
{
  "plugin": ["oh-my-openagent", "opencode-antigravity-auth@latest"]
}
```

确认模型配置使用正确的 Antigravity 模型名：
```jsonc
// oh-my-openagent.json
{
  "agents": {
    "multimodal-looker": { "model": "google/antigravity-gemini-3-flash" }
  }
}
```

如遇速率限制，添加多个 Google 账号（最多 10 个），系统自动轮换。

---

### 7. 模型解析失败（`model not found`）

**症状**：`doctor` 报告某 Agent 模型无法解析

**原因**：
- Provider 未认证
- 模型名拼写错误
- 模型名格式错误

**解决**：
```bash
# 检查 Provider 认证状态
/connect  # 确认所需 Provider 已连接

# 检查模型名格式（provider/model-name）
# ✅ 正确：anthropic/claude-opus-4-6
# ❌ 错误：claude-opus-4-6（缺少 provider 前缀）
```

---

### 8. oh-my-openagent.json 语法错误

**症状**：OmO 插件加载失败，功能不可用

**解决**：
```bash
# 验证 JSON 语法（注意：支持 JSONC，注释是允许的）
cat ~/.config/opencode/oh-my-openagent.json | python3 -m json.tool
# 或使用 jsonc 验证工具
```

常见错误：
- 末尾多余逗号（JSONC 允许但标准 JSON 不允许）
- 使用了不支持的 variant 值
- model 字段缺少 provider 前缀

---

### 9. OpenCode 配置冲突

**症状**：配置设置没有生效

**原因**：多层配置文件冲突，优先级不清晰

**调试**：
```bash
# 检查所有配置文件
cat ~/.config/opencode/opencode.json    # 全局
cat opencode.json                        # 项目级
ls -la .opencode/                        # .opencode 目录

# 记住优先级：项目 > 全局 > Remote
```

---

### 10. /init 或 /init-deep 无法生成 AGENTS.md

**症状**：命令运行但没有创建文件

**解决**：
```bash
# 确认在项目根目录（有 git 仓库）
git status  # 确认是 git 项目
cd /your/project && opencode
/init        # 标准初始化
# 或
/init-deep   # 深度初始化（生成层级 AGENTS.md）
```

---

## 日志与调试

```bash
# 查看 OpenCode 运行日志
# 日志默认路径：~/.local/share/opencode/logs/

# 启动时输出详细信息
OPENCODE_LOG_LEVEL=debug opencode

# 检查 OmO 插件加载情况
bunx oh-my-opencode doctor --verbose  # 若支持 verbose flag
```

---

## 常用重置操作

```bash
# 清除认证（重新配置所有 Provider）
rm ~/.local/share/opencode/auth.json
opencode  # 重新认证

# 重置全局 OpenCode 配置
mv ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.bak

# 重新安装 OmO
bunx oh-my-opencode@latest install --no-tui --claude=yes ...
```
