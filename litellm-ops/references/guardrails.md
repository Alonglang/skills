# LiteLLM 护栏配置

护栏（Guardrails）在 LLM 请求的不同阶段执行安全检查，支持 PII 检测、内容过滤、提示注入防护等。

---

## 执行模式

| 模式 | 时机 | 典型用途 |
|------|------|---------|
| `pre_call` | 请求发到 Provider **之前** | PII 检测、提示注入防护、输入验证 |
| `post_call` | 收到 Provider 响应**之后** | 输出内容过滤、敏感信息检测 |
| `during_call` | 流式响应**过程中** | 实时内容拦截 |

---

## 护栏配置基础

### 在 config.yaml 中定义

```yaml
litellm_settings:
  guardrails:
    - guardrail_name: "pii-protection"
      litellm_params:
        guardrail: presidio          # 护栏提供商
        mode: pre_call               # 执行时机
      # 提供商特定配置
      presidio_config:
        output_parse_pii: true
        pii_entities_config:
          CREDIT_CARD:
            action: MASK
          EMAIL_ADDRESS:
            action: BLOCK

    - guardrail_name: "content-safety"
      litellm_params:
        guardrail: lakera
        mode: pre_call
```

### 客户端请求中启用护栏

```json
{
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "..."}],
  "metadata": {
    "guardrails": ["pii-protection", "content-safety"]
  }
}
```

---

## 护栏分类与提供商

### PII（个人身份信息）检测

| 提供商 | 标识 | 特点 |
|--------|------|------|
| **Presidio** | `presidio` | 微软开源，可本地部署，实体级精细控制 |
| **LakeraGuard** | `lakera` | 商业服务，含 PII + 提示注入 |
| **Google DLP** | `google-dlp` | Google Cloud 数据防泄露 |

### 内容安全

| 提供商 | 标识 | 特点 |
|--------|------|------|
| **OpenAI Moderation** | `openai-moderation` | OpenAI 内容审查 API |
| **Azure Content Safety** | `azure-content-safety` | Azure 内容安全服务 |
| **Bedrock Guardrails** | `bedrock-guardrails` | AWS Bedrock 护栏 |
| **Google Text Moderation** | `google-text-moderation` | Google 文本审查 |

### 提示注入防护

| 提供商 | 标识 | 特点 |
|--------|------|------|
| **LakeraGuard** | `lakera` | 专业提示注入检测 |
| **Aporia** | `aporia` | AI 安全平台 |

### 企业级

| 提供商 | 标识 | 特点 |
|--------|------|------|
| **Aim Security** | `aim` | 企业 AI 安全 |
| **Pangea** | `pangea` | 安全合规平台 |
| **GuardrailsAI** | `guardrails_ai` | NeMo Guardrails 兼容 |

### 自定义

| 提供商 | 标识 | 特点 |
|--------|------|------|
| **Custom Guardrail** | `custom_guardrail` | Python 自定义回调 |
| **Generic API** | `generic_guardrail_api` | 任何 HTTP API |

---

## Presidio 详细配置

Presidio 是最常用的本地 PII 检测方案。

### 完整配置示例

```yaml
litellm_settings:
  guardrails:
    - guardrail_name: "pii-guard"
      litellm_params:
        guardrail: presidio
        mode: pre_call
      presidio_config:
        output_parse_pii: true
        presidio_ad_hoc_recognizers:   # 自定义识别器（可选）
          - name: "custom_phone"
            supported_entity: "PHONE_NUMBER"
            patterns:
              - name: "china_phone"
                regex: "1[3-9]\\d{9}"
                score: 0.85
        pii_entities_config:
          # 各实体类型的处理动作
          CREDIT_CARD:
            action: MASK               # 掩码替换（****1234）
          EMAIL_ADDRESS:
            action: BLOCK              # 拦截整个请求（返回 400）
          PHONE_NUMBER:
            action: MASK
          PERSON:
            action: ANONYMIZE          # 匿名化（用假名替换）
          LOCATION:
            action: REDACT             # 完全删除
          US_SSN:
            action: BLOCK
          IP_ADDRESS:
            action: MASK
```

### PII 动作说明

| 动作 | 行为 | 示例 |
|------|------|------|
| `MASK` | 用掩码替换 | `4111****1111` |
| `BLOCK` | 拦截请求，返回 400 | 请求被拒绝 |
| `REDACT` | 完全删除 | `[REDACTED]` |
| `ANONYMIZE` | 用假数据替换 | `John` → `James` |

---

## 按维度配置护栏

### 按 API Key 配置

```bash
# 生成密钥时指定护栏
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "models": ["gpt-4o"],
    "guardrails": ["pii-guard"],
    "metadata": {"enforced_guardrails": ["pii-guard"]}
  }'
```

### 按 Team 配置

```bash
curl -X POST http://localhost:4000/team/new \
  -H "Authorization: Bearer sk-master-key" \
  -d '{
    "team_alias": "finance",
    "guardrails": ["pii-guard", "content-safety"]
  }'
```

### 全局强制（default_on）

```yaml
litellm_settings:
  guardrails:
    - guardrail_name: "mandatory-pii"
      litellm_params:
        guardrail: presidio
        mode: pre_call
        default_on: true      # 所有请求强制执行，无需客户端指定
```

---

## 自定义护栏

### Python 自定义回调

```python
# my_guardrail.py
from litellm.integrations.custom_guardrail import CustomGuardrail
from litellm.types.guardrails import GuardrailEventHooks

class MyGuardrail(CustomGuardrail):
    async def async_pre_call_hook(self, data, user_api_key_dict, call_type):
        messages = data.get("messages", [])
        for msg in messages:
            if "forbidden_word" in msg.get("content", ""):
                raise ValueError("Request blocked by custom guardrail")
        return data

    async def async_post_call_success_hook(self, data, user_api_key_dict, response):
        # 检查响应内容
        return response
```

```yaml
litellm_settings:
  guardrails:
    - guardrail_name: "custom-check"
      litellm_params:
        guardrail: my_guardrail.MyGuardrail
        mode: pre_call
```

### Generic API 护栏

```yaml
litellm_settings:
  guardrails:
    - guardrail_name: "external-check"
      litellm_params:
        guardrail: generic_guardrail_api
        mode: pre_call
        api_base: "https://my-guardrail-service.com/check"
        api_key: os.environ/GUARDRAIL_API_KEY
```

---

## 护栏与路由的交互

- 护栏在路由**之前**执行（pre_call 模式）
- 如果 pre_call 护栏拦截请求，不会消耗 Provider 调用
- post_call 护栏在响应返回后执行，如果拦截，客户端收到错误但 Provider 调用已发生
- 建议：敏感内容检测用 `pre_call`，输出质量检查用 `post_call`

---

## 护栏行为细节

### 拦截时的错误响应

| 模式 | 拦截行为 | HTTP 状态码 | 计费 |
|------|---------|------------|------|
| `pre_call` BLOCK | 请求被拒绝，不调用 Provider | **400** Bad Request | **不计费** |
| `pre_call` MASK | 敏感内容被掩码后继续发送 | 200（正常响应） | 正常计费 |
| `post_call` BLOCK | Provider 已调用，响应被拦截 | **400** Bad Request | **已计费** |
| `during_call` BLOCK | 流式传输中断 | **400** + 部分响应 | **已计费** |

### 延迟影响

| 护栏类型 | 典型额外延迟 | 说明 |
|---------|-------------|------|
| Presidio（本地） | 5-20ms | 取决于文本长度和实体数量 |
| LakeraGuard（API） | 50-200ms | 网络往返 |
| OpenAI Moderation | 100-300ms | 网络往返 |
| Custom（本地代码） | <5ms | 取决于实现 |
| Generic API | 变化大 | 取决于外部服务 |

### 护栏自身失败时的行为

- **默认：护栏失败 = 请求失败**（返回 500）
- 如果需要护栏失败时放行（fail-open），需要在自定义护栏中 try/except 处理
- 建议：为外部 API 护栏设置超时，避免护栏服务宕机拖垮整个 Proxy

### 多护栏优先级

当多个护栏同时配置时：
- 按 `guardrails` 列表中的**顺序依次执行**
- 任何一个护栏 BLOCK → 立即终止，后续护栏不执行
- MASK/ANONYMIZE 操作会传递给下一个护栏（处理后的文本）
