# Configuration and serving

## 两个核心入口

### 离线推理

使用：

- `from vllm import LLM`
- `SamplingParams`

适用于：

- 程序内直接推理
- 本地批量生成

### 在线服务

使用：

```bash
vllm serve <model>
```

适用于：

- OpenAI-compatible HTTP API
- 对外服务
- 需要 `/metrics`

额外事实：

- 单个 `vllm serve` 实例一次只服务一个模型
- 它是 OpenAI-compatible，但不是 OpenAI 完全等价实现
- vLLM 扩展参数可通过 `extra_body` 传入

## 默认行为

### generation_config

默认会读取 Hugging Face 模型仓库里的 `generation_config.json`。

如果用户要 vLLM 自身默认值：

- 离线：`generation_config="vllm"`
- 在线：`--generation-config vllm`

### Chat template

- `llm.generate` 不会自动套 chat template
- instruct/chat 模型应：
  - 手动 `apply_chat_template`
  - 或使用 `llm.chat(...)`
- `vllm serve` 如果模型没有 template，需要传 `--chat-template`
- 如果 content format 自动识别结果不对，可显式设置 `--chat-template-content-format`

### 支持的接口家族

高频需要知道的接口包括：

- `/v1/completions`
- `/v1/chat/completions`
- `/v1/responses`
- `/v1/embeddings`
- ASR 相关接口
- tokenizer / pooling / classify / score / rerank 等非 OpenAI 标准扩展接口

所以当用户说“OpenAI 兼容”时，回答里要区分：

- 标准兼容部分
- vLLM 自定义扩展部分

## serve 配置文件

支持：

```bash
vllm serve --config config.yaml
```

优先级：

1. 命令行
2. config 文件
3. 默认值

## engine args 与 serve args

文档给出的核心模型是：

- `LLM(...)` 与 `vllm serve` 共用同一套底层 engine/config 概念
- 更底层、更权威的类型与默认值来自 `vllm.config`

## 高频配置问题

### 为什么默认结果变了？

先查：

- `generation_config.json`
- dtype / seed / batch invariance

如果用户从旧版本或旧经验迁移，还要补充：

- V1 已经替代 V0
- logprobs、chunked prefill、默认行为与早期版本可能不同

### 为什么 chat 请求报错？

先查：

- 模型是否真有 chat template
- 是否显式传了 `--chat-template`
- content format 是否被错误自动识别

### 为什么输出不稳定 / 复现不了？

先区分：

- sampling 本身是否随机
- 是否受 batch/scheduling 影响
- 是否跨硬件 / 跨版本

可考虑：

- batch invariance
- 离线模式下 `VLLM_ENABLE_V1_MULTIPROCESSING=0`

### 为什么 config 文件没生效？

先查：

- 是否命令行覆盖了 config.yaml

## 常见环境变量

- `VLLM_API_KEY`
- `VLLM_USE_MODELSCOPE`
- `VLLM_CONFIGURE_LOGGING`
- `VLLM_LOGGING_LEVEL`
- `VLLM_LOG_STATS_INTERVAL`

## 可复现性

vLLM 默认不以可复现为第一目标。

### 离线模式

可考虑：

- `VLLM_ENABLE_V1_MULTIPROCESSING=0`
- batch invariance

### 在线模式

可考虑：

- batch invariance

额外注意：

- V1 默认 seed 是 `0`
- 可复现只在**同硬件 + 同版本**前提下更可靠
- 关闭 V1 multiprocessing 可能污染用户代码中的随机状态

## model resolution

模型识别失败时，优先检查 HF `config.json` 的 `architectures` 字段。

必要时可用：

```python
hf_overrides={"architectures": ["..."]}
```

## 服务端补充建议

- 如果用户在 air-gapped 环境下要文档页，提示 `--enable-offline-docs`
- 如果用户说“API key 开了为什么还担心安全”，明确这不是完整安全边界，转到 deployment/operations 文档继续说明
