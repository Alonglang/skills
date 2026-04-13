# Install and environment

## 推荐默认路径

- Linux
- Python 3.12
- 使用 `uv`

如果用户只是想最快跑起来，默认不要引导去源码编译；优先 quickstart 路径。

## 安装路线

### NVIDIA CUDA

```bash
uv venv --python 3.12 --seed
source .venv/bin/activate
uv pip install vllm --torch-backend=auto
```

### AMD ROCm

```bash
uv venv --python 3.12 --seed
source .venv/bin/activate
uv pip install vllm --extra-index-url https://wheels.vllm.ai/rocm/
```

当前文档强调：

- Python 3.12
- ROCm 7.0
- `glibc >= 2.35`

### TPU

```bash
uv pip install vllm-tpu
```

### CPU

CPU 路线适合基本推理和测试，不是主流高性能生产路径。

重点注意：

- x86 / Arm 有预编译 wheel
- Apple Silicon 与 IBM Z 仍偏实验性
- CPU wheel 常常需要额外设置 `LD_PRELOAD`

尤其是：

- x86 CPU wheel 需要 TCMalloc 和 Intel OpenMP
- Arm CPU wheel 需要 TCMalloc

额外提醒：

- Apple Silicon 在主仓库里仍偏实验性
- 如果用户想在 Apple Silicon 上走 GPU 加速，文档实际引导到 `vllm-metal`
- IBM Z 也是实验性路径

## 开发者安装

### 只改 Python 代码

```bash
VLLM_USE_PRECOMPILED=1 uv pip install --editable .
```

适用场景：

- 只改 Python
- 不改 CUDA / C++ / kernel

如果用户改了 kernel/CUDA/C++，这条路不适用，否则容易遇到动态库缺失或符号不匹配。

### 改 kernel / C++ / CUDA

```bash
uv pip install -e .
```

加速建议：

- `ccache`
- `sccache`
- `MAX_JOBS`

如果本地构建经常打爆机器资源：

- 先降低 `MAX_JOBS`
- 必要时建议用官方/推荐 Docker 环境编译

## 关键环境变量

### 安装 / 构建

- `VLLM_TARGET_DEVICE`
- `VLLM_MAIN_CUDA_VERSION`
- `MAX_JOBS`
- `NVCC_THREADS`
- `CUDA_HOME`
- `VLLM_USE_PRECOMPILED`
- `VLLM_PRECOMPILED_WHEEL_LOCATION`
- `VLLM_PRECOMPILED_WHEEL_COMMIT`

### 运行时

- `VLLM_HOST_IP`
- `VLLM_PORT`
- `VLLM_RPC_BASE_PATH`
- `CUDA_VISIBLE_DEVICES`
- `VLLM_USE_MODELSCOPE`
- `VLLM_API_KEY`
- `VLLM_LOGGING_LEVEL`
- `VLLM_LOG_STATS_INTERVAL`
- `VLLM_NO_USAGE_STATS`
- `DO_NOT_TRACK`

### CPU backend

- `VLLM_CPU_KVCACHE_SPACE`
- `VLLM_CPU_OMP_THREADS_BIND`

## 常见建议

- 如果只想最快启动，优先 quickstart 路径，不要一开始就源码编译
- 如果源码编译 OOM，先降低 `MAX_JOBS`
- 如果要控制设备，优先 `CUDA_VISIBLE_DEVICES`，不要提前自己触碰 CUDA 初始化
- 如果用户想从 ModelScope 拉模型，提示 `VLLM_USE_MODELSCOPE=True`
- 如果用户是隐私敏感场景，主动补充 `VLLM_NO_USAGE_STATS=1` / `DO_NOT_TRACK=1`
