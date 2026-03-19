---
name: agent-browser
description: 面向 AI 代理的浏览器自动化命令行工具。当用户需要与网站交互时使用，包括页面导航、打开URL、填写表单、点击按钮、网页截图、提取数据、从网页抓取内容、测试 Web 应用、登录网站、自动化浏览器交互、会话持久化、比较页面变化、下载文件、保存网页PDF。无论用户何时要求打开网站、自动化网页操作、爬取网页内容、测试网页都必须触发此技能。
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
compatibility: claude-code-only
---

# agent-browser 浏览器自动化

## 核心工作流

每次浏览器自动化都遵循此模式：

1. **导航**: `agent-browser open <url>`
2. **快照**: `agent-browser snapshot -i`（获取元素引用如 `@e1`、`@e2`）
3. **交互**: 使用引用进行点击、填充、选择
4. **重新快照**: 导航或 DOM 变更后，获取新引用

```bash
agent-browser open https://example.com/form
agent-browser snapshot -i
# 输出: @e1 [input type="email"], @e2 [input type="password"], @e3 [button] "Submit"

agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait --load networkidle
agent-browser snapshot -i  # 检查结果
```

## 命令链式调用

命令可以通过 `&&` 链接在单个 shell 调用中。通过后台守护进程，浏览器在命令之间保持持久，因此链式调用比单独调用更安全高效。

```bash
# 将打开 + 等待 + 快照链接在一次调用中
agent-browser open https://example.com && agent-browser wait --load networkidle && agent-browser snapshot -i

# 多个交互链接
agent-browser fill @e1 "user@example.com" && agent-browser fill @e2 "password123" && agent-browser click @e3

# 导航并捕获
agent-browser open https://example.com && agent-browser wait --load networkidle && agent-browser screenshot page.png
```

**何时链式调用：** 当你在继续之前不需要读取中间命令的输出时使用 `&&`（例如：打开 + 等待 + 截图）。当你需要先解析输出（例如：快照发现引用，然后使用这些引用进行交互）时，请分开运行命令。

## 核心命令

```bash
# 导航
agent-browser open <url>              # 导航（别名：goto, navigate）
agent-browser close                   # 关闭浏览器

# 快照
agent-browser snapshot -i             # 获取带引用的交互式元素（推荐）
agent-browser snapshot -i -C          # 包含光标可交互元素（带onclick的div、cursor:pointer）
agent-browser snapshot -s "#selector" # 限制范围到CSS选择器

# 交互（使用快照中的@refs）
agent-browser click @e1               # 点击元素
agent-browser click @e1 --new-tab     # 点击并在新标签页打开
agent-browser fill @e2 "text"         # 清空并输入文本
agent-browser type @e2 "text"         # 输入不清空
agent-browser select @e1 "option"     # 选择下拉选项
agent-browser check @e1               # 勾选复选框
agent-browser press Enter             # 按键
agent-browser keyboard type "text"    # 在当前焦点输入（无选择器）
agent-browser keyboard inserttext "text"  # 插入不触发按键事件
agent-browser scroll down 500         # 页面滚动
agent-browser scroll down 500 --selector "div.content"  # 在特定容器内滚动

# 获取信息
agent-browser get text @e1            # 获取元素文本
agent-browser get url                 # 获取当前URL
agent-browser get title               # 获取页面标题

# 等待
agent-browser wait @e1                # 等待元素
agent-browser wait --load networkidle # 等待网络空闲
agent-browser wait --url "**/page"    # 等待URL模式
agent-browser wait 2000               # 等待毫秒数

# 下载
agent-browser download @e1 ./file.pdf          # 点击元素触发下载
agent-browser wait --download ./output.zip     # 等待下载完成
agent-browser --download-path ./downloads open <url>  # 设置默认下载目录

# 捕获
agent-browser screenshot              # 截图到临时目录
agent-browser screenshot --full       # 整页截图
agent-browser screenshot --annotate   # 带编号元素标签的注释截图
agent-browser pdf output.pdf          # 保存为PDF

# 比较（比较页面状态）
agent-browser diff snapshot                          # 比较当前与上次快照
agent-browser diff snapshot --baseline before.txt    # 比较当前与已保存文件
agent-browser diff screenshot --baseline before.png  # 可视化像素比较
agent-browser diff url <url1> <url2>                 # 比较两个页面
agent-browser diff url <url1> <url2> --wait-until networkidle  # 自定义等待策略
agent-browser diff url <url1> <url2> --selector "#main"  # 限制范围到元素
```

## 常见模式

### 表单提交

```bash
agent-browser open https://example.com/signup
agent-browser snapshot -i
agent-browser fill @e1 "Jane Doe"
agent-browser fill @e2 "jane@example.com"
agent-browser select @e3 "California"
agent-browser check @e4
agent-browser click @e5
agent-browser wait --load networkidle
```

### 使用保险库认证（推荐）

```bash
# 一次性保存凭证（使用 AGENT_BROWSER_ENCRYPTION_KEY 加密）
# 推荐：通过标准输入传递密码避免shell历史暴露
echo "pass" | agent-browser auth save github --url https://github.com/login --username user --password-stdin

# 使用保存的配置文件登录（LLM永远看不到密码）
agent-browser auth login github

# 列出/显示/删除配置
agent-browser auth list
agent-browser auth show github
agent-browser auth delete github
```

### 状态持久化认证

```bash
# 登录一次并保存状态
agent-browser open https://app.example.com/login
agent-browser snapshot -i
agent-browser fill @e1 "$USERNAME"
agent-browser fill @e2 "$PASSWORD"
agent-browser click @e3
agent-browser wait --url "**/dashboard"
agent-browser state save auth.json

# 未来会话中复用
agent-browser state load auth.json
agent-browser open https://app.example.com/dashboard
```

### 会话持久化

```bash
# 跨浏览器重启自动保存/恢复cookies和localStorage
agent-browser --session-name myapp open https://app.example.com/login
# ... 登录流程 ...
agent-browser close  # 状态自动保存到 ~/.agent-browser/sessions/

# 下次自动加载状态
agent-browser --session-name myapp open https://app.example.com/dashboard

# 静态加密存储
export AGENT_BROWSER_ENCRYPTION_KEY=$(openssl rand -hex 32)
agent-browser --session-name secure open https://app.example.com

# 管理已保存状态
agent-browser state list
agent-browser state show myapp-default.json
agent-browser state clear myapp
agent-browser state clean --older-than 7
```

### 数据提取

```bash
agent-browser open https://example.com/products
agent-browser snapshot -i
agent-browser get text @e5           # 获取特定元素文本
agent-browser get text body > page.txt  # 获取所有页面文本

# JSON输出便于解析
agent-browser snapshot -i --json
agent-browser get text @e1 --json
```

### 并行会话

```bash
agent-browser --session site1 open https://site-a.com
agent-browser --session site2 open https://site-b.com

agent-browser --session site1 snapshot -i
agent-browser --session site2 snapshot -i

agent-browser session list
```

### 连接到现有Chrome

```bash
# 自动发现启用了远程调试的运行中Chrome
agent-browser --auto-connect open https://example.com
agent-browser --auto-connect snapshot

# 或者使用显式CDP端口
agent-browser --cdp 9222 snapshot
```

### 配色方案（深色模式）

```bash
# 通过标志持久深色模式（适用于所有页面和新标签页）
agent-browser --color-scheme dark open https://example.com

# 或通过环境变量
AGENT_BROWSER_COLOR_SCHEME=dark agent-browser open https://example.com

# 或在会话期间设置（对后续命令持久）
agent-browser set media dark
```

### 可视化浏览器（调试）

```bash
agent-browser --headed open https://example.com
agent-browser highlight @e1          # 高亮元素
agent-browser record start demo.webm # 记录会话
agent-browser profiler start         # 启动Chrome DevTools分析
agent-browser profiler stop trace.json # 停止并保存分析（路径可选）
```

### 本地文件（PDF、HTML）

```bash
# 使用file:// URLs打开本地文件
agent-browser --allow-file-access open file:///path/to/document.pdf
agent-browser --allow-file-access open file:///path/to/page.html
agent-browser screenshot output.png
```

### iOS模拟器（移动Safari）

```bash
# 列出可用iOS模拟器
agent-browser device list

# 在特定设备启动Safari
agent-browser -p ios --device "iPhone 16 Pro" open https://example.com

# 与桌面相同的工作流程 - 快照、交互、重新快照
agent-browser -p ios snapshot -i
agent-browser -p ios tap @e1          # 点击（click的别名）
agent-browser -p ios fill @e2 "text"
agent-browser -p ios swipe up         # 特定移动手势

# 截图
agent-browser -p ios screenshot mobile.png

# 关闭会话（关闭模拟器）
agent-browser -p ios close
```

**要求：** macOS 安装 Xcode，Appium（`npm install -g appium && appium driver install xcuitest`）

**真实设备：** 如果预先配置可用于物理iOS设备。在 `xcrun xctrace list devices` 获取UDID，使用 `--device "<UDID>"`。

## 安全性

所有安全功能都是选择性加入。默认情况下，agent-browser 对导航、操作或输出不施加任何限制。

### 内容边界（推荐给AI代理）

启用 `--content-boundaries` 将页面源输出包装在标记中，帮助LLM区分工具输出和不可信页面内容：

```bash
export AGENT_BROWSER_CONTENT_BOUNDARIES=1
agent-browser snapshot
# 输出:
# --- AGENT_BROWSER_PAGE_CONTENT nonce=<hex> origin=https://example.com ---
# [可访问性树]
# --- END_AGENT_BROWSER_PAGE_CONTENT nonce=<hex> ---
```

### 域名白名单

限制导航到受信任域名。通配符如 `*.example.com` 也匹配裸域 `example.com`。对非允许域名的子资源请求、WebSocket 和 EventSource 连接也会被阻止。包含目标页面依赖的CDN域名：

```bash
export AGENT_BROWSER_ALLOWED_DOMAINS="example.com,*.example.com"
agent-browser open https://example.com        # OK
agent-browser open https://malicious.com       # 被阻止
```

### 操作策略

使用策略文件控制破坏性操作：

```bash
export AGENT_BROWSER_ACTION_POLICY=./policy.json
```

示例 `policy.json`:
```json
{"default": "deny", "allow": ["navigate", "snapshot", "click", "scroll", "wait", "get"]}
```

保险库认证操作（`auth login` 等）绕过操作策略，但域名白名单仍然适用。

### 输出限制

防止大页面导致上下文溢出：

```bash
export AGENT_BROWSER_MAX_OUTPUT=50000
```

## 差异比较（验证变更）

执行操作后使用 `diff snapshot` 验证操作达到预期效果。这会将当前可访问性树与会话中上次拍摄的快照进行比较。

```bash
# 典型工作流程：快照 -> 操作 -> 比较
agent-browser snapshot -i          # 拍摄基线快照
agent-browser click @e2            # 执行操作
agent-browser diff snapshot        # 查看变更（自动与上次快照比较）
```

对于视觉回归测试或监控：

```bash
# 保存基线截图，稍后比较
agent-browser screenshot baseline.png
# ... 时间推移或发生变更 ...
agent-browser diff screenshot --baseline baseline.png

# 比较测试环境与生产环境
agent-browser diff url https://staging.example.com https://prod.example.com --screenshot
```

`diff snapshot` 输出使用 `+` 表示添加，`-` 表示删除，类似于 git diff。`diff screenshot` 生成差异图像，变更像素用红色高亮，并显示不匹配百分比。

## 超时和慢页面

Playwright 默认超时为 25 秒，适用于本地浏览器。可以通过环境变量 `AGENT_BROWSER_DEFAULT_TIMEOUT` 覆盖（单位毫秒）。对于慢速网站或大页面，使用显式等待而不是依赖默认超时：

```bash
# 等待网络活动稳定（最适合慢页面）
agent-browser wait --load networkidle

# 等待特定元素出现
agent-browser wait "#content"
agent-browser wait @e1

# 等待特定URL模式（重定向后很有用）
agent-browser wait --url "**/dashboard"

# 等待JavaScript条件
agent-browser wait --fn "document.readyState === 'complete'"

# 最后手段：等待固定时长（毫秒）
agent-browser wait 5000
```

处理持续缓慢的网站时，打开后使用 `wait --load networkidle` 确保页面完全加载后再拍摄快照。如果特定元素渲染缓慢，直接使用 `wait <selector>` 或 `wait @ref` 等待它。

## 会话管理和清理

同时运行多个代理或自动化时，始终使用命名会话避免冲突：

```bash
# 每个代理拥有独立隔离会话
agent-browser --session agent1 open site-a.com
agent-browser --session agent2 open site-b.com

# 查看活跃会话
agent-browser session list
```

完成后始终关闭浏览器会话以避免进程泄漏：

```bash
agent-browser close                    # 关闭默认会话
agent-browser --session agent1 close   # 关闭特定会话
```

如果先前会话未正确关闭，守护进程可能仍在运行。开始新工作前使用 `agent-browser close` 清理。

## 引用生命周期（重要）

引用（`@e1`、`@e2` 等）在页面变化时失效。在以下操作后始终重新快照：

- 点击导航的链接或按钮
- 表单提交
- 动态内容加载（下拉框、模态框）

```bash
agent-browser click @e5              # 导航到新页面
agent-browser snapshot -i            # 必须重新快照
agent-browser click @e1              # 使用新引用
```

## 注释截图（视觉模式）

使用 `--annotate` 拍摄在交互元素上覆盖编号标签的截图。每个标签 `[N]` 映射到引用 `@eN`。这还会缓存引用，因此你可以立即交互而无需单独快照。

```bash
agent-browser screenshot --annotate
# 输出包含图像路径和图例：
#   [1] @e1 button "Submit"
#   [2] @e2 link "Home"
#   [3] @e3 textbox "Email"
agent-browser click @e2              # 使用带注释截图中的引用点击
```

何时使用注释截图：
- 页面有未标记图标按钮或仅视觉元素
- 需要验证视觉布局或样式
- 存在画布或图表元素（文本快照不可见）
- 需要关于元素位置的空间推理

## 语义定位器（引用的替代）

当引用不可用或不可靠时，使用语义定位器：

```bash
agent-browser find text "Sign In" click
agent-browser find label "Email" fill "user@test.com"
agent-browser find role button click --name "Submit"
agent-browser find placeholder "Search" type "query"
agent-browser find testid "submit-btn" click
```

## JavaScript 执行（eval）

使用 `eval` 在浏览器上下文中运行JavaScript。**Shell引号可能损坏复杂表达式** -- 使用 `--stdin` 或 `-b` 避免问题。

```bash
# 简单表达式使用常规引用没问题
agent-browser eval 'document.title'
agent-browser eval 'document.querySelectorAll("img").length'

# 复杂JS：使用--stdin加heredoc（推荐）
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify(
  Array.from(document.querySelectorAll("img"))
    .filter(i => !i.alt)
    .map(i => ({ src: i.src.split("/").pop(), width: i.width }))
)
EVALEOF

# 替代方案：base64编码（避免所有shell转义问题）
agent-browser eval -b "$(echo -n 'Array.from(document.querySelectorAll("a")).map(a => a.href)' | base64)"
```

**为什么这很重要：** 当shell处理你的命令时，内部双引号、`!`字符（历史展开）、反引号和 `$()` 都会在JavaScript到达之前损坏它。`--stdin` 和 `-b` 标志完全绕过shell解释。

**经验法则：**
- 单行、无嵌套引号 -> 单引号常规 `eval 'expression'` 没问题
- 嵌套引号、箭头函数、模板字面量或多行 -> 使用 `eval --stdin <<'EVALEOF'`
- 编程/生成脚本 -> 使用 base64 的 `eval -b`

## 配置文件

在项目根目录创建 `agent-browser.json` 用于持久设置：

```json
{
  "headed": true,
  "proxy": "http://localhost:8080",
  "profile": "./browser-data"
}
```

优先级（从低到高）：`~/.agent-browser/config.json` < `./agent-browser.json` < 环境变量 < CLI 标志。使用 `--config <path>` 或 `AGENT_BROWSER_CONFIG` 环境变量自定义配置文件（缺失/无效则报错退出）。所有CLI选项映射到驼峰键（例如，`--executable-path` -> `"executablePath"`）。布尔标志接受 `true`/`false` 值（例如，`--headed false` 覆盖配置）。用户和项目配置的扩展是合并而非替换。

## 深入文档

| 参考 | 使用场景 |
|-----------|-------------|
| [references/commands.md](references/commands.md) | 带所有选项的完整命令参考 |
| [references/snapshot-refs.md](references/snapshot-refs.md) | 引用生命周期、失效规则、故障排查 |
| [references/session-management.md](references/session-management.md) | 并行会话、状态持久化、并发抓取 |
| [references/authentication.md](references/authentication.md) | 登录流程、OAuth、双因素认证处理、状态复用 |
| [references/video-recording.md](references/video-recording.md) | 调试和文档的录制工作流 |
| [references/profiling.md](references/profiling.md) | Chrome DevTools性能分析 |
| [references/proxy-support.md](references/proxy-support.md) | 代理配置、地理测试、轮换代理 |

## 即用模板

| 模板 | 描述 |
|----------|-------------|
| [templates/form-automation.sh](templates/form-automation.sh) | 带验证的表单填充 |
| [templates/authenticated-session.sh](templates/authenticated-session.sh) | 登录一次，复用状态 |
| [templates/capture-workflow.sh](templates/capture-workflow.sh) | 带截图的内容提取 |

```bash
./templates/form-automation.sh https://example.com/form
./templates/authenticated-session.sh https://app.example.com/login
./templates/capture-workflow.sh https://example.com ./output
```
