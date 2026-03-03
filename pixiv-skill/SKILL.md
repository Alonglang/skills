---
name: pixiv
description: 访问 Pixiv 搜索插画、漫画并查看排行榜。支持按关键词搜索和查看每日/每周/每月排行榜。
---

# Pixiv 技能

此技能允许搜索和浏览 Pixiv 插画。

## 设置

使用前，你必须拥有有效的 Pixiv 刷新令牌。令牌存储在技能目录内的 `config.json` 中。

要配置：
1. 向用户询问他们的 Pixiv 刷新令牌
2. 运行：`node skills/pixiv/scripts/pixiv-cli.js login <REFRESH_TOKEN>`

## 使用方法

### 搜索插画

要按关键词搜索插画：

```bash
node skills/pixiv/scripts/pixiv-cli.js search "关键词" [页码]
```

示例：
```bash
node skills/pixiv/scripts/pixiv-cli.js search "miku" 1
```

返回插画详情的 JSON 数组（标题、URL、标签、用户等）。

### 查看排行榜

要查看排行榜：

```bash
node skills/pixiv/scripts/pixiv-cli.js ranking [模式] [页码]
```

模式：`day`（日榜）、`week`（周榜）、`month`（月榜）、`day_male`（男性日榜）、`day_female`（女性日榜）、`week_original`（原创周榜）、`week_rookie`（新人周榜）、`day_ai`（AI 日榜）。
默认是 `day`。

示例：
```bash
node skills/pixiv/scripts/pixiv-cli.js ranking day
```

### 查看用户资料

要查看用户的资料详情：

```bash
node skills/pixiv/scripts/pixiv-cli.js user <用户ID>
```

示例：
```bash
node skills/pixiv/scripts/pixiv-cli.js user 11
```

### 查看登录用户资料（我）

要查看当前登录账户的资料（基于刷新令牌）：

```bash
node skills/pixiv/scripts/pixiv-cli.js me
```

### 查看关注用户

要列出登录账户关注的用户：

```bash
node skills/pixiv/scripts/pixiv-cli.js following [页码]
```

### 查看动态（关注用户新作品）

要查看关注用户的最新插画：

```bash
node skills/pixiv/scripts/pixiv-cli.js feed [限制] [页码]
```

`RESTRICT` 可以是 `all`（全部）、`public`（公开）或 `private`（私有）。默认是 `all`。

### 下载插画

要下载插画（单图、漫画/多图或动图 zip）：

```bash
node scripts/pixiv-cli.js download <插画ID>
```

文件保存到 `downloads/<插画ID>/`。
返回包含已下载文件列表的 JSON。

### 发布插画（新功能）

要使用 AppAPI v2 直接向 Pixiv 发布新插画（纯代码，无需浏览器）：

```bash
node scripts/pixiv-cli.js post <文件路径> "<标题>" "[标签_逗号分隔]" [可见性]
```

- `可见性`：`public`（公开，默认）、`login_only`（仅登录可见）、`mypixiv`（仅自己可见）或 `private`（私有）。
- 默认会自动应用 AI 生成的标签（`illust_ai_type: 2`）。

示例：
```bash
node scripts/pixiv-cli.js post "./output.png" "我的新作品" "原创、少女、AI" private
```

## 如何获取令牌（供用户使用）

如果用户问如何获取令牌：
1. 引导他们查找"Pixiv Refresh Token"或使用像 `gppt`（Get Pixiv Token）这样的工具
2. 或者告诉他们在浏览器中登录 Pixiv，在本地存储或 Cookie 中查找 `refresh_token`（虽然 OAuth 刷新令牌更干净）
3. 对于非技术用户，最简单的方法是使用辅助脚本，但我们这里没有。直接询问他们提供即可。
