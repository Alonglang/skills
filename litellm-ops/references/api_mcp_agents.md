# LiteLLM MCP、Agents 与 Assistants API 参考

---

## 目录

- [MCP（模型上下文协议）— 45 端点](#mcp)
- [Agents & A2A — 21 端点](#agents--a2a)
- [Assistants（OpenAI 兼容）— 8 端点](#assistants)
- [Containers — 9 端点](#containers)
- [Interactions — 8 端点](#interactions)

---

## MCP

LiteLLM 作为 MCP Gateway，可统一管理多个 MCP Server，提供工具发现、OAuth 认证、访问控制。

### MCP 工具列表

**端点：** `GET /v1/mcp/tools`

```bash
curl http://localhost:4000/v1/mcp/tools \
  -H "Authorization: Bearer sk-your-key"
# 返回当前用户可用的所有 MCP 工具
```

### MCP REST API（无需 SSE）

```bash
# 列出工具
curl http://localhost:4000/mcp-rest/tools/list \
  -H "Authorization: Bearer sk-your-key"

# 调用工具
curl -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "Authorization: Bearer sk-your-key" \
  -d '{
    "name": "tool-name",
    "arguments": {"param1": "value1"}
  }'

# 测试连接
curl -X POST http://localhost:4000/mcp-rest/test/connection \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"server_id": "server-xxx"}'

# 测试工具列表
curl -X POST http://localhost:4000/mcp-rest/test/tools/list \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"server_id": "server-xxx"}'
```

### MCP Server 管理

```bash
# 列出所有 MCP Server
curl http://localhost:4000/v1/mcp/server \
  -H "Authorization: Bearer sk-master-key"

# 添加 MCP Server
curl -X POST http://localhost:4000/v1/mcp/server \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "server_name": "my-mcp-server",
    "server_url": "https://my-server.com/mcp",
    "description": "My custom MCP server",
    "transport": "sse"
  }'

# 编辑 MCP Server
curl -X PUT http://localhost:4000/v1/mcp/server \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"server_id": "xxx", "server_url": "https://new-url.com/mcp"}'

# 查询单个
curl http://localhost:4000/v1/mcp/server/xxx \
  -H "Authorization: Bearer sk-master-key"

# 删除
curl -X DELETE http://localhost:4000/v1/mcp/server/xxx \
  -H "Authorization: Bearer sk-master-key"

# 健康检查
curl http://localhost:4000/v1/mcp/server/health \
  -H "Authorization: Bearer sk-master-key"
```

### MCP Server 注册与审批

```bash
# 注册（提交审批）
curl -X POST http://localhost:4000/v1/mcp/server/register \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"server_name": "new-server", "server_url": "https://server.com/mcp"}'

# 查看提交列表
curl http://localhost:4000/v1/mcp/server/submissions \
  -H "Authorization: Bearer sk-master-key"

# 审批通过
curl -X PUT http://localhost:4000/v1/mcp/server/xxx/approve \
  -H "Authorization: Bearer sk-master-key"

# 拒绝
curl -X PUT http://localhost:4000/v1/mcp/server/xxx/reject \
  -H "Authorization: Bearer sk-master-key"
```

### MCP 用户凭证

```bash
# 存储凭证
curl -X POST http://localhost:4000/v1/mcp/server/xxx/user-credential \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"credential_type": "api_key", "credential_value": "my-api-key"}'

# 删除凭证
curl -X DELETE http://localhost:4000/v1/mcp/server/xxx/user-credential \
  -H "Authorization: Bearer sk-your-key"

# OAuth 凭证
curl -X POST http://localhost:4000/v1/mcp/server/xxx/oauth-user-credential \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"access_token": "xxx", "refresh_token": "yyy"}'

# OAuth 状态
curl http://localhost:4000/v1/mcp/server/xxx/oauth-user-credential/status \
  -H "Authorization: Bearer sk-your-key"

# 列出所有凭证
curl http://localhost:4000/v1/mcp/user-credentials \
  -H "Authorization: Bearer sk-your-key"
```

### MCP 访问组与发现

```bash
# MCP 访问组
curl http://localhost:4000/v1/mcp/access_groups \
  -H "Authorization: Bearer sk-master-key"

# 发现公开 MCP Server
curl http://localhost:4000/v1/mcp/discover \
  -H "Authorization: Bearer sk-your-key"

# 设为公开
curl -X POST http://localhost:4000/v1/mcp/make_public \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"server_ids": ["xxx"]}'

# MCP 注册表
curl http://localhost:4000/v1/mcp/registry.json

# OpenAPI 注册表
curl http://localhost:4000/v1/mcp/openapi-registry

# 公共 MCP Hub
curl http://localhost:4000/public/mcp_hub
```

### MCP OAuth 端点

LiteLLM 可作为 MCP OAuth Provider，为 MCP Client 提供认证：

| 端点 | 说明 |
|------|------|
| `GET /authorize` | OAuth 授权 |
| `POST /token` | Token 端点 |
| `GET /callback` | OAuth 回调 |
| `POST /register` | 客户端注册 |
| `GET /.well-known/oauth-authorization-server` | OAuth 服务器元数据 |
| `GET /.well-known/oauth-protected-resource` | 受保护资源元数据 |
| `GET /.well-known/openid-configuration` | OpenID 配置 |
| `GET /.well-known/jwks.json` | JWKS 公钥 |

每个 MCP Server 也有独立的 OAuth 端点（前缀 `/{mcp_server_name}/`）。

---

## Agents & A2A

### Agent CRUD

```bash
# 创建 Agent
curl -X POST http://localhost:4000/v1/agents \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "agent_name": "customer-support",
    "description": "Customer support agent",
    "model": "gpt-4o",
    "tools": ["search", "knowledge-base"],
    "system_prompt": "You are a helpful customer support agent."
  }'

# 列出 Agents
curl http://localhost:4000/v1/agents \
  -H "Authorization: Bearer sk-your-key"

# 查询单个
curl http://localhost:4000/v1/agents/agent-xxx \
  -H "Authorization: Bearer sk-your-key"

# 完整更新
curl -X PUT http://localhost:4000/v1/agents/agent-xxx \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"agent_name": "support-v2", "model": "gpt-4o"}'

# 部分更新
curl -X PATCH http://localhost:4000/v1/agents/agent-xxx \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"description": "Updated description"}'

# 删除
curl -X DELETE http://localhost:4000/v1/agents/agent-xxx \
  -H "Authorization: Bearer sk-master-key"

# 设为公开
curl -X POST http://localhost:4000/v1/agents/agent-xxx/make_public \
  -H "Authorization: Bearer sk-master-key"
```

### A2A（Agent-to-Agent）协议

```bash
# 获取 Agent Card（A2A 协议标准）
curl http://localhost:4000/a2a/agent-xxx/.well-known/agent.json

# 调用 Agent（A2A 消息发送）
curl -X POST http://localhost:4000/a2a/agent-xxx \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tasks/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [{"type": "text", "text": "Help me with my order"}]
      }
    },
    "id": "1"
  }'

# 也可使用 v1 路径
curl -X POST http://localhost:4000/v1/a2a/agent-xxx/message/send \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"message": "Help me"}'
```

### 公共 Agent Hub

```bash
# 公共 Agent 列表
curl http://localhost:4000/public/agent_hub

# Agent 字段定义
curl http://localhost:4000/public/agents/fields
```

### 工具管理

```bash
# 列出工具
curl http://localhost:4000/v1/tool/list \
  -H "Authorization: Bearer sk-master-key"

# 工具详情
curl http://localhost:4000/v1/tool/tool-name/detail \
  -H "Authorization: Bearer sk-master-key"

# 工具使用日志
curl http://localhost:4000/v1/tool/tool-name/logs \
  -H "Authorization: Bearer sk-master-key"

# 更新工具策略
curl -X POST http://localhost:4000/v1/tool/policy \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"tool_name": "tool-name", "policy": "allow", "teams": ["team-xxx"]}'

# 工具策略选项
curl http://localhost:4000/v1/tool/policy/options \
  -H "Authorization: Bearer sk-master-key"

# 删除工具策略覆盖
curl -X DELETE http://localhost:4000/v1/tool/tool-name/overrides \
  -H "Authorization: Bearer sk-master-key"
```

---

## Assistants

OpenAI Assistants API 兼容端点。

```bash
# 创建 Assistant
curl -X POST http://localhost:4000/v1/assistants \
  -H "Authorization: Bearer sk-your-key" \
  -d '{
    "model": "gpt-4o",
    "name": "Math Tutor",
    "instructions": "You are a helpful math tutor."
  }'

# 列出 Assistants
curl http://localhost:4000/v1/assistants \
  -H "Authorization: Bearer sk-your-key"

# 删除
curl -X DELETE http://localhost:4000/v1/assistants/asst_xxx \
  -H "Authorization: Bearer sk-your-key"

# 创建 Thread
curl -X POST http://localhost:4000/v1/threads \
  -H "Authorization: Bearer sk-your-key"

# 获取 Thread
curl http://localhost:4000/v1/threads/thread_xxx \
  -H "Authorization: Bearer sk-your-key"

# 添加消息
curl -X POST http://localhost:4000/v1/threads/thread_xxx/messages \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"role": "user", "content": "Solve x^2 + 2x + 1 = 0"}'

# 获取消息
curl http://localhost:4000/v1/threads/thread_xxx/messages \
  -H "Authorization: Bearer sk-your-key"

# 运行 Thread
curl -X POST http://localhost:4000/v1/threads/thread_xxx/runs \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"assistant_id": "asst_xxx"}'
```

---

## Containers

文件容器管理（用于 Code Interpreter 等场景）。

```bash
# 创建容器
curl -X POST http://localhost:4000/v1/containers \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"name": "my-container"}'

# 列出容器
curl http://localhost:4000/v1/containers \
  -H "Authorization: Bearer sk-your-key"

# 获取容器
curl http://localhost:4000/v1/containers/container-xxx \
  -H "Authorization: Bearer sk-your-key"

# 删除容器
curl -X DELETE http://localhost:4000/v1/containers/container-xxx \
  -H "Authorization: Bearer sk-your-key"

# 上传文件到容器
curl -X POST http://localhost:4000/v1/containers/container-xxx/files \
  -H "Authorization: Bearer sk-your-key" \
  -F "file=@data.csv"

# 列出容器文件
curl http://localhost:4000/v1/containers/container-xxx/files \
  -H "Authorization: Bearer sk-your-key"

# 获取文件内容
curl http://localhost:4000/v1/containers/container-xxx/files/file-xxx/content \
  -H "Authorization: Bearer sk-your-key"

# 删除容器文件
curl -X DELETE http://localhost:4000/v1/containers/container-xxx/files/file-xxx \
  -H "Authorization: Bearer sk-your-key"
```

---

## Interactions

交互管理（Agent 会话跟踪）。

```bash
# 创建交互
curl -X POST http://localhost:4000/v1/interactions \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"agent_id": "agent-xxx", "metadata": {"session": "123"}}'

# 也可用 v1beta 路径
curl -X POST http://localhost:4000/v1beta/interactions \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"agent_id": "agent-xxx"}'

# 获取交互
curl http://localhost:4000/v1/interactions/interaction-xxx \
  -H "Authorization: Bearer sk-your-key"

# 取消交互
curl -X POST http://localhost:4000/v1/interactions/interaction-xxx/cancel \
  -H "Authorization: Bearer sk-your-key"

# 删除交互
curl -X DELETE http://localhost:4000/v1/interactions/interaction-xxx \
  -H "Authorization: Bearer sk-your-key"
```
