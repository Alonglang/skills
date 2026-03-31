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

## 国产模型 / 特殊 Provider 工具调用问题

> 以下经验来自实际生产排查（GLM-4.7 通过 NVIDIA NIM → LiteLLM → opencode）

### 14. Agent 只答一轮就停止（问一句答一句）

**症状：** opencode / 任何 Agent 框架每次只执行一步就停，不会持续调用工具

**根本原因链（按优先级排查）：**

1. **`max_tokens` 未设置** → 模型只生成 32 token（部分模型默认值极小）→ 工具调用 JSON 被截断 → Agent 认为对话结束
2. 流式模式 `finish_reason=stop`（应为 `tool_calls`）→ Agent 不触发工具执行
3. 工具调用 JSON 不完整（被 token 截断）→ 解析失败 → Agent 停止

**快速诊断：**

```bash
# 直接测试模型，不带 max_tokens
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $MASTER_KEY" \
  -d '{"model":"your-model","messages":[{"role":"user","content":"hi"}]}' \
  | python3 -c "import json,sys; r=json.load(sys.stdin); print(r['choices'][0]['finish_reason'], r['usage'])"
# 如果 finish_reason=length，说明 max_tokens 太小！
```

**解决方案：**

```yaml
# config.yaml 中所有模型都加 max_tokens
model_list:
  - model_name: your-model
    litellm_params:
      model: openai/your-model
      api_base: https://your-provider/v1
      api_key: os.environ/YOUR_API_KEY
      max_tokens: 8192   # ← 必须设置！默认值可能只有 32~256
```

---

### 15. GLM-4.7 并行工具调用：部分工具以 XML 格式泄漏在 content 中

**症状：** 发出 3 个并行工具调用请求，只收到 2 个 `tool_calls`，第 3 个以如下格式出现在 `content` 字段：

```
<tool_call>function_name<arg_key>key</arg_key><arg_value>value</arg_value></tool_call>
```

**根本原因：** GLM-4.7 模型本身的 bug，**与 LiteLLM 无关**（直接调 NVIDIA NIM API 也有相同问题）。并行工具调用时，模型随机将部分工具以 XML 格式输出在 content 里而非标准 JSON tool_calls。

**修复方案：** 通过 LiteLLM CustomGuardrail 插件在代理层自动修复。

**完整插件代码 `xml_tool_fix.py`（放在 LiteLLM 工作目录）：**

```python
import re, uuid, json, copy
from typing import AsyncGenerator
from litellm.integrations.custom_guardrail import CustomGuardrail

class XMLToolCallFixer(CustomGuardrail):
    XML_PATTERN = re.compile(
        r'<tool_call>\s*(\w+)\s*((?:<arg_key>.*?</arg_key>\s*<arg_value>.*?</arg_value>\s*)*)</tool_call>',
        re.DOTALL
    )
    ARG_PATTERN = re.compile(
        r'<arg_key>(.*?)</arg_key>\s*<arg_value>(.*?)</arg_value>',
        re.DOTALL
    )

    def _extract_xml_tools(self, content: str):
        xml_tools = []
        for m in self.XML_PATTERN.finditer(content):
            func_name = m.group(1).strip()
            args = {k.strip(): v.strip() for k, v in self.ARG_PATTERN.findall(m.group(2))}
            xml_tools.append({
                'id': f'call_{uuid.uuid4().hex[:8]}',
                'type': 'function',
                'function': {'name': func_name, 'arguments': json.dumps(args)}
            })
        clean = self.XML_PATTERN.sub('', content).strip() or None
        return xml_tools, clean

    # 非流式修复
    async def async_post_call_success_hook(self, data, user_api_key_dict, response):
        try:
            choice = response.choices[0]
            msg = choice.message
            if not msg.content:
                return response
            xml_tools, clean = self._extract_xml_tools(msg.content)
            if not xml_tools:
                return response
            msg.content = clean
            existing = list(msg.tool_calls or [])
            from litellm.types.utils import ChatCompletionMessageToolCall, Function
            for xt in xml_tools:
                existing.append(ChatCompletionMessageToolCall(
                    id=xt['id'], type='function',
                    function=Function(name=xt['function']['name'], arguments=xt['function']['arguments'])
                ))
            msg.tool_calls = existing if existing else None
            if choice.finish_reason in (None, 'stop') and msg.tool_calls:
                choice.finish_reason = 'tool_calls'
            return response
        except Exception as e:
            print(f'[XMLToolCallFixer] non-stream error: {e}')
            return response

    # 流式修复
    async def async_post_call_streaming_iterator_hook(
        self, user_api_key_dict, response, request_data  # 注意：是 request_data 不是 request_body
    ) -> AsyncGenerator:
        from litellm.types.utils import Delta, ChatCompletionDeltaToolCall, Function

        chunks = []
        async for chunk in response:
            chunks.append(chunk)

        full_content = ''
        max_tc_index = -1
        for chunk in chunks:
            try:
                delta = chunk.choices[0].delta
                if delta.content:
                    full_content += delta.content
                for tc in (delta.tool_calls or []):
                    if hasattr(tc, 'index') and tc.index is not None and tc.index > max_tc_index:
                        max_tc_index = tc.index
            except Exception:
                pass

        xml_tools, clean_content = self._extract_xml_tools(full_content)
        has_tools = max_tc_index >= 0 or bool(xml_tools)

        for i, chunk in enumerate(chunks):
            try:
                choice = chunk.choices[0]
                delta = choice.delta
                if delta.content and xml_tools:
                    delta.content = None
                if i == len(chunks) - 1 and has_tools:
                    if choice.finish_reason in ('stop', None):
                        choice.finish_reason = 'tool_calls'
            except Exception:
                pass
            yield chunk

        # 注入 XML 工具调用为标准 streaming chunks
        for xt_idx, xt in enumerate(xml_tools):
            tc_index = max_tc_index + 1 + xt_idx
            try:
                name_chunk = copy.deepcopy(chunks[-1])
                name_chunk.choices[0].finish_reason = None
                name_chunk.choices[0].delta = Delta(
                    role=None, content=None,
                    tool_calls=[ChatCompletionDeltaToolCall(
                        index=tc_index, id=xt['id'], type='function',
                        function=Function(name=xt['function']['name'], arguments='')
                    )]
                )
                yield name_chunk

                args_chunk = copy.deepcopy(chunks[-1])
                args_chunk.choices[0].finish_reason = None
                args_chunk.choices[0].delta = Delta(
                    role=None, content=None,
                    tool_calls=[ChatCompletionDeltaToolCall(
                        index=tc_index, id=xt['id'], type='function',
                        function=Function(name=None, arguments=xt['function']['arguments'])
                    )]
                )
                yield args_chunk
            except Exception as e:
                print(f'[XMLToolCallFixer] inject error: {e}')

        if xml_tools:
            try:
                fin_chunk = copy.deepcopy(chunks[-1])
                fin_chunk.choices[0].delta = Delta(role=None, content=None)
                fin_chunk.choices[0].finish_reason = 'tool_calls'
                yield fin_chunk
            except Exception as e:
                print(f'[XMLToolCallFixer] finish chunk error: {e}')


proxy_handler_instance = XMLToolCallFixer()
```

**注册方式（config.yaml）：**

```yaml
litellm_settings:
  callbacks:
    - xml_tool_fix.proxy_handler_instance
```

**Docker 部署注意事项：**
- 将 `xml_tool_fix.py` 放在宿主机挂载目录（如 `/volume/litellm/`），bind mount 到容器 `/app/`
- 修改插件后需重启容器（Python 模块不会热重载）
- 发送文件到远端无法用 scp 时的替代方案：`python3 -c "import base64; print(base64.b64encode(open('file.py','rb').read()).decode())" | ssh host "base64 -d > /path/file.py"`

---

### 16. 流式模式 finish_reason=stop（工具调用后应为 tool_calls）

**症状：** 流式响应中有 `tool_calls` delta，但最终 `finish_reason=stop`，Agent 不执行工具

**根本原因：** 部分国产模型（如 GLM-4.7、部分 Qwen）流式模式下即使有工具调用，仍返回 `finish_reason=stop`

**修复：** 已内置在上方第 15 条的 `xml_tool_fix.py` 插件中（`has_tools` 判断自动修正）

---

### 17. CustomLogger vs CustomGuardrail 修改响应的区别

**关键认知：** 只有 `CustomGuardrail` 的 hook 返回值才会替换响应；`CustomLogger` 的 hook 返回值**被忽略**。

| 扩展类 | hook | 能否修改响应 |
|--------|------|------------|
| `CustomLogger` | `async_log_success_event` | ❌ 返回值被忽略 |
| `CustomLogger` | `async_post_call_success_hook` | ❌ 不走修改路径 |
| `CustomGuardrail` | `async_post_call_success_hook` | ✅ 返回值替换响应 |
| `CustomGuardrail` | `async_post_call_streaming_iterator_hook` | ✅ 接管整个 AsyncGenerator |

**注册方式区别：**
```yaml
litellm_settings:
  callbacks:                        # ← CustomGuardrail 用 callbacks
    - xml_tool_fix.proxy_handler_instance

  success_callback:                 # ← CustomLogger 用 success_callback
    - my_logger.handler_instance
```

---

### 18. 流式插件中使用自定义 Python 类导致序列化失败

**症状：** `PydanticSerializationError: Unable to serialize unknown type: <class 'MyPlugin.MyHook.<locals>.MyDelta'>`

**原因：** 在 `async_post_call_streaming_iterator_hook` 中创建了局部自定义类作为 delta 对象，Pydantic 无法序列化

**解决方案：** 只使用 LiteLLM 官方 Pydantic 类型：

```python
from litellm.types.utils import Delta, ChatCompletionDeltaToolCall, Function
# 不要创建自定义的 TCDelta、CustomDelta 等类
```

---

### 19. Provider 从 nvidia_nim 改为 openai + api_base 的注意事项

**场景：** NVIDIA NIM 托管的模型（如 GLM-4.7）在 LiteLLM 中建议用 `openai` provider 而非 `nvidia_nim`，以获得更好的工具调用兼容性。

```yaml
# ❌ 避免（工具调用时 LiteLLM 会注入 nvidia_nim 特有的转换逻辑）
- model_name: glm47
  litellm_params:
    model: nvidia_nim/z-ai/glm4.7

# ✅ 推荐（透传标准 OpenAI 格式）
- model_name: glm47
  litellm_params:
    model: openai/z-ai/glm4.7
    api_base: https://integrate.api.nvidia.com/v1
    api_key: os.environ/GLM47_API_KEY
    max_tokens: 8192
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
