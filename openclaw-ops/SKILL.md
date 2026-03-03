---
name: openclaw-ops
description: 管理 OpenClaw 配置——通道、代理、安全和自动导航设置
version: 1.0.0
---

# OpenClaw 配置与运维手册

诊断和修复实际问题。这里的每个命令都经过测试和支持。

---

## 官方文档资源

- **完整文档**: https://docs.openclaw.ai/zh-CN
- **快速开始**: https://docs.openclaw.ai/zh-CN/start/getting-started
- **配置参考**: https://docs.openclaw.ai/zh-CN/gateway/configuration
- **故障排除**: https://docs.openclaw.ai/zh-CN/gateway/troubleshooting
- **GitHub 仓库**: https://github.com/openclaw/openclaw

---

## 快速诊断命令

| 命令 | 用途 | 何时使用 |
|------|------|---------|
| `openclaw status` | 本地系统摘要（操作系统、更新、Gateway、代理、会话、提供商）| 首次检查、快速概览 |
| `openclaw status --all` | 完整本地诊断（只读、可粘贴、相对安全）| 需要分享调试报告时 |
| `openclaw status --deep` | 运行 Gateway 健康检查（包括提供商探测）| "已配置"≠"正常工作"时 |
| `openclaw gateway probe` | Gateway 发现 + 可达性（本地 + 远程目标）| 怀疑在探测错误的 Gateway 时 |
| `openclaw channels status --probe` | 查询运行中 Gateway 的渠道状态（并可选探测）| Gateway 可达但渠道异常时 |
| `openclaw gateway status` | 监管程序状态（launchd/systemd）、运行时 PID/退出、最后错误 | 服务"看起来已加载"但没有运行时 |
| `openclaw logs --follow` | 实时日志流（运行时问题的最佳信号）| 需要实际故障原因时 |
| `openclaw doctor` | 诊断配置问题、提示修复建议 | 配置错误或需要迁移时 |

**分享输出优先**: 使用 `openclaw status --all`（隐藏令牌）。如需粘贴 `openclaw status`，先设置 `OPENCLAW_SHOW_SECRETS=0`。

---

## 配置文件位置

```
~/.openclaw/
├── openclaw.json                    # 主配置——通道、模型、Gateway、技能
├── openclaw.json.bak*               # 自动备份 (.bak, .bak.1, .bak.2 ...)
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

始终：备份、使用 new CLI 编辑、重启。

```bash
# 方法 1: 使用 openclaw config set（推荐用于单键编辑）
openclaw config set channels.whatsapp.allowFrom '["+15555550123"]'

# 方法 2: 使用 config.patch（部分更新，RPC）
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { whatsapp: { allowFrom: [\"+15555550123\"] } } }",
  "baseHash": "<从 config.get 获取的 hash>"
}'

# 方法 3: 配置向导
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
```

### ClawHub 使用

**ClawHub 是推荐的技能注册表**

```bash
# 搜索技能
clawhub search "image generation"
clawhub explore

# 安装到工作区
clawhub install nano-banana-pro

# 列出已安装的技能
clawhub list

# 更新所有技能
clawhub update --all

# 更新特定技能
clawhub update my-skill
clawhub update my-skill --force  # 覆盖本地更改
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

### 技能格式

```markdown
---
name: my-skill
description: 这个技能做什么以及何时触发
metadata:
  {
    "openclaw":
      {
        "emoji": "🚀",
        "requires": { "bins": ["uv"] },
        "os": ["darwin", "linux"]
      },
  }
---

# My Skill

指令放在这里。仅当技能触发时加载。
保持简洁，上下文窗口是共享资源。
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

### OAuth 令牌

```bash
# 生成 setup-token（推荐）
openclaw models auth setup-token --provider anthropic
openclaw models status

# 粘贴令牌
openclaw models auth paste-token --provider anthropic
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

## 许可证

MIT
