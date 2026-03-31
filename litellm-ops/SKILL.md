---
name: litellm-ops
description: LiteLLM AI Gateway（Proxy）的服务运维技能。覆盖部署（Docker/K8s/Helm）、config.yaml配置、虚拟密钥管理、路由策略、成本追踪、护栏、故障排查，以及全部733个API端点的使用方式。当用户需要部署LiteLLM、编写或修改LiteLLM配置文件、管理LiteLLM虚拟密钥和预算、排查LiteLLM故障、配置LiteLLM路由策略或回退、接入新的LLM Provider到LiteLLM、配置LiteLLM护栏（PII/内容安全）、设置LiteLLM可观测性（Langfuse/OTEL/DataDog）、调用LiteLLM API端点（推理/管理/MCP/Agents/Batch/文件/缓存/Pass-through等）时，必须触发此技能。只要用户提及litellm、AI Gateway、LLM代理网关、LLM Proxy、统一LLM接口、litellm API，就使用此技能。
---

# LiteLLM 服务运维技能

LiteLLM 是一个统一的 AI Gateway / LLM Proxy，用 **OpenAI 兼容格式** 统一 100+ LLM 提供商（OpenAI、Azure、Anthropic、Bedrock、Vertex AI 等）。本技能覆盖 LiteLLM Proxy Server 的全生命周期运维。

---

## 架构速览

```
客户端（OpenAI SDK 格式）
    │
    ▼
┌─────────────────────────────────────────────┐
│  LiteLLM Proxy Server (AI Gateway)          │
│  ┌────────────────────────────────────────┐  │
│  │ 认证 → 护栏(pre) → 路由 → SDK调用     │  │
│  │                          ↓             │  │
│  │ 响应 ← 护栏(post) ← 日志 ← Provider   │  │
│  └────────────────────────────────────────┘  │
│  依赖：PostgreSQL（密钥/花费）+ Redis（缓存/路由）│
└─────────────────────────────────────────────┘
    │
    ▼
100+ LLM Providers（OpenAI / Azure / Anthropic / Bedrock / ...）
```

**请求链路详解：** Client → `proxy_server.py`（接收请求） → 认证（virtual key / JWT） → `pre_call` hooks（护栏、PII检测） → `router.py`（路由策略选择部署） → `main.py`（litellm.completion()） → `llm_http_handler.py`（transform_request） → Provider API → transform_response → `post_call` hooks（输出护栏） → 异步日志（Langfuse/OTEL/DB花费写入） → 返回客户端

**性能基准：** P95 延迟 ~8ms @ 1000 RPS（不含 Provider 延迟）

---

## 运维任务导航

根据你要做的事情，阅读对应的参考文档：

| 运维场景 | 参考文档 | 核心内容 |
|---------|---------|---------|
| 🚀 部署/升级 LiteLLM | [deploy.md](references/deploy.md) | Docker / K8s / Helm / 高流量配置 |
| ⚙️ 编写/修改配置 | [config.md](references/config.md) | config.yaml 四大节完整规范 |
| 🔑 密钥/预算/限流 | [keys_budgets.md](references/keys_budgets.md) | 虚拟密钥 / 预算层级 / RPM-TPM 限制 |
| 🔀 路由/回退/重试 | [routing.md](references/routing.md) | 7种路由策略 / 3种回退类型 / 冷却时间 |
| 📊 监控/日志/成本 | [observability.md](references/observability.md) | Langfuse / OTEL / DataDog / 成本追踪 |
| 🛡️ 护栏/安全策略 | [guardrails.md](references/guardrails.md) | 35+ 护栏 / PII / 内容过滤 |
| 🔧 故障排查 | [troubleshoot.md](references/troubleshoot.md) | DB不同步 / Redis / SSL / 死锁 |

### API 端点参考（733 个端点，按功能分 5 卷）

| API 分类 | 参考文档 | 覆盖端点 |
|---------|---------|---------|
| 🤖 推理 API | [api_inference.md](references/api_inference.md) | chat/completions, embeddings, images, audio, rerank, responses, video, realtime, OCR |
| 🏢 管理 API | [api_management.md](references/api_management.md) | 密钥(14) / 团队(20) / 用户(10) / 组织(10) / 客户(8) / 预算(36) / 模型(20) |
| 🔌 MCP & Agents | [api_mcp_agents.md](references/api_mcp_agents.md) | MCP Server(45) / Agents+A2A(21) / Assistants(8) / Containers(9) / Interactions(8) |
| 📦 高级 API | [api_advanced.md](references/api_advanced.md) | 文件 / Batch / 微调 / 向量存储 / 缓存 / 护栏API / Evals / Prompt / RAG |
| 🔗 系统 & 直通 | [api_passthrough.md](references/api_passthrough.md) | Pass-through(85) / 健康检查(17) / SCIM(18) / SSO / 配置 / 凭证 |

---

## 快速速查

### 最小部署（5分钟启动）

```bash
# 1. 创建配置文件
cat > config.yaml << 'EOF'
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  master_key: sk-1234  # 生产环境务必使用强密钥
EOF

# 2. 启动（无数据库，无密钥管理）
docker run -d --name litellm \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -p 4000:4000 \
  ghcr.io/berriai/litellm:main-stable \
  --config /app/config.yaml

# 3. 测试
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "hello"}]}'
```

### 生产部署（带数据库 + Redis）

```bash
# 必须依赖
# PostgreSQL: 密钥管理 + 花费追踪 + 团队/用户体系
# Redis: 路由状态共享 + 缓存 + 分布式限流

docker run -d --name litellm \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -e DATABASE_URL="postgresql://user:pass@db:5432/litellm" \
  -e REDIS_HOST="redis" -e REDIS_PORT="6379" \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -p 4000:4000 \
  ghcr.io/berriai/litellm:main-v1.65.0-stable \
  --config /app/config.yaml
```

### 常用管理端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/health` | GET | 健康检查（含模型连通性） |
| `/health/liveliness` | GET | 存活探针（K8s） |
| `/health/readiness` | GET | 就绪探针（K8s） |
| `/key/generate` | POST | 创建虚拟密钥 |
| `/key/info` | GET | 查询密钥信息 |
| `/user/new` | POST | 创建用户 |
| `/team/new` | POST | 创建团队 |
| `/spend/logs` | GET | 花费日志查询 |
| `/model/info` | GET | 已配置模型列表 |
| `/utils/transform_request` | POST | 调试：查看转换后的请求 |

### 关键环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 | 密钥管理时必需 |
| `REDIS_HOST` / `REDIS_PORT` | Redis 地址 | 多实例/缓存时必需 |
| `LITELLM_MASTER_KEY` | 主密钥（管理员） | 生产必需 |
| `LITELLM_SALT_KEY` | 密钥加密盐值 | 生产强烈推荐 |
| `STORE_MODEL_IN_DB` | 允许通过API更新模型 | 可选 |
| `LITELLM_LOG` | 日志级别（DEBUG） | 调试用 |
| `UI_USERNAME` / `UI_PASSWORD` | Web UI 登录 | 可选 |
| `OPENAI_API_KEY` / `AZURE_API_KEY` 等 | Provider 密钥 | 按需 |

### config.yaml 基本模板

```yaml
model_list:
  - model_name: gpt-4o              # 客户端使用的模型名
    litellm_params:
      model: openai/gpt-4o          # provider/actual-model
      api_key: os.environ/OPENAI_API_KEY
      rpm: 500                       # 该部署的 RPM 限制
      tpm: 100000                    # 该部署的 TPM 限制

  - model_name: gpt-4o              # 同名 = 负载均衡
    litellm_params:
      model: azure/gpt-4o-deployment
      api_key: os.environ/AZURE_API_KEY
      api_base: https://xxx.openai.azure.com/
      rpm: 1000

  - model_name: claude-sonnet        # 可用于回退
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY

litellm_settings:
  drop_params: true                  # 自动丢弃不支持的参数
  set_verbose: false                 # 生产环境关闭
  cache: true                        # 启用缓存
  cache_params:
    type: redis
    host: os.environ/REDIS_HOST
    port: os.environ/REDIS_PORT

router_settings:
  routing_strategy: usage-based-routing-v2  # 按用量路由
  redis_host: os.environ/REDIS_HOST
  redis_port: os.environ/REDIS_PORT
  enable_pre_call_checks: true       # 预检查RPM/TPM余量
  retry_after: 15                    # 重试间隔秒
  allowed_fails: 3                   # 允许失败次数
  cooldown_time: 60                  # 冷却时间秒

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
  alerting:
    - slack
  alert_types:
    - llm_exceptions
    - spend_reports
```

### 通配符路由（快速接入整个 Provider）

```yaml
model_list:
  # 将 anthropic/* 直接暴露给客户端
  - model_name: "anthropic/*"
    litellm_params:
      model: "anthropic/*"
      api_key: os.environ/ANTHROPIC_API_KEY

  # 万能路由（所有已知模型直通）
  - model_name: "*"
    litellm_params:
      model: "*"
```

---

## 操作指引

### 添加新 Provider

1. 在 `model_list` 中添加条目，`model` 字段使用 `provider/model-name` 格式
2. 通过环境变量设置 API Key（推荐）或直接写入 `api_key`
3. 特殊 Provider 需要额外字段：
   - **Azure：** 需要 `api_base`（endpoint URL）
   - **Bedrock：** 需要 `aws_access_key_id`、`aws_secret_access_key`、`aws_region_name`
   - **Vertex AI：** 需要 `vertex_project`、`vertex_location`、`vertex_credentials`（JSON路径）
   - **HuggingFace：** 需要 `api_base`（推理端点 URL）
4. 用 `--detailed_debug` 重启查看请求转换细节
5. 用 `/utils/transform_request` 端点调试最终发送到 Provider 的请求格式

### 配置回退链

```yaml
router_settings:
  fallbacks:
    - gpt-4o: [claude-sonnet, gemini-pro]        # gpt-4o 失败 → 尝试 claude → gemini
  context_window_fallbacks:
    - gpt-4o: [gpt-4o-128k]                      # 上下文超限专用回退
  content_policy_fallbacks:
    - claude-sonnet: [gpt-4o]                     # 内容策略拒绝专用回退
```

### 快速启用成本追踪

```yaml
litellm_settings:
  success_callback: ["langfuse"]     # 或 "otel", "datadog" 等

# 环境变量
# LANGFUSE_PUBLIC_KEY=pk-xxx
# LANGFUSE_SECRET_KEY=sk-xxx
# LANGFUSE_HOST=https://cloud.langfuse.com  （或自建地址）
```

### 快速启用 PII 护栏

```yaml
litellm_settings:
  guardrails:
    - guardrail_name: "pii-protection"
      litellm_params:
        guardrail: presidio
        mode: pre_call                # 请求发到 Provider 前检测
      presidio_config:
        output_parse_pii: true
        pii_entities_config:
          CREDIT_CARD:
            action: MASK              # 信用卡号 → 掩码
          EMAIL_ADDRESS:
            action: BLOCK             # 邮件地址 → 拦截请求
```

---

## 生产部署检查清单

### 基础配置
- [ ] 固定镜像版本（不用 `latest`，用 `main-v1.65.0-stable`）
- [ ] 配置 PostgreSQL（密钥管理 + 花费追踪需要）
- [ ] 配置 Redis（多实例 / 缓存 / 分布式限流需要）
- [ ] 设置强 `master_key` 和 `LITELLM_SALT_KEY`
- [ ] 生产环境：`set_verbose: false`，`drop_params: true`

### 模型与路由
- [ ] 每个模型部署设置 `rpm` / `tpm` 限制
- [ ] 配置回退链（至少一个 fallback provider）
- [ ] 设置合理的 `cooldown_time` 和 `allowed_fails`

### 可观测性
- [ ] 启用成本追踪回调（langfuse / otel / datadog）
- [ ] 配置 Slack 告警（`llm_exceptions` + `spend_reports` + `budget_alerts`）
- [ ] 配置 Prometheus 抓取（`/metrics` 端点）

### 安全
- [ ] API Key 全部通过环境变量注入（不硬编码）
- [ ] 配置预算上限（代理级 / 团队级 / 密钥级）
- [ ] 考虑启用 PII 护栏（`pre_call` 模式）

### 基础设施
- [ ] 配置 K8s 健康探针（`/health/liveliness` + `/health/readiness`）
- [ ] 设置 `terminationGracePeriodSeconds: 60`（优雅关闭）
- [ ] 高流量：启用 `use_redis_transaction_buffer: true`
- [ ] 高流量：调大 `DATABASE_CONNECTION_POOL_LIMIT`
- [ ] 数据库备份策略已就绪（`pg_dump` 定时任务）
- [ ] 日志保留策略已配置
