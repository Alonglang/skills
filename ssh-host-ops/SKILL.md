---
name: ssh-host-ops
description: 当用户要求你在某个 hostname、主机别名或设备名上执行配置、排障、网络修改、安装、查看状态等操作时，必须使用此技能。即使用户没有显式说 SSH，只要任务本质上是“去那台远端机器上操作”，都应触发。该技能固定通过 `ssh -p 2822 root@hostname` 连接目标主机；优先从本机 `/etc/hosts` 解析主机名，缺失时先向用户索取 IP 并补充 hosts，再检查免密登录，必要时通过 `ssh-copy-id` 建立公钥登录，然后在远端完成任务。
---

# SSH Host Ops

通过固定入口 `ssh -p 2822 root@hostname` 在远端主机上执行操作，并把主机解析、免密配置、远端探测和执行流程标准化。

## 适用场景

- 用户说“在 mac 上 / 在 nas 上 / 到 server-01 上”做某件事。
- 用户要求修改远端机器配置、网络、服务、软件包或系统状态。
- 用户没有明确写出 SSH，但目标明显是某台远端主机而不是当前机器。

## 不适用场景

- 用户没有指出明确的目标主机。
- 任务其实是在当前机器执行，而不是远端机器。
- 用户要求改变 SSH 用户名、端口或批量横向操作多台机器。这个技能第一版只支持 `root@hostname:2822`。

## 快速参考

| 步骤 | 命令 | 用途 |
|---|---|---|
| 解析主机 | `bash ~/.agents/skills/ssh-host-ops/scripts/resolve_target.sh <hostname> [ip]` | 从 `/etc/hosts` 解析 hostname；必要时补充映射 |
| 配置免密 | `bash ~/.agents/skills/ssh-host-ops/scripts/ensure_ssh_key_auth.sh <hostname>` | 检查公钥登录；必要时执行 `ssh-copy-id` |
| 远端探测 | `bash ~/.agents/skills/ssh-host-ops/scripts/run_remote_command.sh <hostname> --probe-os` | 获取远端系统类型和基础信息 |
| 执行命令 | `bash ~/.agents/skills/ssh-host-ops/scripts/run_remote_command.sh <hostname> -- '<command>'` | 在远端执行具体命令 |

## 工作流

### 1. 提取目标主机和操作意图

先从用户请求里分离出：

- **目标主机名**：例如 `mac`、`nas`、`server-01`
- **远端任务**：例如“把网关和 dns 改成 192.168.28.1”

如果用户没有给出明确的目标主机，先用 `ask_user` 询问主机名，再继续。

### 2. 先解析本机 `/etc/hosts`

优先运行：

```bash
bash ~/.agents/skills/ssh-host-ops/scripts/resolve_target.sh <hostname>
```

规则：

- 只把本机 `/etc/hosts` 作为首选解析来源。
- 如果主机名已存在于 `/etc/hosts`，直接继续。
- 如果主机名不存在，必须先向用户索取 IP，再执行：

```bash
bash ~/.agents/skills/ssh-host-ops/scripts/resolve_target.sh <hostname> <ip>
```

- 成功补充 hosts 后，再进行 SSH 流程。

不要在用户没有提供 IP 的情况下擅自猜测地址。

### 3. 检查并建立免密登录

在真正执行远端操作前，先运行：

```bash
bash ~/.agents/skills/ssh-host-ops/scripts/ensure_ssh_key_auth.sh <hostname>
```

行为要求：

- 固定连接方式：`ssh -p 2822 root@<hostname>`
- 先做非交互式公钥登录探测。
- 如果免密已生效，直接继续。
- 如果免密未生效，使用 `ssh-copy-id -p 2822 root@<hostname>` 建立公钥登录。
- 如果首次连接出现主机指纹确认、密码输入，或 `ssh-copy-id` 需要交互，允许进入交互式处理并继续完成配置。
- 如果本机不存在可用公钥，脚本会生成一个新的 `ed25519` key，再继续配置。

如果最终仍无法建立公钥登录，要明确说明失败原因，不要假装已经连接成功。

### 4. 先探测远端系统，再改配置

在执行任何会改变系统状态的操作前，先探测远端系统：

```bash
bash ~/.agents/skills/ssh-host-ops/scripts/run_remote_command.sh <hostname> --probe-os
```

至少确认：

- 远端是 `Darwin` 还是 `Linux`
- 如为 Linux，尽量读取 `/etc/os-release`
- 如为 macOS，优先使用系统原生命令，而不是假设 Linux 工具存在

只有在确认系统类型后，才生成真正的远端操作命令。

### 5. 先看当前状态，再执行修改

对于网络、服务、系统配置这类风险更高的操作，先读取当前状态，再修改：

- 网络：先看当前接口、IP、DNS、默认路由
- 服务：先看当前状态、配置文件和日志
- 软件：先看是否已安装、版本和路径

这样可以避免盲改，也能在需要回滚时给出足够上下文。

### 6. 用统一入口执行远端命令

执行远端命令时，使用：

```bash
bash ~/.agents/skills/ssh-host-ops/scripts/run_remote_command.sh <hostname> -- '<command>'
```

要求：

- 把真正的业务命令放在单引号字符串里，减少转义错误。
- 一次做一类操作；如果需要多步变更，先读取状态，再执行变更，再验证结果。
- 不要把本地命令误执行在当前主机上。

### 7. 面向用户的输出

向用户汇报时，至少说明：

1. 目标主机名，以及是否补充了 `/etc/hosts`
2. 是否已配置或新建了免密登录
3. 远端系统类型
4. 实际执行了什么关键操作
5. 修改结果与仍需人工处理的问题

## 常见任务模式

### 主机不存在于 `/etc/hosts`

1. 用 `ask_user` 索取该 hostname 对应的 IP。
2. 运行 `resolve_target.sh <hostname> <ip>` 写入 `/etc/hosts`。
3. 再继续 SSH 与远端任务。

### 首次连接还没配免密

1. 运行 `ensure_ssh_key_auth.sh <hostname>`。
2. 允许脚本通过 `ssh-copy-id` 进入交互式流程。
3. 免密建立成功后再执行远端命令。

### macOS 网络配置示例

对于类似“在 mac 上把网关和 dns 改成 192.168.28.1”的请求：

1. 先完成主机解析与免密配置。
2. 探测远端系统，确认是 macOS。
3. 先读取当前默认路由、网络服务、IP 与 DNS 配置。
4. 再基于当前接口和服务名，使用 `networksetup`、`route` 等 macOS 原生命令完成修改。
5. 修改后再次读取 DNS 和默认路由确认结果。

不要直接套用 Linux 的 `ip route`、`nmcli` 或 `resolvectl` 到 macOS 主机。

## 失败处理

- `/etc/hosts` 中不存在目标主机，且用户尚未提供 IP：暂停并先向用户询问。
- `ssh-copy-id` 不可用：明确报错，说明缺少该命令。
- 远端登录失败：返回真实错误，不要静默重试无限次。
- 远端系统与预期不符：先告知用户，再按实际系统重新规划命令。

## 脚本说明

| 脚本 | 作用 |
|---|---|
| `scripts/resolve_target.sh` | 检查 hostname 是否存在于 `/etc/hosts`，必要时追加 IP 映射 |
| `scripts/ensure_ssh_key_auth.sh` | 检查是否能通过公钥登录；必要时生成本地公钥并执行 `ssh-copy-id` |
| `scripts/run_remote_command.sh` | 用统一 SSH 参数执行远端探测与业务命令 |

## 示例触发语句

- `请帮我在 mac 上把网关和 dns 改成 192.168.28.1`
- `去 nas 上看看 docker 现在是不是挂了`
- `在 server-01 上把 nginx 重启一下`
- `帮我到 mini 上装一下 tailscale`

## 备注

- 第一版严格固定 `ssh -p 2822 root@hostname`
- 第一版只处理用户明确指名的单台主机
- 如果脚本补充了 `/etc/hosts` 或新建了本地 SSH key，要在最终结果里告诉用户
