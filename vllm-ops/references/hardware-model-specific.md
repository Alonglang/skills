# 硬件与模型专项调优经验

本文件记录针对特定硬件 + 特定模型的实战调优经验，包含在官方文档中找不到的坑和最佳实践。

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
