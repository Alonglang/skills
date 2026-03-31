---
name: openclaw-ops
description: 管理 OpenClaw 配置与运维——涵盖渠道（WhatsApp/Telegram/Discord/Slack/Teams/QQ Bot）、代理、节点、安全审计、自动化（Cron/钩子）、技能生态、Web UI、TUI、ACP 工作区绑定、记忆系统、模型提供商（Anthropic/xAI/Grok/Vercel AI/Kilo Gateway/MiniMax/Gemini）、OpenAI API 兼容层、图片生成。当用户需要配置 OpenClaw 任何功能、排查 Gateway/渠道故障、管理技能/插件/沙箱/节点/密钥、处理异步审批、更新版本、绑定 ACP 工作区、配置文件上传、配置 Qwen/xAI/MiniMax 提供商、或询问 openclaw.json 任何配置项时必须触发此技能。
version: 2026.3.28
lastUpdated: 2026-03-31
---

# OpenClaw 配置与运维手册

诊断和修复实际问题。这里的每个命令都经过测试和支持。

---

## 官方文档资源

- **完整文档**: https://docs.openclaw.ai/zh-CN
- **快速开始**: https://docs.openclaw.ai/zh-CN/start/getting-started
- **配置参考**: https://docs.openclaw.ai/zh-CN/gateway/configuration
- **配置完整参考**: https://docs.openclaw.ai/zh-CN/gateway/configuration-reference
- **故障排除**: https://docs.openclaw.ai/zh-CN/gateway/troubleshooting
- **GitHub 仓库**: https://github.com/anomalyco/openclaw
- **常见问题 (FAQ)**: https://docs.openclaw.ai/zh-CN/help/faq
- **Control UI**: https://docs.openclaw.ai/zh-CN/web/control-ui
- **TUI**: https://docs.openclaw.ai/zh-CN/web/tui
- **ClawHub 技能中心**: https://clawhub.com
- **节点系统**: https://docs.openclaw.ai/zh-CN/nodes
- **CLI 参考**: https://docs.openclaw.ai/zh-CN/cli/index
- **Microsoft Teams 渠道**: https://docs.openclaw.ai/channels/msteams
- **ACP 工作区**: https://docs.openclaw.ai/zh-CN/acp
- **更新日志**: https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md
- **What's New (2026-03)**: https://tenten.co/openclaw/en/docs/whats-new/march-2026

---

## 快速诊断命令

| 命令 | 用途 | 何时使用 |
|------|------|---------|
| `openclaw status` | 本地系统摘要（操作系统、更新、Gateway、节点、会话、提供商）| 首次检查、快速概览 |
| `openclaw status --all` | 完整本地诊断（只读、可粘贴、相对安全）| 需要分享调试报告时 |
| `openclaw status --deep` | 运行 Gateway 健康检查（包括提供商探测）| "已配置"≠"正常工作"时 |
| `openclaw gateway probe` | Gateway 发现 + 可达性（本地 + 远程目标）| 怀疑在探测错误的 Gateway 时 |
| `openclaw channels status --probe` | 查询运行中 Gateway 的渠道状态（并可选探测）| Gateway 可达但渠道异常时 |
| `openclaw gateway status` | 监管程序状态（launchd/systemd）、运行时 PID/退出、最后错误 | 服务"看起来已加载"但没有运行时 |
| `openclaw logs --follow` | 实时日志流（运行时问题的最佳信号）| 需要实际故障原因时 |
| `openclaw doctor` | 诊断配置问题、提示修复建议 | 配置错误或需要迁移时 |
| `openclaw dashboard` | 打开浏览器控制界面（Web UI）| 需要图形界面管理时 |
| `openclaw tui` | 打开终端界面 | 需要纯文本界面时 |
| `openclaw security audit` | 审计配置安全状态 | 检查安全配置时 |
| `openclaw secrets` | 密钥管理和审计 | 管理密钥引用时 |
| `openclaw nodes status` | 查看已配对节点状态 | 检查节点连接时 |
| `openclaw memory status` | 查看记忆索引状态 | 检查记忆系统时 |
| `openclaw update` | 自更新到最新版本 | 检查/应用 OpenClaw 更新时 |
| `openclaw config schema` | 打印 openclaw.json 的 JSON Schema | 验证配置结构时 |
| `openclaw acp status` | 查看 ACP 工作区绑定状态 | 管理 ACP 会话绑定时 |
| `openclaw skills info <name>` | 查看技能详细信息、需求和 API 密钥 | 技能加载失败或需要配置时 |

**分享输出优先**: 使用 `openclaw status --all`（隐藏令牌）。如需粘贴 `openclaw status`，先设置 `OPENCLAW_SHOW_SECRETS=0`。

---

## 配置文件位置

```
~/.openclaw/
├── openclaw.json                    # 主配置——通道、模型、Gateway、技能
├── openclaw.json.bak*               # 自动备份 (.bak, .bak.1, .bak.2 ...)
├── .env                             # 环境变量（可选）
├── .clawhub/lock.json              # ClawHub 安装记录
├── node.json                        # 节点主机配置
├── exec-approvals.json              # Exec 批准配置
├── agents/
│   ├── <agentId>/agent/
│   │   ├── auth-profiles.json       # 每个代理的认证配置（OAuth + API 密钥）
│   │   ├── auth.json                # 内置 Pi 智能体运行时缓存（自动管理）
│   │   └── sessions/
│   │       ├── sessions.json        # 会话索引
│   │       └── *.jsonl              # 会话转录（每行一个 JSON）
├── workspace/                       # 代理工作区（git 跟踪）
│   ├── SOUL.md                      # 个性、写作风格、语气规则
│   ├── IDENTITY.md                  # 名称、类型、氛围
│   ├── USER.md                      # 所有者上下文和偏好
│   ├── AGENTS.md                    # 会话行为、记忆规则、安全
│   ├── BOOT.md                      # 启动指令
│   ├── BOOTSTRAP.md                 # 自动创建的引导文件
│   ├── HEARTBEAT.md                 # 定期任务清单（空 = 跳过心跳）
│   ├── MEMORY.md                    # 精选长期记忆（仅主会话）
│   ├── TOOLS.md                     # 联系人、SSH 主机、设备昵称
│   ├── memory/                      # 每日日志：YYYY-MM-DD.md、topic-chat.md
│   ├── skills/                      # 工作区级技能（优先级最高）
│   └── canvas/                      # Canvas 文件（http://<host>:18793/__openclaw__/canvas/）
├── sandboxes/                       # 沙箱容器配置
│   └── <agentId>/
│       ├── docker-compose.yml       # Docker Compose 配置
│       └── Dockerfile               # 自定义 Dockerfile
├── memory/main.sqlite               # 向量记忆 DB (Gemini 嵌入、FTS5 搜索)
├── logs/
│   ├── gateway.log                  # 运行时日志
│   ├── gateway.err.log              # 错误日志
│   └── openclaw-YYYY-MM-DD.log      # 文件日志（或 logging.file 配置的路径）
├── cron/
│   ├── jobs.json                    # 作业定义（计划、负载、传递目标）
│   └── runs/                        # 每个作业运行日志：{job-uuid}.jsonl
├── credentials/
│   ├── whatsapp/default/            # Baileys 会话：~1400 个 app-state-sync-key-*.json 文件
│   ├── telegram/<botname>/token.txt  # Bot 令牌（每个机器人账户一个）
│   ├── signal/                      # signal-cli 配置
│   ├── bluebubbles/                 # BlueBubbles 凭证
│   ├── bird/cookies.json            # X/Twitter 认证 cookie
│   ├── discord/                     # Discord 凭证
│   ├── slack/                       # Slack 凭证
│   └── googlechat/                  # Google Chat 服务账号
├── extensions/{name}/               # 自定义插件 (TypeScript)
│   ├── openclaw.plugin.json         # {"id", "channels", "configSchema"}
│   ├── package.json
│   └── index.ts
├── skills/                          # 托管/本地技能（所有代理共享）
│   └── <skill>/SKILL.md
├── identity/                        # device.json、device-auth.json
├── devices/                         # paired.json、pending.json
├── media/inbound/                   # 接收的图像、音频文件
├── media/browser/                   # 浏览器截图
├── browser/openclaw/user-data/      # Chromium 配置文件 (~180MB)
└── web/                             # Web Control UI + WebChat
    └── canvas/                      # Canvas 托管
```

---

## 核心配置概念

### 配置文件格式

- **格式**: JSON5（支持注释、尾逗号）
- **位置**: `~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- **严格验证**: 未知键、类型错误或无效值会导致 Gateway 拒绝启动
- **修复命令**: `openclaw doctor` 和 `openclaw doctor --fix`

### 配置包含（`$include`）

使用 `$include` 指令拆分配置文件：

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },

  // 包含单个文件（替换该键的值）
  agents: { $include: "./agents.json5" },

  // 包含多个文件（按顺序深度合并）
  broadcast: {
    $include: ["./clients/team-a.json5", "./clients/team-b.json5"],
  },
}
```

**规则**:
- 单个文件 → 替换
- 文件数组 → 按顺序深度合并
- 支持嵌套包含（最多10层）
- 相对路径相对于包含文件解析

### 配置热重载

Gateway 监视 `~/.openclaw/openclaw.json` 并自动应用更改：

```json5
{
  gateway: {
    reload: {
      mode: "hybrid",      // hybrid | hot | restart | off
      debounceMs: 300,
    },
  },
}
```

**Reload 模式：**
- **`hybrid`** (默认): 立即热应用安全更改，对关键更改自动重启
- **`hot`**: 仅热应用安全更改，需要重启时记录警告
- **`restart`**: 任何配置更改都会重启 Gateway
- **`off`**: 禁用文件监视，更改在下次手动重启时生效

**热重载 vs 重启：**
- **可热重载**（无需重启）: 渠道、智能体/模型、自动化（hooks/cron）、会话/消息、工具/媒体、UI/日志
- **需要重启**: Gateway 服务器（port/bind/auth/tailscale/TLS）、基础设施（discovery/canvasHost/plugins）

### 环境变量替换

在任何字符串值中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
  gateway: {
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

**规则**:
- 仅匹配大写变量名：`[A-Z_][A-Z0-9_]*`
- 缺失或空变量会抛出错误
- 使用 `$${VAR}` 转义输出字面量

### 安全配置模式

| 模式 | 行为 | 风险 |
|---|---|---|
| `open` + `allowFrom: ["*"]` | 任何人可发消息，机器人回复所有 | 高——消耗 API 积分，机器人作为你发言 |
| `pairing` | 未知发送者收到配对码，需批准 | 低——显式控制关口 |
| `allowlist` + `allowFrom: ["+1..."]` | 仅允许列表中的号码 | 低——显式控制 |
| `disabled` | 通道完全关闭 | 无 |

---

## 配置编辑

### 安全编辑模式

始终：备份、使用 new CLI 编辑、必要时重启。

```bash
# 方法 1: 使用 openclaw config set（推荐用于单键编辑）
openclaw config set channels.whatsapp.allowFrom '["+15555550123"]'
 
# 方法 2: Control UI（推荐用于图形界面）
openclaw dashboard  # 在浏览器中打开配置编辑器

# 方法 3: 使用 config.patch（部分更新，RPC）
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { whatsapp: { allowFrom: [\"+15555550123\"] } } }",
  "baseHash": "<从 config.get 获取的 hash>"
}'

# 方法 4: 配置向导
openclaw configure
```

### 常用配置编辑

```bash
# 切换 WhatsApp 到 allowlist
openclaw config set channels.whatsapp.dmPolicy allowlist
openclaw config set channels.whatsapp.allowFrom '["+15555550123"]'

# 启用 WhatsApp 群组
openclaw config set channels.whatsapp.groupPolicy allowlist
openclaw config set channels.whatsapp.groupAllowFrom '["+15551234567"]'

# 设置模型
openclaw config set agents.defaults.models '{"anthropic/claude-opus-4-6": {"alias": "opus"}}'

# 启用节点
openclaw config set nodes.enabled true

# 调整并发
openclaw config set agents.defaults.maxConcurrent 10
```

### 从备份恢复

```bash
# 最新备份
cp ~/.openclaw/openclaw.json.bak ~/.openclaw/openclaw.json

# 按日期列出所有备份
ls -lt ~/.openclaw/openclaw.json.bak*

# 重启前验证 JSON
python3 -m json.tool ~/.openclaw/openclaw.json > /dev/null && echo "OK" || echo "BROKEN"
```

---

## Web 界面

### Control UI（浏览器界面）

OpenClaw 提供基于浏览器的控制界面：

```bash
# 打开 Control UI
openclaw dashboard

# 打开但不自动打开浏览器
openclaw dashboard --no-open
```

**访问方式：**

- **本地**: `http://127.0.0.1:18789/`
- **通过 SSH 隧道**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`，然后访问 `http://127.0.0.1:18789/`
- **通过 Tailscale Serve**: `https://<magicdns>/`（需要配置 `openclaw gateway --tailscale serve`）

**功能：**
- 聊天界面（与模型直接对话）
- 渠道状态和配置
- 会话管理
- 定时任务（Cron）管理
- 技能管理
- 节点管理
- 配置编辑（支持表单和原始 JSON）
- 日志查看
- 系统状态和健康检查

**认证：**
- 首次连接需要设备配对批准（本地 127.0.0.1 除外）
- 使用 `openclaw devices approve <requestId>` 批准
- 支持 Token 和密码认证

### TUI（终端界面）

纯文本终端界面，适合服务器环境：

```bash
# 打开 TUI
openclaw tui

# 连接到远程 Gateway
openclaw tui --url ws://<host>:18789 --token <token>

# 指定会话
openclaw tui --session main --deliver
```

**TUI 键盘快捷键：**
- `Enter`: 发送消息
- `Esc`: 中止运行
- `Ctrl+C`: 清除输入（按两次退出）
- `Ctrl+D`: 退出
- `Ctrl+L`: 模型选择器
- `Ctrl+G`: 智能体选择器
- `Ctrl+P`: 会话选择器
- `Ctrl+O`: 切换工具输出展开
- `Ctrl+T`: 切换思考可见性

**TUI 斜杠命令：**
- `/status`: 显示状态
- `/agent <id>`: 切换智能体
- `/session <key>`: 切换会话
- `/model <provider/model>`: 切换模型
- `/deliver on/off`: 启用/禁用投递
- `/new` 或 `/reset`: 重置会话
- `/abort`: 中止运行

---

## 故障排除

### WhatsApp: "我发送消息但没有回复"

按顺序检查：

```bash
# 1. Gateway 是否真的在运行？
grep -i "whatsapp.*listening\|whatsapp.*starting" ~/.openclaw/logs/gateway.log | tail -5

# 2. 检查 WebSocket 超时/断开
grep -i "408\|499\|retry\|connection.*closed" ~/.openclaw/logs/gateway.err.log | tail -10

# 3. 检查跨上下文消息阻止
grep -i "cross-context.*denied" ~/.openclaw/logs/gateway.err.log | tail -10

# 4. 检查会话是否存在
cat ~/.openclaw/agents/main/sessions/sessions.json | jq -r 'to_entries[] | select(.key | test("whatsapp")) | "\(.key) | \(.value.origin.label // "?")"'

# 5. 检查发送者是否被允许
cat ~/.openclaw/openclaw.json | jq '.channels.whatsapp | {dmPolicy, allowFrom, groupPolicy, selfChatMode}'

# 6. 检查是否是群组消息
cat ~/.openclaw/openclaw.json | jq '.channels.whatsapp.groupPolicy'

# 7. 检查通道拥塞（代理忙）
grep "lane wait exceeded" ~/.openclaw/logs/gateway.err.log | tail -5

# 8. 检查运行超时
grep "embedded run timeout" ~/.openclaw/logs/gateway.err.log | tail -5
```

**快速诊断命令**:
```bash
openclaw channels status --probe
```

### WhatsApp: 完全断开连接

```bash
# 检查凭证文件
ls ~/.openclaw/credentials/whatsapp/default/ | wc -l

# 检查登录事件
grep -i "pair\|link\|qr\|scan\|logged out" ~/.openclaw/logs/gateway.log | tail -10

# 检查 Baileys 错误
grep -i "baileys\|DisconnectReason\|logout\|stream:error" ~/.openclaw/logs/gateway.err.log | tail -20

# 重新登录
openclaw channels login
```

### Telegram: "机器人有问题/忘记事情"

```bash
# 1. 检查配置
cat ~/.openclaw/openclaw.json | jq '.channels.telegram'

# 2. 检查轮询超时
grep -i "telegram.*exit\|telegram.*timeout\|getUpdates" ~/.openclaw/logs/gateway.err.log | tail -10

# 3. 检查轮询偏移（遗忘/重放）
cat ~/.openclaw/telegram/update-offset-*.json

# 4. 重启 Gateway
openclaw gateway restart
```

### Signal: "RPC 发送失败"

```bash
# 1. 检查进程
ps aux | grep "[s]ignal-cli"

# 2. 检查 RPC 端点
grep -i "signal.*starting\|signal.*8080" ~/.openclaw/logs/gateway.log | tail -10

# 3. 检查连接不稳定
grep -i "HikariPool\|reconnecting\|SSE stream error" ~/.openclaw/logs/gateway.err.log | tail -10

# 4. 检查速率限制
grep -i "signal.*rate" ~/.openclaw/logs/gateway.err.log | tail -5
```

### QQ Bot: 安装与配置

**QQ Bot** 是由社区维护的第三方渠道插件，提供完整的 QQ 机器人支持。
- **推荐版本**：`@tencent-connect/openclaw-qqbot` v1.6.6（最新稳定版）
- **社区分支**：`@sliverp/qqbot` v1.6.1

#### 第一步：创建 QQ 机器人

1. 前往 [QQ 开放平台](https://q.qq.com/)，手机 QQ 扫码登录
2. 点击**创建机器人**，获取 `AppID` 和 `AppSecret`
3. **AppSecret 只显示一次**，务必立即保存

#### 第二步：安装插件

```bash
# 官方版（推荐，v1.6.6，功能最全）
openclaw plugins install @tencent-connect/openclaw-qqbot@latest

# 社区版（v1.6.1）
openclaw plugins install @sliverp/qqbot@latest

# 或从源码安装
git clone https://github.com/sliverp/qqbot.git && cd qqbot
openclaw plugins install .
```

#### 第三步：配置

**方式一：通过 CLI 配置（推荐）**

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

**方式二：手动编辑配置文件**

编辑 `~/.openclaw/openclaw.json`：

```json5
{
  "channels": {
    "qqbot": {
      "enabled": true,
      "appId": "你的 AppID",
      "clientSecret": "你的 AppSecret",
      "markdownSupport": true,     // 启用 Markdown 格式（需要 QQ 开放平台申请权限）
      "allowFrom": ["*"],          // 允许发送消息的用户
      "dmPolicy": "open",           // open / pairing / allowlist
      // STT 语音转文字（可选）
      "stt": {
        "provider": "siliconflow",
        "model": "FunAudioLLM/SenseVoiceSmall"
      },
      // TTS 文字转语音（可选）
      "tts": {
        "provider": "openai",
        "model": "FunAudioLLM/CosyVoice2-0.5B",
        "voice": "FunAudioLLM/CosyVoice2-0.5B:claire"
      }
    }
  }
}
```

#### 多账户配置（多个 QQ 机器人）

```json5
{
  "channels": {
    "qqbot": {
      "enabled": true,
      // 默认账户
      "appId": "111111111",
      "clientSecret": "secret-of-bot-1",
      
      // 更多账户
      "accounts": {
        "bot2": {
          "enabled": true,
          "appId": "222222222",
          "clientSecret": "secret-of-bot-2",
          "allowFrom": ["*"]
        },
        "bot3": {
          "enabled": true,
          "appId": "333333333",
          "clientSecret": "secret-of-bot-3"
        }
      }
    }
  }
}
```

通过 CLI 添加第二个机器人：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

#### 向指定用户发送消息

```bash
# 默认机器人
openclaw message send --channel "qqbot" \
  --target "qqbot:c2c:OPENID" \
  --message "hello"

# 指定机器人账户
openclaw message send --channel "qqbot" \
  --account bot2 \
  --target "qqbot:c2c:OPENID" \
  --message "hello from bot2"
```

**Target 格式：**
| 格式 | 说明 |
|------|------|
| `qqbot:c2c:OPENID` | 私聊 |
| `qqbot:group:GROUP_OPENID` | 群聊 |
| `qqbot:channel:CHANNEL_ID` | 频道 |

### QQ Bot: 富媒体使用

AI 在回复中使用特殊标签发送富媒体内容：

| 类型 | 标签格式 | 说明 |
|------|----------|------|
| 图片 | `<qqimg>/path/to/image.png</qqimg>` | 本地文件或 URL，支持 jpg/png/gif/webp |
| 语音 | `<qqvoice>/path/to/audio.mp3</qqvoice>` | 支持 mp3/wav/silk/ogg |
| 文件 | `<qqfile>/path/to/file.pdf</qqfile>` | 任意格式，最大 100MB（v1.6.6 分块上传） |
| 视频 | `<qqvideo>/path/to/video.mp4</qqvideo>` | 本地文件或 URL |

**示例：**
```markdown
给你画好了猫咪：

<qqimg>https://example.com/cat.png</qqimg>
```

**标签容错**：插件自动纠正 30+ 种变体写法，比如 `<qq_img>`、`＜qqimg＞` 都能识别。

**大文件分块上传（v1.6.6）**：超过阈值的文件自动分块并行上传，支持断点续传和进度回调。

**引用消息解析（v1.6.x）**：QQ 的引用消息（`REFIDX_*`）会被透明解析为完整原文+多媒体摘要，注入 AI 输入上下文，使回复更智能。

### QQ Bot: 语音能力配置

STT（语音转文字）支持两级优先级：
1. `channels.qqbot.stt`（插件专属）
2. `tools.media.audio.models[0]`（框架级回退）

配置示例：
```json5
{
  "tools": {
    "media": {
      "audio": {
        "models": [
          { "provider": "siliconflow", "model": "FunAudioLLM/SenseVoiceSmall" }
        ]
      }
    }
  }
}
```

TTS（文字转语音）同样两级优先级：
1. `channels.qqbot.ttt`（插件专属）
2. `messages.tts`（框架级回退）

### QQ Bot: 升级

```bash
# 通过 OpenClaw 升级（推荐）
openclaw plugins upgrade @tencent-connect/openclaw-qqbot@latest

# 社区版升级
openclaw plugins upgrade @sliverp/qqbot@latest

# 通过 npx 升级
npx -y @sliverp/qqbot@latest upgrade

# 使用项目自带脚本一键升级
cd qqbot
bash ./upgrade-and-run.sh

# 源码升级（手动）
bash ./scripts/upgrade.sh
openclaw plugins install .
openclaw gateway restart
```

**聊天内热升级（v1.6.x）**：在 QQ 私聊中直接发送命令即可升级，无需 SSH/服务器访问：

```
/bot-upgrade              # 升级到最新版
/bot-upgrade --latest     # 强制拉取最新
/bot-upgrade --version 1.6.6  # 指定版本
/bot-upgrade ?            # 查看帮助
```

升级前插件会自动备份 AppID/AppSecret 凭证，升级失败可自动恢复。

### QQ Bot: 存储管理（v1.6.6）

```bash
# 在 QQ 私聊中发送
/bot-clear-storage        # 清理插件缓存和下载文件
```

清理按账户和对话隔离，不影响其他机器人或会话数据。

### QQ Bot: 频道 API 代理（v1.6.x）

AI 可通过 `qqbot_channel_api` 工具直接调用 QQ 开放平台频道 HTTP 端点：

- 子频道管理
- 成员查询
- 论坛帖子操作
- 公告和日程管理

### QQ Bot: 安全增强（v1.6.6）

- **SSRF 防护**（`ssrf-guard`）：所有远程文件下载会检查 DNS 和 IP，阻止内网/保留地址的恶意 URL
- **作用域下载路径**：附件按账户和对话隔离存储，防止多账户冲突和意外覆盖
- **HTTP/SOCKS5 代理支持**：所有上传/下载操作支持代理配置

### QQ Bot: 故障排除

```bash
# 检查插件状态
openclaw plugins list

# 检查通道配置
openclaw channels list

# 查看实时日志
openclaw logs --follow

# 检查配置
openclaw config get channels.qqbot

# 清理缓存排除存储问题
# 在 QQ 私聊中发送: /bot-clear-storage
```

**常见问题：**
- **机器人回复"该机器人去火星了"**：检查 Gateway 是否运行，以及 AppID/AppSecret 是否配置正确
- **Markdown 不显示**：需要在 QQ 开放平台申请 Markdown 权限
- **语音无法识别**：检查 STT 配置是否正确，provider 是否存在且有 API 密钥
- **大文件上传失败**：检查网络连接和代理配置，分块上传会自动重试；如仍失败检查日志中的超时错误
- **引用消息丢失上下文**：确保插件版本 ≥ v1.6.x，旧版本不支持 `REFIDX_*` 解析
- **下载被 SSRF 防护拦截**：正常行为——插件会阻止指向内网地址的 URL，检查来源是否可信

### Microsoft Teams: 安装与配置

**Microsoft Teams** 从 OpenClaw v2026.3.x 起作为独立插件提供，支持流式回复、Adaptive Card 审批和原生 Teams 体验。

#### 第一步：注册 Azure Bot

1. 前往 [Azure Portal](https://portal.azure.com/)，创建 **Azure Bot 资源**
2. 记录 `App ID`、`App Password`（Client Secret）和 `Tenant ID`
3. 在 Bot 配置中设置 Messaging Endpoint（公开 HTTPS URL，默认端口 3978）
4. 在 Teams 中上传 App Manifest 包（含 Bot 配置和 RSC 权限）

#### 第二步：安装插件

```bash
openclaw plugins install @openclaw/msteams
```

#### 第三步：配置

```json5
{
  "channels": {
    "msteams": {
      "enabled": true,
      "appId": "${MSTEAMS_APP_ID}",
      "appPassword": "${MSTEAMS_APP_PASSWORD}",
      "tenantId": "${MSTEAMS_TENANT_ID}",
      "webhook": {
        "port": 3978,
        "path": "/api/messages"
      },
      "dmPolicy": "pairing",           // 私聊：未知发送者需配对
      "allowFrom": ["user@org.com"],   // 仅允许指定用户（使用 Azure AD Object ID 更安全）
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["user@org.com"],
      "configWrites": false
    }
  }
}
```

**安全说明：**
- 插件通过 JWT 验证来自 Microsoft 的请求签名，确保消息真实性
- 建议使用 Azure AD Object ID（而非 UPN/显示名，因为这些可变）进行访问控制
- 使用最小权限原则注册 Azure App

#### 故障排除

```bash
# 检查插件状态
openclaw plugins list

# 检查渠道状态
openclaw channels status --probe

# 查看实时日志
openclaw logs --follow

# 检查配置
openclaw config get channels.msteams
```

**常见问题：**
- **消息未收到**：检查 Messaging Endpoint 是否公开可达（HTTPS，非 localhost）
- **签名验证失败**：确认 `appId` 和 `appPassword` 与 Azure Portal 一致
- **配对未完成**：在 `dmPolicy: "pairing"` 模式下，使用 `openclaw pairing list` 查看待处理请求

---



```bash
# 1. 所有作业概览
cat ~/.openclaw/cron/jobs.json | jq -r '.jobs[] | "\(.enabled | if . then "ON " else "OFF" end) \(.state.lastStatus // "never" | if . == "error" then "FAIL" else . end) \(.name)"'

# 2. 失败作业详情
cat ~/.openclaw/cron/jobs.json | jq '.jobs[] | select(.state.lastStatus == "error")'

# 3. 读取失败作业运行日志
JOB_ID="粘贴job-uuid"
tail -20 ~/.openclaw/cron/runs/$JOB_ID.jsonl | python3 -c "
import sys, json
for line in sys.stdin:
    try:
        obj = json.loads(line)
        if obj.get('type') == 'message':
            role = obj['message']['role']
            text = ''.join(c.get('text','') for c in obj['message'].get('content',[]) if isinstance(c,dict))
            if text.strip():
                print(f'[{role}] {text[:300]}')
    except: pass
"

# 4. 使用诊断命令
openclaw cron status --deep
```

### 记忆 / "它忘记了"

记忆系统有 3 层：

```bash
# 第 1 层：上下文窗口（会话内）
grep -c '"compaction"' ~/.openclaw/agents/main/sessions/SESSION_ID.jsonl

# 第 2 层：工作区文件
ls -la ~/.openclaw/workspace/memory/
cat ~/.openclaw/workspace/MEMORY.md

# 第 3 层：向量记忆 DB
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT path, size FROM files;"
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT COUNT(*) FROM chunks;"
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT substr(text, 1, 200) FROM chunks_fts WHERE chunks_fts MATCH 'KEYWORD' LIMIT 5;"
```

---

## ACP 工作区绑定

**ACP（Agent Control Plane）** 允许将正在进行的对话绑定为 ACP 工作区，无需创建新线程——直接在 Telegram、Discord、iMessage 等渠道的实时聊天中启用持久工作区。

### 基本命令

```bash
# 查看 ACP 状态
openclaw acp status

# 在当前聊天中绑定 Codex 工作区（v2026.3.28 新增：支持 Discord、BlueBubbles、iMessage）
openclaw acp spawn codex --bind here

# 列出所有 ACP 工作区
openclaw acp list
```

### 支持渠道（v2026.3.28 更新）

| 渠道 | `--bind here` 支持 | 说明 |
|------|-------------------|------|
| Telegram | ✅ | 将当前 Telegram 对话变为工作区 |
| Discord | ✅ **新增** | 在 Discord 频道/私信中直接绑定 |
| iMessage / BlueBubbles | ✅ **新增** | 在 iMessage 对话中启用 ACP |

### 配置示例

在 `openclaw.json` 中配置 ACP 绑定：

```json5
{
  "bindings": [
    {
      "type": "acp",
      "match": { "peer": { "id": "your_channel_or_thread_id" } }
      // 其他 ACP 选项...
    }
  ]
}
```

**使用场景：**
- 将 Telegram/Discord/iMessage 对话转为持久 AI 工作区
- 在现有聊天上下文中执行代码、管理文件（无需新开线程）
- 跨会话保持记忆和上下文连续性

---

## 搜索会话

### 查找对话

```bash
# 按名称搜索（不区分大小写）
cat ~/.openclaw/agents/main/sessions/sessions.json | jq -r 'to_entries[] | select(.value.origin.label // "" | test("NAME"; "i")) | "\(.value.sessionId) | \(.value.lastChannel) | \(.value.origin.label)"'

# 按渠道查找
cat ~/.openclaw/agents/main/sessions/sessions.json | jq -r 'to_entries[] | select(.value.lastChannel == "whatsapp") | "\(.value.sessionId) | \(.value.origin.label // .key)"'

# 最近的会话
cat ~/.openclaw/agents/main/sessions/sessions.json | jq -r '[to_entries[] | {id: .value.sessionId, updated: .value.updatedAt, label: (.value.origin.label // .key), ch: (.value.lastChannel // "cron")}] | sort_by(.updated) | reverse | .[:10][] | "\(.updated | . / 1000 | todate) | \(.ch) | \(.label)"'
```

### 跨会话搜索消息

```bash
# 快速定位包含关键字的会话
grep -l "KEYWORD" ~/.openclaw/agents/main/sessions/*.jsonl

# 详细查看带时间戳的匹配消息
grep "KEYWORD" ~/.openclaw/agents/main/sessions/*.jsonl | python3 -c "
import sys, json
for line in sys.stdin:
    path, data = line.split(':', 1)
    try:
        obj = json.loads(data)
        if obj.get('type') == 'message':
            role = obj['message']['role']
            text = ''.join(c.get('text','') for c in obj['message'].get('content',[]) if isinstance(c,dict))
            if text.strip():
                sid = path.split('/')[-1].replace('.jsonl','')[:8]
                ts = obj.get('timestamp','')[:19]
                print(f'{ts} [{sid}] [{role}] {text[:200]}')
    except: pass
" | head -30
```

### 阅读会话转录

```bash
# 最后 30 条消息
tail -50 ~/.openclaw/agents/main/sessions/SESSION_ID.jsonl | python3 -c "
import sys, json
for line in sys.stdin:
    try:
        obj = json.loads(line)
        if obj.get('type') == 'message':
            role = obj['message']['role']
            text = ''.join(c.get('text','') for c in obj['message'].get('content',[]) if isinstance(c,dict))
            if text.strip() and role != 'toolResult':
                print(f'[{role}] {text[:300]}')
                print()
    except: pass
"
```

---

## 技能生态

### 技能位置和加载优先级

```
1. 工作区技能:   <workspace>/skills          (最高优先级)
2. 托管技能:     ~/.openclaw/skills          (共享)
3. 内置技能:     npm 包或 OpenClaw.app 内置  (最低优先级)
4. 额外目录:     skills.load.extraDirs      (最低优先级)
```

### ClawHub 使用

**ClawHub 是推荐的公共技能注册中心**

```bash
# 安装 ClawHub CLI
npm i -g clawhub  # 或 pnpm add -g clawhub

# 登录
clawhub login     # 浏览器认证流程

# 搜索技能（支持语义搜索，不仅仅是关键词）
clawhub search "image generation"
clawhub search "postgres backups"

# 安装到工作区
clawhub install nano-banana-pro

# 列出已安装的技能
clawhub list

# 更新所有技能
clawhub update --all

# 更新特定技能
clawhub update my-skill
clawhub update my-skill --force

# 备份/发布技能
clawhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0

# 同步本地技能（扫描并发布更新）
clawhub sync
clawhub sync --all  # 非交互模式
```

**ClawHub 特性：**
- 公开浏览技能及其内容
- 基于嵌入向量的智能搜索
- 版本管理和变更日志
- 技能评级和评论
- 星标和评论功能
- **VirusTotal 自动扫描**：所有上传到 ClawHub 的技能自动进行恶意软件扫描

### 技能安全（v2026.3+）

```bash
# 技能签名验证（Beta）—— 仅安装已签名的技能
openclaw config set skills.requireSigned true

# 查看技能安全状态
clawhub info <skill-name>   # 显示 VirusTotal 扫描结果

# 报告可疑技能
clawhub report <skill-name>
```

**技能管理 UI（v2026.3+）**

Control UI 现在显示技能状态标签：
- **All** — 所有技能
- **Ready** — 已安装且可用
- **Needs Setup** — 缺少 API 密钥或依赖项
- **Disabled** — 已禁用

```bash
# CLI 查看技能状态
openclaw skills check -v

# 查看单个技能详情（需求、API 密钥位置）
openclaw skills info <skill-name>
```

### 技能配置

在 `~/.openclaw/openclaw.json` 中配置技能：

```json5
{
  skills: {
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.com",
          model: "nano-pro",
        },
      },
      "peekaboo": { enabled: true },
      "sag": { enabled: false },
    },
  },
}
```

### 技能格式和门槛

```markdown
---
name: my-skill
description: 这个技能做什么以及何时触发
metadata:
  {
    "openclaw":
      {
        "emoji": "🚀",
        "requires": {
          "bins": ["uv"],
          "env": ["API_KEY"],
          "config": ["browser.enabled"]
        },
        "os": ["darwin", "linux"],
        "always": false,
        "primaryEnv": "API_KEY"
      },
  }
---

# My Skill

指令放在这里。仅当技能触发时加载。
保持简洁，上下文窗口是共享资源。
```

**门槛字段（metadata.openclaw.requires）：**
- `always: true`: 始终包含该技能（跳过其他门槛）
- `bins`: 列表，每个二进制文件必须存在于 PATH 中
- `anyBins`: 列表，至少一个必须存在于 PATH 中
- `env`: 列表，环境变量必须存在或在配置中提供
- `config`: openclaw.json 路径列表，必须为真值
- `os`: 可选的平台列表（darwin、linux、win32）
- `primaryEnv`: 与 `skills.entries.<name>.apiKey` 关联的环境变量名称

**沙箱注意事项：**
- `requires.bins` 在技能加载时在宿主机上检查
- 如果智能体处于沙箱隔离状态，二进制文件也必须存在于容器内部

---

## 节点系统

### 节点概念

**节点**是连接到 Gateway 的配套设备（macOS/iOS/Android/无头），通过 `role: "node"` 连接到 Gateway WebSocket，暴露命令接口（`canvas.*`、`camera.*`、`system.*` 等）。

**节点 vs Gateway：**
- Gateway：接收消息、运行模型、路由工具调用
- 节点：提供额外功能，如本地屏幕/摄像头/画布和命令执行

### 节点配对和状态

```bash
# 查看待处理的配对请求
openclaw devices list

# 批准配对请求
openclaw devices approve <requestId>

# 拒绝配对请求
openclaw devices reject <requestId>

# 查看已配对节点状态
openclaw nodes status

# 查看节点详细信息
openclaw nodes describe --node <id|name|ip>

# 列出所有节点
openclaw nodes list
```

### 远程节点主机（system.run）

当 Gateway 在一台机器上运行，而命令需要在另一台机器上执行时使用：

```bash
# 启动无头节点主机（前台）
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"

# 启动节点主机（服务）
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart

# 在节点上执行命令
openclaw nodes run --node <id|name|ip> -- echo "Hello from node"
```

**SSH 隧道访问（loopback 绑定）：**
```bash
# 创建 SSH 隧道
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 通过隧道连接节点主机
export OPENCLAW_GATEWAY_TOKEN="<token>"
openclaw node run --host 127.0.0.1 --port 18790
```

### Canvas 和媒体操作

```bash
# Canvas 快照
openclaw nodes canvas snapshot --node <id|name|ip> --format png --max-width 1200

# Canvas 控制
openclaw nodes canvas present --node <id|name|ip> --target https://example.com
openclaw nodes canvas navigate https://example.com --node <id|name|ip>
openclaw nodes canvas eval "document.title" --node <id|name|ip>
openclaw nodes canvas hide --node <id|name|ip>

# 相机照片
openclaw nodes camera snap --node <id|name|ip> --facing front

# 相机视频片段
openclaw nodes camera clip --node <id|name|ip> --duration 10s

# 屏幕录制
openclaw nodes screen record --node <id|name|ip> --duration 10s --fps 10

# 位置信息
openclaw nodes location get --node <id|name|ip> --accuracy precise
```

### 节点通知

```bash
# 发送通知（仅 macOS）
openclaw nodes notify --node <id|name|ip> \
  --title "Ping" \
  --body "Gateway ready" \
  --priority active \
  --delivery system
```

### Exec 节点绑定

```bash
# 设置默认节点
openclaw config set tools.exec.node "node-id-or-name"

# 按智能体覆盖
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"

# 添加命令到允许列表
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/git"
```

---

## 多智能体配置

### 创建多个智能体

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
      { id: "public", workspace: "~/.openclaw/workspace-public", sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" } },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
  channels: {
    whatsapp: {
      accounts: {
        personal: {},
        biz: {},
      },
    },
  },
}
```

### 智能体访问控制

**完全访问**（个人智能体）:
```json5
{ id: "personal", sandbox: { mode: "off" } }
```

**只读**:
```json5
{
  id: "family",
  sandbox: {
    mode: "all",
    scope: "agent",
    workspaceAccess: "ro",
  },
  tools: {
    allow: ["read", "sessions_list"],
    deny: ["write", "edit", "exec"],
  },
}
```

**无文件系统访问**（仅消息）:
```json5
{
  id: "public",
  sandbox: {
    mode: "all",
    scope: "agent",
    workspaceAccess: "none",
  },
  tools: {
    allow: ["whatsapp", "telegram", "discord"],
    deny: ["read", "write", "exec", "browser"],
  },
}
```

---

## 安全和密钥管理

### 安全审计

```bash
# 安全审计（基本）
openclaw security audit

# 深度安全审计（包括实时探测）
openclaw security audit --deep

# 自动修复安全配置
openclaw security audit --fix
```

### 密钥管理（Secrets）

OpenClaw 支持 **SecretRef** 机制，提供安全的密钥管理：

```bash
# 重新加载密钥引用
openclaw secrets reload

# 密钥审计
openclaw secrets audit

# 配置密钥提供者
openclaw secrets configure
```

### SecretRef 示例

支持三种 SecretRef 源：

```json5
{
  // 1. ENV 密钥引用
  models: {
    providers: {
      openai: {
        apiKey: {
          source: "env",
          provider: "default",
          id: "OPENAI_API_KEY"
        }
      }
    }
  },

  // 2. FILE 密钥引用
  skills: {
    entries: {
      "nano-banana-pro": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/nano-banana-pro/apiKey"
        }
      }
    }
  },

  // 3. EXEC 密钥引用
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount"
      }
    }
  }
}
```

### Exec 批准

控制哪些命令可以在节点或 Gateway 上执行：

```bash
# 查看当前批准状态
openclaw approvals get

# 设置默认策略
openclaw approvals set security allowlist
openclaw approvals set ask on-miss

# 添加到允许列表
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/git"
openclaw approvals allowlist remove --node <id|name|ip> "/usr/bin/git"

# 按智能体设置
openclaw config set agents.list[0].tools.exec.security allowlist
```

**Exec 批准存储位置：**
- 节点主机：`~/.openclaw/exec-approvals.json`
- macOS 应用：设置 → Exec approvals

### 常见安全配置

```json5
{
  // 限制渠道访问
  channels: {
    whatsapp: {
      dmPolicy: "pairing",      // 或 allowlist
      allowFrom: ["+15555550123"],
      groupPolicy: "allowlist",
      groups: {
        "G1234567890": {
          requireMention: true
        }
      }
    }
  },

  // 启用沙箱隔离
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",      // off | non-main | all
        scope: "agent",        // session | agent | shared
        workspaceAccess: "ro"  // none | ro | rw
      }
    }
  },

  // 工具策略
  tools: {
    exec: {
      security: "allowlist",    // deny | ask | allowlist | full
      ask: "on-miss",
      node: "node-id-or-name"   // 绑定到特定节点
    }
  }
}
```

---

## 自更新系统（v2026.2+）

OpenClaw 支持通过 CLI 自更新，无需手动运行 npm：

```bash
# 检查并更新到最新版本
openclaw update

# 预览更新内容（不实际安装）
openclaw update --dry-run

# 配置更新通道
openclaw config set update.channel stable  # stable | beta | dev
```

**注意：** v2026.2+ 强制失效超过 2 个月的旧配置键，更新后请运行 `openclaw doctor` 检查配置兼容性。

---

## 异步审批钩子（v2026.2+）

插件和工具调用现在支持暂停等待人工审批的机制，通过 `requireApproval` 钩子实现。

### 审批流程

```bash
# 查看待处理审批
openclaw approvals list

# 批准请求（通过 CLI）
openclaw approvals approve <approval-id>

# 拒绝请求
openclaw approvals reject <approval-id>
```

**渠道中的审批**：
- **Telegram/Discord**：系统发送带有 Approve/Reject 按钮的消息
- **CLI**：使用 `/approve` 命令或 `openclaw approvals approve <id>`

### 配置审批策略

```json5
{
  "tools": {
    "exec": {
      "security": "ask",       // 执行前要求审批
      "ask": "on-miss"         // 仅在不在允许列表时询问
    }
  }
}
```

---

## OpenAI API 兼容层（v2026.3+）

OpenClaw Gateway 现在兼容 OpenAI API 格式，可与 LangChain、LlamaIndex、RAG 工具无缝集成：

```bash
# Gateway 默认在同一端口提供 OpenAI 兼容端点
# 端点：http://127.0.0.1:18789/v1/

# 测试兼容性
curl http://127.0.0.1:18789/v1/models \
  -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN"
```

**配置示例（在第三方工具中使用）：**
```python
import openai
client = openai.OpenAI(
    base_url="http://127.0.0.1:18789/v1",
    api_key="your-openclaw-gateway-token"
)
```

### OpenAI apply_patch 默认启用（v2026.3.28）

对于 OpenAI 和 OpenAI Codex 模型，`apply_patch` 工具现在**默认启用**，支持更流畅的代码更新流程：

```json5
{
  "models": {
    "providers": {
      "openai": {
        "type": "openai",
        "apiKey": "${OPENAI_API_KEY}",
        // apply_patch 默认 true，无需手动启用
      }
    }
  }
}
```

---

## 统一文件上传（v2026.2+）

各渠道的文件发送操作现已统一为 `upload-file` 动作：

```bash
# Slack
openclaw message send --channel slack \
  --target "slack:C1234567" \
  --file /path/to/file.pdf \
  --comment "这是文件"

# Microsoft Teams
openclaw message send --channel msteams \
  --target "msteams:user@org.com" \
  --file /path/to/report.xlsx

# Google Chat
openclaw message send --channel googlechat \
  --target "googlechat:space-id" \
  --file /path/to/image.png
```

---

## 新命令概述

### 定时任务（Cron）

```bash
# 查看状态
openclaw cron status

# 列出所有作业
openclaw cron list

# 添加作业
openclaw cron add \
  --name morning-summary \
  --at "08:00" \
  --message "Morning summary please"

# 编辑作业
openclaw cron edit <id> --at "09:00"

# 启用/禁用
openclaw cron enable <id>
openclaw cron disable <id>

# 查看运行历史
openclaw cron runs --id <id> --limit 20

# 手动运行
openclaw cron run <id>
```

### 插件管理

```bash
# 列出插件
openclaw plugins list

# 安装插件
openclaw plugins install <path|npm-spec|tgz>

# 升级插件
openclaw plugins upgrade <id>@latest

# 启用/禁用
openclaw plugins enable <id>
openclaw plugins disable <id>

# 插件诊断
openclaw plugins doctor
```

### 配置 Schema

```bash
# 打印 openclaw.json 的 JSON Schema（用于验证和 IDE 集成）
openclaw config schema

# 导出 Schema 到文件
openclaw config schema > ~/.openclaw/openclaw.schema.json
```

### 沙箱管理

```bash
# 列出沙箱
openclaw sandbox list

# 重建沙箱
openclaw sandbox recreate --agent <id>
openclaw sandbox recreate --all

# 解释沙箱状态
openclaw sandbox explain --agent <id>
```

### 配对管理

```bash
# 列出待处理请求
openclaw pairing list

# 批准配对
openclaw pairing approve <channel> <code>

# 带通知批准
openclaw pairing approve --channel whatsapp <code> --notify
```

### 记忆系统

```bash
# 查看状态
openclaw memory status

# 重建索引
openclaw memory index

# 搜索记忆（支持多语言，v2026.3+）
openclaw memory search "important note"
```

**记忆系统增强（v2026.3+）：**
- **多语言原生支持**：记忆存储和检索支持多语言，跨语言检索更智能
- **Memory v2 预览功能**（需在配置中启用）：
  - 向量语义搜索（基于嵌入）
  - 记忆分层：公开 / 私有 / 敏感
  - PII 自动脱敏
  - 跨代理共享记忆

```json5
{
  // 启用 Memory v2 预览（实验性）
  "memory": {
    "version": 2,
    "multilingual": true,
    "piiRedaction": true
  }
}
```

### 浏览器管理

```bash
# 浏览器状态
openclaw browser status

# 启动/停止
openclaw browser start
openclaw browser stop

# 标签页操作
openclaw browser open <url>
openclaw browser tabs
openclaw browser focus <tabId>
openclaw browser close [tabId]

# 截图和快照
openclaw browser screenshot
openclaw browser snapshot --format aria
```

---

## Web Control UI

### 启动

```bash
# Gateway 启动后自动提供 Web UI
openclaw gateway --port 18789

# 本地访问
# http://127.0.0.1:18789/

# 远程访问（需要认证或 Tailscale）
# http://<lan-ip>:18789/
```

### 配置 Web UI

```json5
{
  gateway: { port: 18789 },
  web: {
    enabled: true,
    title: "OpenClaw Control",
  },
  gateway: {
    auth: {
      mode: "password",  // 或 "token"
      password: "${OPENCLAW_WEB_PASSWORD}",
    },
  },
}
```

### 安全 HTTP 访问

**注意**: HTTP 浏览器上下文无法使用 WebCrypto，需特殊配置：

```json5
{
  web: {
    controlUi: {
      allowInsecureAuth: true,  // 允许不安全的设备身份认证
    },
  },
  gateway: {
    auth: {
      mode: "password",  // 仅密码认证（不使用设备身份）
      password: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

---

## 远程访问

### 方式对比

| 方式 | 安全性 | 设置难度 | 推荐场景 |
|------|--------|---------|---------|
| **Tailscale Serve** | Tailnet + 强认证 | 简单 | 家庭/团队网络 |
| **Tailscale Funnel** | 公开 + 密码保护 | 简单 | 需要临时公开访问 |
| **SSH 隧道** | 需 SSH 密钥 | 中等 | 已有 SSH 基础设施 |

### Tailscale Serve（推荐）

```bash
# 1. 配置
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.tailscale.resetOnExit false

# 2. 重启 Gateway
openclaw gateway restart

# 3. 访问（自动获取 Tailnet IP）
openclaw status --all
```

### Tailscale Funnel（公开访问）

```bash
# 必须设置密码认证
openclaw config set gateway.tailscale.mode funnel
openclaw config set gateway.auth.mode password
openclaw config set gateway.auth.password "${OPENCLAW_GATEWAY_TOKEN}"
openclaw gateway restart
```

### SSH 隧道

```bash
# 在 Gateway 主机上转发端口
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host

# 本地访问
# http://127.0.0.1:18789/
```

---

## Canvas 画布

### 访问 Canvas 文件

```bash
# Canvas 自动托管在工作区
# http://<gateway-host>:18793/__openclaw__/canvas/

# 配置 Canvas 主机
openclaw config set canvasHost.enabled true
openclaw config set canvasHost.port 18793
```

### 使用 Canvas

```bash
# 列出 Canvas 文件
ls -la ~/.openclaw/workspace/canvas/

# 推送到节点
openclaw nodes canvas-present --node <node-id> --target http://localhost:18793/__openclaw__/canvas/my-page.html
```

---

## 日志和调试

### 日志位置

| 日志类型 | 默认路径 | 说明 |
|---------|---------|------|
| **Gateway 文件日志** | `/tmp/openclaw/openclaw-YYYY-MM-DD.log` | 结构化日志（可配置）|
| **Gateway 服务日志** | `~/.openclaw/logs/gateway.log` | macOS LaunchAgent |
| **Gateway 错误日志** | `~/.openclaw/logs/gateway.err.log` | macOS LaunchAgent |
| **系统服务日志** | `journalctl --user -u openclaw-gateway` | Linux systemd |

### 启用详细日志

```bash
# 方法 1: 命令行
openclaw gateway --verbose

# 方法 2: 配置文件
openclaw config set logging.level debug
openclaw config set logging.consoleLevel debug
```

### 常用日志查询

```bash
# 实时日志
openclaw logs --follow

# 查找错误
grep -i "error\|fail\|exception" ~/.openclaw/logs/gateway.err.log | tail -20

# 查找消息处理
grep -i "message\|process\|agent.*run" ~/.openclaw/logs/gateway.log | tail -20

# 最近 WebSocket 连接
grep -i "connect\|disconnect\|ws.*client" ~/.openclaw/logs/gateway.log | tail -20
```

---

## 新手引导

### 初始设置

```bash
# 1. 安装
npm install -g openclaw@latest

# 2. 运行向导（推荐）
openclaw onboard

# 3. 配置 WhatsApp
openclaw channels login

# 4. 启动 Gateway
openclaw gateway --port 18789

# 5. 验证状态
openclaw status
```

### 向导功能

- **openclaw onboard**: 完整的向导流程（配置Gateway、工作区、渠道、技能）
- **openclaw configure**: 快速配置向导
- **openclaw doctor**: 诊断并修复配置问题

---

## 认证管理

### Setup-Token（推荐）

**Setup-token** 是推荐的认证方式，特别适合 Claude 订阅用户：

```bash
# 生成 setup-token（在任何机器上运行 Claude Code CLI）
claude setup-token

# 在 Gateway 主机上粘贴 setup-token
openclaw models auth paste-token --provider anthropic

# 或在 Gateway 主机上直接生成
openclaw models auth setup-token --provider anthropic

# 验证状态
openclaw models status
```

**支持 setup-token 的提供商：**
- Anthropic（Claude Pro、Claude Max）

### OAuth 令牌

```bash
# 交互式 OAuth 认证
openclaw models auth login --provider google-gemini-cli --set-default

# 列出认证配置文件
openclaw models status

# 查看认证顺序
openclaw models auth order get --provider anthropic

# 设置认证顺序
openclaw models auth order set --provider anthropic profile1 profile2
```

### API 密钥

```json5
{
  skills: {
    entries: {
      "nano-banana-pro": {
        apiKey: "YOUR_API_KEY",
        env: {
          GEMINI_API_KEY: "YOUR_API_KEY",
        },
      },
    },
  },
}
```

---

## 常见问题

### "No API key found for provider"

智能体认证存储为空或缺少凭证。

**修复**:
```bash
# 重新运行向导并选择提供商
openclaw configure

# 或在 Gateway 主机生成 setup-token
openclaw models auth setup-token --provider <provider>

# 验证
openclaw models status
```

### "OAuth token refresh failed"

令牌过期且刷新失败。

**修复**:
```bash
# 在 Gateway 主机粘贴新 setup-token
openclaw models auth paste-token --provider anthropic
```

### "Gateway start blocked: set gateway.mode=local"

`openclaw.json` 配置存在但未设置 `gateway.mode`。

**修复**:
```bash
openclaw configure
# 或
openclaw config set gateway.mode local
```

### 配置文件验证失败

Gateway 拒绝启动因为配置无效。

**修复**:
```bash
# 查看具体问题
openclaw doctor

# 自动修复
openclaw doctor --fix
```

### "Device identity required" / "connect failed"

如果通过纯 HTTP 打开仪表板（如 `http://<lan-ip>:18789/`），浏览器运行在非安全上下文中，会阻止 WebCrypto。

**修复**:
- 优先使用 HTTPS（Tailscale Serve）
- 或在本地打开：`http://127.0.0.1:18789/`
- 如果必须使用 HTTP，启用 `gateway.controlUi.allowInsecureAuth: true`

### 节点无法连接

```bash
# 检查节点状态
openclaw nodes status

# 检查待处理的配对请求
openclaw devices list

# 检查节点主机服务
openclaw node status
```

### 技能加载失败

```bash
# 检查技能状态
openclaw skills check -v

# 查看技能要求
openclaw skills info <skill-name>

# 重新加载技能
openclaw gateway restart  # 技能快照在会话开始时创建
```

### 沙箱中技能缺少 API 密钥

```bash
# 技能在主机上工作但在沙箱中失败
# 原因：沙箱 exec 在 Docker 内运行，不继承主机 process.env

# 修复：设置沙箱环境变量
openclaw config set agents.defaults.sandbox.docker.env.GEMINI_API_KEY "YOUR_KEY"

# 或重建沙箱
openclaw sandbox recreate --agent <id>
```

### 沙箱中缺少二进制文件

```bash
# 检查沙箱中是否有所需二进制文件
openclaw sandbox explain --agent <id>

# 安装二进制文件到沙箱
openclaw config set agents.defaults.sandbox.docker.setupCommand "apt-get update && apt-get install -y curl git"

# 或使用自定义镜像
openclaw config set agents.defaults.sandbox.docker.image "my-custom-image:latest"
```

### Control UI 显示 "unauthorized"

```bash
# 检查 Gateway 状态
openclaw gateway status

# 检查认证配置
openclaw config get gateway.auth

# 对于新设备，需要配对
openclaw devices list
openclaw devices approve <requestId>
```

### TUI 无法连接

```bash
# 检查 Gateway 是否运行
openclaw status

# 使用正确的 URL 和认证
openclaw tui --url ws://127.0.0.1:18789 --token <token>

# 或使用密码认证
openclaw tui --password <password>
```

### Cron 作业没有触发

```bash
# 检查 Cron 状态
openclaw cron status

# 查看作业详情
openclaw cron list

# 查看运行日志
openclaw cron runs --id <job-id>

# 手动运行测试
openclaw cron run <job-id>
```

### 记忆搜索没有结果

```bash
# 查看记忆索引状态
openclaw memory status

# 重建索引
openclaw memory index

# 查看记忆文件
cat ~/.openclaw/workspace/MEMORY.md
ls -la ~/.openclaw/workspace/memory/
```

---

## 配置加固（v2026.2+ 新安装默认值）

新安装的 OpenClaw 现在使用更安全的默认配置：

| 设置 | 旧默认值 | 新默认值 |
|------|---------|---------|
| `gateway.bind` | `0.0.0.0` | `127.0.0.1`（仅本机） |
| `gateway.auth.token` | 无 | 自动生成随机 Token |
| `tools.exec.executor` | 直接执行 | Docker/Podman（沙箱） |
| 敏感密钥日志 | 可能泄露 | 自动脱敏 |

**敏感密钥自动脱敏：**

命令输出和快照中的敏感字段（API 密钥、环境变量等）现在自动屏蔽：

```bash
# 查看脱敏后的状态（敏感信息被屏蔽）
openclaw status --all

# 明确显示密钥（谨慎使用）
OPENCLAW_SHOW_SECRETS=1 openclaw status
```

**旧配置键迁移：**

超过 2 个月的旧配置键不再自动迁移，而是直接报错：

```bash
# 检查并修复过期配置键
openclaw doctor
openclaw doctor --fix
```

---

## 新模型提供商（v2026.2-3+）

### Vercel AI Gateway

```json5
{
  "models": {
    "providers": {
      "vercel-gateway": {
        "type": "vercel",
        "apiKey": "${VERCEL_GATEWAY_API_KEY}"
      }
    }
  }
}
```

### Kilo Gateway

```json5
{
  "models": {
    "providers": {
      "kilo": {
        "type": "kilo",
        "apiKey": "${KILO_API_KEY}"
      }
    }
  }
}
```

### 捆绑 CLI 后端（Claude/Codex/Gemini CLI）

v2026.2+ 将 Claude CLI、Codex CLI 和 Gemini CLI 作为内置提供商。**v2026.3.28 起**，配置中引用的 CLI 后端插件会**自动加载**，无需额外手动配置：

```json5
{
  "models": {
    "providers": {
      "anthropic": {
        "type": "claude-cli"   // 使用本地安装的 claude CLI，自动加载
      },
      "google": {
        "type": "gemini-cli"   // 使用本地安装的 gemini CLI，自动加载
      }
    }
  }
}
```

```bash
# 设置 Claude Opus 4.6 为默认模型
openclaw config set agents.defaults.models '{"anthropic/claude-opus-4-6": {"alias": "opus"}}'

# 使用 OAuth 认证 Gemini CLI
openclaw models auth login --provider google-gemini-cli --set-default
```

### xAI / Grok 集成（v2026.3.28）

```json5
{
  "models": {
    "providers": {
      "xai": {
        "type": "xai",
        "apiKey": "${XAI_API_KEY}"
      }
    }
  }
}
```

**Grok 搜索插件**（v2026.3.28 新增）：

```bash
# 在 onboard/configure 流程中自动启用 Grok 搜索
openclaw configure --section web

# 手动启用 xAI 实时搜索
openclaw config set models.providers.xai.tools.x_search true
```

**xAI Responses API** 取代旧版 Chat Completions API，支持更强大的工具调用。

### Qwen 迁移（v2026.3.28 破坏性变更）

**废弃** `qwen-portal-auth` OAuth 方式，**迁移至 Model Studio API Key**：

```bash
# 旧方式（已废弃，不再工作）
# openclaw models auth login --provider qwen  ← 已移除

# 新方式：使用 Model Studio API Key
openclaw config set models.providers.qwen.apiKey "${QWEN_API_KEY}"
```

```json5
{
  "models": {
    "providers": {
      "qwen": {
        "type": "qwen",
        "apiKey": "${QWEN_API_KEY}"  // 从 Alibaba Model Studio 获取
      }
    }
  }
}
```

⚠️ 如果你之前使用 Qwen OAuth 认证，必须切换到 Model Studio API Key，否则 Qwen 提供商将无法工作。

### MiniMax 图片生成（v2026.3.28）

```json5
{
  "models": {
    "providers": {
      "minimax": {
        "type": "minimax",
        "apiKey": "${MINIMAX_API_KEY}",
        "imageModel": "image-01"      // 图片生成和编辑模型
      }
    }
  }
}
```

**功能：**
- 文生图（text-to-image）
- 图生图（image-to-image 编辑）
- 宽高比控制（aspect ratio）

---

## 服务管理

### macOS (launchd)

```bash
# 安装服务
openclaw gateway install

# 启动服务
openclaw gateway start

# 停止服务
openclaw gateway stop

# 重启服务
openclaw gateway restart

# 查看状态
openclaw gateway status

# 卸载服务
openclaw gateway uninstall
```

### Linux (systemd)

```bash
# 查看服务状态
systemctl --user status openclaw-gateway.service

# 启动/停止/重启
systemctl --user start openclaw-gateway.service
systemctl --user stop openclaw-gateway.service
systemctl --user restart openclaw-gateway.service

# 启用开机启动
systemctl --user enable openclaw-gateway.service

# 查看日志
journalctl --user -u openclaw-gateway.service -n 100 --no-pager
```

---

## 更新摘要 (v2026.3.28 - 2026-03-31)

本次更新基于 OpenClaw **v2026.3.28**（最新版）官方发布说明和 GitHub 社区知识，全面同步最新功能：

### v2.3.0 新增内容（基于 v2026.3.28）：

1. **xAI / Grok 集成**
   - xAI Responses API 支持
   - Grok 搜索插件自动启用
   - `openclaw configure --section web` 快速配置

2. **Qwen 破坏性迁移**（必须操作）
   - 废弃 `qwen-portal-auth` OAuth，迁移至 Model Studio API Key
   - 提供迁移指南

3. **MiniMax 图片生成**
   - `image-01` 模型支持文生图、图生图
   - 宽高比控制

4. **ACP 渠道扩展**（Discord、BlueBubbles、iMessage）
   - `--bind here` 在这些渠道的实时对话中直接绑定 ACP 工作区

5. **OpenAI apply_patch 默认启用**
   - OpenAI/Codex 模型无需手动配置

6. **插件自动加载**
   - CLI 后端插件在配置中引用时自动加载

### v2.2.0 内容（基于 v2026.3.24）：

1. **Microsoft Teams 渠道**（`@openclaw/msteams` 插件）
   - Azure Bot 注册和 JWT 签名验证流程
   - 完整配置示例和访问控制说明
   - 故障排除指南

2. **ACP 工作区绑定**
   - `openclaw acp status` / `openclaw acp spawn codex --bind here`

3. **自更新系统** — `openclaw update` / `--dry-run`

4. **异步审批钩子** — `requireApproval`、Telegram/Discord 按钮审批

5. **OpenAI API 兼容层** — Gateway `/v1/` 端点

6. **统一文件上传** — Slack/Teams/Google Chat/BlueBubbles

7. **新模型提供商** — Vercel AI、Kilo Gateway

8. **技能安全** — 签名验证、VirusTotal 扫描、状态 UI 标签

9. **记忆系统 v2** — 多语言、向量搜索、PII 脱敏

10. **配置加固** — 新安装安全默认值、敏感密钥自动脱敏

### 技能现在涵盖的所有主流渠道：
- WhatsApp（官方内置）
- Telegram（官方内置）
- Signal（官方内置）
- QQ Bot（社区第三方）
- Discord（官方内置）
- Slack（官方内置）
- Google Chat（官方内置）
- **Microsoft Teams**（官方插件，v2026.3+）

---

## 许可证
MIT
