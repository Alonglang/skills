# LiteLLM 虚拟密钥与预算管理

虚拟密钥是 LiteLLM 的核心安全特性，用于控制谁可以访问什么模型、花多少钱、以什么速率调用。**需要 PostgreSQL 数据库。**

---

## 密钥体系架构

```
Master Key（管理员）
    │
    ├── 创建 Organization（组织）
    │       └── 分配预算、模型访问
    │
    ├── 创建 Team（团队）
    │       └── 分配预算、模型访问、成员
    │
    ├── 创建 User（用户）
    │       └── 分配预算、团队归属
    │
    └── 生成 Virtual Key（虚拟密钥）
            └── 绑定到 User/Team、预算/速率限制/模型访问
```

---

## 虚拟密钥管理

### 创建密钥

```bash
# 基本创建
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
    "metadata": {"user": "alice", "purpose": "dev"}
  }'
# 返回：{ "key": "sk-generated-key-xxx" }
```

### 密钥参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| `models` | list[str] | 允许访问的模型列表（空=全部） |
| `max_budget` | float | 密钥预算上限（美元） |
| `budget_duration` | str | 预算周期（"24h" / "7d" / "30d"） |
| `tpm_limit` | int | Token/分钟 限制 |
| `rpm_limit` | int | 请求/分钟 限制 |
| `max_parallel_requests` | int | 最大并发请求数 |
| `duration` | str | 密钥有效期（"24h" / "7d" / "30d"） |
| `team_id` | str | 绑定到团队 |
| `user_id` | str | 绑定到用户 |
| `tags` | list[str] | 标签（用于 tag-based 路由） |
| `metadata` | dict | 自定义元数据 |
| `aliases` | dict | 模型别名映射 |
| `allowed_cache_controls` | list | 允许的缓存控制 |
| `permissions` | dict | 自定义权限 |

### 查询密钥信息

```bash
curl http://localhost:4000/key/info?key=sk-xxx \
  -H "Authorization: Bearer sk-master-key"
```

### 更新密钥

```bash
curl -X POST http://localhost:4000/key/update \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "sk-xxx",
    "max_budget": 200,
    "models": ["gpt-4o", "claude-sonnet", "gemini-pro"]
  }'
```

### 删除密钥

```bash
curl -X POST http://localhost:4000/key/delete \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{"keys": ["sk-xxx"]}'
```

---

## 预算层级体系

预算从上到下层叠生效，最严格的限制优先：

```
代理级（general_settings.max_budget）
    └── 组织级（/organization/new → max_budget）
        └── 团队级（/team/new → max_budget）
            └── 用户级（/user/new → max_budget）
                └── 密钥级（/key/generate → max_budget）
```

### 预算超限时的行为

| 场景 | HTTP 状态码 | 错误信息 | 在途请求 |
|------|------------|---------|---------|
| 密钥预算超限 | **429** | `Budget exceeded for key` | 不受影响（已发出的请求正常完成） |
| 团队预算超限 | **429** | `Budget exceeded for team` | 不受影响 |
| 用户预算超限 | **429** | `Budget exceeded for user` | 不受影响 |
| 代理级预算超限 | **429** | `Proxy budget exceeded` | 不受影响 |

- 预算按 `budget_duration` 自动重置（如 "30d" = 每 30 天归零）
- 重置后密钥自动恢复可用，无需手动操作
- 手动重置：`POST /key/{key}/reset_spend`

### 密钥过期行为

- 设置了 `duration` 的密钥到期后返回 **401 Unauthorized**
- 过期密钥**不会自动删除**，需要管理员手动清理
- 查询过期密钥：`GET /key/info?key=sk-xxx` 查看 `expires` 字段

### 代理级预算

```yaml
general_settings:
  max_budget: 10000              # 全局上限 $10,000
  budget_duration: "30d"
```

### 团队级预算

```bash
# 创建团队
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
    ]
  }'
```

### 用户级预算

```bash
curl -X POST http://localhost:4000/user/new \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "user_id": "alice@company.com",
    "max_budget": 500,
    "budget_duration": "30d",
    "user_role": "internal_user",
    "team_id": "team-xxx"
  }'
```

### user_role 选项

| 角色 | 权限 | 说明 |
|------|------|------|
| `proxy_admin` | 最高权限 | 管理所有密钥/团队/模型/配置 |
| `proxy_admin_viewer` | 只读管理 | 查看所有信息但不能修改 |
| `internal_user` | 普通用户 | 使用分配的模型，管理自己的密钥 |
| `internal_user_viewer` | 只读用户 | 只能查看自己的信息 |

---

## 速率限制

### 限制维度

| 维度 | RPM | TPM | 并发 |
|------|-----|-----|------|
| 密钥级 | `rpm_limit` | `tpm_limit` | `max_parallel_requests` |
| 团队级 | `team_rpm_limit` | `team_tpm_limit` | `team_max_parallel_requests` |
| 用户级 | `user_rpm_limit` | `user_tpm_limit` | - |
| 模型部署级 | `rpm`（在 model_list 中） | `tpm`（在 model_list 中） | - |

### 速率限制窗口

默认为 **1 分钟滑动窗口**。达到限制时返回 HTTP 429 + `Retry-After` 头。

### 分布式速率限制

多 LiteLLM 实例时，速率限制计数必须通过 Redis 共享：

```yaml
router_settings:
  redis_host: os.environ/REDIS_HOST
  redis_port: os.environ/REDIS_PORT
```

---

## 模型访问控制

### 直接指定模型列表

```bash
# 密钥只能访问指定模型
curl -X POST http://localhost:4000/key/generate \
  -d '{"models": ["gpt-4o", "gpt-4o-mini"]}'
```

### 访问组（Access Groups）

将模型分组，密钥/团队按组授权：

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
    model_info:
      access_groups: ["premium", "all"]

  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
    model_info:
      access_groups: ["basic", "all"]
```

```bash
# 密钥只能访问 "basic" 组的模型
curl -X POST http://localhost:4000/key/generate \
  -d '{"models": ["basic"]}'
```

### 模型别名

```bash
# 团队内部使用别名，映射到实际模型
curl -X POST http://localhost:4000/team/new \
  -d '{
    "team_alias": "team-a",
    "model_aliases": {
      "cheap": "gpt-4o-mini",
      "smart": "gpt-4o"
    }
  }'
# 客户端请求 model: "cheap" → 实际路由到 gpt-4o-mini
```

---

## 密钥上限与默认值

管理员可设置密钥参数的上限和默认值：

```yaml
general_settings:
  key_generation_settings:
    # 密钥参数上限（用户不能创建超过此限制的密钥）
    max_budget_upperbound: 1000       # 预算上限最大值
    max_rpm_limit_upperbound: 500     # RPM 上限最大值
    max_tpm_limit_upperbound: 200000  # TPM 上限最大值

    # 密钥默认值（未指定时自动应用）
    default_max_budget: 100
    default_budget_duration: "30d"
    default_rpm_limit: 100
    default_tpm_limit: 50000
```

---

## 花费查询

### 按密钥查询花费

```bash
curl http://localhost:4000/key/info?key=sk-xxx
# 返回包含 spend 字段
```

### 按团队查询花费

```bash
curl http://localhost:4000/team/info?team_id=team-xxx
```

### 每日花费明细

```bash
curl "http://localhost:4000/user/daily/activity?start_date=2024-03-01&end_date=2024-03-31" \
  -H "Authorization: Bearer sk-master-key"
```

### 花费日志

```bash
curl "http://localhost:4000/spend/logs?start_date=2024-03-01&end_date=2024-03-31&api_key=sk-xxx" \
  -H "Authorization: Bearer sk-master-key"
```
