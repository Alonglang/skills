# LiteLLM 推理 API 参考

所有推理端点兼容 OpenAI SDK 格式。基础 URL：`http://localhost:4000`

> 所有请求需要 `Authorization: Bearer <your-key>` 头

---

## 目录

- [Chat Completions](#chat-completions)
- [Completions（文本补全）](#completions)
- [Embeddings（向量嵌入）](#embeddings)
- [Images（图像生成/编辑）](#images)
- [Audio（语音合成/转录）](#audio)
- [Moderations（内容审查）](#moderations)
- [Responses API](#responses-api)
- [Rerank（重排序）](#rerank)
- [OCR（光学字符识别）](#ocr)
- [Video（视频生成）](#video)
- [Realtime（实时语音）](#realtime)

---

## Chat Completions

最核心的端点，支持所有 LLM 提供商的聊天补全。

**端点：** `POST /v1/chat/completions`（兼容 `/chat/completions`）

### 基本调用

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### 流式响应

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Write a story"}],
    "stream": true,
    "stream_options": {"include_usage": true}
  }'
```

### Function Calling / Tool Use

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "What is the weather in SF?"}],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "Get current weather",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {"type": "string"}
            },
            "required": ["location"]
          }
        }
      }
    ],
    "tool_choice": "auto"
  }'
```

### 结构化输出（JSON Mode）

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "List 3 colors"}],
    "response_format": {"type": "json_object"}
  }'
```

### 视觉（图像输入）

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "What is in this image?"},
          {"type": "image_url", "image_url": {"url": "https://example.com/image.png"}}
        ]
      }
    ]
  }'
```

### LiteLLM 扩展参数

在标准 OpenAI 参数之外，LiteLLM 支持通过 `metadata` 传递扩展参数：

```json
{
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "hello"}],
  "metadata": {
    "tags": ["production", "chatbot"],
    "guardrails": ["pii-guard"],
    "trace_id": "trace-123",
    "no-log": false
  },
  "caching": true,
  "num_retries": 3,
  "fallbacks": ["claude-sonnet", "gemini-pro"],
  "context_window_fallback_dict": {"gpt-4o": "gpt-4o-128k"}
}
```

| 扩展参数 | 类型 | 说明 |
|---------|------|------|
| `metadata.tags` | list[str] | 请求标签（用于 tag-based 路由和花费追踪） |
| `metadata.guardrails` | list[str] | 启用的护栏名称 |
| `metadata.trace_id` | str | 链路追踪 ID（传递到 Langfuse 等） |
| `metadata.no-log` | bool | 跳过日志记录 |
| `caching` | bool | 启用/禁用缓存 |
| `num_retries` | int | 重试次数 |
| `fallbacks` | list[str] | 请求级回退模型列表 |
| `context_window_fallback_dict` | dict | 上下文超限回退映射 |

### 使用 OpenAI SDK（Python）

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-your-litellm-key",
    base_url="http://localhost:4000/v1"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True
)
for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

---

## Completions

传统文本补全（非 Chat 格式）。

**端点：** `POST /v1/completions`

```bash
curl -X POST http://localhost:4000/v1/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo-instruct",
    "prompt": "Once upon a time",
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

---

## Embeddings

生成文本的向量嵌入。

**端点：** `POST /v1/embeddings`

```bash
curl -X POST http://localhost:4000/v1/embeddings \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "The quick brown fox",
    "encoding_format": "float"
  }'
```

### 批量嵌入

```bash
curl -X POST http://localhost:4000/v1/embeddings \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": ["First text", "Second text", "Third text"]
  }'
```

---

## Images

### 图像生成

**端点：** `POST /v1/images/generations`

```bash
curl -X POST http://localhost:4000/v1/images/generations \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dall-e-3",
    "prompt": "A cute cat wearing a top hat",
    "n": 1,
    "size": "1024x1024",
    "quality": "hd"
  }'
```

### 图像编辑

**端点：** `POST /v1/images/edits`

```bash
curl -X POST http://localhost:4000/v1/images/edits \
  -H "Authorization: Bearer sk-your-key" \
  -F "model=dall-e-2" \
  -F "image=@original.png" \
  -F "mask=@mask.png" \
  -F "prompt=Add a rainbow in the sky" \
  -F "n=1" \
  -F "size=1024x1024"
```

---

## Audio

### 语音合成（Text-to-Speech）

**端点：** `POST /v1/audio/speech`

```bash
curl -X POST http://localhost:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "Hello, how are you today?",
    "voice": "alloy",
    "response_format": "mp3"
  }' --output speech.mp3
```

### 语音转文字（Transcription）

**端点：** `POST /v1/audio/transcriptions`

```bash
curl -X POST http://localhost:4000/v1/audio/transcriptions \
  -H "Authorization: Bearer sk-your-key" \
  -F "model=whisper-1" \
  -F "file=@audio.mp3" \
  -F "language=zh"
```

---

## Moderations

内容审查。

**端点：** `POST /v1/moderations`

```bash
curl -X POST http://localhost:4000/v1/moderations \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-moderation-latest",
    "input": "Some text to check"
  }'
```

---

## Responses API

OpenAI 新版 Responses API（替代 Assistants 的轻量方案）。

### 创建响应

**端点：** `POST /v1/responses`

```bash
curl -X POST http://localhost:4000/v1/responses \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "input": "Tell me a joke"
  }'
```

### 流式响应

```bash
curl -X POST http://localhost:4000/v1/responses \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "input": "Write a haiku",
    "stream": true
  }'
```

### 获取响应

**端点：** `GET /v1/responses/{response_id}`

```bash
curl http://localhost:4000/v1/responses/resp_xxx \
  -H "Authorization: Bearer sk-your-key"
```

### 获取响应输入项

**端点：** `GET /v1/responses/{response_id}/input_items`

```bash
curl http://localhost:4000/v1/responses/resp_xxx/input_items \
  -H "Authorization: Bearer sk-your-key"
```

### 取消响应

**端点：** `POST /v1/responses/{response_id}/cancel`

```bash
curl -X POST http://localhost:4000/v1/responses/resp_xxx/cancel \
  -H "Authorization: Bearer sk-your-key"
```

### 删除响应

**端点：** `DELETE /v1/responses/{response_id}`

```bash
curl -X DELETE http://localhost:4000/v1/responses/resp_xxx \
  -H "Authorization: Bearer sk-your-key"
```

### Compact Response

**端点：** `POST /v1/responses/compact`

用于压缩长对话上下文：

```bash
curl -X POST http://localhost:4000/v1/responses/compact \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "input": "Summarize the conversation so far",
    "previous_response_id": "resp_xxx"
  }'
```

---

## Rerank

文档重排序（用于 RAG 检索结果优化）。

**端点：** `POST /v1/rerank`（兼容 `/v2/rerank`）

```bash
curl -X POST http://localhost:4000/v1/rerank \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "rerank-english-v3.0",
    "query": "What is machine learning?",
    "documents": [
      "Machine learning is a subset of AI",
      "The weather is nice today",
      "Deep learning uses neural networks"
    ],
    "top_n": 2
  }'
```

---

## OCR

光学字符识别。

**端点：** `POST /v1/ocr`

```bash
curl -X POST http://localhost:4000/v1/ocr \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "image_url": "https://example.com/document.png"
  }'
```

---

## Video

视频生成（Sora 等模型）。

### 生成视频

**端点：** `POST /v1/videos`

```bash
curl -X POST http://localhost:4000/v1/videos \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sora",
    "prompt": "A cat playing piano",
    "duration": 5
  }'
# 返回 video_id，需要轮询状态
```

### 查询视频状态

**端点：** `GET /v1/videos/{video_id}`

```bash
curl http://localhost:4000/v1/videos/vid_xxx \
  -H "Authorization: Bearer sk-your-key"
# status: "processing" | "completed" | "failed"
```

### 获取视频内容

**端点：** `GET /v1/videos/{video_id}/content`

```bash
curl http://localhost:4000/v1/videos/vid_xxx/content \
  -H "Authorization: Bearer sk-your-key" --output video.mp4
```

### 其他视频端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/v1/videos` | GET | 列出所有视频 |
| `/v1/videos/{id}/remix` | POST | 视频混剪 |
| `/v1/videos/characters` | POST | 创建视频角色 |
| `/v1/videos/characters/{id}` | GET | 获取视频角色 |
| `/v1/videos/edits` | POST | 视频编辑 |
| `/v1/videos/extensions` | POST | 视频扩展（延长） |

---

## Realtime

实时语音对话（WebRTC）。

### 创建实时会话凭证

**端点：** `POST /v1/realtime/client_secrets`

```bash
curl -X POST http://localhost:4000/v1/realtime/client_secrets \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-realtime-preview"
  }'
# 返回临时 client_secret 供前端 WebRTC 连接
```

### 代理实时调用

**端点：** `POST /v1/realtime/calls`

```bash
curl -X POST http://localhost:4000/v1/realtime/calls \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-realtime-preview",
    "voice": "alloy"
  }'
```

---

## 端点兼容性速查

所有推理端点支持以下路径前缀（行为一致）：

| 前缀 | 示例 |
|------|------|
| `/v1/` | `/v1/chat/completions` |
| `/` | `/chat/completions` |
| `/openai/deployments/{model}/` | `/openai/deployments/gpt-4o/chat/completions`（Azure 兼容） |
| `/engines/{model}/` | `/engines/gpt-4o/chat/completions`（旧版兼容） |

---

## 通用错误码

| HTTP 状态码 | 含义 | 常见原因 |
|-------------|------|---------|
| 400 | Bad Request | 参数错误 / 护栏拦截 |
| 401 | Unauthorized | 密钥无效或过期 |
| 403 | Forbidden | 无权访问该模型 |
| 404 | Not Found | 模型不存在 |
| 408 | Timeout | 请求超时 |
| 422 | Unprocessable Entity | 请求体格式错误 |
| 429 | Rate Limited | 超过 RPM/TPM 限制 |
| 500 | Internal Error | 服务端错误 |
| 503 | Service Unavailable | Provider 连接失败 |
