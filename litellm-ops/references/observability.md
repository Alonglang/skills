# LiteLLM 可观测性与成本追踪

---

## 回调类型说明

LiteLLM 有三种回调配置，作用不同：

| 配置项 | 触发时机 | 适用场景 |
|--------|---------|---------|
| `callbacks` | **所有请求**（成功 + 失败） | OTEL、DataDog 等全量遥测 |
| `success_callback` | **仅成功请求** | Langfuse（只关心正常调用的日志） |
| `failure_callback` | **仅失败请求** | Sentry（只关心错误） |

```yaml
litellm_settings:
  callbacks: ["otel"]                        # 全量：发到 OTEL Collector
  success_callback: ["langfuse"]             # 成功：发到 Langfuse
  failure_callback: ["langfuse", "sentry"]   # 失败：发到 Langfuse + Sentry
```

> 三者可同时配置，互不冲突。同一个集成可以同时出现在多个列表中。

### 自定义回调

```python
# my_callback.py
from litellm.integrations.custom_logger import CustomLogger

class MyCallback(CustomLogger):
    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time):
        print(f"Model: {kwargs['model']}, Tokens: {response_obj.usage.total_tokens}")

    async def async_log_failure_event(self, kwargs, response_obj, start_time, end_time):
        print(f"Failed: {kwargs['model']}, Error: {kwargs.get('exception')}")
```

```yaml
litellm_settings:
  callbacks: ["my_callback.MyCallback"]    # 引用自定义类
```

---

## 日志集成一览

| 集成 | 类型 | 配置方式 | 适用 |
|------|------|---------|------|
| Langfuse | LLM 可观测性平台 | 回调 + 环境变量 | **推荐，最完善** |
| OpenTelemetry (OTEL) | 通用遥测 | 回调 + OTEL Collector | 已有 OTEL 基础设施 |
| DataDog | APM + 监控 | 回调 + DD Agent | DataDog 用户 |
| Prometheus | 指标导出 | 内置端点 | K8s + Grafana |
| MLflow | ML 实验跟踪 | 回调 | ML 团队 |
| Lunary | LLM 监控 | 回调 | 轻量选择 |
| Sentry | 错误追踪 | 回调 | 错误监控 |
| Slack | 告警 | general_settings | 即时通知 |
| Arize AI | LLM 可观测性 | 回调 | 企业级监控 |
| Helicone | LLM 监控 | 回调 + 头信息 | 轻量 SaaS 选择 |

---

## Langfuse 集成（推荐）

### 配置

```yaml
litellm_settings:
  success_callback: ["langfuse"]
  failure_callback: ["langfuse"]
```

```bash
# 环境变量
export LANGFUSE_PUBLIC_KEY="pk-lf-xxx"
export LANGFUSE_SECRET_KEY="sk-lf-xxx"
export LANGFUSE_HOST="https://cloud.langfuse.com"  # 或自建地址
```

### 传递 Trace 元数据

客户端通过 `metadata` 字段传递追踪信息：

```json
{
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "hello"}],
  "metadata": {
    "generation_name": "user-query",
    "trace_id": "trace-123",
    "trace_user_id": "alice@company.com",
    "session_id": "session-456",
    "tags": ["production", "chatbot"]
  }
}
```

---

## OpenTelemetry 集成

### 基本配置

```yaml
litellm_settings:
  callbacks: ["otel"]
```

```bash
# 环境变量
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4317"
export OTEL_EXPORTER_OTLP_HEADERS="x-api-key=xxx"
export OTEL_SERVICE_NAME="litellm-proxy"
```

### 导出到 Honeycomb

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="https://api.honeycomb.io"
export OTEL_EXPORTER_OTLP_HEADERS="x-honeycomb-team=your-api-key"
```

### 导出到 Jaeger

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://jaeger:4317"
```

---

## DataDog 集成

```yaml
litellm_settings:
  callbacks: ["datadog"]
```

```bash
export DD_API_KEY="your-dd-api-key"
export DD_SITE="datadoghq.com"
```

---

## Prometheus 指标

LiteLLM 内置 Prometheus 指标端点，在 **Proxy 同一端口（4000）** 暴露。

> ⚠️ **v1.83 破坏性变更**：`litellm_request_duration_seconds` 直方图的默认延迟桶（LATENCY_BUCKETS）从 35 个减少到 18 个边界值。升级到 v1.83+ 后，引用旧桶边界（如 `le="1.5"` 或 `le="9.5"`）的 PromQL 查询/Grafana 面板会返回空数据，需相应更新查询。

```bash
# 指标端点（无需认证）
curl http://localhost:4000/metrics
```

### Prometheus 抓取配置

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'litellm'
    scrape_interval: 15s
    static_configs:
      - targets: ['litellm:4000']
```

### 完整指标列表

| 指标 | 类型 | 说明 |
|------|------|------|
| `litellm_requests_total` | Counter | 总请求数（按 model/status 标签） |
| `litellm_request_duration_seconds` | Histogram | 请求延迟（含 Provider 延迟） |
| `litellm_tokens_total` | Counter | Token 消耗总量 |
| `litellm_request_errors_total` | Counter | 错误请求数（按错误类型标签） |
| `litellm_deployment_state` | Gauge | 部署状态（1=健康, 0=冷却中） |
| `litellm_deployment_success_responses` | Counter | 每部署成功响应数 |
| `litellm_deployment_failure_responses` | Counter | 每部署失败响应数 |
| `litellm_deployment_latency_per_output_token` | Histogram | 每输出 token 延迟 |
| `litellm_remaining_team_budget` | Gauge | 团队剩余预算 |
| `litellm_remaining_api_key_budget` | Gauge | 密钥剩余预算 |

### Grafana 示例查询

```promql
# 请求速率
rate(litellm_requests_total[5m])

# P95 延迟
histogram_quantile(0.95, rate(litellm_request_duration_seconds_bucket[5m]))

# 错误率
rate(litellm_request_errors_total[5m]) / rate(litellm_requests_total[5m])

# 每部署健康状态
litellm_deployment_state

# 团队预算剩余
litellm_remaining_team_budget
```

---

## 成本追踪

### 追踪维度

LiteLLM 自动按以下维度追踪花费：

| 维度 | 来源 | 查询端点 |
|------|------|---------|
| API Key | 虚拟密钥 | `/key/info` |
| User | `user_id`（密钥或请求） | `/user/info` |
| Team | `team_id` | `/team/info` |
| Tag | 请求 metadata.tags | `/spend/tags` |
| Model | 使用的模型 | `/spend/logs` |

### 花费写入流程

```
请求完成 → 计算花费 → 写入 Redis 队列
                          ↓
                  每 60 秒批量刷入 PostgreSQL（SpendLog 表）
```

**高流量优化：** 启用 `use_redis_transaction_buffer: true` 减轻 DB 写入压力。

**Redis 故障时的行为：**
- Redis 不可用时，花费直接写入 PostgreSQL（性能下降但不丢数据）
- 回调（Langfuse 等）是异步的，失败不影响主请求返回
- 花费计算本身在内存中完成，不依赖外部服务

### 查询花费

```bash
# 按密钥查询
curl http://localhost:4000/key/info?key=sk-xxx \
  -H "Authorization: Bearer sk-master-key"

# 按团队查询
curl http://localhost:4000/team/info?team_id=team-xxx \
  -H "Authorization: Bearer sk-master-key"

# 每日花费明细
curl "http://localhost:4000/user/daily/activity?start_date=2024-03-01&end_date=2024-03-31" \
  -H "Authorization: Bearer sk-master-key"

# 花费日志（详细）
curl "http://localhost:4000/spend/logs?start_date=2024-03-01&end_date=2024-03-31" \
  -H "Authorization: Bearer sk-master-key"

# 按标签查询
curl "http://localhost:4000/spend/tags?start_date=2024-03-01&end_date=2024-03-31" \
  -H "Authorization: Bearer sk-master-key"
```

### 自定义成本

对于 LiteLLM 不认识的模型（如自建模型），手动设置每 token 价格：

```yaml
model_list:
  - model_name: my-custom-model
    litellm_params:
      model: openai/my-model
      api_base: http://vllm:8000/v1
      input_cost_per_token: 0.000001    # $0.001 / 1K input tokens
      output_cost_per_token: 0.000002   # $0.002 / 1K output tokens
```

---

## 响应头信息

LiteLLM 在每个响应中添加运维有用的头信息：

| 响应头 | 说明 |
|--------|------|
| `x-litellm-model-id` | 实际使用的模型部署 ID |
| `x-litellm-model-api-base` | 实际请求的 API 地址 |
| `x-litellm-key-spend` | 当前密钥累计花费 |
| `x-litellm-key-remaining-budget` | 密钥剩余预算 |
| `x-litellm-key-rpm-limit` | 密钥 RPM 限制 |
| `x-litellm-key-tpm-limit` | 密钥 TPM 限制 |

---

## Slack 告警

### 配置

```yaml
general_settings:
  alerting:
    - slack
  alerting_args:
    slack_webhook_url: os.environ/SLACK_WEBHOOK_URL
  alert_types:
    - llm_exceptions          # LLM 调用异常
    - spend_reports           # 花费报告
    - db_exceptions           # 数据库异常
    - daily_reports           # 每日摘要
    - cooldown_deployment     # 模型冷却事件
    - outage_alerts           # 中断告警
    - budget_alerts           # 预算超限
```

### 预算告警阈值

```yaml
general_settings:
  alerting:
    - slack
  alert_to_webhook_url:
    budget_alerts: "https://hooks.slack.com/services/xxx/budget-channel"
    llm_exceptions: "https://hooks.slack.com/services/xxx/oncall-channel"
```

---

## 日志控制（隐私保护）

```yaml
litellm_settings:
  # 不记录消息内容（只记录元数据）
  turn_off_message_logging: true

  # 日志中隐藏用户 API 密钥
  redact_user_api_key_info: true
```

### 按请求控制

客户端可在请求中指定 `no-log: true` 跳过日志：

```json
{
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "sensitive content"}],
  "metadata": {"no-log": true}
}
```
