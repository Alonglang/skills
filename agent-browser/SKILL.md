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

### 导航与状态

```bash
# 打开URL
agent-browser open <url>

# 获取当前状态
agent-browser state

# 返回/前进
agent-browser back
agent-browser forward
```

### 截图与快照

```bash
# 截图
agent-browser screenshot page.png

# 获取元素快照（带索引）
agent-browser snapshot -i
```

### 交互

```bash
# 点击元素
agent-browser click @3

# 填写输入
agent-browser fill @1 "文本内容"

# 按键
agent-browser press Enter
agent-browser hotkey Control+a

# 滚动
agent-browser scroll down --amount 3
```

### 等待

```bash
# 等待网络空闲
agent-browser wait --load networkidle

# 等待特定时间（毫秒）
agent-browser wait --time 3000
```

### JavaScript

```bash
# 执行 JavaScript
agent-browser evaluate "document.title"
```

## 最佳实践

### 使用快照进行可靠自动化

```bash
agent-browser open https://example.com/login
agent-browser wait --load networkidle

# 获取带索引的快照
agent-browser snapshot -i
# 输出示例:
# [0] <input type="email" id="email">
# [1] <input type="password" id="password">
# [2] <button type="submit">Login</button>

# 使用索引引用元素
agent-browser fill @0 "user@example.com"
agent-browser fill @1 "secretpass"
agent-browser click @2

# 等待导航完成
agent-browser wait --load networkidle
```

### 处理动态内容

```bash
# 等待特定元素出现
agent-browser wait --for "button.submit-button"

# 等待元素包含特定文本
agent-browser wait --for ".status" --text "Complete"

# 结合等待和重试
agent-browser wait --load networkidle
agent-browser wait --time 1000
agent-browser snapshot -i
```

### 错误处理和恢复

```bash
# 检查元素是否存在后再交互
if agent-browser snapshot -i | grep -q "Error message"; then
    echo "检测到错误，执行恢复..."
    agent-browser back
    agent-browser wait --load networkidle
fi

# 使用 || 提供后备方案
agent-browser click @5 || agent-browser click @6
```

## 调试技巧

### 获取页面信息

```bash
# 完整页面状态
agent-browser state

# 当前URL
agent-browser evaluate "window.location.href"

# 页面标题
agent-browser evaluate "document.title"

# 检查元素
agent-browser evaluate "document.querySelector('#element-id').outerHTML"

# 页面性能信息
agent-browser evaluate "JSON.stringify(performance.timing)"
```

### 可视化调试

```bash
# 截图特定元素
agent-browser screenshot element.png --selector="#target"

# 截图前高亮元素（使用JavaScript）
agent-browser evaluate "
    const el = document.querySelector('#target');
    if (el) {
        el.style.outline = '3px solid red';
        el.scrollIntoView({behavior: 'instant', block: 'center'});
    }
"
agent-browser screenshot highlighted.png
```

## 实用示例

### 表单填写和提交

```bash
#!/bin/bash
# fill_form.sh - 填写和提交表单

URL="https://example.com/contact"

# 打开表单
agent-browser open "$URL"
agent-browser wait --load networkidle

# 获取表单字段
agent-browser snapshot -i

# 填写字段（根据实际索引调整）
agent-browser fill @0 "John Doe"           # 姓名
agent-browser fill @1 "john@example.com"   # 邮箱
agent-browser fill @2 "Hello, this is a test message."  # 消息

# 选择下拉选项（如果有）
# agent-browser select @3 "General Inquiry"

# 勾选复选框（如果有）
# agent-browser click @4

# 提交表单
agent-browser click @5  # 提交按钮索引

# 等待提交完成
agent-browser wait --load networkidle

# 验证成功
if agent-browser snapshot | grep -q "Thank you\|Success"; then
    echo "表单提交成功!"
else
    echo "表单提交可能失败，请检查截图"
    agent-browser screenshot error.png
fi
```

### 数据提取

```bash
#!/bin/bash
# extract_data.sh - 从页面提取数据

URL="https://example.com/products"

# 打开页面
agent-browser open "$URL"
agent-browser wait --load networkidle

# 提取产品数据（使用JavaScript）
DATA=$(agent-browser evaluate "
    Array.from(document.querySelectorAll('.product')).map(p => ({
        name: p.querySelector('.name')?.textContent?.trim() || '',
        price: p.querySelector('.price')?.textContent?.trim() || '',
        rating: p.querySelector('.rating')?.textContent?.trim() || ''
    }))
")

# 保存数据
echo "$DATA" > products.json
echo "数据已提取到 products.json"
```

### 自动化测试

```bash
#!/bin/bash
# test_flow.sh - 自动化测试流程

BASE_URL="https://app.example.com"
FAILED=0

run_test() {
    local name="$1"
    local cmd="$2"
    local check="$3"
    
    echo "测试: $name"
    if eval "$cmd"; then
        if eval "$check"; then
            echo "  ✓ 通过"
        else
            echo "  ✗ 失败 (验证未通过)"
            FAILED=$((FAILED + 1))
        fi
    else
        echo "  ✗ 失败 (命令执行错误)"
        FAILED=$((FAILED + 1))
    fi
}

# 启动浏览器
agent-browser open "$BASE_URL"

# 运行测试
run_test "页面加载" \
    "agent-browser wait --load networkidle" \
    "agent-browser state | grep -q '$BASE_URL'"

run_test "登录表单可见" \
    "agent-browser snapshot -i" \
    "agent-browser snapshot | grep -q 'username'"

run_test "填写用户名" \
    "agent-browser fill @0 'testuser'" \
    "agent-browser evaluate 'document.querySelector(\"#username\").value' | grep -q 'testuser'"

# 更多测试...

# 清理
agent-browser close

# 报告
if [ $FAILED -eq 0 ]; then
    echo "所有测试通过!"
    exit 0
else
    echo "$FAILED 个测试失败"
    exit 1
fi
```

## 性能优化技巧

### 最小化等待时间

```bash
# 不要：使用固定等待
agent-browser wait --time 5000  # 总是等待5秒

# 要：使用条件等待
agent-browser wait --load networkidle  # 网络空闲时立即停止

# 更好：等待特定条件
agent-browser wait --for ".loading" --text "Complete"
```

### 高效选择器

```bash
# 不要：过于通用的选择器
agent-browser click --selector "div > div > span > button"

# 要：使用ID或特定类
agent-browser click --selector "#submit-button"
agent-browser click --selector "[data-testid='login-btn']"

# 最好：使用快照索引（最稳定）
agent-browser snapshot -i
agent-browser click @5
```

### 批量操作

```bash
# 不要：单独执行每个操作
agent-browser open https://example.com
agent-browser wait --load networkidle
agent-browser snapshot -i

# 要：使用命令链
agent-browser open https://example.com && agent-browser wait --load networkidle && agent-browser snapshot -i

# 更好：使用批处理脚本
./complex_workflow.sh
```

## 故障排除

### 常见问题

#### 元素未找到

```bash
# 问题：快照后元素索引已更改
agent-browser click @5
# 错误：元素 @5 不存在

# 解决方案1：重新获取快照
agent-browser snapshot -i

# 解决方案2：使用更稳定的选择器
agent-browser click --selector "#submit-button"

# 解决方案3：等待元素出现
agent-browser wait --for "#submit-button"
agent-browser click --selector "#submit-button"
```

#### 点击未生效

```bash
# 问题：点击后页面未变化
agent-browser click @3
agent-browser snapshot
# 页面与之前相同

# 解决方案1：等待页面加载
agent-browser click @3
agent-browser wait --load networkidle

# 解决方案2：使用JavaScript点击
agent-browser evaluate "document.querySelector('#button').click()"

# 解决方案3：点击前确保元素可见
agent-browser scroll --to @3
agent-browser click @3
```

#### 超时问题

```bash
# 问题：操作超时
agent-browser wait --for ".result"
# 错误：超时 30000ms

# 解决方案1：增加超时时间
agent-browser wait --for ".result" --timeout 60000

# 解决方案2：使用更可靠的条件
agent-browser wait --load networkidle

# 解决方案3：检查元素是否真的会出现
agent-browser snapshot
# 手动检查输出
```

### 获取帮助

```bash
# 显示全局帮助
agent-browser --help

# 显示特定命令帮助
agent-browser click --help
agent-browser fill --help
agent-browser wait --help

# 检查浏览器状态
agent-browser state

# 验证安装
which agent-browser
agent-browser --version
```

### 调试信息收集

遇到问题时的信息收集步骤：

```bash
# 1. 浏览器版本
agent-browser --version

# 2. 当前状态
agent-browser state

# 3. 页面快照
agent-browser snapshot -i

# 4. 截图（如果可能）
agent-browser screenshot debug.png

# 5. 错误日志（如有）
# 从命令输出中复制错误信息
```

将以上信息与问题描述一起提供以获得更快的支持。
