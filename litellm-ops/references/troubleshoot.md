# LiteLLM 故障排查手册

---

## 快速诊断流程

```
故障发生
  │
  ├── 启动失败？→ 检查配置 YAML 语法 / 数据库连接 / 镜像版本
  ├── 请求 401？→ 检查 master_key / virtual key / Provider API key
  ├── 请求 429？→ 检查 RPM/TPM 限制 / Provider 限额 / 预算超限
  ├── 请求 500？→ 检查 --detailed_debug 日志 / Provider 错误
  ├── DB 错误？→ 检查 Schema 同步 / 连接池耗尽
  ├── 延迟高？→ 检查路由策略 / Provider 响应时间 / 缓存 / 护栏延迟
  ├── 内存/CPU 高？→ 检查并发量 / 回调阻塞 / 连接泄漏
  └── 花费不准？→ 检查自定义定价 / Redis 缓冲延迟 / LiteLLM 版本
```

---

## 常见故障与解决方案

### 1. DB Schema 不同步

**症状：** 启动后出现 `Unknown column` / `relation does not exist` 错误

**原因：** Prisma Schema 更新但数据库未迁移

**解决方案：**

```bash
# 方法 1：使用 litellm-proxy-extras 包自动迁移
pip install litellm-proxy-extras
litellm-proxy-extras db migrate

# 方法 2：手动重置（开发环境）
# 警告：会丢失所有数据！
docker exec -it postgres psql -U user -d litellm -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
# 然后重启 LiteLLM，它会自动创建表

# 方法 3：检查当前 Schema 状态
docker exec -it litellm python -c "
from litellm.proxy.db.prisma_client import PrismaClient
# 查看 Prisma 迁移状态
"
```

### 2. Redis 连接错误

**症状：** `ConnectionError: Error connecting to Redis` / 路由不均匀

**诊断：**

```bash
# 检查 Redis 连通性
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping

# 检查 Redis 认证
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping

# 检查 LiteLLM 配置
docker exec litellm env | grep REDIS
```

**解决方案：**

```yaml
# 确保配置正确
router_settings:
  redis_host: redis-host         # 不要用 redis://redis-host
  redis_port: 6379               # 确保是整数
  redis_password: "password"     # 如果有密码
```

### 3. SSL 证书验证失败

**症状：** `SSLError: certificate verify failed` / 连接 Provider 失败

**解决方案：**

```bash
# 方法 1：跳过 SSL 验证（开发环境）
export SSL_VERIFY="false"

# 方法 2：指定 CA 证书
export SSL_CERT_FILE="/path/to/ca-bundle.crt"
export REQUESTS_CA_BUNDLE="/path/to/ca-bundle.crt"

# 方法 3：针对特定 Provider
# 在 model_list 中设置
```

### 4. 高流量 DB 死锁

**症状：** 高并发下出现 `deadlock detected` / 花费写入丢失

**原因：** 多个 LiteLLM 实例同时写入花费表

**解决方案：**

```yaml
general_settings:
  # 花费写入走 Redis 缓冲，每 60 秒批量刷入 DB
  use_redis_transaction_buffer: true
```

### 5. 模型调用超时

**症状：** `TimeoutError` / 请求超时

**诊断：**

```bash
# 检查 Provider 直连是否也慢
curl -w "\nTotal: %{time_total}s\n" \
  https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "hi"}]}'
```

**解决方案：**

```yaml
# 增加超时
router_settings:
  timeout: 600

model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      timeout: 300
      stream_timeout: 60
```

### 6. 密钥认证失败

**症状：** `AuthenticationError` / 401 Unauthorized

**诊断清单：**

1. 检查 `master_key` 是否正确设置
2. 检查虚拟密钥是否过期（`duration` 字段）
3. 检查虚拟密钥是否超预算（`max_budget`）
4. 检查密钥是否有权访问请求的模型（`models` 字段）
5. 检查 Provider API Key 是否有效

```bash
# 检查密钥信息
curl http://localhost:4000/key/info?key=sk-xxx \
  -H "Authorization: Bearer sk-master-key"

# 检查密钥花费/预算
# 返回中看 spend vs max_budget
```

### 7. 回调/日志静默失败

**症状：** Langfuse / OTEL 收不到数据，但请求正常返回

**原因：** 日志回调是异步的，失败不影响主请求

**诊断：**

```bash
# 开启详细日志
litellm --config config.yaml --detailed_debug

# 检查环境变量
docker exec litellm env | grep -E "LANGFUSE|OTEL|DD_"
```

**常见原因：**
- 环境变量未正确传入容器
- Langfuse Host 地址不可达
- OTEL Collector 端点配置错误
- `turn_off_message_logging: true` 不会影响花费记录

### 8. 模型不存在错误

**症状：** `NotFoundError: Model 'xxx' not found`

**诊断：**

```bash
# 查看已配置的模型
curl http://localhost:4000/model/info \
  -H "Authorization: Bearer sk-master-key"

# 检查模型名匹配
# 客户端请求的 model 名必须与 config.yaml 中的 model_name 匹配
```

**常见原因：**
- `model_name` 拼写错误
- 密钥没有访问该模型的权限
- `STORE_MODEL_IN_DB=True` 时，模型可能存在 DB 中而非 config.yaml

### 9. 花费计算不准确

**症状：** 花费数据与 Provider 账单不匹配

**常见原因：**
- 自建模型未配置 `input_cost_per_token` / `output_cost_per_token`
- LiteLLM 模型定价表过时（更新到最新版本）
- `use_redis_transaction_buffer: true` 时花费有最多 60 秒延迟

**诊断步骤：**

```bash
# 查看 LiteLLM 内置模型定价表
curl http://localhost:4000/public/litellm_model_cost_map | python3 -c "
import json,sys; data=json.load(sys.stdin)
for k,v in data.items():
    if 'gpt-4o' in k:
        print(f'{k}: input={v.get(\"input_cost_per_token\")}, output={v.get(\"output_cost_per_token\")}')
"

# 手动覆盖模型定价（在 model_list 中）
# input_cost_per_token: 0.000001
# output_cost_per_token: 0.000002
```

### 10. Prisma 连接池耗尽

**症状：** `Error: Can't acquire connection from the pool` / DB 请求超时但 PostgreSQL 本身正常

**原因：** 高并发下连接池不够用（默认较小）

**解决方案：**

```bash
# 增大连接池（环境变量）
export DATABASE_CONNECTION_POOL_LIMIT=100    # 默认较小，高流量需加大
export DATABASE_CONNECTION_TIMEOUT=60        # 连接获取超时（秒）

# 或考虑使用 PgBouncer 做连接池代理
# PgBouncer → PostgreSQL，LiteLLM 连 PgBouncer
```

**监控：** 观察 PostgreSQL `pg_stat_activity` 中活跃连接数是否接近 `max_connections`。

### 11. 内存持续增长（疑似泄漏）

**症状：** LiteLLM 进程 RSS 内存持续上涨，不回落

**诊断：**

```bash
# 查看进程内存
docker stats litellm --no-stream

# 查看进程内部（进入容器）
docker exec litellm python3 -c "
import resource
print(f'RSS: {resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024:.0f} MB')
"

# 检查是否有大量待处理回调（异步回调堆积）
docker logs litellm 2>&1 | grep -c "callback"
```

**常见原因：**
- 异步回调目标不可达（如 Langfuse 服务端宕机），回调对象堆积在内存中
- 大量缓存未设置 TTL（Redis 缓存 + 内存 DualCache）
- 流式请求未正确关闭连接

**解决方案：**
- 确保所有回调目标可达
- 设置缓存 TTL：`cache_params.ttl: 3600`
- 定期重启（K8s 设置内存 limit，OOMKilled 自动重启）

### 12. 配置文件 YAML 语法错误

**症状：** 启动失败，报 `yaml.scanner.ScannerError` 或 `yaml.parser.ParserError`

**诊断：**

```bash
# 本地验证 YAML 语法
python3 -c "import yaml; yaml.safe_load(open('config.yaml'))" && echo "✅ YAML valid" || echo "❌ YAML invalid"

# 常见错误：
# - Tab vs Space 混用（YAML 只允许空格缩进）
# - 冒号后缺少空格（key:value → key: value）
# - 特殊字符未加引号（含 : / # 等字符的值需要引号）
```

### 13. 回退链耗尽

**症状：** 所有回退模型都失败，返回最后一个错误

**行为说明：**
- LiteLLM 按 fallback 列表顺序逐个尝试
- 每个回退模型也受路由策略、冷却机制控制
- **所有回退都失败时**：返回最后一个模型的错误，HTTP 状态码取决于最后的错误类型
- **所有部署都在冷却中时**：返回 `No healthy deployments available` 错误（503）

**缓解措施：**
- 配置足够的回退链（至少 2-3 个不同 Provider）
- 降低 `cooldown_time`（默认 60s，可改为 30s）
- 对于关键服务，设置 `disable_cooldowns: true`（以重试代替冷却）

---

## 调试工具

### 详细调试模式

```bash
# CLI 方式
litellm --config config.yaml --detailed_debug

# 环境变量方式
export LITELLM_LOG=DEBUG
```

### 请求转换调试

查看发送给 Provider 的实际请求格式：

```bash
curl -X POST http://localhost:4000/utils/transform_request \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "test"}],
    "stream": true
  }'
# 返回转换后的 Provider 请求格式
```

### 健康检查

```bash
# 基本健康
curl http://localhost:4000/health

# 存活探针
curl http://localhost:4000/health/liveliness

# 就绪探针（含 DB 连接检查）
curl http://localhost:4000/health/readiness

# 模型连通性检查
curl http://localhost:4000/health?model=gpt-4o \
  -H "Authorization: Bearer sk-master-key"
```

### 日志查看

```bash
# Docker 日志
docker logs litellm --tail 100 -f

# K8s 日志
kubectl logs -l app=litellm --tail=100 -f

# 过滤错误
docker logs litellm 2>&1 | grep -i "error\|exception\|traceback"
```

---

## 升级故障恢复

### 升级后服务异常

```bash
# 1. 回滚到之前的版本
docker stop litellm
docker run -d --name litellm \
  ghcr.io/berriai/litellm:main-v1.64.0-stable \
  ...

# 2. 检查 CHANGELOG 的 Breaking Changes
# https://github.com/BerriAI/litellm/releases

# 3. DB Schema 问题用 litellm-proxy-extras 修复
pip install litellm-proxy-extras
litellm-proxy-extras db migrate
```

### 数据库备份与恢复

```bash
# 备份（升级前必做）
pg_dump -h db-host -U user -d litellm > litellm_backup_$(date +%Y%m%d).sql

# 恢复
psql -h db-host -U user -d litellm < litellm_backup_20240301.sql
```
