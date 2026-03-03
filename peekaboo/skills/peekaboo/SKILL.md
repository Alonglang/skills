---
name: peekaboo
description: 使用Peekaboo CLI捕获和自动化macOS UI。
homepage: https://peekaboo.boo
metadata: {"clawdbot":{"emoji":"👀","os":["darwin"],"requires":{"bins":["peekaboo"]},"install":[{"id":"brew","kind":"brew","formula":"steipete/tap/peekaboo","bins":["peekaboo"],"label":"安装Peekaboo (brew)"}]}}
---

# Peekaboo

Peekaboo是一个完整的macOS UI自动化CLI：捕获/检查屏幕、定位UI元素、驱动输入和管理应用/窗口/菜单。命令共享快照缓存并支持 `--json`/`-j` 用于脚本。运行 `peekaboo` 或 `peekaboo <cmd> --help` 查看标志；`peekaboo --version` 打印构建元数据。提示：通过 `polter peekaboo` 运行以确保最新构建。

## 功能（所有CLI功能，不包括代理/MCP）

核心
- `bridge`: 检查Peekaboo Bridge主机连接
- `capture`: 实时捕获或视频输入 + 帧提取
- `clean`: 清理快照缓存和临时文件
- `config`: 初始化/显示/编辑/验证，提供商、模型、凭证
- `image`: 捕获屏幕截图（屏幕/窗口/菜单栏区域）
- `learn`: 打印完整的代理指南 + 工具目录
- `list`: 应用、窗口、屏幕、菜单栏、权限
- `permissions`: 检查屏幕录制/辅助功能状态
- `run`: 执行 `.peekaboo.json` 脚本
- `sleep`: 暂停执行一段时间
- `tools`: 列出可用工具以及过滤/显示选项

交互
- `click`: 通过ID/查询/坐标定位，带智能等待
- `drag`: 在元素/坐标/Dock之间拖放
- `hotkey`: 修饰符组合，如 `cmd,shift,t`
- `move`: 带有可选平滑的鼠标定位
- `paste`: 设置剪贴板 -> 粘贴 -> 恢复
- `press`: 带重复的特殊键序列
- `scroll`: 方向滚动（定向 + 平滑）
- `swipe`: 目标之间的手势式拖动
- `type`: 文本 + 控制键（`--clear`，延迟）

系统
- `app`: 启动/退出/重新启动/隐藏/取消隐藏/切换/列出应用
- `clipboard`: 读取/写入剪贴板（文本/图像/文件）
- `dialog`: 点击/输入/文件/关闭/列出系统对话框
- `dock`: 启动/右键单击/隐藏/显示/列出Dock项目
- `menu`: 单击/列出应用菜单 + 菜单扩展
- `menubar`: 列出/单击状态栏项目
- `open`: 增强的 `open`，支持应用定位 + JSON负载
- `space`: 列出/切换/移动窗口（桌面）
- `visualizer`: 练习Peekaboo视觉反馈动画
- `window`: 关闭/最小化/最大化/移动/调整大小/聚焦/列出

视觉
- `see`: 带注释的UI地图、快照ID、可选分析

全局运行时标志
- `--json`/`-j`、`--verbose`/`-v`、`--log-level <level>`
- `--no-remote`、`--bridge-socket <路径>`

## 快速开始（快乐路径）
```bash
peekaboo permissions
peekaboo list apps --json
peekaboo see --annotate --path /tmp/peekaboo-see.png
peekaboo click --on B1
peekaboo type "你好" --return
```

## 常用定位参数（大多数交互命令）
- 应用/窗口：`--app`、`--pid`、`--window-title`、`--window-id`、`--window-index`
- 快照定位：`--snapshot`（来自 `see` 的ID；默认为最新的）
- 元素/坐标：`--on`/`--id`（元素ID）、`--coords x,y`
- 焦点控制：`--no-auto-focus`、`--space-switch`、`--bring-to-current-space`、`--focus-timeout-seconds`、`--focus-retry-count`

## 常用捕获参数
- 输出：`--path`、`--format png|jpg`、`--retina`
- 定位：`--mode screen|window|frontmost`、`--screen-index`、`--window-title`、`--window-id`
- 分析：`--analyze "提示"`、`--annotate`
- 捕获引擎：`--capture-engine auto|classic|cg|modern|sckit`

## 常用运动/打字参数
- 时间：`--duration`（拖动/滑动）、`--steps`、`--delay`（打字/滚动/按键）
- 人类般的运动：`--profile human|linear`、`--wpm`（打字）
- 滚动：`--direction up|down|left|right`、`--amount <刻度>`、`--smooth`

## 示例

### 查看 -> 点击 -> 打字（最可靠的流程）
```bash
peekaboo see --app Safari --window-title "登录" --annotate --path /tmp/see.png
peekaboo click --on B3 --app Safari
peekaboo type "user@example.com" --app Safari
peekaboo press tab --count 1 --app Safari
peekaboo type "supersecret" --app Safari --return
```

### 按窗口ID定位
```bash
peekaboo list windows --app "Visual Studio Code" --json
peekaboo click --window-id 12345 --coords 120,160
peekaboo type "来自Peekaboo的问候" --window-id 12345
```

### 捕获屏幕截图 + 分析
```bash
peekaboo image --mode screen --screen-index 0 --retina --path /tmp/screen.png
peekaboo image --app Safari --window-title "仪表板" --analyze "总结KPI"
peekaboo see --mode screen --screen-index 0 --analyze "总结仪表板"
```

### 实时捕获（运动感知）
```bash
peekaboo capture live --mode region --region 100,100,800,600 --duration 30 \
  --active-fps 8 --idle-fps 2 --highlight-changes --path /tmp/capture
```

### 应用 + 窗口管理
```bash
peekaboo app launch "Safari" --open https://example.com
peekaboo window focus --app Safari --window-title "示例"
peekaboo window set-bounds --app Safari --x 50 --y 50 --width 1200 --height 800
peekaboo app quit --app Safari
```

### 菜单、菜单栏、Dock
```bash
peekaboo menu click --app Safari --item "新建窗口"
peekaboo menu click --app TextEdit --path "格式 > 字体 > 显示字体"
peekaboo menu click-extra --title "WiFi"
peekaboo dock launch Safari
peekaboo menubar list --json
```

### 鼠标 + 手势输入
```bash
peekaboo move 500,300 --smooth
peekaboo drag --from B1 --to T2
peekaboo swipe --from-coords 100,500 --to-coords 100,200 --duration 800
peekaboo scroll --direction down --amount 6 --smooth
```

### 键盘输入
```bash
peekaboo hotkey --keys "cmd,shift,t"
peekaboo press escape
peekaboo type "第1行\n第2行" --delay 10
```

## 注意

- 需要屏幕录制 + 辅助功能权限
- 在点击前使用 `peekaboo see --annotate` 识别目标
