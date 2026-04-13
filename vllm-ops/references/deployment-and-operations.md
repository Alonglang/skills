# Deployment and operations

## 生产部署路线

### Docker

官方镜像：

- `vllm/vllm-openai`
- `vllm/vllm-openai-rocm`

常用模式：

- 挂载 Hugging Face cache
- 传 `HF_TOKEN`
- 暴露 8000
- `--ipc=host`

### Kubernetes

原生 K8s 文档给的是最小基线：

- PVC
- Secret
- Deployment
- Service

但生产上通常还要看：

- Helm
- KServe
- KubeRay
- production-stack
- 其他 integration 页面

回答 Kubernetes 问题时，默认先区分两种目标：

1. 先有一个能工作的最小部署
2. 做成带弹性、观测和更完整控制面的生产方案

## 观测

服务端暴露：

```bash
curl http://<host>:8000/metrics
```

高价值指标：

- `vllm:num_preemptions`
- `vllm:kv_cache_usage_perc`
- `vllm:num_requests_running`
- `vllm:num_requests_waiting`
- `vllm:e2e_request_latency_seconds`
- `vllm:inter_token_latency_seconds`

指标解读时的默认提示：

- `num_preemptions` 高：通常说明 KV cache 压力大
- `kv_cache_usage_perc` 高：说明缓存接近打满
- `num_requests_waiting` 高：可能是并发过高、调度预算过紧，或模型规模/并行度不够

## 常见故障

### 模型下载卡住

- 先用 `huggingface-cli` 预下载
- 然后传本地路径

### 模型加载很慢

- 避免共享/网络文件系统
- 看 CPU 内存与 swap
- 可用 `--load-format dummy` 隔离加载瓶颈

### 分布式资源报错

如果报：

`No available node types can fulfill resource request`

优先检查：

- `VLLM_HOST_IP`
- Ray 看到的 node IP
- 网卡 / 接口选择
- 是否在建集群时统一下发了通信环境变量

### 分布式通信

跨节点时，建议在集群创建阶段统一传：

- NCCL 相关 env
- `VLLM_HOST_IP`

而不是只在当前 shell 临时设置。

如果用户是 Ray 多节点，默认建议同时使用：

- `ray status`
- `ray list nodes`

来核对资源和 IP 视图。

## 安全

### 永远主动提醒的几点

- 多节点通信默认不安全
- `torch.distributed` 相关端口不能暴露公网
- `--api-key` 只保护 `/v1` 路径下的一部分接口
- 许多端点默认仍未鉴权

尤其要提醒用户：以下类型的接口可能仍未受保护：

- 非 `/v1` 推理接口
- `/pause`、`/resume` 等控制接口
- tokenizer / health / load 之类工具接口
- dev-mode 下更危险的调试与 RPC 接口

所以生产建议必须包含：

- 内网隔离
- 防火墙
- 只暴露必要端口
- 不启用不需要的 dev/profiler 能力

### 多模态 URL 安全

建议：

- `--allowed-media-domains`
- `VLLM_MEDIA_URL_ALLOW_REDIRECTS=0`

目的：

- 防 SSRF
- 防资源耗尽

## RL / weight transfer

权重同步是正式机制，不是临时 hack。

后端：

- `nccl`
- `ipc`

HTTP 路由依赖：

- `VLLM_SERVER_DEV_MODE=1`

这意味着：

- 只在受控环境里开
- 不要把 dev-mode 端点暴露给外部

## Benchmark 与运维的连接方式

如果用户问“怎么知道最近性能退化了”，优先建议：

- 看 vLLM Performance Dashboard
- 再做本地 benchmark 复现

如果用户问“我要系统化扫参数”，优先建议：

- `vllm bench sweep`

如果用户只是想压单一配置：

- 优先考虑 GuideLLM
