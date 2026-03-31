# LiteLLM 部署指南

## 部署方式对照

| 方式 | 适用场景 | 需要 | 命令 |
|------|---------|------|------|
| Docker（基础） | 开发/测试 | Docker | `docker run` |
| Docker + DB | 生产（密钥管理） | Docker + PostgreSQL | `docker run` + DB |
| Docker Compose | 生产（一键启动全栈） | docker-compose | `docker-compose up` |
| Kubernetes + Helm | 大规模生产 | K8s 集群 | `helm install` |

---

## Docker 部署

### 基础部署（无数据库）

适合快速测试，无密钥管理、无花费追踪。

```bash
docker run -d --name litellm \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -p 4000:4000 \
  ghcr.io/berriai/litellm:main-stable \
  --config /app/config.yaml --port 4000
```

### 生产部署（带 PostgreSQL + Redis）

```bash
docker run -d --name litellm \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -e DATABASE_URL="postgresql://user:pass@db-host:5432/litellm" \
  -e REDIS_HOST="redis-host" \
  -e REDIS_PORT="6379" \
  -e LITELLM_MASTER_KEY="sk-your-strong-master-key" \
  -e LITELLM_SALT_KEY="your-random-salt-string" \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -p 4000:4000 \
  ghcr.io/berriai/litellm:main-v1.65.0-stable \
  --config /app/config.yaml --port 4000
```

### Docker Compose（推荐生产方式）

```yaml
# docker-compose.yaml
version: "3.9"
services:
  litellm:
    image: ghcr.io/berriai/litellm:main-v1.65.0-stable
    command: --config /app/config.yaml --port 4000
    ports:
      - "4000:4000"
    volumes:
      - ./config.yaml:/app/config.yaml
    environment:
      DATABASE_URL: postgresql://llmproxy:dbpassword@db:5432/litellm
      REDIS_HOST: redis
      REDIS_PORT: "6379"
      LITELLM_MASTER_KEY: ${LITELLM_MASTER_KEY}
      LITELLM_SALT_KEY: ${LITELLM_SALT_KEY}
      STORE_MODEL_IN_DB: "True"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health/liveliness"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: litellm
      POSTGRES_USER: llmproxy
      POSTGRES_PASSWORD: dbpassword
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -d litellm -U llmproxy"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

---

## Kubernetes 部署

### Helm Chart

```bash
# 添加 Helm 仓库
helm repo add litellm https://berriai.github.io/litellm/
helm repo update

# 安装
helm install litellm litellm/litellm-helm \
  --set masterKey=sk-your-master-key \
  --set db.useExisting=true \
  --set db.url=postgresql://user:pass@db:5432/litellm \
  --set redis.enabled=true
```

### 自定义 values.yaml

```yaml
# values.yaml
replicaCount: 3

image:
  repository: ghcr.io/berriai/litellm
  tag: main-v1.65.0-stable

masterKey: sk-your-master-key

config:
  # 直接嵌入 config.yaml 内容，或引用 ConfigMap
  model_list:
    - model_name: gpt-4o
      litellm_params:
        model: openai/gpt-4o
        api_key: os.environ/OPENAI_API_KEY

db:
  useExisting: true
  url: postgresql://user:pass@db:5432/litellm

redis:
  enabled: true
  host: redis-master
  port: 6379

resources:
  requests:
    cpu: "2"
    memory: "4Gi"
  limits:
    cpu: "4"
    memory: "8Gi"

livenessProbe:
  httpGet:
    path: /health/liveliness
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 15

readinessProbe:
  httpGet:
    path: /health/readiness
    port: 4000
  initialDelaySeconds: 15
  periodSeconds: 10
```

### ConfigMap 方式管理配置

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: litellm-config
data:
  config.yaml: |
    model_list:
      - model_name: gpt-4o
        litellm_params:
          model: openai/gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    router_settings:
      routing_strategy: usage-based-routing-v2
      redis_host: os.environ/REDIS_HOST
      redis_port: os.environ/REDIS_PORT
    general_settings:
      master_key: os.environ/LITELLM_MASTER_KEY
      database_url: os.environ/DATABASE_URL
---
apiVersion: v1
kind: Secret
metadata:
  name: litellm-secrets
type: Opaque
stringData:
  LITELLM_MASTER_KEY: "sk-your-master-key"
  LITELLM_SALT_KEY: "your-salt"
  DATABASE_URL: "postgresql://user:pass@db:5432/litellm"
  OPENAI_API_KEY: "sk-xxx"
```

---

## 版本管理

| 标签格式 | 说明 | 适用 |
|---------|------|------|
| `main-stable` | 最新稳定版（滚动更新） | 测试 |
| `main-v1.65.0-stable` | 固定版本 | **生产推荐** |
| `main-latest` | 最新开发版 | 不推荐 |

**升级策略：**
1. **备份数据库**：`pg_dump -h db-host -U user -d litellm > backup_$(date +%Y%m%d).sql`
2. 先在 staging 环境测试新版本
3. 检查 [CHANGELOG](https://github.com/BerriAI/litellm/releases) 的 Breaking Changes
4. 升级镜像版本
5. DB Schema 自动迁移（Prisma）——LiteLLM 启动时自动执行
6. 迁移失败时：`pip install litellm-proxy-extras && litellm-proxy-extras db migrate`
7. 升级后运行 `/health` 检查模型连通性
8. 验证 `/spend/logs` 花费数据完整性

---

## 启动行为与故障处理

### PostgreSQL 不可达时

- LiteLLM **会启动失败**（如果配置了 `database_url`）
- 错误信息：`Error connecting to the database`
- 需要等 DB 可用后重启

### 环境变量与 config.yaml 优先级

```
环境变量 > config.yaml 中的 os.environ/ 引用 > config.yaml 硬编码值
```

- `os.environ/OPENAI_API_KEY` 在运行时读取环境变量
- 环境变量直接设置（如 `LITELLM_MASTER_KEY`）会覆盖 config.yaml 中的 `general_settings.master_key`

### 优雅关闭

LiteLLM 收到 `SIGTERM` 后：
1. 停止接受新请求
2. 等待正在处理的请求完成（有超时限制）
3. 刷新 Redis 中的花费缓冲到 DB
4. 退出进程

K8s 中配置 `terminationGracePeriodSeconds` 确保足够的关闭时间：

```yaml
spec:
  terminationGracePeriodSeconds: 60   # 给足时间完成在途请求
```

---

## 高流量部署配置（1000+ RPS）

### 最低资源要求

| 组件 | CPU | 内存 | 说明 |
|------|-----|------|------|
| LiteLLM | 4 核 | 8 GB | 单实例上限约 1000 RPS |
| PostgreSQL | 2 核 | 4 GB | 花费写入是主要负载 |
| Redis | 1 核 | 2 GB | 路由状态 + 缓存 |

### 关键配置

```yaml
general_settings:
  # 花费写入走 Redis 队列，每60秒批量刷入 DB，大幅减轻 DB 压力
  use_redis_transaction_buffer: true

router_settings:
  redis_host: os.environ/REDIS_HOST
  redis_port: os.environ/REDIS_PORT
  # 多实例必须共享 Redis，否则路由状态不一致
```

### 水平扩展

- 多个 LiteLLM 实例共享同一 Redis + PostgreSQL
- 用 Nginx / K8s Ingress 做 L7 负载均衡
- 每个实例独立处理请求，无状态（状态全在 Redis/DB）
- 扩容时只需增加 LiteLLM Pod 数量

### 连接池优化

```bash
# 环境变量配置 DB 连接池
DATABASE_CONNECTION_POOL_LIMIT=100   # 连接池大小
DATABASE_CONNECTION_TIMEOUT=60       # 连接超时秒数
```

---

## SSL / TLS 配置

### 自签名证书（开发环境）

```bash
# 如果 Provider API 使用自签名证书
docker run -d --name litellm \
  -e SSL_VERIFY="false" \
  ...
```

### 正式证书

在 Nginx / Ingress 层终结 TLS，LiteLLM 本身监听 HTTP：

```nginx
server {
    listen 443 ssl;
    ssl_certificate     /etc/ssl/certs/litellm.crt;
    ssl_certificate_key /etc/ssl/private/litellm.key;

    location / {
        proxy_pass http://litellm:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
