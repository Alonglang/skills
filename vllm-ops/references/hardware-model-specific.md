# 硬件与模型专项调优经验

本文件记录针对特定硬件 + 特定模型的实战调优经验，包含在官方文档中找不到的坑和最佳实践。

---

## NVIDIA GB10（DGX Spark, SM121）+ Gemma-4-31B-IT-NVFP4

> 实战经验来源：2026-04-14 在 xpark2（单 Spark, 128GB 统一内存）上调优

### 硬件特征

| 属性 | 值 |
|------|-----|
| GPU 架构 | Blackwell，计算能力 **SM121**（非数据中心版 Blackwell）|
| 内存 | ~119 GB 统一内存（CPU+GPU 共享）|
| 关键差异 | **缺少 `tcgen05` 指令** → CUTLASS FP4 在此 GPU 上无效 |
| 典型部署 | 单卡，无需 TP |

### SM121 致命陷阱：必须强制 Marlin 后端

SM121 没有数据中心 Blackwell 的 `tcgen05` 张量核心指令，导致 **CUTLASS FP4 内核在此 GPU 上静默失败**（不会报错，只是慢且结果不对）。**必须**通过三个环境变量强制使用 Marlin 路径：

```yaml
environment:
  VLLM_NVFP4_GEMM_BACKEND: marlin
  VLLM_USE_FLASHINFER_MOE_FP4: "0"
  VLLM_TEST_FORCE_FP8_MARLIN: "1"
```

**验证方法**：容器启动日志中必须出现：
```
Using NvFp4LinearBackend.MARLIN for NVFP4 GEMM
```

如果缺少这行，说明在用错误路径。效果：+16% 速度，-7 GB 内存（比损坏的 CUTLASS 路径）。

### aarch64 torch.compile 修复

DGX Spark 是 aarch64，`torch.compile` 的 `AOTAutogradCache` 在此平台序列化时崩溃。必须设置：

```yaml
environment:
  VLLM_DISABLE_COMPILE_CACHE: "1"
```

这保留了 torch.compile 的编译优化，只是跳过了缓存序列化。**不要**设 `enforce_eager=True`，那会完全禁用编译，丢失性能收益。

### 模型架构特征（影响参数选择）

Gemma-4-31B 是**密集模型**（不是 MoE），60 层混合注意力：
- 50 层 sliding window 注意力（window=1024 tokens）
- 10 层全局 full attention（每 6 层 1 个）

**KV cache 反直觉行为**：由于 sliding 层 KV 极小（只需 1024 tokens/seq），`max-model-len=65536` 时 KV capacity **多于** `max-model-len=262144`：

| max-model-len | GPU KV cache size |
|---|---|
| 262144 | 129,408 tokens |
| **65536** | **135,024 tokens**（更多！）|

实践建议：除非用户需要超长上下文，将 `max-model-len` 设为 65536 即可，既省内存又有更大 KV cache。

### 最优生产配置（实测 Round 4）

```yaml
# vLLM v0.19.1.dev6, gemma4-cu130 镜像
command:
  - --max-model-len
  - "65536"
  - --max-num-seqs
  - "64"
  - --max-num-batched-tokens
  - "65536"
  - --gpu-memory-utilization
  - "0.92"
  - --kv-cache-dtype
  - fp8
  - --enable-prefix-caching
  - --compilation-config
  - '{"pass_config": {"fuse_norm_quant": true, "fuse_act_quant": true}, "cudagraph_capture_sizes": [1, 2, 4, 8, 16, 24, 32, 48, 56, 64]}'

environment:
  VLLM_NVFP4_GEMM_BACKEND: marlin
  VLLM_USE_FLASHINFER_MOE_FP4: "0"
  VLLM_TEST_FORCE_FP8_MARLIN: "1"
  VLLM_WORKER_MULTIPROC_METHOD: spawn
  VLLM_DISABLE_COMPILE_CACHE: "1"
  VLLM_ALLOW_LONG_MAX_MODEL_LEN: "1"
```

### 实测吞吐基准（GB10，Gemma-4-31B-IT-NVFP4，input=512/output=128）

| 并发 | Output tok/s |
|------|-------------|
| c=1  | 7.13 |
| c=4  | 26.43 |
| c=8  | 49.37 |
| c=16 | 81.15 |
| c=32 | **94.95**（峰值）|

> 社区参考：单 Spark NVFP4+Marlin c=1 ~7 tok/s，与我们结果一致。
> torch.compile 贡献：decode +10-22%（已含在上述数字中）。

### OOM 防护：安全调参规则

上次宕机根因：同时将 `max-num-seqs` 和 `max-num-batched-tokens` 都翻倍（64 × 131072），加上 CUDA graph capture + torch.compile，峰值超 128GB，触发内核 OOM panic。

**安全规则**（必须遵守）：
1. **每次只增加一个参数**：seqs 或 batched-tokens，不能同时翻倍
2. `max-num-batched-tokens` 保持 **≤ 65536**（上次 OOM 值的一半）
3. 实验阶段用 `restart: "no"`，防止 OOM 后容器自动重启循环再次 OOM
4. 稳定验证通过后再改 `restart: unless-stopped`
5. `cudagraph_capture_sizes` 中的最大值应与 `max-num-seqs` 保持一致

**安全调参顺序**（经过验证的路径）：
```
max-num-seqs: 32 → 48 → 56 → 64（每步验证不 OOM 后再推进）
max-num-batched-tokens: 65536（固定，不随 seqs 增加）
```

### 正确的 benchmark 命令

```bash
docker exec vllm-gemma4-31b-nvfp4 vllm bench serve \
  --backend openai-chat \
  --host localhost --port 8001 \
  --endpoint /v1/chat/completions \
  --model gemma4-31b-it-nvfp4 \
  --tokenizer /models/gemma4 \        # 必须指容器内本地路径
  --dataset-name random \
  --random-input-len 512 \
  --random-output-len 128 \
  --num-prompts 320 \
  --max-concurrency 16
```

**注意**：必须用 `--host/--port/--endpoint`，不能用 `--base-url`（后者会 404）。

### sglang 在此配置下不可用

`scitrera/dgx-spark-sglang:0.5.10` 在 SM121 + Gemma4-31B NVFP4 上有不可绕过的 bug：

- **CUDA graph 模式（默认）**：TVM/FlashInfer RMSNorm kernel 崩溃于任意 batch size
  ```
  ValueError: Mismatched mW.shape[0] on argument #1
  calling: __call__(mX: Tensor([n0, 256], bfloat16), mW: Tensor([256], bfloat16), ...)
  ```
  根因：TVM kernel 对 Gemma4 head_dim=256 的编译 bug，无法通过参数绕过
- **禁用 CUDA graph 模式**：warmup 请求超时（>10 分钟），无法实用
- **结论**：vLLM 是目前 DGX Spark + Gemma4-31B NVFP4 唯一可用方案

---

## NVIDIA GB10（Grace Blackwell）+ Gemma4-26B-A4B NVFP4

### 硬件特征

| 属性 | 值 |
|------|-----|
| GPU 架构 | Blackwell，计算能力 12.1 |
| 内存 | ~119 GB 统一内存（CPU+GPU 共享） |
| 瓶颈特征 | decode 阶段受内存带宽限制 |
| 典型部署 | 单卡，不需要 TP |

### 必要的启动参数

```yaml
# 最小可工作配置（缺一不可）
--model /path/to/Gemma-4-26B-A4B-it-NVFP4
--chat-template /path/to/model/chat_template.jinja   # 必须是模型自带的 266 行版本
--tool-call-parser gemma4                              # 工具调用必须
# --reasoning-parser gemma4   ← 千万不要加，会造成问题
```

**关于 chat template：**
- 使用模型目录下的 `chat_template.jinja`（266 行），包含完整工具调用支持
- 不要使用网上流传的 `moe_tools.jinja`（159 行旧版，功能不完整）

### NVFP4 权重加载 Bug（vLLM ≤ 0.19.x）

**症状：** 容器启动时报 `KeyError: 'layers.0.moe.experts.0.down_proj.weight'`

**原因：** vLLM 内置的 `gemma4.py` 不能处理 NVFP4 量化格式的权重名映射。

**修复方式：** 用修复后的 `gemma4.py` 覆盖容器内的版本：

```yaml
# docker-compose.yml volumes 部分
volumes:
  - ./gemma4.py:/usr/local/lib/python3.12/dist-packages/vllm/model_executor/models/gemma4.py
```

> ⚠️ 验证方法：在容器外用 md5sum 比较你的补丁文件 vs. 容器内的文件。不要在容器内部比较——挂载后容器内路径就是你的文件，md5 永远匹配，无法验证。

### 吞吐调优参数（经过实测的最优值）

```yaml
# 在 docker-compose.yml 中的 command 或环境变量
--max-num-seqs 24                            # 默认 16 不够，KV cache 利用率过低
--max-num-batched-tokens 49152               # 24 * 2048
--gpu-memory-utilization 0.9018              # 由 profiler 推荐，见下文
--cudagraph-capture-sizes 1,2,4,8,16,24     # 覆盖所有并发档位

# 环境变量
VLLM_MEMORY_PROFILER_ESTIMATE_CUDAGRAPHS=1   # 让 profiler 自动推荐 gpu_memory_utilization
```

**如何获取 `gpu_memory_utilization` 推荐值：**

首次启动时，在日志中搜索：

```
Recommended gpu_memory_utilization
```

profiler 输出的值比固定的 `0.9` 更精准。不同机器略有差异（xpark1 推荐 0.9018，xpark2 推荐 0.9026）。

### FlashInfer 自动调优

vLLM 启动后，FlashInfer 的 autotuner 需要 **2-5 分钟** 才能收敛到最优内核选择。

**实践建议：** 服务启动后，先等 5 分钟再开始基准测试，否则得到的是未调优的低结果。

### 实测吞吐基准（GB10，Gemma4-26B-A4B NVFP4）

使用 `vllm bench serve`，512 输入 + 256 输出 tokens，24 并发：

| 指标 | 值 |
|------|-----|
| 持续吞吐（200 请求） | **415 tok/s** |
| 峰值吞吐 | 600 tok/s |
| 单请求吞吐 | ~50 tok/s |
| 首 token 延迟（TTFT P99） | ~2000 ms |
| token 间延迟（TPOT Mean） | ~49 ms |
| 请求失败率 | 0% |

> 注意：burst 测试（短时高并发）可达 621 tok/s，但持续负载下稳定在 415 tok/s。压测要用 `vllm bench serve --num-prompts 200` 这类持续场景，而不是一次性并发。

### KV Cache 利用率与并发调优

判断 `max_num_seqs` 是否需要增加：

```bash
curl -s http://localhost:8000/metrics | grep kv_cache_usage
```

- 如果 `kv_cache_usage_perc` < 50%，说明并发上限太低，可以安全提高 `max_num_seqs`
- 本场景 16 并发时 KV cache 只有 0.6%，提到 24 后吞吐提升 ~27%

### 正确的 benchmark 运行方式

```bash
docker exec vllm-gemma4-26b-a4b vllm bench serve \
  --backend openai-chat \
  --endpoint /v1/chat/completions \         # 必须显式指定
  --host 127.0.0.1 \
  --port 8000 \
  --model <served-model-name> \             # 与 --served-model-name 一致
  --tokenizer /models/gemma4 \              # 必须指向本地路径，无网络时无法从 HF 下载
  --dataset-name random \
  --random-input-len 512 \
  --random-output-len 256 \
  --num-prompts 200 \
  --max-concurrency 24
```

常见错误：
- 不传 `--endpoint /v1/chat/completions`：报 `URL must end with one of: {'chat/completions'}`
- 不传 `--tokenizer /path`：无网络环境下尝试从 HuggingFace 下载失败

---

## Docker 镜像传输（Docker 29 Bug）

### 症状

`docker save image:tag | ssh remote docker load` 后，远端镜像 digest 对，但容器配置（entrypoint、cmd、labels）用的是旧版本。

### 原因

Docker 29 的 bug：当目标机上已有相同 layers 时，`docker load` 会跳过更新 image config，导致新 tag 指向旧 config。

### 正确做法

```bash
# 1. 源机打包
docker save vllm/vllm-openai:gemma4-cu130 | gzip > /tmp/vllm-gemma4.tar.gz

# 2. 传输（直连光纤优先）
scp /tmp/vllm-gemma4.tar.gz root@192.168.1.2:/tmp/

# 3. 目标机：先删旧 tag，再加载
ssh root@192.168.1.2 "docker rmi vllm/vllm-openai:gemma4-cu130 2>/dev/null; \
  docker load -i /tmp/vllm-gemma4.tar.gz"
```

关键：**先 `docker rmi` 再 `docker load`**，强制写入新的 image config。
