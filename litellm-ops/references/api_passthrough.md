# LiteLLM Pass-through、健康检查与系统管理 API 参考

Provider 直通端点、SCIM、SSO、配置管理、健康检查等系统级 API。

---

## 目录

- [Pass-through 直通 API（85 端点）](#pass-through-直通-api)
- [健康检查（17 端点）](#健康检查)
- [配置管理（10 端点）](#配置管理)
- [SSO 设置（6 端点）](#sso-设置)
- [JWT Key Mapping（5 端点）](#jwt-key-mapping)
- [UI 设置（6 端点）](#ui-设置)
- [凭证管理（6 端点）](#凭证管理)
- [日志/审计（5 端点）](#日志审计)
- [SCIM v2（18 端点，企业版）](#scim-v2)
- [合规（2 端点）](#合规)
- [路由/回退设置（5 端点）](#路由回退设置)
- [IP 白名单（2 端点）](#ip-白名单)
- [其他公共端点](#其他公共端点)

---

## Pass-through 直通 API

将请求直接转发到 Provider 原始 API，不经过 LiteLLM 的请求转换。适用于 LiteLLM 尚未支持的 Provider 特有功能。

### 通用格式

每个 Provider 提供 5 个标准直通端点：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/{provider}/v1/*` | 直通 GET 请求 |
| POST | `/{provider}/v1/*` | 直通 POST 请求 |
| PUT | `/{provider}/v1/*` | 直通 PUT 请求 |
| PATCH | `/{provider}/v1/*` | 直通 PATCH 请求 |
| DELETE | `/{provider}/v1/*` | 直通 DELETE 请求 |

### 支持的 Provider

| Provider | 路径前缀 | 示例 |
|----------|---------|------|
| OpenAI | `/openai/` | `/openai/v1/assistants` |
| Anthropic | `/anthropic/` | `/anthropic/v1/messages` |
| Azure | `/azure/` | `/azure/openai/deployments/xxx/chat/completions` |
| Azure AI | `/azure_ai/` | `/azure_ai/v1/...` |
| Bedrock | `/bedrock/` | `/bedrock/model/xxx/invoke` |
| Vertex AI | `/vertex-ai/` | `/vertex-ai/v1/projects/xxx/...` |
| Google AI Studio | `/gemini/` | `/gemini/v1beta/models/...` |
| Cohere | `/cohere/` | `/cohere/v1/chat` |
| Mistral | `/mistral/` | `/mistral/v1/chat/completions` |
| Langfuse | `/langfuse/` | `/langfuse/api/public/...` |
| AssemblyAI | `/assemblyai/` | `/assemblyai/v2/transcript` |
| Cursor | `/cursor/` | `/cursor/chat/completions` |
| vLLM | `/vllm/` | `/vllm/v1/...` |
| Milvus | `/milvus/` | `/milvus/v2/...` |

### 示例：Anthropic 直通

```bash
# 直接使用 Anthropic Messages API（非 OpenAI 格式）
curl -X POST http://localhost:4000/anthropic/v1/messages \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello Claude"}]
  }'
```

### 示例：Vertex AI 直通

```bash
# 使用 Vertex AI 原生 API
curl -X POST "http://localhost:4000/vertex-ai/v1/projects/my-project/locations/us-central1/publishers/google/models/gemini-pro:generateContent" \
  -H "Authorization: Bearer sk-your-key" \
  -d '{
    "contents": [{"role": "user", "parts": [{"text": "Hello"}]}]
  }'
```

### Anthropic 特殊端点

```bash
# Anthropic Token 计数
curl -X POST http://localhost:4000/anthropic/v1/messages/count_tokens \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"model": "claude-sonnet-4-20250514", "messages": [{"role": "user", "content": "Hello"}]}'

# Anthropic Skills API
curl http://localhost:4000/anthropic/v1/skills \
  -H "Authorization: Bearer sk-your-key"
```

### Google GenAI 端点

LiteLLM 提供 14 个 Google GenAI 特定端点（`/gemini/` 前缀），包括模型管理、内容生成、缓存等。

---

## 健康检查

### 核心健康端点

```bash
# 综合健康检查
curl http://localhost:4000/health
# 返回所有模型的健康状态

# 存活探针（K8s livenessProbe）
curl http://localhost:4000/health/liveliness
# 仅检查进程存活，不检查依赖

# 就绪探针（K8s readinessProbe）
curl http://localhost:4000/health/readiness
# 检查 DB 和 Redis 连接
```

### 模型级健康检查

```bash
# 检查特定模型
curl "http://localhost:4000/health?model=gpt-4o" \
  -H "Authorization: Bearer sk-master-key"

# 活跃模型列表
curl http://localhost:4000/active/model/list \
  -H "Authorization: Bearer sk-master-key"
```

### 服务信息

```bash
# 服务器信息（版本/配置）
curl http://localhost:4000/server_info \
  -H "Authorization: Bearer sk-master-key"

# 服务器设置
curl http://localhost:4000/v1/server_settings \
  -H "Authorization: Bearer sk-master-key"

# 首页
curl http://localhost:4000/
```

---

## 配置管理

动态修改运行中的 LiteLLM 配置。

```bash
# 获取当前配置
curl http://localhost:4000/config/list \
  -H "Authorization: Bearer sk-master-key"

# 更新配置
curl -X POST http://localhost:4000/config/update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "litellm_settings": {"drop_params": true},
    "router_settings": {"routing_strategy": "usage-based-routing-v2"}
  }'

# 删除配置项
curl -X POST http://localhost:4000/config/delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"key": "litellm_settings.cache"}'

# YAML 配置查看
curl http://localhost:4000/config/yaml \
  -H "Authorization: Bearer sk-master-key"
```

---

## SSO 设置

```bash
# 获取 SSO 配置
curl http://localhost:4000/sso/settings \
  -H "Authorization: Bearer sk-master-key"

# 更新 SSO
curl -X POST http://localhost:4000/sso/settings \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "provider": "okta",
    "client_id": "xxx",
    "client_secret": "yyy",
    "authorization_url": "https://okta.com/oauth2/authorize",
    "token_url": "https://okta.com/oauth2/token"
  }'

# SSO 回调
# GET /sso/callback — 由 SSO Provider 回调
```

---

## JWT Key Mapping

将 JWT Token 映射到 LiteLLM 权限。

```bash
# 获取 JWT 映射
curl http://localhost:4000/jwt/key_mapping \
  -H "Authorization: Bearer sk-master-key"

# 更新映射
curl -X POST http://localhost:4000/jwt/key_mapping \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "jwt_field": "roles",
    "mapping": {
      "admin": {"models": ["*"], "max_budget": null},
      "developer": {"models": ["gpt-4o-mini"], "max_budget": 100}
    }
  }'
```

---

## UI 设置

```bash
# 获取 UI 设置
curl http://localhost:4000/ui/settings \
  -H "Authorization: Bearer sk-master-key"

# 更新 UI 设置
curl -X POST http://localhost:4000/ui/settings \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"ui_access_mode": "all"}'

# UI 主题
curl http://localhost:4000/ui/theme \
  -H "Authorization: Bearer sk-master-key"

# 更新主题
curl -X POST http://localhost:4000/ui/theme \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"primary_color": "#1a73e8", "logo_url": "https://example.com/logo.png"}'
```

---

## 凭证管理

管理 Provider API 凭证。

```bash
# 列出凭证
curl http://localhost:4000/v1/credentials \
  -H "Authorization: Bearer sk-master-key"

# 创建凭证
curl -X POST http://localhost:4000/v1/credentials \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "credential_name": "openai-prod",
    "credential_type": "api_key",
    "credential_values": {"api_key": "sk-xxx"}
  }'

# 查询
curl http://localhost:4000/v1/credentials/openai-prod \
  -H "Authorization: Bearer sk-master-key"

# 更新
curl -X PUT http://localhost:4000/v1/credentials/openai-prod \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"credential_values": {"api_key": "sk-new-xxx"}}'

# 删除
curl -X DELETE http://localhost:4000/v1/credentials/openai-prod \
  -H "Authorization: Bearer sk-master-key"
```

---

## 日志/审计

```bash
# 审计日志（企业版）
curl "http://localhost:4000/audit/logs?start_date=2024-03-01&end_date=2024-03-31" \
  -H "Authorization: Bearer sk-master-key"

# 日志回调配置
curl http://localhost:4000/v1/logging/callbacks \
  -H "Authorization: Bearer sk-master-key"

# 更新日志回调
curl -X POST http://localhost:4000/v1/logging/callbacks \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"callbacks": ["langfuse", "otel"]}'
```

---

## SCIM v2

企业版 SCIM 端点，用于与身份提供商（Okta、Azure AD 等）集成，自动同步用户和组。

### 用户

```bash
# 列出用户
curl http://localhost:4000/scim/v2/Users \
  -H "Authorization: Bearer sk-master-key"

# 创建用户
curl -X POST http://localhost:4000/scim/v2/Users \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
    "userName": "alice@company.com",
    "name": {"givenName": "Alice", "familyName": "Smith"},
    "emails": [{"value": "alice@company.com", "primary": true}]
  }'

# 获取/更新/删除用户
# GET    /scim/v2/Users/{user_id}
# PUT    /scim/v2/Users/{user_id}
# PATCH  /scim/v2/Users/{user_id}
# DELETE /scim/v2/Users/{user_id}
```

### 组

```bash
# 列出组
curl http://localhost:4000/scim/v2/Groups \
  -H "Authorization: Bearer sk-master-key"

# 创建组
curl -X POST http://localhost:4000/scim/v2/Groups \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    "displayName": "Engineering",
    "members": [{"value": "user-id-xxx"}]
  }'

# 获取/更新/删除组
# GET    /scim/v2/Groups/{group_id}
# PUT    /scim/v2/Groups/{group_id}
# PATCH  /scim/v2/Groups/{group_id}
# DELETE /scim/v2/Groups/{group_id}
```

---

## 合规

```bash
# 获取合规设置
curl http://localhost:4000/compliance/settings \
  -H "Authorization: Bearer sk-master-key"

# 更新合规设置
curl -X POST http://localhost:4000/compliance/settings \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"data_retention_days": 90, "audit_logging": true}'
```

---

## 路由/回退设置

```bash
# 获取路由设置
curl http://localhost:4000/router/settings \
  -H "Authorization: Bearer sk-master-key"

# 更新路由设置
curl -X POST http://localhost:4000/router/settings \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"routing_strategy": "latency-based-routing"}'

# 获取回退配置
curl http://localhost:4000/v1/fallbacks \
  -H "Authorization: Bearer sk-master-key"

# 更新回退
curl -X POST http://localhost:4000/v1/fallbacks \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"fallbacks": [{"gpt-4o": ["claude-sonnet"]}]}'

# 删除回退
curl -X DELETE http://localhost:4000/v1/fallbacks \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"model": "gpt-4o"}'
```

---

## IP 白名单

```bash
# 添加 IP
curl -X POST http://localhost:4000/add/allowed_ip \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"ip": "10.0.0.1"}'

# 删除 IP
curl -X POST http://localhost:4000/delete/allowed_ip \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"ip": "10.0.0.1"}'
```

---

## 其他公共端点

不需要认证的端点：

```bash
# 首页
curl http://localhost:4000/

# 模型中心
curl http://localhost:4000/public/model_hub

# MCP Hub
curl http://localhost:4000/public/mcp_hub

# Agent Hub
curl http://localhost:4000/public/agent_hub

# 成本表
curl http://localhost:4000/public/litellm_model_cost_map

# Provider 列表
curl http://localhost:4000/public/providers

# Provider 字段
curl "http://localhost:4000/public/providers/fields?provider=openai"

# 邮件管理
# POST /email/send — 发送邮件通知
# GET /email/settings — 邮件设置
```
