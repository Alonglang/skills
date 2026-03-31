# LiteLLM 路由策略与回退机制

LiteLLM Router 在同名模型的多个部署间做负载均衡，并提供回退、冷却、重试能力。

---

## 路由策略一览

| 策略 | 标识 | 适用场景 |
|------|------|---------|
| 简单随机 | `simple-shuffle` | 默认策略，随机分配 |
| 最少繁忙 | `least-busy` | 按活跃请求数路由，均匀分配并发 |
| 基于用量 v2 | `usage-based-routing-v2` | 按 RPM/TPM 使用比例路由，**推荐生产使用** |
| 基于延迟 | `latency-based-routing` | 按历史 TTFT 延迟路由，优化响应速度 |
| 最低成本 | `cost-based-routing` | 优先选择最便宜的部署 |
| 基于标签 | `tag-based-routing` | 按请求标签匹配部署标签 |
| 复杂度路由 | `complexity-router` | 简单问题→小模型，复杂问题→大模型 |

### 配置方法

```yaml
router_settings:
  routing_strategy: usage-based-routing-v2   # 选择策略
  redis_host: os.environ/REDIS_HOST          # 多实例必须共享 Redis
  redis_port: os.environ/REDIS_PORT
```

---

## 策略详解

### usage-based-routing-v2（推荐）

按 RPM/TPM 使用比例路由。每个部署设置 `rpm`/`tpm` 上限，路由器优先选择使用率最低的部署。

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      rpm: 500      # 使用率 = 当前请求数 / 500
      tpm: 100000

  - model_name: gpt-4o
    litellm_params:
      model: azure/gpt-4o-deploy
      rpm: 1000     # 容量更大，会分配更多流量
      tpm: 200000

router_settings:
  routing_strategy: usage-based-routing-v2
  enable_pre_call_checks: true    # 跳过已达限额的部署
```

### latency-based-routing

基于 Time-to-First-Token (TTFT) 的加权随机路由。延迟低的部署获得更高选中概率。

```yaml
router_settings:
  routing_strategy: latency-based-routing
  # 低延迟部署被优先选择，但不是绝对（加权随机避免饥饿）
```

### cost-based-routing

优先路由到每 token 成本最低的部署。适合成本敏感场景。

```yaml
router_settings:
  routing_strategy: cost-based-routing
```

### tag-based-routing

按请求中的 `tags` 匹配部署中的 `tags`，实现精确路由。适合多租户/环境隔离。

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      tags: ["production", "paid"]

  - model_name: gpt-4o
    litellm_params:
      model: azure/gpt-4o-dev
      tags: ["development", "free"]

router_settings:
  routing_strategy: tag-based-routing
```

客户端请求时指定标签：
```json
{
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "hello"}],
  "metadata": {"tags": ["production"]}
}
```

### least-busy

按当前活跃请求数路由，选择最空闲的部署。

```yaml
router_settings:
  routing_strategy: least-busy
```

---

## 回退机制

LiteLLM 支持三种回退类型，可组合使用。

### 1. 通用回退（fallbacks）

模型调用失败时，依次尝试回退列表中的模型。

```yaml
router_settings:
  fallbacks:
    - gpt-4o: [claude-sonnet, gemini-pro]     # gpt-4o 失败 → claude → gemini
    - claude-sonnet: [gpt-4o]                  # claude 失败 → gpt-4o
```

### 2. 上下文窗口回退（context_window_fallbacks）

当请求因上下文窗口超限失败时触发。

```yaml
router_settings:
  context_window_fallbacks:
    - gpt-4o: [gpt-4o-128k, claude-sonnet]    # 上下文超限 → 更大窗口模型
```

### 3. 内容策略回退（content_policy_fallbacks）

当请求因内容策略（Provider 拒绝）失败时触发。

```yaml
router_settings:
  content_policy_fallbacks:
    - claude-sonnet: [gpt-4o]                  # Claude 拒绝 → 用 GPT 重试
```

### 回退执行顺序

当多种回退同时配置时：
1. 先检查具体错误类型回退（`context_window_fallbacks` / `content_policy_fallbacks`）
2. 再检查通用回退（`fallbacks`）
3. 回退链中的每个模型也受路由策略控制（如果有多个部署）

---

## 重试策略

### 全局重试

```yaml
router_settings:
  num_retries: 3         # 最大重试次数
  retry_after: 15        # 重试间隔（秒）
```

### 自定义重试策略（RetryPolicy）

按错误类型配置不同的重试次数：

```yaml
router_settings:
  retry_policy:
    BadRequestErrorRetries: 0          # 400 不重试
    AuthenticationErrorRetries: 0      # 401 不重试
    TimeoutErrorRetries: 3             # 超时重试3次
    RateLimitErrorRetries: 5           # 限流重试5次
    ContentPolicyViolationRetries: 0   # 内容策略不重试
    InternalServerErrorRetries: 2      # 500 重试2次
```

### 允许失败策略（AllowedFailsPolicy）

按错误类型配置冷却前允许的失败次数：

```yaml
router_settings:
  allowed_fails_policy:
    BadRequestErrorAllowedFails: 1000       # 400 不冷却（请求问题非部署问题）
    AuthenticationErrorAllowedFails: 10
    TimeoutErrorAllowedFails: 3
    RateLimitErrorAllowedFails: 5
    ContentPolicyViolationErrorAllowedFails: 1000
    InternalServerErrorAllowedFails: 2
```

---

## 冷却机制

当某个部署连续失败达到阈值时，临时将其移出路由池。

```yaml
router_settings:
  allowed_fails: 3       # 连续失败3次后冷却
  cooldown_time: 60      # 冷却60秒
  disable_cooldowns: false  # 设为 true 禁用冷却
```

**冷却工作原理：**
1. 部署 A 连续失败 3 次（`allowed_fails`）
2. 部署 A 进入冷却状态，60 秒内不接受新请求
3. 60 秒后自动恢复，重新加入路由池
4. 冷却事件可触发 Slack 告警（配置 `alert_types: [cooldown_deployment]`）

**所有部署都在冷却中时的行为：**
- 如果同名模型的所有部署都冷却了，LiteLLM 返回 **503 Service Unavailable**，错误信息 `No healthy deployments available`
- 如果配置了 `fallbacks`，会尝试回退到其他模型名
- **缓解策略：**
  - 降低 `cooldown_time`（如 30s）加速恢复
  - 增加 `allowed_fails`（如 10）提高冷却门槛
  - 配置 `disable_cooldowns: true`（重试代替冷却，适合关键服务）
  - 确保回退链中有不同 Provider 的模型

**`enable_pre_call_checks` 与重试的交互：**
- 开启 `enable_pre_call_checks: true` 后，路由器在选择部署前检查 RPM/TPM 余量
- 如果某部署已达限额，直接跳过而不计为"失败"（不触发冷却）
- 重试时也会重新做预检查，避免重试到同一个已满的部署

---

## 超时配置

```yaml
router_settings:
  timeout: 300              # 全局超时（秒）

model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      timeout: 120            # 该部署独立超时
      stream_timeout: 30      # 流式请求超时

litellm_settings:
  request_timeout: 600        # SDK 层超时（最外层兜底）
```

**超时优先级：** 模型级 > 路由器级 > SDK 级

---

## Redis 分布式状态

多个 LiteLLM 实例时，路由状态必须通过 Redis 共享：

```yaml
router_settings:
  redis_host: os.environ/REDIS_HOST
  redis_port: os.environ/REDIS_PORT
  redis_password: os.environ/REDIS_PASSWORD  # 可选
```

**Redis 存储内容：**
- 路由用量计数（RPM/TPM per deployment）
- 冷却状态
- 延迟统计（用于 latency-based 路由）
- 缓存（如启用）
- 速率限制计数

**无 Redis 时的行为：** 每个实例独立计算路由状态，导致负载不均匀。仅单实例场景可省略 Redis。
