# LiteLLM config.yaml 完整配置规范

config.yaml 是 LiteLLM Proxy 的核心配置文件，包含四大节。

---

## 文件结构总览

```yaml
model_list:          # 模型定义（必须）
  - model_name: ...
    litellm_params: ...

litellm_settings:    # SDK 级别设置（可选）
  drop_params: true
  cache: true
  ...

router_settings:     # 路由器设置（可选）
  routing_strategy: ...
  ...

general_settings:    # Proxy 全局设置（可选）
  master_key: ...
  database_url: ...
  ...
```

---

## 1. model_list（模型列表）

每个条目定义一个模型部署。同 `model_name` 的多条目自动启用负载均衡。

```yaml
model_list:
  - model_name: gpt-4o              # 客户端请求使用的名称
    litellm_params:
      model: openai/gpt-4o          # 格式：provider/model-name
      api_key: os.environ/OPENAI_API_KEY
      api_base: https://api.openai.com/v1  # 可选，自定义端点
      rpm: 500                       # 该部署的 RPM 上限
      tpm: 100000                    # 该部署的 TPM 上限
      max_parallel_requests: 50      # 最大并发请求数
      timeout: 300                   # 请求超时（秒）
      stream_timeout: 60             # 流式超时（秒）
      tags: ["paid", "production"]   # 标签（用于 tag-based 路由）
    model_info:
      id: "gpt-4o-openai-prod"      # 唯一标识符
      description: "Production GPT-4o"
      access_groups: ["premium", "all"]  # 访问组（密钥/团队按组授权）
      base_model: "gpt-4o"              # 基础模型（用于定价匹配）
      input_cost_per_token: 0.000005    # 自定义输入定价（覆盖内置）
      output_cost_per_token: 0.000015   # 自定义输出定价
```

### model_info 完整字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | str | 唯一标识符 |
| `description` | str | 描述 |
| `access_groups` | list[str] | 访问组列表 |
| `base_model` | str | 基础模型名（影响定价查询） |
| `input_cost_per_token` | float | 自定义每 input token 价格（美元） |
| `output_cost_per_token` | float | 自定义每 output token 价格（美元） |
| `max_tokens` | int | 模型最大输出 token |
| `max_input_tokens` | int | 模型最大输入 token |
| `supports_vision` | bool | 是否支持视觉输入 |
| `supports_function_calling` | bool | 是否支持 function calling |

### 支持的 Provider 格式

| Provider | model 格式 | 额外字段 |
|----------|-----------|---------|
| OpenAI | `openai/gpt-4o` | `api_key` |
| Azure OpenAI | `azure/deployment-name` | `api_key`, `api_base`, `api_version` |
| Anthropic | `anthropic/claude-sonnet-4-20250514` | `api_key` |
| AWS Bedrock | `bedrock/anthropic.claude-v2` | `aws_access_key_id`, `aws_secret_access_key`, `aws_region_name` |
| Google Vertex AI | `vertex_ai/gemini-pro` | `vertex_project`, `vertex_location`, `vertex_credentials` |
| HuggingFace | `huggingface/model-name` | `api_base`（推理端点 URL） |
| Ollama | `ollama/llama3` | `api_base: http://localhost:11434` |
| vLLM | `openai/model-name` | `api_base: http://vllm-host:8000/v1` |
| Together AI | `together_ai/model-name` | `api_key` |
| Groq | `groq/model-name` | `api_key` |
| Deepseek | `deepseek/deepseek-chat` | `api_key` |
| Cohere | `cohere/command-r-plus` | `api_key` |
| Mistral | `mistral/mistral-large-latest` | `api_key` |

### Azure OpenAI 完整示例

```yaml
- model_name: gpt-4o
  litellm_params:
    model: azure/gpt-4o-deployment
    api_key: os.environ/AZURE_API_KEY
    api_base: https://my-resource.openai.azure.com/
    api_version: "2024-06-01"
    rpm: 1000
    tpm: 200000
```

### AWS Bedrock 完整示例

```yaml
- model_name: claude-sonnet
  litellm_params:
    model: bedrock/anthropic.claude-sonnet-4-20250514-v1:0
    aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
    aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
    aws_region_name: us-east-1
```

### 通配符路由

```yaml
model_list:
  # 暴露整个 Provider 的所有模型
  - model_name: "anthropic/*"
    litellm_params:
      model: "anthropic/*"
      api_key: os.environ/ANTHROPIC_API_KEY

  # 万能路由（任何已知模型直通）
  - model_name: "*"
    litellm_params:
      model: "*"
```

### 环境变量引用

所有字段都支持 `os.environ/VAR_NAME` 语法从环境变量读取：

```yaml
api_key: os.environ/OPENAI_API_KEY        # 单个变量
api_base: os.environ/AZURE_ENDPOINT        # URL 也可以
```

---

## 2. litellm_settings（SDK 设置）

控制 LiteLLM SDK 层面的行为。

```yaml
litellm_settings:
  # --- 请求处理 ---
  drop_params: true              # 自动丢弃 Provider 不支持的参数（推荐开启）
  set_verbose: false             # 详细日志（生产关闭）
  num_retries: 2                 # SDK 层重试次数
  request_timeout: 300           # 全局请求超时（秒）

  # --- 缓存 ---
  cache: true
  cache_params:
    type: redis                  # redis / redis-semantic / s3 / local
    host: os.environ/REDIS_HOST
    port: os.environ/REDIS_PORT
    password: os.environ/REDIS_PASSWORD  # 可选
    ttl: 3600                    # 缓存 TTL（秒）
    namespace: "litellm_cache"   # Redis key 前缀

  # --- 回调（日志/可观测性）---
  # 三种回调触发时机不同，可同时配置：
  callbacks: ["otel"]                      # 所有请求（成功+失败）
  success_callback: ["langfuse"]           # 仅成功请求
  failure_callback: ["langfuse", "sentry"] # 仅失败请求
  # 详见 observability.md 的"回调类型说明"章节

  # --- 护栏 ---
  guardrails:
    - guardrail_name: "pii-guard"
      litellm_params:
        guardrail: presidio
        mode: pre_call

  # --- 日志控制 ---
  turn_off_message_logging: true   # 不记录请求/响应消息内容（隐私）
  redact_user_api_key_info: true   # 日志中隐藏用户密钥信息

  # --- 模型默认参数 ---
  default_team_settings:
    - team_id: "team-finance"
      model_aliases:
        cheap-model: gpt-4o-mini
        smart-model: gpt-4o
```

---

## 3. router_settings（路由器设置）

控制负载均衡和故障处理。详见 [routing.md](routing.md)。

```yaml
router_settings:
  # --- 路由策略 ---
  routing_strategy: usage-based-routing-v2  # 见 routing.md 详解

  # --- Redis（多实例必须）---
  redis_host: os.environ/REDIS_HOST
  redis_port: os.environ/REDIS_PORT
  redis_password: os.environ/REDIS_PASSWORD  # 可选

  # --- 预检查 ---
  enable_pre_call_checks: true     # 路由前检查 RPM/TPM 余量

  # --- 重试 ---
  num_retries: 3                   # 路由层重试次数
  retry_after: 15                  # 重试间隔（秒）
  timeout: 300                     # 路由层超时（秒）

  # --- 冷却 ---
  allowed_fails: 3                 # 冷却前允许的失败次数
  cooldown_time: 60                # 冷却时间（秒），期间不路由到该部署

  # --- 回退 ---
  fallbacks:
    - gpt-4o: [claude-sonnet, gemini-pro]
  context_window_fallbacks:
    - gpt-4o: [gpt-4o-128k]
  content_policy_fallbacks:
    - claude-sonnet: [gpt-4o]
```

---

## 4. general_settings（全局设置）

控制 Proxy Server 级别的行为。

```yaml
general_settings:
  # --- 认证 ---
  master_key: os.environ/LITELLM_MASTER_KEY    # 管理员主密钥
  database_url: os.environ/DATABASE_URL         # PostgreSQL 连接串

  # --- 安全 ---
  litellm_key_header_name: "x-api-key"          # 自定义认证头（默认 Authorization）
  allow_user_auth: true                          # 允许用户自助管理密钥
  custom_auth: "my_custom_auth.auth_handler"     # 自定义认证函数

  # --- 花费管理 ---
  use_redis_transaction_buffer: true             # 花费写入走 Redis 缓冲（高流量推荐）
  max_budget: 1000                               # 代理级全局预算上限（美元）
  budget_duration: "30d"                         # 预算周期

  # --- 模型管理 ---
  store_model_in_db: true                        # 允许通过 API 动态添加模型

  # --- 告警 ---
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

  # --- 并发控制 ---
  max_parallel_requests: 1000   # Proxy 级最大并发
  global_max_parallel_requests: 5000

  # --- CORS ---
  allowed_origins: ["*"]         # 允许的跨域来源

  # --- Web UI ---
  ui_access_mode: "admin"        # "admin" | "all"
  litellm_ui_port: 4000
```

---

## 多配置文件

LiteLLM 支持通过 CLI 参数加载配置：

```bash
# 基本
litellm --config config.yaml

# 指定端口
litellm --config config.yaml --port 4000

# 详细调试
litellm --config config.yaml --detailed_debug

# 指定 worker 数量
litellm --config config.yaml --num_workers 4
```

---

## 配置验证清单

- [ ] 每个 model_list 条目都有 `model_name` 和 `litellm_params.model`
- [ ] `model` 字段使用正确的 `provider/model-name` 格式
- [ ] API Key 通过 `os.environ/` 引用（不硬编码）
- [ ] Azure 模型配置了 `api_base` 和 `api_version`
- [ ] 生产环境设置了 `master_key` 和 `database_url`
- [ ] 多实例部署配置了共享 Redis
- [ ] 设置了合理的 `rpm` / `tpm` 限制
- [ ] `drop_params: true` 已开启（避免参数不兼容错误）
