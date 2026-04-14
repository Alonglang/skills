---
name: vllm-ops
description: 面向 vLLM 的配置、维护、部署、开发与性能调优助手。只要用户提到 vllm、vllm serve、LLM 推理服务、engine args、serve args、KV cache、tensor parallel、pipeline parallel、quantization、benchmark、吞吐、延迟、OOM、分布式推理、OpenAI-compatible server、vLLM Kubernetes/Docker 部署、vLLM 故障排查，或希望获得 vLLM 的参数建议、调优建议、运维建议、开发接入建议时，都应使用此技能。特别地，当用户在 NVIDIA DGX Spark / GB10 / SM121 上部署模型（包括 Gemma4、NVFP4、Marlin 后端相关问题）、遇到 CUTLASS FP4 崩溃、torch.compile aarch64 序列化问题、混合注意力架构 KV cache 异常、或 sglang 在 DGX Spark 上的兼容性问题时，必须使用此技能。
---

# vLLM Ops

把 vLLM 官方文档整理成一个可直接回答“怎么装、怎么配、怎么跑、怎么排障、怎么调优”的技能。

## 使用方式

先判断用户意图属于哪一类，再加载对应参考文件：

1. **安装 / 环境选择**
   - 读取 `references/install-and-environment.md`
2. **离线推理 / 在线服务 / 参数配置**
   - 读取 `references/configuration-and-serving.md`
3. **部署 / 观测 / 故障排查 / 分布式**
   - 读取 `references/deployment-and-operations.md`
4. **吞吐 / 延迟 / 内存 / 并行 / benchmark 调优**
   - 读取 `references/performance-tuning.md`
5. **特定硬件 / 特定模型的已知坑和调优经验**（如 GB10、Gemma4、NVFP4）
   - 读取 `references/hardware-model-specific.md`

如果请求跨多个主题，先回答用户当前最关键的决策，再补充关联主题。

这些 `references/` 文件就是技能的主要知识体。回答时优先复用其中已经整理好的判断规则、参数优先级、排障路径和安全 caveat，而不是只复述本文件的摘要。

## 回答顺序

默认按这个顺序组织答案：

1. 给出**推荐默认方案**
2. 给出**需要的命令、参数或配置**
3. 给出**关键限制、兼容性或安全 caveat**
4. 如果问题涉及性能或稳定性，补充**下一步观测/调优方向**

不要一上来枚举所有参数。优先给用户最稳妥、最常用、最容易成功的路径。

## 核心决策规则

### 1. 入口选择

- 如果用户是在自己代码里直接推理，优先走 `LLM(...)`
- 如果用户要暴露 HTTP 接口或兼容 OpenAI 客户端，优先走 `vllm serve`
- 如果用户在问部署到生产，优先同时考虑 `serve`、部署文档、观测与安全

### 2. 默认参数来源

- 遇到“为什么默认结果和以前不同”或“为什么采样行为怪了”时，优先检查 `generation_config.json`
- 如果用户想用 vLLM 自己的中性默认值，明确建议：
  - 离线：`generation_config="vllm"`
  - 在线：`--generation-config vllm`

### 3. Chat 模型

- `llm.generate` 不会自动应用 chat template
- 对 instruct/chat 模型，优先建议：
  - 手动应用 tokenizer chat template
  - 或直接使用 `llm.chat(...)`
- 对 `vllm serve`，如果模型缺少 chat template，要显式传 `--chat-template`

### 4. 配置优先级

如果用户使用 `vllm serve --config config.yaml`，明确说明优先级：

`命令行 > 配置文件 > 默认值`

### 5. 内存与 OOM

OOM 或显存不够时，优先按下面顺序排查：

1. 增加 `tensor_parallel_size`
2. 使用 quantization 或更低精度
3. 减少 `max_model_len`
4. 减少 `max_num_seqs`
5. 减少 CUDA graph 占用，必要时 `enforce_eager=True`
6. 多模态场景下减少 `limit_mm_per_prompt` 或 `mm_processor_kwargs`

### 6. 吞吐与延迟

性能问题优先看这些信号：

- `num_preemptions`
- `kv_cache_usage_perc`
- `num_requests_running`
- `num_requests_waiting`
- `e2e_request_latency_seconds`
- `inter_token_latency_seconds`

如果用户没有任何观测数据，不要直接胡乱调参；先建议看 `/metrics` 和日志。

### 7. Preemption

如果日志里出现 preemption / recompute，优先建议：

- 增加 `gpu_memory_utilization`
- 降低 `max_num_seqs`
- 降低 `max_num_batched_tokens`
- 增加 `tensor_parallel_size`
- 必要时增加 `pipeline_parallel_size`

### 8. Chunked prefill

- V1 中 chunked prefill 尽可能默认开启
- 调 `max_num_batched_tokens` 时：
  - 更小：更好 ITL
  - 更大：更好 TTFT / 更高吞吐
  - 小模型大 GPU 场景，吞吐通常建议 `> 8192`
- 如果禁用了 chunked prefill，要警惕：
  - `max_num_batched_tokens < max_model_len` 可能直接导致启动失败

### 9. 并行策略

对单个模型副本，优先按这个决策树：

- 单卡能放下：不要分布式
- 单机多卡能放下：优先 tensor parallel
- 单机放不下：跨节点时用 tensor parallel + pipeline parallel

补充规则：

- 如果单机能放下，但 GPU 拆分不均匀，优先考虑 pipeline parallel
- 如果 GPU 没有 NVLINK（例如 L40S），pipeline parallel 可能比 tensor parallel 更合适

### 10. 分布式故障

如果用户遇到多机多卡问题，先检查：

- `VLLM_HOST_IP` 是否和 Ray 看到的节点 IP 一致
- 是否在集群创建时统一传了 NCCL / 网络相关环境变量
- GPU-to-GPU 跨节点通信是否正常

当看到：

`No available node types can fulfill resource request`

先怀疑 IP / 网卡 / 资源识别问题，不要先假设 GPU 数量不足。

### 11. 安全

永远不要把 `--api-key` 当成完整安全边界。

必须主动提醒：

- 多机通信默认不安全
- 只 `/v1` 路径下的 OpenAI 风格接口受 `--api-key` 保护
- 还有很多未受保护的端点
- 生产环境必须加：
  - 内网隔离
  - 防火墙
  - 最小暴露端口

如果涉及多模态 URL，补充：

- `--allowed-media-domains`
- `VLLM_MEDIA_URL_ALLOW_REDIRECTS=0`

## 调优建议风格

当用户问“怎么调优”时，不要只给参数表。优先输出：

1. 当前最可能的瓶颈
2. 最值得先试的 2-4 个旋钮
3. 每个旋钮对吞吐、延迟、显存的影响方向
4. 需要看哪些指标来判断是否真的变好

## 参考文件

- `references/install-and-environment.md`
- `references/configuration-and-serving.md`
- `references/deployment-and-operations.md`
- `references/performance-tuning.md`
- `references/hardware-model-specific.md` — GB10、Gemma4-26B NVFP4 等特定硬件/模型的实战经验

当需要更详细的解释时，只读取与当前问题直接相关的参考文件，不要全部加载。
