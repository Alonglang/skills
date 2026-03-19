---
name: openclaw-ops
description: 管理 OpenClaw 配置——包括通道、代理、节点、安全、自动化、技能、Web UI 和 TUI 设置。当需要修改OpenClaw配置、管理技能、调整安全设置、配置自动化任务、设置Web UI/TUI时必须触发此技能。
version: 2.1.0
lastUpdated: 2026-03-19
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

#### 第一步：创建 QQ 机器人

1. 前往 [QQ 开放平台](https://q.qq.com/)，手机 QQ 扫码登录
2. 点击**创建机器人**，获取 `AppID` 和 `AppSecret`
3. **AppSecret 只显示一次**，务必立即保存

#### 第二步：安装插件

```bash
# 通过 OpenClaw CLI 安装（推荐）
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
| 文件 | `<qqfile>/path/to/file.pdf</qqfile>` | 任意格式，最大 20MB |
| 视频 | `<qqvideo>/path/to/video.mp4</qqvideo>` | 本地文件或 URL |

**示例：**
```markdown
给你画好了猫咪：

<qqimg>https://example.com/cat.png</qqimg>
```

**标签容错**：插件自动纠正 30+ 种变体写法，比如 `<qq_img>`、`＜qqimg＞` 都能识别。

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
```

**常见问题：**
- **机器人回复"该机器人去火星了"**：检查 Gateway 是否运行，以及 AppID/AppSecret 是否配置正确
- **Markdown 不显示**：需要在 QQ 开放平台申请 Markdown 权限
- **语音无法识别**：检查 STT 配置是否正确，provider 是否存在且有 API 密钥

### Cron 作业故障

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

# 启用/禁用
openclaw plugins enable <id>
openclaw plugins disable <id>

# 插件诊断
openclaw plugins doctor
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

# 搜索记忆
openclaw memory search "important note"
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

## 更新摘要 (v2.1.0 - 2026-03-19)

本次更新添加了 **QQ Bot 第三方渠道插件** 的完整文档：

### 新增内容：

1. **QQ Bot 安装指南**
   - 从 QQ 开放平台创建机器人步骤
   - npm 安装和源码安装方法
   - 单账户和多账户配置

2. **语音能力配置**
   - STT（语音转文字）两级配置优先级
   - TTS（文字转语音）两级配置优先级

3. **富媒体使用方法**
   - `<qqimg>` `<qqvoice>` `<qqfile>` `<qqvideo>` 标签格式
   - 支持的文件类型和大小限制

4. **常用命令**
   - 向指定用户发送消息
   - 多账户使用 `--account` 参数
   - 升级方法

5. **故障排除**
   - 常见问题和解决方法
   - 调试命令

### QQ Bot 主要功能：

- 🔒 **多场景支持** - C2C 私聊、群聊 @消息、频道消息、频道私信
- 🖼️ **富媒体消息** - 支持图片、语音、视频、文件的收发
- 🎙️ **语音能力 (STT/TTS)** - 语音转文字自动转录 & 文字转语音回复
- ⏰ **定时推送** - 支持定时任务触发后主动推送消息
- 🔗 **URL 无限制** - 私聊可直接发送 URL
- ⌨️ **输入状态** - 实时显示"Bot 正在输入中…"状态
- 🔄 **热更新** - 支持 npm 方式安装和无缝热更新
- 📝 **Markdown** - 完整支持 Markdown 格式消息
- 🛠️ **原生命令** - 支持 OpenClaw 原生命令

**技能现在涵盖了 OpenClaw 的所有主流渠道，包括：**
- WhatsApp（官方内置）
- Telegram（官方内置）
- Signal（官方内置）
- QQ Bot（社区第三方）
- Discord（官方内置）
- Slack（官方内置）
- Google Chat（官方内置）

---

## 许可证
MIT
