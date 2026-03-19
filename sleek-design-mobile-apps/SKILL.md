---
name: sleek-design-mobile-apps
description: 当用户想要设计移动应用、创建屏幕、构建或与他们的 Sleek 项目交互时必须使用此技能。涵盖高级请求（"设计一个能做 X 的应用"）和具体请求（"列出我的项目"、"创建新项目"、"获取该屏幕截图"）。
compatibility: 需要 SLEEK_API_KEY 环境变量。网络访问限制为 https://sleek.design 仅限。
metadata:
  requires-env: SLEEK_API_KEY
  allowed-hosts: https://sleek.design
---

# 使用 Sleek 进行设计

## 概述

Sleek 是一个 AI 驱动的移动应用设计工具。你通过与它通信的 `/api/v1/*` REST API 来创建项目，用自然语言描述你想要构建的内容，并获取渲染的屏幕。所有通信都是标准 HTTP，使用 bearer token 认证。

**基础 URL**：`https://sleek.design`
**认证**：在每个 `/api/v1/*` 请求上使用 `Authorization: Bearer $SLEEK_API_KEY`
**Content-Type**：`application/json`（请求和响应）
**CORS**：在所有 `/api/v1/*` 端点上启用

---

## 先决条件：API 密钥

在 **https://sleek.design/dashboard/api-keys** 创建 API 密钥。完整的密钥值仅在创建时显示一次——将其存储在 `SLEEK_API_KEY` 环境变量中。

**所需计划**：Pro+（API 访问有门槛）

### 密钥范围

| 范围 | 开启的功能 |
| ----------------- | ---------------------------- |
| `projects:read` | 列出/获取项目 |
| `projects:write` | 创建/删除项目 |
| `components:read` | 列出项目中的组件 |
| `chats:read` | 获取聊天运行状态 |
| `chats:write` | 发送聊天消息 |
| `screenshots` | 渲染组件屏幕截图 |

创建密钥时仅包含任务所需的范围。

---

## 安全与隐私

- **单一主机**：所有请求仅发送到 `https://sleek.design`。不会将数据发送到第三方。
- **仅 HTTPS**：所有通信使用 HTTPS。API 密钥仅在 `Authorization` 标头中传输到 Sleek 端点。
- **最小范围**：创建仅包含任务所需范围的 API 密钥。优先使用短期或可撤销的密钥。
- **图像 URL**：在聊天消息中使用 `imageUrls` 时，这些 URL 会由 Sleek 的服务器获取。避免传递包含敏感内容的 URL。

---

## 处理高级请求

当用户说"设计一个健身追踪应用"或"为我构建一个设置屏幕"之类的话时：

1. **创建项目**（如果不存在）（询问用户名称，或从请求中推断）
2. **发送聊天消息**描述要构建的内容——你可以直接使用用户的话作为 `message.text`；Sleek 的 AI 会解释自然语言
3. **按照下面的屏幕截图交付规则**显示结果

你不需要先将请求分解为屏幕。将完整意图作为单个消息发送，让 Sleek 决定创建哪些屏幕。

---

## 屏幕截图交付规则

**在每个产生 `screen_created` 或 `screen_updated` 操作的聊天运行后，始终截取屏幕截图并向用户展示。** 永远不要在不显示视觉效果的情况下静默完成聊天运行。

**当项目中首次创建屏幕时**（即运行包括 `screen_created` 操作），交付：
1. 每个新创建屏幕的一个屏幕截图（单独的 `componentIds: [screenId]`）
2. 项目中所有屏幕的一个组合屏幕截图（`componentIds: [所有屏幕 id]`）

**当仅更新现有屏幕时**，为每个受影响的屏幕交付一个屏幕截图。

除非用户另有明确要求，否则对所有屏幕截图使用 `background: "transparent"`。

---

## 快速参考 — 所有端点

| 方法 | 路径 | 范围 | 描述 |
| -------- | --------------------------------------- | ----------------- | ----------------- |
| `GET` | `/api/v1/projects` | `projects:read` | 列出项目 |
| `POST` | `/api/v1/projects` | `projects:write` | 创建项目 |
| `GET` | `/api/v1/projects/:id` | `projects:read` | 获取项目 |
| `DELETE` | `/api/v1/projects/:id` | `projects:write` | 删除项目 |
| `GET` | `/api/v1/projects/:id/components` | `components:read` | 列出组件 |
| `POST` | `/api/v1/projects/:id/chat/messages` | `chats:write` | 发送聊天消息 |
| `GET` | `/api/v1/projects/:id/chat/runs/:runId` | `chats:read` | 轮询运行状态 |
| `POST` | `/api/screenshots` | `screenshots` | 渲染屏幕截图 |

所有 ID 都是稳定的字符串标识符。

---

## 端点

### 项目

#### 列出项目

```http
GET /api/v1/projects?limit=50&offset=0
Authorization: Bearer $SLEEK_API_KEY
```

响应 `200`：

```json
{
  "data": [
    {
      "id": "proj_abc",
      "name": "My App",
      "slug": "my-app",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "..."
    }
  ],
  "pagination": { "total": 12, "limit": 50, "offset": 0 }
}
```

#### 创建项目

```http
POST /api/v1/projects
Authorization: Bearer $SLEEK_API_KEY
Content-Type: application/json

{ "name": "My New App" }
```

响应 `201` — 与单个项目形状相同。

#### 获取/删除项目

```http
GET    /api/v1/projects/:projectId
DELETE /api/v1/projects/:projectId   → 204 No Content
```

---

### 组件

#### 列出组件

```http
GET /api/v1/projects/:projectId/components?limit=50&offset=0
Authorization: Bearer $SLEEK_API_KEY
```

响应 `200`：

```json
{
  "data": [
    {
      "id": "cmp_xyz",
      "name": "Hero Section",
      "activeVersion": 3,
      "versions": [{ "id": "ver_001", "version": 1, "createdAt": "..." }],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": { "total": 5, "limit": 50, "offset": 0 }
}
```

---

### 聊天 — 发送消息

这是核心操作：在 `message.text` 中描述你想要的内容，AI 会创建或修改屏幕。

```http
POST /api/v1/projects/:projectId/chat/messages?wait=false
Authorization: Bearer $SLEEK_API_KEY
Content-Type: application/json
idempotency-key: <可选，最多 255 字符>

{
  "message": { "text": "Add a pricing section with three tiers" },
  "imageUrls": ["https://example.com/ref.png"],
  "target": { "screenId": "scr_abc" }
}
```

| 字段 | 必需 | 说明 |
| ------------------------ | -------- | --------------------------------------------- |
| `message.text` | 是 | 1+ 个字符，已修剪 |
| `imageUrls` | 否 | 仅 HTTPS URL；包含为视觉上下文 |
| `target.screenId` | 否 | 编辑特定屏幕；省略让 AI 决定 |
| `?wait=true/false` | 否 | 同步等待模式（默认：false）|
| `idempotency-key` 标头 | 否 | 安全重放的防重放 |

#### 响应 — 异步（默认，`wait=false`）

状态 `202 Accepted`。在运行到达终端状态之前，`result` 和 `error` 不存在。

```json
{
  "data": {
    "runId": "run_111",
    "status": "queued",
    "statusUrl": "/api/v1/projects/proj_abc/chat/runs/run_111"
  }
}
```

#### 响应 — 同步（`wait=true`）

最多阻塞 **300 秒**。完成时返回 `200`，如果超时则返回 `202`。

```json
{
  "data": {
    "runId": "run_111",
    "status": "completed",
    "statusUrl": "...",
    "result": {
      "assistantText": "I added a pricing section with...",
      "operations": [
        { "type": "screen_created", "screenId": "scr_xyz", "screenName": "Pricing" },
        { "type": "screen_updated", "screenId": "scr_abc" },
        { "type": "theme_updated" }
      ]
    }
  }
}
```

---

### 聊天 — 轮询运行状态

在异步发送后使用它来检查进度。

```http
GET /api/v1/projects/:projectId/chat/runs/:runId
Authorization: Bearer $SLEEK_API_KEY
```

响应 — 与发送消息 `data` 对象形状相同：

```json
{
  "data": {
    "runId": "run_111",
    "status": "queued",
    "statusUrl": "..."
  }
}
```

当成功完成时，存在 `result`：

```json
{
  "data": {
    "runId": "run_111",
    "status": "completed",
    "statusUrl": "...",
    "result": {
      "assistantText": "...",
      "operations": [...]
    }
  }
}
```

当失败时，存在 `error`：

```json
{
  "data": {
    "runId": "run_111",
    "status": "failed",
    "statusUrl": "...",
    "error": { "code": "execution_failed", "message": "..." }
  }
}
```

**运行状态生命周期**：`queued` → `running` → `completed | failed`

---

### 屏幕截图

拍摄一个或多个渲染组件的快照。

```http
POST /api/screenshots
Authorization: Bearer $SLEEK_API_KEY
Content-Type: application/json

{
  "componentIds": ["cmp_xyz", "cmp_abc"],
  "projectId": "proj_abc",
  "format": "png",
  "scale": 2,
  "gap": 40,
  "padding": 40,
  "background": "transparent"
}
```

| 字段 | 默认值 | 说明 |
| ------------ | ------------- | --------------------------------------------------------------------- |
| `format` | `png` | `png` 或 `webp` |
| `scale` | `2` | 1–3（设备像素比）|
| `gap` | `40` | 组件之间的像素 |
| `padding` | `40` | 所有侧的统一内边距 |
| `paddingX` | _(可选)_ | 水平内边距；提供时覆盖横向的 `padding` |
| `paddingY` | _(可选)_ | 垂直内边距；提供时覆盖纵向的 `padding` |
| `background` | `transparent` | 任何 CSS 颜色（十六进制、命名、`transparent`）|
| `showDots` | `false` | 在背景上覆盖微妙的点网格 |

`paddingX` 和 `paddingY` 在其轴上的优先级高于 `padding`。如果两者均未设置，`padding` 适用于所有侧。例如，`{ "padding": 20, "paddingX": 10 }` 给出 10px 水平内边距和 20px 垂直内边距。

当 `showDots` 为 `true` 时，会在背景颜色上绘制点图案。点会自动适应背景：暗背景获得亮点，浅背景获得暗点。当 `background` 为 `"transparent"` 时，这没有效果。

除非用户明确请求特定的背景颜色，否则始终使用 `"background": "transparent"`。

响应：原始二进制 `image/png` 或 `image/webp`，带 `Content-Disposition: attachment`。

---

## 错误形状

```json
{ "code": "UNAUTHORIZED", "message": "..." }
```

| HTTP | 代码 | 何时 |
| ---- | ----------------------- | -------------------------------------- |
| 401 | `UNAUTHORIZED` | 缺少/无效/过期的 API 密钥 |
| 403 | `FORBIDDEN` | 有效密钥，错误范围或计划 |
| 404 | `NOT_FOUND` | 资源不存在 |
| 400 | `BAD_REQUEST` | 验证失败 |
| 409 | `CONFLICT` | 此项目的另一个运行处于活动状态 |
| 500 | `INTERNAL_SERVER_ERROR` | 服务器错误 |

聊天运行级错误（在 `data.error` 内）：

| 代码 | 含义 |
| ------------------ | -------------------------------- |
| `out_of_credits` | 组织没有剩余积分 |
| `execution_failed` | AI 执行错误 |

---

## 流程

### 流程 1：创建项目并生成 UI（异步 + 轮询）

```
1. POST /api/v1/projects                              → 获取 projectId
2. POST /api/v1/projects/:id/chat/messages            → 获取 runId (202)
3. 轮询 GET /api/v1/projects/:id/chat/runs/:runId
   直到 status == "completed" 或 "failed"
4. 从 result.operations 收集 screenIds
   （screen_created 和 screen_updated 条目）
5. 为每个受影响的屏幕单独截取屏幕截图
6. 如果有任何 screen_created：也截取所有项目屏幕的组合屏幕截图
7. 向用户显示所有屏幕截图
```

**轮询建议**：从 2s 间隔开始，10s 后退避到 5s，5 分钟后放弃。

### 流程 2：同步模式（简单、阻塞）

最适合短任务或延迟可接受时。

```
1. POST /api/v1/projects/:id/chat/messages?wait=true
   → 最多阻塞 300s
   → 如果完成返回 200，如果超时返回 202
2. 如果 202，使用返回的 runId 回退到流程 1 轮询
3. 完成后，截取受影响屏幕的屏幕截图并向用户展示（见屏幕截图交付规则）
```

### 流程 3：编辑特定屏幕

```
1. GET /api/v1/projects/:id/components         → 查找 screenId
2. POST /api/v1/projects/:id/chat/messages
   body: { message: { text: "..." }, target: { screenId: "scr_xyz" } }
3. 轮询或等待如上所述
4. 截取更新屏幕的屏幕截图并向用户展示
```

### 流程 4：幂等消息（安全重试）

在发送请求上添加 `idempotency-key` 标头。如果网络断开并且你使用相同的密钥重试，服务器将返回现有运行而不是创建重复。密钥必须 ≤255 个字符。

```
POST /api/v1/projects/:id/chat/messages
idempotency-key: my-unique-request-id-abc123
```

### 流程 5：一次一个运行（冲突处理）

每个项目只允许一个活动运行。如果你在一个运行时发送消息，你会得到 `409 CONFLICT`。等待活动运行完成后再发送下一条消息。

```
409 响应 → 轮询现有运行 → 已完成 → 发送下一条消息
```

---

## 分页

所有列表端点接受 `limit`（1-100，默认 50）和 `offset`（≥0）。响应始终包括 `pagination.total`，因此你可以对结果进行分页。

```http
GET /api/v1/projects?limit=10&offset=20
```

---

## 常见错误

| 错误 | 修复 |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| 发送到 `/api/v1` 而没有 `Authorization` 标头 | 在每个请求上添加 `Authorization: Bearer $SLEEK_API_KEY` |
| 使用错误范围 | 检查密钥的范围是否与端点匹配（例如，对于发送消息为 `chats:write`）|
| 在运行完成前发送下一条消息 | 在下次发送前轮询直到 `completed`/`failed` |
| 对长生成使用 `wait=true` | 它最多阻塞 300s；对于 `202` 响应有回退到轮询 |
| `imageUrls` 中的 HTTP URL | 仅接受 HTTPS URL |
| 假定 `result` 在 `202` 上存在 | 在 status 为 `completed` 之前 `result` 不存在 |
