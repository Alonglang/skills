# Performance tuning

## 先看什么

调优时，优先区分用户想优化的是：

- 吞吐
- 首 token 延迟（TTFT）
- token 间延迟（ITL / TPOT）
- 显存 / 内存
- 并发能力

没有指标时，先建议：

- `/metrics`
- 相关日志

如果用户已经贴出启动日志，优先寻找：

- `GPU KV cache size`
- `Maximum concurrency`
- preemption / recompute 警告

## 并行策略

### 基础决策树

- 单卡能放下：不分布式
- 单机多卡能放下：tensor parallel
- 单机放不下：tensor parallel + pipeline parallel

回答“需要多少 GPU”时，优先同时回答两件事：

1. 能不能放得下
2. 在目标上下文长度下能支持多少并发

### 重要补充

- 如果 GPU 数量拆分不匀，pipeline parallel 可以兜底
- 没有 NVLINK 的 GPU（例如 L40S），pipeline parallel 可能更优
- 如果模型虽然能放下，但 `Maximum concurrency` 远低于业务需求，也应继续加 GPU / 调整并行，不要只看“是否能启动”

## Preemption

如果看到 preemption / recompute：

优先试：

1. 提高 `gpu_memory_utilization`
2. 减少 `max_num_seqs`
3. 减少 `max_num_batched_tokens`
4. 提高 `tensor_parallel_size`
5. 再考虑 `pipeline_parallel_size`

解释方向：

- 前三项主要是在给 KV cache 腾空间
- 后两项是在给权重占用腾空间或改变并行布局

## Chunked prefill

V1 中尽可能默认开启。

### `max_num_batched_tokens`

- 更小：更好 ITL
- 更大：更好 TTFT
- 小模型 + 大 GPU，吞吐常建议 `> 8192`

如果 chunked prefill 关闭：

- `max_num_batched_tokens < max_model_len` 可能导致启动问题

## 内存压缩路线

OOM 时按这个顺序考虑：

1. `tensor_parallel_size`
2. quantization
3. 更低精度
4. 更小 `max_model_len`
5. 更小 `max_num_seqs`
6. 减少 CUDA graph 捕获
7. 多模态限制与 processor 参数

多模态场景还要补充：

- `limit_mm_per_prompt`
- `mm_processor_kwargs`

并说明：

- size hints 影响的是 profiling / 预留，不直接改变真实输入处理逻辑

## CUDA graph / 编译

优化等级：

- `-O0`
- `-O1`
- `-O2`（默认）
- `-O3`

理解方式：

- 更高优化等级通常换来更长启动时间
- 更低优化等级更适合调试或快速启动

显存紧张时：

- 可减少 cudagraph capture sizes
- 必要时 `enforce_eager=True`

## benchmark 方法

### 单配置压测

优先考虑：

- GuideLLM

### 系统化扫参

优先考虑：

- `vllm bench sweep serve`
- `vllm bench sweep serve_workload`

关键规则：

- `--serve-params` 与 `--bench-params` 会做笛卡尔积
- 先 `--dry-run`
- 中断后可 `--resume`
- sweep 之间会重置缓存，减少结果互相污染

## 应该优先关注的文档域

- `configuration/optimization`
- `configuration/conserving_memory`
- `configuration/engine_args`
- `configuration/serve_args`
- `serving/parallelism_scaling`
- `benchmarking/sweeps`
- `benchmarking/dashboard`
- `usage/metrics`

## 实战回答模板

面对“吞吐不高 / 延迟太高 / OOM / 并发太低”这类问题，优先按以下格式回答：

1. 最可能的瓶颈
2. 先试哪 2-4 个参数
3. 每个参数影响吞吐 / 延迟 / 显存的方向
4. 应该看哪些指标判断是否真的改善

## 高频瓶颈到旋钮映射

### 吞吐不高

先看：

- `num_requests_waiting`
- `kv_cache_usage_perc`
- `num_preemptions`

常见首选旋钮：

- `max_num_batched_tokens`
- `max_num_seqs`
- `gpu_memory_utilization`
- `tensor_parallel_size` / `pipeline_parallel_size`

### ITL 太差

优先考虑：

- 降低 `max_num_batched_tokens`
- 检查 decode 是否被大 prefill 拖慢

### TTFT 太差

优先考虑：

- 适当提高 `max_num_batched_tokens`
- 看是否启动了过重的编译/图捕获策略

### OOM 或 cache 压力大

优先考虑：

- TP / quantization / 更短上下文
- 更小 batch budget
- 减少 graph capture
