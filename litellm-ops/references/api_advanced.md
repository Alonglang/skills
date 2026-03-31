# LiteLLM 高级 API 参考

文件管理、Batch 处理、微调、向量存储、缓存、护栏 API、Evals、搜索、Prompt 管理等。

---

## 目录

- [文件管理（10 端点）](#文件管理)
- [Batch 处理（8 端点）](#batch-处理)
- [微调（4 端点）](#微调)
- [向量存储（11 端点）](#向量存储)
- [缓存管理（7 端点）](#缓存管理)
- [护栏 API（22+ 端点）](#护栏-api)
- [策略管理（19 端点）](#策略管理)
- [OpenAI Evals API（11 端点）](#openai-evals-api)
- [搜索工具（10 端点）](#搜索工具)
- [Prompt 管理（10 端点）](#prompt-管理)
- [RAG（2 端点）](#rag)

---

## 文件管理

OpenAI 兼容的文件 API。

```bash
# 上传文件
curl -X POST http://localhost:4000/v1/files \
  -H "Authorization: Bearer sk-your-key" \
  -F "file=@data.jsonl" \
  -F "purpose=fine-tune"

# 列出文件
curl http://localhost:4000/v1/files \
  -H "Authorization: Bearer sk-your-key"

# 获取文件信息
curl http://localhost:4000/v1/files/file-xxx \
  -H "Authorization: Bearer sk-your-key"

# 获取文件内容
curl http://localhost:4000/v1/files/file-xxx/content \
  -H "Authorization: Bearer sk-your-key"

# 删除文件
curl -X DELETE http://localhost:4000/v1/files/file-xxx \
  -H "Authorization: Bearer sk-your-key"
```

**Provider 特定文件上传：**

```bash
# 上传到特定 Provider
curl -X POST http://localhost:4000/azure/v1/files \
  -H "Authorization: Bearer sk-your-key" \
  -F "file=@data.jsonl" \
  -F "purpose=fine-tune"
```

---

## Batch 处理

大批量异步请求处理（如批量翻译、批量分析）。

```bash
# 创建 Batch
curl -X POST http://localhost:4000/v1/batches \
  -H "Authorization: Bearer sk-your-key" \
  -d '{
    "input_file_id": "file-xxx",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'

# 查询 Batch 状态
curl http://localhost:4000/v1/batches/batch-xxx \
  -H "Authorization: Bearer sk-your-key"

# 列出所有 Batch
curl http://localhost:4000/v1/batches \
  -H "Authorization: Bearer sk-your-key"

# 取消 Batch
curl -X POST http://localhost:4000/v1/batches/batch-xxx/cancel \
  -H "Authorization: Bearer sk-your-key"
```

**Batch 输入文件格式（.jsonl）：**

```jsonl
{"custom_id": "req-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Translate to French: Hello"}]}}
{"custom_id": "req-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Translate to French: World"}]}}
```

---

## 微调

```bash
# 创建微调任务
curl -X POST http://localhost:4000/v1/fine_tuning/jobs \
  -H "Authorization: Bearer sk-your-key" \
  -d '{
    "model": "gpt-4o-mini-2024-07-18",
    "training_file": "file-xxx",
    "hyperparameters": {"n_epochs": 3}
  }'

# 列出微调任务
curl http://localhost:4000/v1/fine_tuning/jobs \
  -H "Authorization: Bearer sk-your-key"

# 查询微调任务
curl http://localhost:4000/v1/fine_tuning/jobs/ftjob-xxx \
  -H "Authorization: Bearer sk-your-key"

# 取消微调
curl -X POST http://localhost:4000/v1/fine_tuning/jobs/ftjob-xxx/cancel \
  -H "Authorization: Bearer sk-your-key"
```

---

## 向量存储

用于 Assistants 和 RAG 的向量存储管理。

### 向量存储 CRUD

```bash
# 创建
curl -X POST http://localhost:4000/v1/vector_stores \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"name": "my-knowledge-base"}'

# 列出
curl http://localhost:4000/v1/vector_stores \
  -H "Authorization: Bearer sk-your-key"

# 查询
curl http://localhost:4000/v1/vector_stores/vs-xxx \
  -H "Authorization: Bearer sk-your-key"

# 更新
curl -X POST http://localhost:4000/v1/vector_stores/vs-xxx \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"name": "updated-name"}'

# 删除
curl -X DELETE http://localhost:4000/v1/vector_stores/vs-xxx \
  -H "Authorization: Bearer sk-your-key"
```

### 向量存储文件

```bash
# 上传文件到向量存储
curl -X POST http://localhost:4000/v1/vector_stores/vs-xxx/files \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"file_id": "file-xxx"}'

# 列出向量存储文件
curl http://localhost:4000/v1/vector_stores/vs-xxx/files \
  -H "Authorization: Bearer sk-your-key"

# 获取文件
curl http://localhost:4000/v1/vector_stores/vs-xxx/files/file-xxx \
  -H "Authorization: Bearer sk-your-key"

# 删除文件
curl -X DELETE http://localhost:4000/v1/vector_stores/vs-xxx/files/file-xxx \
  -H "Authorization: Bearer sk-your-key"

# 批量上传
curl -X POST http://localhost:4000/v1/vector_stores/vs-xxx/file_batches \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"file_ids": ["file-1", "file-2"]}'

# 查询批量状态
curl http://localhost:4000/v1/vector_stores/vs-xxx/file_batches/batch-xxx \
  -H "Authorization: Bearer sk-your-key"
```

---

## 缓存管理

### 缓存配置

```bash
# 查看缓存配置
curl http://localhost:4000/cache/config \
  -H "Authorization: Bearer sk-master-key"

# 刷新缓存（删除所有缓存）
curl -X POST http://localhost:4000/cache/flush \
  -H "Authorization: Bearer sk-master-key"

# 查询单个缓存
curl -X POST http://localhost:4000/cache/get \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"key": "cache-key-xxx"}'

# 删除单个缓存
curl -X POST http://localhost:4000/cache/delete \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"keys": ["cache-key-xxx"]}'

# ping 缓存
curl http://localhost:4000/cache/ping \
  -H "Authorization: Bearer sk-master-key"
```

### 请求级缓存控制

```json
{
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "hello"}],
  "caching": true,
  "metadata": {
    "cache_control": {"ttl": 3600}
  }
}
```

---

## 护栏 API

通过 API 动态管理护栏配置。

### 护栏 CRUD

```bash
# 列出护栏
curl http://localhost:4000/v1/guardrails \
  -H "Authorization: Bearer sk-master-key"

# 创建护栏
curl -X POST http://localhost:4000/v1/guardrails \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "guardrail_name": "pii-guard",
    "litellm_params": {
      "guardrail": "presidio",
      "mode": "pre_call"
    },
    "presidio_config": {
      "pii_entities_config": {
        "CREDIT_CARD": {"action": "MASK"},
        "EMAIL_ADDRESS": {"action": "BLOCK"}
      }
    }
  }'

# 查询护栏
curl http://localhost:4000/v1/guardrails/pii-guard \
  -H "Authorization: Bearer sk-master-key"

# 更新护栏
curl -X PUT http://localhost:4000/v1/guardrails/pii-guard \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"presidio_config": {"pii_entities_config": {"CREDIT_CARD": {"action": "BLOCK"}}}}'

# 删除护栏
curl -X DELETE http://localhost:4000/v1/guardrails/pii-guard \
  -H "Authorization: Bearer sk-master-key"
```

---

## 策略管理

更细粒度的安全策略管理。

```bash
# 列出策略
curl http://localhost:4000/v1/policies \
  -H "Authorization: Bearer sk-master-key"

# 创建策略
curl -X POST http://localhost:4000/v1/policies \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "policy_name": "no-pii-in-output",
    "policy_type": "output_filter",
    "config": {...}
  }'

# 查询
curl http://localhost:4000/v1/policies/policy-xxx \
  -H "Authorization: Bearer sk-master-key"

# 更新
curl -X PUT http://localhost:4000/v1/policies/policy-xxx \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"config": {...}}'

# 删除
curl -X DELETE http://localhost:4000/v1/policies/policy-xxx \
  -H "Authorization: Bearer sk-master-key"
```

---

## OpenAI Evals API

用于模型评估的 API。

### Eval CRUD

```bash
# 创建 Eval
curl -X POST http://localhost:4000/v1/evals \
  -H "Authorization: Bearer sk-your-key" \
  -d '{
    "name": "my-eval",
    "data_source_config": {...},
    "testing_criteria": [...]
  }'

# 列出 Evals
curl http://localhost:4000/v1/evals \
  -H "Authorization: Bearer sk-your-key"

# 查询
curl http://localhost:4000/v1/evals/eval-xxx \
  -H "Authorization: Bearer sk-your-key"

# 更新
curl -X POST http://localhost:4000/v1/evals/eval-xxx \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"name": "updated-eval"}'

# 删除
curl -X DELETE http://localhost:4000/v1/evals/eval-xxx \
  -H "Authorization: Bearer sk-your-key"
```

### Eval Runs

```bash
# 创建运行
curl -X POST http://localhost:4000/v1/evals/eval-xxx/runs \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"model": "gpt-4o"}'

# 列出运行
curl http://localhost:4000/v1/evals/eval-xxx/runs \
  -H "Authorization: Bearer sk-your-key"

# 查询运行
curl http://localhost:4000/v1/evals/eval-xxx/runs/run-xxx \
  -H "Authorization: Bearer sk-your-key"

# 删除运行
curl -X DELETE http://localhost:4000/v1/evals/eval-xxx/runs/run-xxx \
  -H "Authorization: Bearer sk-your-key"

# 获取运行输出
curl http://localhost:4000/v1/evals/eval-xxx/runs/run-xxx/output_items \
  -H "Authorization: Bearer sk-your-key"
```

---

## 搜索工具

### Web 搜索

```bash
# Unified 搜索
curl -X POST http://localhost:4000/v1/search \
  -H "Authorization: Bearer sk-your-key" \
  -d '{"query": "latest news about AI", "search_context_size": "medium"}'
```

### 搜索工具管理

```bash
# 列出搜索工具
curl http://localhost:4000/v1/search/tools \
  -H "Authorization: Bearer sk-master-key"

# 配置搜索工具
curl -X POST http://localhost:4000/v1/search/tools \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"tool_name": "tavily", "api_key": "xxx"}'
```

---

## Prompt 管理

### Prompt CRUD

```bash
# 创建 Prompt
curl -X POST http://localhost:4000/v1/prompts \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "prompt_name": "customer-support",
    "prompt_template": "You are a helpful customer support agent for {{company_name}}.",
    "metadata": {"version": "1.0"}
  }'

# 列出 Prompts
curl http://localhost:4000/v1/prompts \
  -H "Authorization: Bearer sk-master-key"

# 查询
curl http://localhost:4000/v1/prompts/customer-support \
  -H "Authorization: Bearer sk-master-key"

# 更新
curl -X PUT http://localhost:4000/v1/prompts/customer-support \
  -H "Authorization: Bearer sk-master-key" \
  -d '{"prompt_template": "Updated template..."}'

# 删除
curl -X DELETE http://localhost:4000/v1/prompts/customer-support \
  -H "Authorization: Bearer sk-master-key"
```

### 在请求中使用 Prompt

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -d '{
    "model": "gpt-4o",
    "prompt_id": "customer-support",
    "prompt_variables": {"company_name": "Acme Corp"},
    "messages": [{"role": "user", "content": "I need help with my order"}]
  }'
```

---

## RAG

检索增强生成。

```bash
# RAG 查询
curl -X POST http://localhost:4000/v1/rag/query \
  -H "Authorization: Bearer sk-your-key" \
  -d '{
    "query": "What is our refund policy?",
    "vector_store_ids": ["vs-xxx"],
    "model": "gpt-4o"
  }'

# RAG 配置
curl http://localhost:4000/v1/rag/config \
  -H "Authorization: Bearer sk-master-key"
```
