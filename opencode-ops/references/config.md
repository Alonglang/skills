# opencode.json / tui.json 配置参考

## 配置文件格式

支持 **JSON** 和 **JSONC**（带注释的 JSON）。

Schema 引用（可在编辑器中获得自动补全和校验）：
```jsonc
{
  "$schema": "https://opencode.ai/config.json"
}
```

---

## 配置文件位置与优先级

优先级由低到高（后者覆盖前者，**非替换**，是合并）：

| 优先级 | 来源 | 路径 |
|--------|------|------|
| 1（最低） | Remote 远程配置 | 从 `.well-known/opencode` 自动获取（组织默认值） |
| 2 | Global 全局配置 | `~/.config/opencode/opencode.json` |
| 3 | Custom 自定义路径 | `$OPENCODE_CONFIG` 环境变量指向的文件 |
| 4 | Project 项目配置 | 项目根目录的 `opencode.json` |
| 5 | `.opencode` 目录 | `.opencode/agents/`、`.opencode/commands/`、`.opencode/plugins/` 等 |
| 6（最高） | Inline 内联 | `$OPENCODE_CONFIG_CONTENT` 环境变量（JSON 字符串） |

> 建议将通用 Provider 配置放在全局，将项目特定 Agent/Permission 放在项目级。

自定义目录：
```bash
export OPENCODE_CONFIG_DIR=/path/to/my/config-directory
```

---

## opencode.json 完整字段参考

### 基础

```jsonc
{
  "$schema": "https://opencode.ai/config.json",

  // 默认使用的模型
  "model": "anthropic/claude-sonnet-4-6",

  // 轻量任务（如标题生成）使用的廉价模型
  "small_model": "anthropic/claude-haiku-4-5",

  // 默认 Agent（build/plan 或自定义 Agent 名）
  "default_agent": "build",

  // 自动更新：true | false | "notify"
  "autoupdate": true
}
```

### Provider 配置

```jsonc
{
  "provider": {
    "anthropic": {
      "options": {
        "timeout": 600000,       // 请求超时（ms），默认 300000，false 禁用
        "chunkTimeout": 30000,   // 流式响应块超时（ms）
        "setCacheKey": true,     // 始终设置缓存 key
        "baseURL": "https://api.anthropic.com/v1"  // 自定义 base URL
      }
    },
    "amazon-bedrock": {
      "options": {
        "region": "us-east-1",
        "profile": "my-aws-profile",
        "endpoint": "https://bedrock-runtime.us-east-1.vpce-xxxxx.amazonaws.com"
      }
    }
  }
}
```

### 工具权限

```jsonc
{
  // 默认允许所有操作，可设为 "ask"（询问）或 false（禁止）
  "permission": {
    "edit": "ask",   // 文件编辑前询问
    "bash": "ask",   // bash 命令前询问
    "write": false   // 完全禁止新文件写入
  },

  // 精细工具控制
  "tools": {
    "write": false,
    "bash": false
  }
}
```

### Agents（自定义 Agent）

```jsonc
{
  "agent": {
    "code-reviewer": {
      "description": "只读代码审查，关注安全和性能",
      "model": "anthropic/claude-sonnet-4-6",
      "prompt": "You are a code reviewer. Focus on security, performance, maintainability.",
      "tools": {
        "write": false,   // 只读，不允许写文件
        "edit": false
      }
    }
  }
}
```

也可用 Markdown 文件定义 Agent：`~/.config/opencode/agents/` 或 `.opencode/agents/`

### 自定义命令

```jsonc
{
  "command": {
    "test": {
      "template": "Run the full test suite with coverage report and show failures.",
      "description": "运行测试套件",
      "agent": "build",
      "model": "anthropic/claude-haiku-4-5"
    },
    "component": {
      "template": "Create a new React component named $ARGUMENTS with TypeScript.",
      "description": "创建 React 组件"
    }
  }
}
```

也可用 Markdown 文件定义：`~/.config/opencode/commands/` 或 `.opencode/commands/`

### MCP 服务器

```jsonc
{
  "mcp": {
    "my-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@my/mcp-server"],
      "enabled": true
    },
    "remote-server": {
      "type": "remote",
      "url": "https://mcp.example.com",
      "enabled": false
    }
  }
}
```

### 插件

```jsonc
{
  // 从 npm 加载插件（也可放在 .opencode/plugins/）
  "plugin": ["opencode-helicone-session", "oh-my-openagent"]
}
```

### 快照（Snapshot）

```jsonc
{
  // 默认开启，允许 /undo 和 /redo
  // 大型仓库或有很多子模块时可关闭以节省磁盘
  "snapshot": false
}
```

### 上下文压缩

```jsonc
{
  "compaction": {
    "auto": true,        // 上下文满时自动压缩
    "prune": true,       // 删除旧的工具输出节省 token
    "reserved": 10000    // 压缩时保留的 token 缓冲
  }
}
```

### 文件监视器

```jsonc
{
  "watcher": {
    "ignore": ["node_modules/**", "dist/**", ".git/**"]
  }
}
```

### 格式化器

```jsonc
{
  "formatter": {
    "prettier": { "disabled": false },
    "custom-prettier": {
      "command": ["npx", "prettier", "--write", "$FILE"],
      "environment": { "NODE_ENV": "development" },
      "extensions": [".js", ".ts", ".jsx", ".tsx"]
    }
  }
}
```

### 分享

```jsonc
{
  // "manual"（默认）| "auto" | "disabled"
  "share": "manual"
}
```

### 服务器（opencode serve / opencode web）

```jsonc
{
  "server": {
    "port": 4096,
    "hostname": "0.0.0.0",
    "mdns": true,                      // mDNS 服务发现
    "mdnsDomain": "myproject.local",
    "cors": ["http://localhost:5173"]
  }
}
```

### 额外指令文件

```jsonc
{
  // 加载到 Agent 上下文的额外文档
  "instructions": ["CONTRIBUTING.md", "docs/guidelines.md", ".cursor/rules/*.md"]
}
```

---

## tui.json 配置

TUI 专用配置文件（`~/.config/opencode/tui.json` 或项目根 `tui.json`）。

```jsonc
{
  "$schema": "https://opencode.ai/tui.json",

  // 主题
  "theme": "tokyonight",    // 常见主题: catppuccin, dracula, gruvbox, opencode 等

  // 滚动
  "scroll_speed": 3,
  "scroll_acceleration": { "enabled": true },

  // diff 显示风格
  "diff_style": "auto",

  // 快捷键覆盖
  "keybinds": {
    "session.new": "ctrl+n",
    "app.quit": "ctrl+q"
  }
}
```

环境变量覆盖：`OPENCODE_TUI_CONFIG=/path/to/tui.json`

> 注意：旧版 opencode.json 中的 `theme`、`keybinds`、`tui` 字段已废弃，启动时会自动迁移。

---

## 常用配置示例

### 极简开发配置

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-6",
  "autoupdate": true
}
```

### 生产安全配置（所有操作需确认）

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-opus-4-6",
  "permission": { "edit": "ask", "bash": "ask", "write": "ask" },
  "snapshot": true,
  "share": "disabled"
}
```

### 团队共享项目配置（提交到 git）

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": ["CONTRIBUTING.md", ".opencode/AGENTS.md"],
  "formatter": { "prettier": { "disabled": false } },
  "watcher": { "ignore": ["node_modules/**", "dist/**", ".turbo/**"] },
  "plugin": ["oh-my-openagent"]
}
```
