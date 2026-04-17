# LiteLLM 管理 API 参考

管理端点用于密钥、团队、用户、组织、模型、预算等资源的 CRUD 操作。

> 管理端点需要 `master_key` 或有相应权限的虚拟密钥。

---

## 目录

- [密钥管理（14 端点）](#密钥管理)
- [团队管理（20 端点）](#团队管理)
- [用户管理（10 端点）](#用户管理)
- [组织管理（10 端点）](#组织管理)
- [客户/终端用户管理（8 端点）](#客户管理)
- [访问组管理（10 端点）](#访问组管理)
- [项目管理（5 端点）](#项目管理)
- [模型管理（20 端点）](#模型管理)
- [预算与花费追踪（36 端点）](#预算与花费追踪)
- [标签管理（12 端点）](#标签管理)
- [安全策略（Policies，19 端点）](#安全策略)
- [审计日志（2 端点）](#审计日志)
- [回退规则管理（3 端点）](#回退规则管理)

---

## 密钥管理

### 生成密钥

**端点：** `POST /key/generate`

```bash
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "models": ["gpt-4o", "claude-sonnet"],
    "max_budget": 100,
    "budget_duration": "30d",
    "tpm_limit": 50000,
    "rpm_limit": 100,
    "max_parallel_requests": 10,
    "duration": "90d",
    "team_id": "team-xxx",
    "tags": ["production"],
    "metadata": {"user": "alice", "purpose": "dev"}
  }'
# 返回：{"key": "sk-generated-xxx", "token": "xxx", "key_name": null}
```

### 生成服务账号密钥

**端点：** `POST /key/service-account/generate`

```bash
curl -X POST http://localhost:4000/key/service-account/generate \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"duration": "365d", "models": ["gpt-4o"]}'
```

### 查询密钥

**端点：** `GET /key/info`

```bash
# 按 key 查询
curl "http://localhost:4000/key/info?key=sk-xxx" \
  -H "Authorization: Bearer sk-master-key"

# 返回字段：token, key_name, spend, max_budget, models, team_id, user_id, rpm_limit, tpm_limit, expires...
```

### 列出密钥

**端点：** `GET /key/list`

```bash
curl "http://localhost:4000/key/list?team_id=team-xxx&page=1&size=20" \
  -H "Authorization: Bearer sk-master-key"
```

### 更新密钥

**端点：** `POST /key/update`

```bash
curl -X POST http://localhost:4000/key/update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"key": "sk-xxx", "max_budget": 200, "models": ["gpt-4o", "gpt-4o-mini"]}'
```

### 批量更新密钥

**端点：** `POST /key/bulk_update`

```bash
curl -X POST http://localhost:4000/key/bulk_update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "keys": ["sk-xxx1", "sk-xxx2"],
    "max_budget": 500,
    "rpm_limit": 200
  }'
```

### 删除密钥

**端点：** `POST /key/delete`

```bash
curl -X POST http://localhost:4000/key/delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"keys": ["sk-xxx1", "sk-xxx2"]}'
```

### 重新生成密钥

**端点：** `POST /key/regenerate` 或 `POST /key/{key}/regenerate`

```bash
curl -X POST http://localhost:4000/key/regenerate \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"key": "sk-old-key"}'
# 旧密钥失效，返回新密钥
```

### 重置密钥花费

**端点：** `POST /key/{key}/reset_spend`

```bash
curl -X POST http://localhost:4000/key/sk-xxx/reset_spend \
  -H "Authorization: Bearer sk-master-key"
```

### 阻止/解除阻止密钥

```bash
# 阻止
curl -X POST http://localhost:4000/key/block \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"key": "sk-xxx"}'

# 解除
curl -X POST http://localhost:4000/key/unblock \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"key": "sk-xxx"}'
```

### 密钥别名

**端点：** `GET /key/aliases`

```bash
curl http://localhost:4000/key/aliases \
  -H "Authorization: Bearer sk-master-key"
```

### 密钥健康检查

**端点：** `POST /key/health`

```bash
curl -X POST http://localhost:4000/key/health \
  -H "Authorization: Bearer sk-your-key"
# 检查密钥对应模型的可用性
```

---

## 团队管理

### 创建团队

**端点：** `POST /team/new`

```bash
curl -X POST http://localhost:4000/team/new \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "team_alias": "engineering",
    "max_budget": 5000,
    "budget_duration": "30d",
    "models": ["gpt-4o", "claude-sonnet"],
    "members_with_roles": [
      {"role": "admin", "user_id": "alice@company.com"},
      {"role": "user", "user_id": "bob@company.com"}
    ],
    "metadata": {"department": "engineering"},
    "tpm_limit": 500000,
    "rpm_limit": 1000
  }'
```

### 更新团队

**端点：** `POST /team/update`

```bash
curl -X POST http://localhost:4000/team/update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"team_id": "team-xxx", "max_budget": 10000}'
```

### 删除团队

**端点：** `POST /team/delete`

```bash
curl -X POST http://localhost:4000/team/delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"team_ids": ["team-xxx"]}'
```

### 查询/列出团队

```bash
# 查询单个
curl "http://localhost:4000/team/info?team_id=team-xxx" \
  -H "Authorization: Bearer sk-master-key"

# 列出所有（v2 分页）
curl "http://localhost:4000/v2/team/list?page=1&page_size=20" \
  -H "Authorization: Bearer sk-master-key"
```

### 成员管理

```bash
# 添加成员
curl -X POST http://localhost:4000/team/member_add \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"team_id": "team-xxx", "member": {"role": "user", "user_id": "charlie@company.com"}}'

# 批量添加
curl -X POST http://localhost:4000/team/bulk_member_add \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "team_id": "team-xxx",
    "members": [
      {"role": "user", "user_id": "dave@company.com"},
      {"role": "user", "user_id": "eve@company.com"}
    ]
  }'

# 更新成员角色
curl -X POST http://localhost:4000/team/member_update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"team_id": "team-xxx", "user_id": "charlie@company.com", "role": "admin"}'

# 移除成员
curl -X POST http://localhost:4000/team/member_delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"team_id": "team-xxx", "user_id": "charlie@company.com"}'
```

### 团队模型管理

```bash
# 添加模型
curl -X POST http://localhost:4000/team/model/add \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"team_id": "team-xxx", "models": ["gemini-pro"]}'

# 移除模型
curl -X POST http://localhost:4000/team/model/delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"team_id": "team-xxx", "models": ["gemini-pro"]}'
```

### 团队权限

```bash
# 查看权限
curl "http://localhost:4000/team/permissions_list?team_id=team-xxx" \
  -H "Authorization: Bearer sk-master-key"

# 更新权限
curl -X POST http://localhost:4000/team/permissions_update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"team_id": "team-xxx", "permissions": {...}}'
```

### 团队回调/日志

```bash
# 添加团队级回调
curl -X POST http://localhost:4000/team/team-xxx/callback \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"callback_name": "langfuse", "callback_vars": {"LANGFUSE_PUBLIC_KEY": "pk-xxx"}}'

# 查看团队回调
curl http://localhost:4000/team/team-xxx/callback \
  -H "Authorization: Bearer sk-master-key"

# 禁用团队日志
curl -X POST http://localhost:4000/team/team-xxx/disable_logging \
  -H "Authorization: Bearer sk-master-key"
```

### 团队活动

**端点：** `GET /team/daily/activity`

```bash
curl "http://localhost:4000/team/daily/activity?team_id=team-xxx&start_date=2024-03-01&end_date=2024-03-31" \
  -H "Authorization: Bearer sk-master-key"
```

### 阻止/解除团队

```bash
curl -X POST http://localhost:4000/team/block \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"team_id": "team-xxx"}'

curl -X POST http://localhost:4000/team/unblock \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"team_id": "team-xxx"}'
```

---

## 用户管理

### 创建用户

**端点：** `POST /user/new`

```bash
curl -X POST http://localhost:4000/user/new \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "user_id": "alice@company.com",
    "user_role": "internal_user",
    "team_id": "team-xxx",
    "max_budget": 500,
    "budget_duration": "30d",
    "models": ["gpt-4o"]
  }'
```

### 查询/列出用户

```bash
# 查询单个
curl "http://localhost:4000/user/info?user_id=alice@company.com" \
  -H "Authorization: Bearer sk-master-key"

# v2 接口
curl "http://localhost:4000/v2/user/info?user_id=alice@company.com" \
  -H "Authorization: Bearer sk-master-key"

# 列出所有
curl "http://localhost:4000/user/list?page=1&page_size=20" \
  -H "Authorization: Bearer sk-master-key"
```

### 更新/删除用户

```bash
# 更新
curl -X POST http://localhost:4000/user/update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"user_id": "alice@company.com", "max_budget": 1000}'

# 批量更新
curl -X POST http://localhost:4000/user/bulk_update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"user_ids": ["alice@company.com", "bob@company.com"], "max_budget": 800}'

# 删除
curl -X POST http://localhost:4000/user/delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"user_ids": ["alice@company.com"]}'
```

### 用户活动

```bash
# 每日活动
curl "http://localhost:4000/user/daily/activity?user_id=alice@company.com&start_date=2024-03-01&end_date=2024-03-31" \
  -H "Authorization: Bearer sk-master-key"

# 聚合活动
curl "http://localhost:4000/user/daily/activity/aggregated?start_date=2024-03-01&end_date=2024-03-31" \
  -H "Authorization: Bearer sk-master-key"
```

---

## 组织管理

### CRUD 操作

```bash
# 创建
curl -X POST http://localhost:4000/organization/new \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"organization_alias": "Acme Corp", "max_budget": 50000, "budget_duration": "30d", "models": ["gpt-4o"]}'

# 查询
curl "http://localhost:4000/organization/info?organization_id=org-xxx" \
  -H "Authorization: Bearer sk-master-key"

# 列出
curl http://localhost:4000/organization/list \
  -H "Authorization: Bearer sk-master-key"

# 更新
curl -X PATCH http://localhost:4000/organization/update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"organization_id": "org-xxx", "max_budget": 100000}'

# 删除
curl -X DELETE http://localhost:4000/organization/delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"organization_ids": ["org-xxx"]}'
```

### 组织成员

```bash
# 添加
curl -X POST http://localhost:4000/organization/member_add \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"organization_id": "org-xxx", "member": {"role": "admin", "user_id": "alice@company.com"}}'

# 更新
curl -X PATCH http://localhost:4000/organization/member_update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"organization_id": "org-xxx", "user_id": "alice@company.com", "role": "user"}'

# 移除
curl -X DELETE http://localhost:4000/organization/member_delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"organization_id": "org-xxx", "user_id": "alice@company.com"}'
```

### 组织活动

```bash
curl "http://localhost:4000/organization/daily/activity?organization_id=org-xxx&start_date=2024-03-01" \
  -H "Authorization: Bearer sk-master-key"
```

---

## 客户管理

终端用户（End User / Customer）管理，用于 B2B 场景。

```bash
# 创建
curl -X POST http://localhost:4000/customer/new \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"user_id": "customer-123", "alias": "Customer A", "max_budget": 100, "budget_duration": "30d"}'

# 查询
curl "http://localhost:4000/customer/info?end_user_id=customer-123" \
  -H "Authorization: Bearer sk-master-key"

# 列出
curl http://localhost:4000/customer/list \
  -H "Authorization: Bearer sk-master-key"

# 更新
curl -X POST http://localhost:4000/customer/update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"user_id": "customer-123", "max_budget": 200}'

# 删除
curl -X POST http://localhost:4000/customer/delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"user_ids": ["customer-123"]}'

# 阻止/解除
curl -X POST http://localhost:4000/customer/block \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"user_ids": ["customer-123"]}'

# 每日活动
curl "http://localhost:4000/customer/daily/activity?customer_id=customer-123" \
  -H "Authorization: Bearer sk-master-key"
```

---

## 访问组管理

将模型分组，实现批量授权。

```bash
# 创建访问组
curl -X POST http://localhost:4000/v1/access_group \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"access_group_id": "premium-models", "models": ["gpt-4o", "claude-sonnet"]}'

# 查询
curl http://localhost:4000/v1/access_group/premium-models \
  -H "Authorization: Bearer sk-master-key"

# 列出
curl http://localhost:4000/v1/access_group \
  -H "Authorization: Bearer sk-master-key"

# 更新
curl -X PUT http://localhost:4000/v1/access_group/premium-models \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"models": ["gpt-4o", "claude-sonnet", "gemini-pro"]}'

# 删除
curl -X DELETE http://localhost:4000/v1/access_group/premium-models \
  -H "Authorization: Bearer sk-master-key"
```

---

## 项目管理

```bash
# 创建
curl -X POST http://localhost:4000/project/new \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"project_name": "chatbot-v2", "team_id": "team-xxx"}'

# 查询
curl "http://localhost:4000/project/info?project_id=proj-xxx" \
  -H "Authorization: Bearer sk-master-key"

# 列出
curl http://localhost:4000/project/list \
  -H "Authorization: Bearer sk-master-key"

# 更新
curl -X POST http://localhost:4000/project/update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"project_id": "proj-xxx", "project_name": "chatbot-v3"}'

# 删除
curl -X DELETE http://localhost:4000/project/delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"project_id": "proj-xxx"}'
```

---

## 模型管理

### 查看模型

```bash
# OpenAI 兼容格式列表
curl http://localhost:4000/v1/models \
  -H "Authorization: Bearer sk-your-key"

# 详细模型信息（含定价、模式等）
curl http://localhost:4000/v1/model/info \
  -H "Authorization: Bearer sk-your-key"

# 单个模型
curl http://localhost:4000/v1/models/gpt-4o \
  -H "Authorization: Bearer sk-your-key"

# 模型组信息
curl http://localhost:4000/model_group/info \
  -H "Authorization: Bearer sk-master-key"
```

### 动态添加/更新/删除模型

需要 `STORE_MODEL_IN_DB=True`。

```bash
# 添加模型
curl -X POST http://localhost:4000/model/new \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "model_name": "gemini-pro",
    "litellm_params": {
      "model": "vertex_ai/gemini-pro",
      "vertex_project": "my-project",
      "vertex_location": "us-central1"
    }
  }'

# 更新模型
curl -X POST http://localhost:4000/model/update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"model_id": "xxx", "litellm_params": {"rpm": 1000}}'

# Patch 更新（部分更新）
curl -X PATCH http://localhost:4000/model/xxx/update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"litellm_params": {"tpm": 200000}}'

# 删除模型
curl -X POST http://localhost:4000/model/delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"id": "xxx"}'
```

### 公共模型信息

```bash
# 模型中心（公开）
curl http://localhost:4000/public/model_hub

# 成本表
curl http://localhost:4000/public/litellm_model_cost_map

# 支持的 Provider 列表
curl http://localhost:4000/public/providers

# Provider 必填字段
curl "http://localhost:4000/public/providers/fields?provider=azure"
```

---

## 预算与花费追踪

### 预算 CRUD

```bash
# 创建预算
curl -X POST http://localhost:4000/budget/new \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"budget_id": "budget-eng", "max_budget": 5000, "budget_duration": "30d"}'

# 查询
curl -X POST http://localhost:4000/budget/info \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"budgets": ["budget-eng"]}'

# 列出
curl http://localhost:4000/budget/list \
  -H "Authorization: Bearer sk-master-key"

# 更新
curl -X POST http://localhost:4000/budget/update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"budget_id": "budget-eng", "max_budget": 10000}'

# 预算设置
curl http://localhost:4000/budget/settings \
  -H "Authorization: Bearer sk-master-key"

# 删除
curl -X POST http://localhost:4000/budget/delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"id": "budget-eng"}'
```

### 花费查询

```bash
# 花费日志
curl "http://localhost:4000/spend/logs?start_date=2024-03-01&end_date=2024-03-31&api_key=sk-xxx" \
  -H "Authorization: Bearer sk-master-key"

# 花费日志 v2（分页）
curl "http://localhost:4000/spend/logs/v2?page=1&page_size=50" \
  -H "Authorization: Bearer sk-master-key"

# 按标签查看花费
curl "http://localhost:4000/spend/tags?start_date=2024-03-01&end_date=2024-03-31" \
  -H "Authorization: Bearer sk-master-key"

# 全局花费报告
curl "http://localhost:4000/global/spend/report?start_date=2024-03-01&end_date=2024-03-31&group_by=model" \
  -H "Authorization: Bearer sk-master-key"

# 全局标签花费
curl "http://localhost:4000/global/spend/tags?start_date=2024-03-01&end_date=2024-03-31" \
  -H "Authorization: Bearer sk-master-key"

# 花费计算（预估）
curl -X POST http://localhost:4000/spend/calculate \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "hello"}]}'

# 重置全局花费（危险！）
curl -X POST http://localhost:4000/global/spend/reset \
  -H "Authorization: Bearer sk-master-key"
```

### 成本折扣/加价

```bash
# 查看成本折扣配置
curl http://localhost:4000/config/cost_discount_config \
  -H "Authorization: Bearer sk-master-key"

# 更新折扣
curl -X PATCH http://localhost:4000/config/cost_discount_config \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"model_cost_discount": {"gpt-4o": 0.9}}'

# 成本加价配置
curl http://localhost:4000/config/cost_margin_config \
  -H "Authorization: Bearer sk-master-key"

# 预估成本
curl -X POST http://localhost:4000/cost/estimate \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"model": "gpt-4o", "input_tokens": 1000, "output_tokens": 500}'
```

### 标签管理

```bash
# 创建标签
curl -X POST http://localhost:4000/tag/new \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"tag_name": "chatbot-v2", "description": "Chatbot version 2"}'

# 列出标签
curl http://localhost:4000/tag/list \
  -H "Authorization: Bearer sk-master-key"

# 标签活动
curl "http://localhost:4000/tag/daily/activity?tag=chatbot-v2&start_date=2024-03-01" \
  -H "Authorization: Bearer sk-master-key"

# 标签摘要
curl http://localhost:4000/tag/summary \
  -H "Authorization: Bearer sk-master-key"

# DAU/WAU/MAU
curl http://localhost:4000/tag/dau \
  -H "Authorization: Bearer sk-master-key"
```

### Agent 活动

```bash
curl "http://localhost:4000/agent/daily/activity?start_date=2024-03-01" \
  -H "Authorization: Bearer sk-master-key"
```

### AI 花费分析

```bash
curl -X POST http://localhost:4000/usage/ai/chat \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"question": "What was the most expensive model last month?"}'
```

---

## 标签管理（Tag Management）

标签可用于分类请求、追踪花费、实现 tag-based 路由，以及统计每个标签的 DAU/WAU/MAU。

```bash
# 创建标签
curl -X POST http://localhost:4000/tag/new \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"name": "production", "description": "生产环境请求"}'

# 列出所有标签（含预算信息）
curl http://localhost:4000/tag/list \
  -H "Authorization: Bearer sk-master-key"

# 查询标签信息
curl -X POST http://localhost:4000/tag/info \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"names": ["production", "dev"]}'

# 更新标签
curl -X POST http://localhost:4000/tag/update \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"name": "production", "description": "updated description"}'

# 删除标签
curl -X POST http://localhost:4000/tag/delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"name": "old-tag"}'
```

### 标签用量统计

```bash
# 标签汇总（请求数、Token、花费）
curl http://localhost:4000/tag/summary \
  -H "Authorization: Bearer sk-master-key"

# 每日活跃用户（按标签）
curl "http://localhost:4000/tag/dau?tag=production" \
  -H "Authorization: Bearer sk-master-key"

# 每周活跃用户
curl "http://localhost:4000/tag/wau?tag=production" \
  -H "Authorization: Bearer sk-master-key"

# 每月活跃用户
curl "http://localhost:4000/tag/mau?tag=production" \
  -H "Authorization: Bearer sk-master-key"

# 每日活动明细（按标签过滤）
curl "http://localhost:4000/tag/daily/activity?tags=production,dev&start_date=2024-03-01" \
  -H "Authorization: Bearer sk-master-key"

# 获取所有不同用户代理标签
curl http://localhost:4000/tag/distinct \
  -H "Authorization: Bearer sk-master-key"

# 每用户分析（按标签）
curl "http://localhost:4000/tag/user-agent/per-user-analytics?tag=production" \
  -H "Authorization: Bearer sk-master-key"
```

---

## 安全策略（Policies）

策略（Policies）是 v1.83+ 引入的企业级安全特性，可将护栏规则组合成可复用的策略并附加到密钥/团队上。

### 策略 CRUD

```bash
# 创建策略
curl -X POST http://localhost:4000/policies \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "policy_name": "pii-policy",
    "description": "PII 保护策略",
    "guardrail_ids": ["guardrail-xxx"]
  }'

# 列出所有策略
curl http://localhost:4000/policies/list \
  -H "Authorization: Bearer sk-master-key"

# 获取策略详情
curl http://localhost:4000/policies/{policy_id} \
  -H "Authorization: Bearer sk-master-key"

# 更新策略
curl -X PUT http://localhost:4000/policies/{policy_id} \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"description": "updated"}'

# 删除策略
curl -X DELETE http://localhost:4000/policies/{policy_id} \
  -H "Authorization: Bearer sk-master-key"

# 更新策略版本状态（draft → published）
curl -X PUT http://localhost:4000/policies/{policy_id}/status \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"status": "published"}'
```

### 策略附件（将策略附加到密钥/团队）

```bash
# 创建附件（将策略附加到密钥）
curl -X POST http://localhost:4000/policies/attachments \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"policy_id": "policy-xxx", "key_id": "sk-xxx"}'

# 评估影响（附加前预估影响范围）
curl -X POST http://localhost:4000/policies/attachments/estimate-impact \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"policy_id": "policy-xxx"}'

# 列出所有附件
curl http://localhost:4000/policies/attachments/list \
  -H "Authorization: Bearer sk-master-key"

# 删除附件
curl -X DELETE http://localhost:4000/policies/attachments/{attachment_id} \
  -H "Authorization: Bearer sk-master-key"
```

### 策略测试与解析

```bash
# 测试策略管道（用样本消息验证）
curl -X POST http://localhost:4000/policies/test-pipeline \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "policy_id": "policy-xxx",
    "messages": [{"role": "user", "content": "My SSN is 123-45-6789"}]
  }'

# 解析上下文对应的策略（查看某密钥/团队实际生效的策略）
curl -X POST http://localhost:4000/policies/resolve \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"key_id": "sk-xxx"}'

# 策略用量概览
curl http://localhost:4000/policies/usage/overview \
  -H "Authorization: Bearer sk-master-key"
```

### 策略版本管理

```bash
# 列出策略所有版本
curl "http://localhost:4000/policies/name/pii-policy/versions" \
  -H "Authorization: Bearer sk-master-key"

# 创建新版本（从现有版本 fork）
curl -X POST "http://localhost:4000/policies/name/pii-policy/versions" \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"source_version": 1}'

# 比较两个版本
curl "http://localhost:4000/policies/compare?version_a=1&version_b=2" \
  -H "Authorization: Bearer sk-master-key"
```

---

## 审计日志（Audit Logging）

记录所有管理操作的变更历史（谁、何时、对什么资源做了什么操作）。

```bash
# 获取所有审计日志（含分页和过滤）
curl "http://localhost:4000/audit?start_date=2024-03-01&end_date=2024-03-31&action_type=key.generate" \
  -H "Authorization: Bearer sk-master-key"

# 获取单条审计日志详情
curl http://localhost:4000/audit/{audit_log_id} \
  -H "Authorization: Bearer sk-master-key"
```

---

## 回退规则管理（Fallback Management）

通过 API 动态管理模型回退配置（无需重启 Proxy）。

```bash
# 创建/更新回退规则
curl -X POST http://localhost:4000/fallback \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "gpt-4o",
    "fallbacks": ["claude-sonnet", "gemini-pro"]
  }'

# 查看某模型的回退配置
curl http://localhost:4000/fallback/gpt-4o \
  -H "Authorization: Bearer sk-master-key"

# 删除回退规则
curl -X DELETE http://localhost:4000/fallback/gpt-4o \
  -H "Authorization: Bearer sk-master-key"
```

> 通过 API 设置的回退规则会与 config.yaml 中的 `router_settings.fallbacks` 合并生效。
