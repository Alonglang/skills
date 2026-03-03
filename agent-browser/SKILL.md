---
name: agent-browser
description: "通过 inference.sh 为 AI 代理进行的浏览器自动化。使用 @e 引用导航网页、与元素交互、截图、录制视频。能力：网页抓取、表单填写、点击、输入、拖放、文件上传、JavaScript 执行。用于：网页自动化、数据提取、测试、代理浏览、研究。触发词：browser、网页自动化、scrape、navigate、click、填写表单、screenshot、浏览网页、playwright、无头浏览器、网页代理、冲浪互联网、录制视频"
allowed-tools: Bash(infsh *)
---

# 代理浏览器

通过 [inference.sh](https://inference.sh) 为 AI 代理进行的浏览器自动化。在底层使用 Playwright，并具有用于元素交互的简单 `@e` 引用系统。

![Agentic Browser](https://cloud.inference.sh/app/files/u/4mg21r6ta37mpaz6ktzwtt8krr/01kgjw8atdxgkrsr8a2t5peq7b.jpeg)

## 快速开始

```bash
# 安装 CLI
curl -fsSL https://cli.inference.sh | sh && infsh login

# 打开页面并获取交互式元素
infsh app run agent-browser --function open --input '{"url": "https://example.com"}' --session new
```

> **安装说明**：[安装脚本](https://cli.inference.sh) 仅检测你的操作系统/架构，从 `dist.inference.sh` 下载匹配的二进制文件，并验证其 SHA-256 校验和。不需要提升权限或后台进程。[手动安装和验证](https://dist.inference.sh/cli/checksums.txt)可用。

## 核心工作流程

每个浏览器自动化都遵循此模式：

1. **打开** - 导航到 URL，获取 `@e` 引用以获取元素
2. **交互** - 使用引用进行点击、填充、拖动等
3. **重新快照** - 在导航/更改后，获取新的引用
4. **关闭** - 结束会话（如果录制则返回视频）

```bash
# 1. 开始会话
RESULT=$(infsh app run agent-browser --function open --session new --input '{
  "url": "https://example.com/login"
}')
SESSION_ID=$(echo $RESULT | jq -r '.session_id')
# 元素：@e1 [input] "Email"、@e2 [input] "Password"、@e3 [button] "Sign In"

# 2. 填充和提交
infsh app run agent-browser --function interact --session $SESSION_ID --input '{
  "action": "fill", "ref": "@e1", "text": "user@example.com"
}'
infsh app run agent-browser --function interact --session $SESSION_ID --input '{
  "action": "fill", "ref": "@e2", "text": "password123"
}'
infsh app run agent-browser --function interact --session $SESSION_ID --input '{
  "action": "click", "ref": "@e3"
}'

# 3. 导航后重新快照
infsh app run agent-browser --function snapshot --session $SESSION_ID --input '{}'

# 4. 完成后关闭
infsh app run agent-browser --function close --session $SESSION_ID --input '{}'
```

## 函数

| 函数 | 描述 |
|----------|-------------|
| `open` | 导航到 URL，配置浏览器（视口、代理、视频录制）|
| `snapshot` | 在 DOM 更改后使用 `@e` 引用重新获取页面状态 |
| `interact` | 使用 `@e` 引用执行操作（点击、填充、拖动、上传等）|
| `screenshot` | 截取页面截图（视口或完整页面）|
| `execute` | 在页面上运行 JavaScript 代码 |
| `close` | 关闭会话，如果启用录制则返回视频 |

## 交互操作

| 操作 | 描述 | 所需字段 |
|--------|-------------|-----------------|
| `click` | 点击元素 | `ref` |
| `dblclick` | 双击元素 | `ref` |
| `fill` | 清除并输入文本 | `ref`、`text` |
| `type` | 输入文本（不清除）| `text` |
| `press` | 按键（Enter、Tab 等）| `text` |
| `select` | 选择下拉选项 | `ref`、`text` |
| `hover` | 将鼠标悬停在元素上 | `ref` |
| `check` | 选中复选框 | `ref` |
| `uncheck` | 取消选中复选框 | `ref` |
| `drag` | 拖放 | `ref`、`target_ref` |
| `upload` | 上传文件（多个）| `ref`、`file_paths` |
| `scroll` | 滚动页面 | `direction`（向上/向下/向左/向右）、`scroll_amount` |
| `back` | 在历史记录中返回 | - |
| `wait` | 等待毫秒 | `wait_ms` |
| `goto` | 导航到 URL | `url` |

## 元素引用

元素返回时带有 `@e` 引用：

```
@e1 [a] "Home" href="/"
@e2 [input type="text"] placeholder="Search"
@e3 [button] "Submit"
@e4 [select] "Choose option"
@e5 [input type="checkbox"] name="agree"
```

**重要：** 引用在导航后失效。始终在以下情况后重新快照：
- 点击导航的链接/按钮
- 表单提交
- 动态内容加载

## 功能

### 视频录制

录制浏览器会话以进行调试或文档记录：

```bash
# 启用录制（可选显示光标指示器）
SESSION=$(infsh app run agent-browser --function open --session new --input '{
  "url": "https://example.com",
  "record_video": true,
  "show_cursor": true
}' | jq -r '.session_id')

# ... 执行操作 ...

# 关闭以获取视频文件
infsh app run agent-browser --function close --session $SESSION --input '{}'
# 返回：{"success": true, "video": <File>}
```

### 光标指示器

在截图和视频中显示可见光标（对于演示很有用）：

```bash
infsh app run agent-browser --function open --session new --input '{
  "url": "https://example.com",
  "show_cursor": true,
  "record_video": true
}'
```

光标显示为跟随鼠标移动并显示点击反馈的红点。

### 代理支持

通过代理服务器路由流量：

```bash
infsh app run agent-browser --function open --session new --input '{
  "url": "https://example.com",
  "proxy_url": "http://proxy.example.com:8080",
  "proxy_username": "user",
  "proxy_password": "pass"
}'
```

### 文件上传

将文件上传到文件输入：

```bash
infsh app run agent-browser --function interact --session $SESSION --input '{
  "action": "upload",
  "ref": "@e5",
  "file_paths": ["/path/to/file.pdf"]
}'
```

### 拖放

将元素拖到目标：

```bash
infsh app run agent-browser --function interact --session $SESSION --input '{
  "action": "drag",
  "ref": "@e1",
  "target_ref": "@e2"
}'
```

### JavaScript 执行

运行自定义 JavaScript：

```bash
infsh app run agent-browser --function execute --session $SESSION --input '{
  "code": "document.querySelectorAll(\"h2\").length"
}'
# 返回：{"result": "5", "screenshot": <File>}
```

## 深入文档

| 参考 | 描述 |
|-----------|-------------|
| [references/commands.md](references/commands.md) | 完整的函数参考，包含所有选项 |
| [references/snapshot-refs.md](references/snapshot-refs.md) | 引用生命周期、失效规则、故障排除 |
| [references/session-management.md](references/session-management.md) | 会话持久化、并行会话 |
| [references/authentication.md](references/authentication.md) | 登录流程、OAuth、2FA 处理 |
| [references/video-recording.md](references/video-recording.md) | 用于调试的录制工作流程 |
| [references/proxy-support.md](references/proxy-support.md) | 代理配置、地理测试 |

## 即用型模板

| 模板 | 描述 |
|----------|-------------|
| [templates/form-automation.sh](templates/form-automation.sh) | 带有验证的表单填写 |
| [templates/authenticated-session.sh](templates/authenticated-session.sh) | 一次性登录，重用会话 |
| [templates/capture-workflow.sh](templates/capture-workflow.sh) | 带有截图的内容提取 |

## 示例

### 表单提交

```bash
SESSION=$(infsh app run agent-browser --function open --session new --input '{
  "url": "https://example.com/contact"
}' | jq -r '.session_id')

# 获取元素：@e1 [input] "Name"、@e2 [input] "Email"、@e3 [textarea]、@e4 [button] "Send"

infsh app run agent-browser --function interact --session $SESSION --input '{"action": "fill", "ref": "@e1", "text": "John Doe"}'
infsh app run agent-browser --function interact --session $SESSION --input '{"action": "fill", "ref": "@e2", "text": "john@example.com"}'
infsh app run agent-browser --function interact --session $SESSION --input '{"action": "fill", "ref": "@e3", "text": "Hello!"}'
infsh app run agent-browser --function interact --session $SESSION --input '{"action": "click", "ref": "@e4"}'

infsh app run agent-browser --function snapshot --session $SESSION --input '{}'
infsh app run agent-browser --function close --session $SESSION --input '{}'
```

### 搜索和提取

```bash
SESSION=$(infsh app run agent-browser --function open --session new --input '{
  "url": "https://google.com"
}' | jq -r '.session_id')

infsh app run agent-browser --function interact --session $SESSION --input '{"action": "fill", "ref": "@e1", "text": "weather today"}'
infsh app run agent-browser --function interact --session $SESSION --input '{"action": "press", "text": "Enter"}'
infsh app run agent-browser --function interact --session $SESSION --input '{"action": "wait", "wait_ms": 2000}'

infsh app run agent-browser --function snapshot --session $SESSION --input '{}'
infsh app run agent-browser --function close --session $SESSION --input '{}'
```

### 带视频的截图

```bash
SESSION=$(infsh app run agent-browser --function open --session new --input '{
  "url": "https://example.com",
  "record_video": true
}' | jq -r '.session_id')

# 截取完整页面截图
infsh app run agent-browser --function screenshot --session $SESSION --input '{
  "full_page": true
}'

# 关闭并获取视频
RESULT=$(infsh app run agent-browser --function close --session $SESSION --input '{}')
echo $RESULT | jq '.video'
```

## 会话

浏览器状态在会话内持久化。始终：

1. 第一次调用时使用 `--session new` 启动
2. 对后续调用使用返回的 `session_id`
3. 完成后关闭会话

## 相关技能

```bash
# 网页搜索（用于研究 + 浏览）
npx skills add inference-sh/skills@web-search

# LLM 模型（分析提取的内容）
npx skills add inference-sh/skills@llm-models
```

## 文档

- [inference.sh 会话](https://inference.sh/docs/extend/sessions) - 会话管理
- [多函数应用程序](https://inference.sh/docs/extend/multi-function-apps) - 函数如何工作
