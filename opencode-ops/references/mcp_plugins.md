# MCP 服务器、插件与 Hooks 参考

## MCP 服务器（Model Context Protocol）

MCP 让 OpenCode 可以调用外部工具。工具与内置工具并列可用。

> ⚠️ 每个 MCP 服务器会增加上下文，工具过多会超出 token 限制，请谨慎添加。

### 本地 MCP 服务器

```jsonc
// opencode.json
{
  "mcp": {
    "my-local-mcp": {
      "type": "local",
      "command": ["npx", "-y", "my-mcp-command"],
      "enabled": true,
      "environment": {
        "MY_ENV_VAR": "value"
      },
      "timeout": 5000   // 工具获取超时（ms），默认 5000
    }
  }
}
```

常用 MCP 示例：

```jsonc
{
  "mcp": {
    // GitHub MCP（注意：工具多，token 消耗大）
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "environment": { "GITHUB_TOKEN": "{env:GITHUB_TOKEN}" }
    },
    // 文件系统工具
    "filesystem": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    },
    // Postgres 数据库
    "postgres": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-postgres"],
      "environment": { "POSTGRES_URL": "postgresql://localhost/mydb" }
    }
  }
}
```

### 远程 MCP 服务器

```jsonc
{
  "mcp": {
    "my-remote-mcp": {
      "type": "remote",
      "url": "https://my-mcp-server.com",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer {env:MY_API_KEY}"
      }
    }
  }
}
```

### MCP OAuth 认证

OpenCode 自动处理 OAuth（RFC 7591 动态客户端注册）：

```bash
# 触发/重新触发 OAuth 认证
opencode mcp auth <server-name>

# 列出所有 MCP 服务器及认证状态
opencode mcp list

# 删除存储的凭证
opencode mcp logout <server-name>

# 调试连接问题
opencode mcp debug <server-name>
```

认证 token 存储路径：`~/.local/share/opencode/mcp-auth.json`

预配置 OAuth：
```jsonc
{
  "mcp": {
    "my-oauth-server": {
      "type": "remote",
      "url": "https://mcp.example.com/mcp",
      "oauth": {
        "clientId": "{env:MCP_CLIENT_ID}",
        "clientSecret": "{env:MCP_CLIENT_SECRET}",
        "scope": "tools:read tools:execute"
      }
    }
  }
}
```

禁用 OAuth（使用 API Key）：
```jsonc
{
  "mcp": {
    "api-key-server": {
      "type": "remote",
      "url": "https://mcp.example.com/mcp",
      "oauth": false,
      "headers": { "Authorization": "Bearer {env:MY_API_KEY}" }
    }
  }
}
```

### OmO 内置 MCP（自动开启）

Oh-My-OpenAgent 内置以下 MCP 供 Librarian 等 Agent 使用：

| MCP | 用途 |
|-----|------|
| Exa | 网络搜索 |
| Context7 | 官方文档查询 |
| Grep.app | GitHub 代码搜索 |

---

## 插件（Plugins）

插件是 JS/TS 模块，可监听事件和自定义行为。

### 加载方式

**本地文件**（自动加载）：
- 全局：`~/.config/opencode/plugins/`
- 项目：`.opencode/plugins/`

**npm 包**（在 opencode.json 中配置）：
```jsonc
{
  "plugin": ["oh-my-openagent", "opencode-wakatime", "opencode-helicone-session"]
}
```

npm 包自动用 Bun 安装，缓存路径：`~/.cache/opencode/node_modules/`

### 加载顺序

1. 全局 opencode.json 中的 npm 插件
2. 项目 opencode.json 中的 npm 插件
3. 全局 plugins 目录
4. 项目 plugins 目录

### 插件基本结构

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // 事件钩子
  }
}
```

上下文参数：
- `project`：当前项目信息
- `directory`：当前工作目录
- `worktree`：git worktree 路径
- `client`：OpenCode SDK 客户端
- `$`：Bun shell API（执行命令）

---

## 可用 Hooks 事件

### Tool Hooks（最常用）

```typescript
{
  // 工具执行前（可修改参数或抛出异常阻止）
  "tool.execute.before": async (input, output) => {
    // input.tool: 工具名（"bash", "read", "write" 等）
    // output.args: 工具参数（可修改）
    if (input.tool === "bash") {
      console.log("Running bash:", output.args.command)
    }
  },

  // 工具执行后（可查看结果）
  "tool.execute.after": async (input, output) => {
    // output.result: 工具执行结果
  }
}
```

### Session Hooks

```typescript
{
  "session.created": async ({ session }) => { /* 新会话创建 */ },
  "session.idle":    async ({ session }) => { /* 会话完成空闲 */ },
  "session.error":   async ({ error })   => { /* 会话出错 */ },
  "session.compacted": async ({ session }) => { /* 会话压缩 */ }
}
```

### File & LSP Hooks

```typescript
{
  "file.edited": async ({ path, content }) => { /* 文件被修改 */ },
  "lsp.client.diagnostics": async ({ diagnostics }) => { /* LSP 诊断 */ }
}
```

### Shell Hooks

```typescript
{
  // 注入环境变量（所有 shell 执行都会用到）
  "shell.env": async (input, output) => {
    output.env.MY_API_KEY = "secret"
    output.env.PROJECT_ROOT = input.cwd
  }
}
```

### TUI Hooks

```typescript
{
  "tui.prompt.append": async (input, output) => { /* 追加到 prompt */ },
  "tui.command.execute": async ({ command }) => { /* 命令执行 */ },
  "tui.toast.show": async ({ message }) => { /* 显示 toast 通知 */ }
}
```

---

## 实用插件示例

### macOS 会话完成通知

```typescript
export const NotificationPlugin = async ({ $ }) => ({
  "session.idle": async () => {
    await $`osascript -e 'display notification "Task done!" with title "OpenCode"'`
  }
})
```

### 保护 .env 文件不被读取

```typescript
export const EnvProtection = async () => ({
  "tool.execute.before": async (input, output) => {
    if (input.tool === "read" && output.args.filePath.includes(".env")) {
      throw new Error("Access to .env files is not allowed")
    }
  }
})
```

### 自定义工具

```typescript
import { type Plugin, tool } from "@opencode-ai/plugin"

export const CustomToolsPlugin: Plugin = async (ctx) => ({
  tool: {
    my-api-call: tool({
      description: "Call my internal API",
      args: { endpoint: tool.schema.string() },
      async execute(args, context) {
        const res = await fetch(`https://api.example.com/${args.endpoint}`)
        return await res.text()
      }
    })
  }
})
```

---

## OpenCode CLI 命令参考

### 启动命令

```bash
opencode                          # 启动 TUI
opencode run "your prompt"       # 非交互式运行
opencode serve                   # 启动 HTTP 服务器
opencode web                     # 启动 Web UI
```

### TUI 内部命令

| 命令 | 说明 |
|------|------|
| `/connect` | 连接/配置 LLM Provider |
| `/models` | 切换模型 |
| `/init` | 初始化项目（生成 AGENTS.md） |
| `/init-deep` | 深度初始化（生成层级 AGENTS.md） |
| `/undo` | 撤销上次 Agent 变更 |
| `/redo` | 重做已撤销的变更 |
| `/share` | 生成会话分享链接 |
| `<Tab>` | 切换 Build/Plan（Prometheus）模式 |
| `/start-work` | Atlas 开始执行 Prometheus 计划 |
| `ultrawork` / `ulw` | 触发 OmO 全自动编排模式 |
| `/ulw-loop` | Ralph Loop（持续循环直到 100% 完成） |
| `/handoff` | 保存并转移会话上下文 |

### MCP 管理命令

```bash
opencode mcp list                  # 列出所有 MCP 服务器
opencode mcp auth <name>           # 触发 OAuth 认证
opencode mcp logout <name>         # 清除认证凭证
opencode mcp debug <name>          # 调试 MCP 连接
```

### 认证命令

```bash
opencode auth login                # 登录 Provider
opencode auth logout               # 登出
opencode auth list                 # 列出已认证的 Provider
```

### 环境变量

| 变量 | 说明 |
|------|------|
| `OPENCODE_CONFIG` | 自定义配置文件路径 |
| `OPENCODE_CONFIG_DIR` | 自定义配置目录 |
| `OPENCODE_CONFIG_CONTENT` | 内联 JSON 配置（最高优先级） |
| `OPENCODE_TUI_CONFIG` | 自定义 TUI 配置文件路径 |
| `OPENCODE_LOG_LEVEL` | 日志级别（debug/info/warn/error） |
