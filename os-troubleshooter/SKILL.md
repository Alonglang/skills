---
name: os-troubleshooter
description: 操作系统问题定位与分析技能。自动诊断内核崩溃、用户态崩溃、性能问题和系统挂起。当用户提及系统故障、错误分析、日志诊断、crash分析、panic定位、coredump分析、段错误、性能瓶颈、系统卡死、进程挂起、或需要帮助排查服务器/OS问题时必须触发此技能。支持内核态问题（vmcore分析、dmesg日志、panic诊断）、用户态问题（coredump分析、gdb调试、段错误定位）、性能问题（USE方法、红灯信号法、瓶颈定位）和系统挂起（死锁分析、等待队列分析）的自动化诊断，生成根因分析和解决方案。
---

# OS问题定位技能

基于四阶段法和USE方法论的系统性问题定位技能。用于诊断Linux操作系统（特别是基于openEuler的发行版）的各类问题。

---

## 核心原则

**铁律：没有根因调查，不进行修复**

### 反模式警示（必须避免）

| 反模式 | 问题 | 正确做法 |
|--------|------|----------|
| "就试试这个" | 无根因的随机修复 | 先调查，后修复 |
| "可能是X" | 无证据的猜测 | 收集证据后再假设 |
| "快速补丁" | 治标不治本 | 找到并修复根因 |
| "一次修多个" | 无法知道什么有效 | 一次一个变量 |
| "跳过复现" | 无法可靠触发 | 确保可复现后再分析 |

---

## 执行流程总览

```
┌─────────────────────────────────────────────────────────────┐
│ 步骤1：问题类型识别                                          │
│ - 关键词匹配：panic/BUG/OOM/segfault/coredump/卡死          │
│ - 日志特征：kernel NULL pointer/soft lockup/out of memory   │
│ - 用户描述：崩溃/卡住/慢/异常                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 步骤2：工具检查                                              │
│ - 内核分析：crash, vmlinux, debuginfo                       │
│ - 用户态分析：gdb, debuginfo                                 │
│ - 性能分析：perf, sar, iostat                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 步骤3：数据收集                                              │
│ - 标准路径：/var/crash/, /var/log/, /var/core/              │
│ - 用户指定路径（如标准路径无数据则询问）                      │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌───────────┐       ┌───────────┐       ┌───────────┐
    │ 内核崩溃  │       │ 用户态崩溃│       │ 性能问题  │
    │ 系统挂起  │       │          │       │          │
    └───────────┘       └───────────┘       └───────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 步骤4：深度分析（四阶段法）                                   │
│ 阶段1：根因调查 - 读错误、复现、查变更、追踪数据流            │
│ 阶段2：模式分析 - 找案例、比差异、理依赖                      │
│ 阶段3：假设测试 - 形成假设、设计测试、验证迭代                │
│ 阶段4：修复验证 - 修复根因、编写测试、完整验证                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 步骤5：根因分析                                              │
│ - 代码问题：定位到具体代码行                                  │
│ - 配置问题：识别错误配置项                                    │
│ - 资源问题：资源耗尽/竞争                                     │
│ - 设计问题：架构缺陷                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 步骤6：解决方案生成                                          │
│ - 根本修复方案（含代码修改）                                  │
│ - 规避方案（临时措施）                                       │
│ - 配置调整方案                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 步骤7：用户确认 → 执行修复 / 指导用户                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 步骤1：问题类型识别

### 自动分类规则

根据输入自动判断问题类型：

| 问题类型 | 触发关键词 | 日志特征 |
|----------|------------|----------|
| **内核崩溃** | panic, crash, vmcore, 内核复位 | `kernel BUG at`, `BUG: unable to handle`, `Call Trace` |
| **用户态崩溃** | coredump, segfault, 段错误, segment fault | `Segmentation fault`, `core dumped` |
| **性能问题** | 慢, 性能, 瓶颈, 延迟, 吞吐量 | 高CPU/内存/IO使用率 |
| **系统挂起** | 卡死, 挂起, hang, 无响应, 死锁 | `blocked for more than`, `soft lockup` |

### 问题类型确认流程

1. 首先根据关键词匹配初步分类
2. 检查标准路径是否存在相关日志文件
3. 如无法确定，向用户确认问题类型

---

## 步骤2：工具检查

### 必要工具清单

| 分析类型 | 工具 | 检查命令 |
|----------|------|----------|
| 内核崩溃 | crash | `which crash` |
| 内核崩溃 | vmlinux | `ls /usr/lib/debug/lib/modules/$(uname -r)/vmlinux*` |
| 用户态崩溃 | gdb | `which gdb` |
| 用户态崩溃 | debuginfo | 检查对应包的debuginfo是否安装 |
| 性能分析 | perf | `which perf` |
| 性能分析 | sysstat | `which sar, iostat` |

### 工具缺失处理

如果必要工具缺失：
1. 告知用户缺少的工具
2. 提供安装命令
3. 询问是否继续（部分分析可能受限）

```bash
# openEuler安装命令示例
yum install -y crash kernel-debuginfo gdb perf sysstat
```

---

## 步骤3：数据收集

### 标准数据路径

| 数据类型 | 标准路径 | 备选路径 |
|----------|----------|----------|
| vmcore | /var/crash/ | 用户指定 |
| coredump | /var/core/ | /tmp/, 用户指定 |
| 内核日志 | /var/log/messages | journalctl -k |
| dmesg | 实时采集 | dmesg |
| 串口日志 | 用户指定 | - |

### 数据收集清单

```markdown
## 内核崩溃问题
- [ ] vmcore文件位置
- [ ] vmlinux文件位置（版本需匹配）
- [ ] dmesg日志
- [ ] messages日志（崩溃前后）
- [ ] 串口日志（如有）

## 用户态崩溃问题
- [ ] coredump文件位置
- [ ] 可执行文件路径
- [ ] debuginfo包（需要符号信息）
- [ ] 应用日志

## 性能问题
- [ ] perf数据（perf record）
- [ ] sar数据
- [ ] 问题描述（何时慢、什么操作）
- [ ] 系统配置信息

## 系统挂起
- [ ] 挂起时的进程信息
- [ ] /proc/*/stack内容
- [ ] dmesg日志
```

---

## 内核崩溃分析

### Panic类型分类

| Panic类型 | 典型特征 | 分析重点 |
|-----------|----------|----------|
| **硬件异常** | `BUG: unable to handle kernel NULL pointer dereference` | bt查看崩溃栈，追踪指针来源 |
| **软件BUG** | `kernel BUG at`, `WARNING:` | 查看BUG_ON条件，分析触发原因 |
| **软锁检测** | `BUG: soft lockup - CPU#X stuck` | bt -a查看所有CPU，检查死锁 |
| **硬锁检测** | `NMI watchdog: BUG: hard lockup` | 检查死锁、关中断 |
| **OOM Killer** | `Out of memory: Killed process` | kmem -i分析内存，找内存消费者 |
| **栈溢出** | `stackoverflow detected` | 检查递归调用、大数组 |

### vmcore分析流程

```bash
# 1. 加载vmcore
crash /usr/lib/debug/lib/modules/$(uname -r)/vmlinux /var/crash/vmcore

# 2. 基本信息
sys                    # 系统基本信息
bt                     # 崩溃时调用栈
log                    # 内核日志，确认panic信息

# 3. 问题范围界定
bt -a                  # 所有CPU的调用栈
foreach bt             # 遍历所有进程调用栈
ps | grep UN           # UN状态进程
kmem -i                # 内存使用情况

# 4. 深度分析
struct <type> <addr>   # 分析数据结构
p <expression>         # 打印表达式值
kmem -s                # slab缓存统计
dev -d                 # 设备信息
```

### 内存问题分析

#### OOM分析

```bash
# 在vmcore中
kmem -i                # 内存分配概览
kmem -s                # slab分配器信息
vm                     # 虚拟内存统计
foreach bt -l          # 各进程内存使用

# 关键指标检查
# - MemTotal vs MemFree
# - Slab占用情况
# - 进程RSS/VSZ异常
```

#### 内存泄漏分析

```bash
# 运行时分析
slabtop                # 实时slab分配
cat /proc/meminfo      # 内存详细信息
cat /proc/slabinfo     # slab信息

# vmcore分析
kmem -s                # slab缓存统计
kmem <address>         # 查找地址对应slab
```

### 死锁分析

```bash
# 在vmcore中
foreach bt             # 所有进程栈
ps | grep UN           # UN状态进程
bt <pid>               # 特定进程栈
struct mutex <address> # 分析锁状态
struct task_struct <addr> # 进程状态

# 死锁检测步骤
1. 找到锁持有者（mutex owner字段）
2. 找到等待者（等待队列）
3. 构建锁依赖图
4. 分析是否存在循环等待
```

---

## 用户态崩溃分析

### 段错误类型分类

| 段错误类型 | 典型原因 | 诊断方法 |
|------------|----------|----------|
| **NULL指针解引用** | `*ptr = value`，ptr为NULL | `p ptr`，检查指针值 |
| **Use-After-Free** | 访问已释放内存 | `valgrind --tool=memcheck` |
| **栈溢出** | 递归过深、大数组局部变量 | `info frame`，检查栈指针 |
| **数组越界** | 缓冲区溢出写入 | `x/20x` 检查周围内存 |
| **未初始化指针** | 使用未初始化指针 | `p *ptr`，检查值 |
| **对齐问题** | ARM等平台对齐要求 | 检查地址是否对齐 |

### coredump分析流程

```bash
# 1. 加载coredump
gdb <executable> <coredump>

# 2. 基本信息
info threads           # 所有线程
info registers         # 寄存器状态
info sharedlibrary     # 加载的库

# 3. 根因分析
bt                     # 调用栈
bt full                # 完整调用栈和局部变量
frame N                # 切换到第N帧
info locals            # 局部变量
info args              # 函数参数

# 4. 内存检查
x/20x $sp              # 查看栈内容
x/s <address>          # 查看字符串
info proc mappings     # 内存映射
p *<pointer>           # 查看指针指向内容
```

### 进程Hang住分析

```bash
# 1. 确认进程状态
ps -eo pid,ppid,stat,cmd | grep <process>
cat /proc/<pid>/status | grep State

# 2. 检查等待点
cat /proc/<pid>/stack  # 内核栈
cat /proc/<pid>/wchan  # 等待的内核函数
strace -p <pid>        # 跟踪系统调用

# 3. 检查资源等待
lsof -p <pid>          # 打开的文件
cat /proc/<pid>/fd     # 文件描述符
ipcs                   # IPC资源

# 4. 检查锁
gdb -p <pid>
info threads
thread apply all bt
```

---

## 性能问题分析

### USE方法论框架

对每个资源检查三个指标：
- **利用率(Utilization)**：资源使用百分比
- **饱和度(Saturation)**：队列长度、等待时间
- **错误(Errors)**：错误计数

| 资源 | 利用率工具 | 饱和度工具 | 错误工具 |
|------|------------|------------|----------|
| CPU | mpstat, top | uptime, vmstat | dmesg |
| 内存 | free, vmstat | vmstat, sar | dmesg |
| 网络 | sar -n DEV | netstat -s, ss | dmesg |
| 存储 | iostat -x | iostat -x await | dmesg |

### 红灯信号法（60秒检查清单）

```bash
# 执行顺序
uptime                 # 负载和运行队列
dmesg | tail           # 内核错误
vmstat 1               # 内存和交换（观察几秒）
mpstat -P ALL 1        # 各CPU使用率
iostat -x 1            # IO统计
sar -n DEV 1           # 网络统计
```

### CPU性能分析

```bash
# 整体CPU分析
top -H                 # 各线程CPU
mpstat -P ALL 1        # 各核心使用率
pidstat -t 1           # 进程/线程CPU使用

# CPU使用分解
perf top               # 实时热点
perf record -g -- sleep 30  # 采样
perf report --stdio    # 报告

# 调用链分析
perf record -g --call-graph dwarf
perf report -g graph,0.5,caller
```

### 内存性能分析

```bash
# 页面错误分析
ps -o pid,min_flt,maj_flt,cmd -p <pid>
sar -B 1               # 页面统计
perf stat -e faults ./program

# 缓存分析
perf stat -e cache-references,cache-misses ./program
numastat               # NUMA统计

# 交换分析
cat /proc/vmstat | grep pswp
swapon -s
vmstat -s
```

### IO性能分析

```bash
# 分层分析
# 应用层
strace -e trace=read,write
ltrace                 # 库调用跟踪

# 文件系统层
iostat -x 1            # IO统计
iotop                  # 进程IO排名

# 块设备层
blktrace -d <device> -o - | blkparse -i -
perf record -e block:*
```

### 网络性能分析

```bash
# 网络统计
sar -n DEV 1           # 接口统计
netstat -s             # 协议统计
ss -s                  # socket统计

# 延迟分析
ping, mtr, traceroute

# 带宽测试
iperf3 -s              # 服务端
iperf3 -c <host>       # 客户端

# 包分析
tcpdump -i <interface> -w capture.pcap
```

---

## 代码定位流程

### 推断流程

```
┌─────────────────────────────────────────────────────────────┐
│ 从错误信息推断可能涉及的模块                                  │
│ - 函数名 → 代码目录                                          │
│ - 驱动名 → 驱动目录                                          │
│ - 软件包名 → 软件包目录                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 根据软件包责任领域表推断                                      │
│ - kernel → 内核源码树                                        │
│ - glibc → C库                                               │
│ - systemd → 系统服务                                         │
│ - 其他软件包 → 对应目录                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 向用户确认代码位置                                            │
│ - 代码仓库根目录                                              │
│ - 是否需要切换分支                                            │
│ - 是否有调试符号                                              │
└─────────────────────────────────────────────────────────────┘
```

### 常见内核模块位置

| 模块类型 | 代码位置 |
|----------|----------|
| 核心内核 | kernel/, mm/, fs/ |
| 驱动 | drivers/, sound/ |
| 网络 | net/ |
| 架构相关 | arch/<arch>/ |
| 文件系统 | fs/ |

### 代码分析步骤

1. 定位崩溃函数所在文件
2. 分析函数调用链
3. 检查相关数据结构
4. 追踪数据流（坏值从哪来）
5. 定位根本原因

---

## 解决方案生成

### 方案类型

| 方案类型 | 适用场景 | 优先级 |
|----------|----------|--------|
| **根本修复** | 可定位到具体代码问题 | 最高 |
| **规避方案** | 临时措施，等待根本修复 | 中 |
| **配置调整** | 配置问题导致 | 高 |
| **升级建议** | 已知bug在更新版本修复 | 中 |

### 方案内容要求

每个方案必须包含：
1. **问题描述**：清晰描述根因
2. **影响范围**：受影响的组件/场景
3. **修复步骤**：详细的修复操作
4. **验证方法**：如何验证修复有效
5. **风险评估**：可能的副作用

### 代码修改格式

```markdown
## 修复方案

**问题根因**：[描述根因]

**影响文件**：
- path/to/file.c: 函数名/行号

**修改内容**：
\`\`\`diff
--- a/path/to/file.c
+++ b/path/to/file.c
@@ -xxx,xx +xxx,xx @@
 [修改内容]
\`\`\`

**验证方法**：
1. 编译内核/模块
2. 加载测试
3. 复现场景验证
```

---

## 用户确认流程

### 修复决策树

```
问题定位完成
    │
    ├── 是否能定位根因？
    │       │
    │       ├── 是 → 生成根本修复方案
    │       │         │
    │       │         ├── 代码问题 → 询问用户是否直接修复
    │       │         │               │
    │       │         │               ├── 是 → 执行修复
    │       │         │               └── 否 → 提供修复指导
    │       │         │
    │       │         ├── 配置问题 → 提供配置修改方案
    │       │         └── 资源问题 → 提供扩容/优化方案
    │       │
    │       └── 否 → 提供规避方案
    │                   │
    │                   └── 建议收集更多信息
    │
    └── 用户确认执行
```

### 询问用户

```
已定位问题根因：[根因描述]

修复方案：
[方案描述]

是否需要我：
1. 直接修复（需要代码仓库权限）
2. 提供详细的修复指导
3. 仅提供规避方案
4. 需要更多信息分析
```

---

## 输出格式

### 简单问题（终端输出）

```markdown
## 问题诊断结果

**问题类型**：[类型]
**根因**：[根因描述]
**严重程度**：高/中/低

**解决方案**：
[方案描述]

**修复步骤**：
1. [步骤1]
2. [步骤2]

**验证方法**：
[验证方法]
```

### 复杂问题（生成Markdown报告）

复杂问题生成独立报告文件，包含：

```markdown
# OS问题诊断报告

## 摘要
- 问题类型：[类型]
- 根因：[根因摘要]
- 严重程度：[高/中/低]
- 状态：[待修复/已规避/已解决]

## 问题描述
[详细描述]

## 分析过程
### 数据收集
[收集的数据清单]

### 问题分类
[分类依据]

### 深度分析
[分析过程，使用四阶段法]

## 根因分析
### 5 Whys分析
1. Why: [原因1]
2. Why: [原因2]
...

### 根因确定
[确定的根因]

## 解决方案
### 根本修复方案
[方案详情]

### 规避方案（临时）
[方案详情]

## 验证方法
[验证步骤]

## 附件
- [日志文件]
- [分析数据]
```

---

## 软件包责任领域参考

常用软件包分类（用于快速定位责任领域）：

| 软件包 | 等级 | 责任领域 |
|--------|------|----------|
| kernel | Q1 | compute |
| glibc | Q1 | compute |
| systemd | Q2 | compute |
| libvirt | Q1 | virt |
| qemu | Q1 | virt |
| docker | Q1 | virt |
| NetworkManager | Q2 | virt |
| grub2 | Q2 | base |
| bash | Q2 | base |
| coreutils | Q2 | base |

完整列表见 `references/software-packages.md`

---

## 多OS适配层

### 命令映射表

不同Linux发行版和macOS的常用命令差异对照：

| 功能 | openEuler/CentOS/RHEL | Ubuntu/Debian | SUSE/openSUSE | macOS |
|------|----------------------|---------------|---------------|-------|
| 包管理-安装 | `yum install` / `dnf install` | `apt install` | `zypper install` | `brew install` |
| 包管理-搜索 | `yum search` / `dnf search` | `apt search` | `zypper search` | `brew search` |
| 包验证 | `rpm -Va` | `debsums` | `rpm -Va` | N/A |
| 系统日志 | `/var/log/messages` | `/var/log/syslog` | `/var/log/messages` | `/var/log/system.log` |
| 日志服务 | `journalctl` | `journalctl` | `journalctl` | `log show` |
| 服务管理 | `systemctl` | `systemctl` | `systemctl` | `launchctl` |
| 防火墙 | `firewalld` / `iptables` | `ufw` / `iptables` | `firewalld` | `pfctl` |
| 内核调试信息 | `yum install kernel-debuginfo` | `apt install linux-image-$(uname -r)-dbgsym` | `zypper install kernel-default-debuginfo` | N/A |
| 崩溃转储 | `kdump` | `linux-crashdump` | `kdump` | `DiagnosticReports` |
| 网络配置 | `nmcli` / `ip` | `nmcli` / `ip` / `netplan` | `wicked` / `nmcli` | `networksetup` / `ifconfig` |
| 进程管理 | `systemctl` | `systemctl` | `systemctl` | `launchctl` |

### 发行版检测

```bash
# 自动检测当前发行版
if [ -f /etc/os-release ]; then
    . /etc/os-release
    DISTRO="$ID"
    VERSION="$VERSION_ID"
elif [ -f /etc/redhat-release ]; then
    DISTRO="centos"
elif [ "$(uname)" = "Darwin" ]; then
    DISTRO="macos"
else
    DISTRO="unknown"
fi
```

### 适配注意事项

| 差异点 | 说明 |
|--------|------|
| 日志位置 | CentOS用messages，Ubuntu用syslog，均可用journalctl |
| 包格式 | RPM系 vs DEB系，影响debuginfo安装方式 |
| 内核命名 | CentOS: vmlinuz-版本, Ubuntu: vmlinuz-版本-generic |
| 默认shell | 大多数Linux用bash，部分容器镜像用sh/ash |
| cgroup版本 | 新版本发行版默认cgroup v2，老版本用v1 |
| SELinux vs AppArmor | CentOS/openEuler用SELinux，Ubuntu用AppArmor |

---

## 迭代诊断模式

对于复杂问题，采用多轮迭代诊断而非单次线性流程：

### 迭代流程

```
第一轮：快速扫描
├── 运行60秒快速检查（红灯信号法）
├── 初步分类问题类型
├── 向用户确认观察结果
└── 输出：初步诊断方向

第二轮：定向收集
├── 根据初步分类选择收集策略
├── 执行针对性数据收集脚本
├── 分析收集到的数据
└── 输出：数据分析结果 + 假设列表

第三轮：深度分析
├── 根据假设进行深入分析
├── 验证或排除每个假设
├── 定位根因
└── 输出：根因分析报告

第四轮：方案验证
├── 制定修复方案
├── 执行修复（经用户确认）
├── 验证修复效果
├── 是否需要继续？
│   ├── 是 → 回到第一轮
│   └── 否 → 生成最终报告
└── 输出：修复验证报告
```

### 迭代退出条件

| 条件 | 动作 |
|------|------|
| 根因已定位且修复验证通过 | 退出，生成最终报告 |
| 超过3轮迭代未定位根因 | 建议收集更多数据或寻求外部支持 |
| 用户选择停止 | 输出当前进展报告 |
| 问题自行恢复 | 记录现象，建议监控 |

### 每轮必做检查

每轮迭代开始时，必须确认：
1. 上一轮的结论是否仍然有效
2. 是否有新的现象出现
3. 系统状态是否发生变化
4. 是否需要调整诊断方向

---

## 严重程度评估

### 评估矩阵

| 维度 | 高（P1） | 中（P2） | 低（P3） |
|------|----------|----------|----------|
| **影响范围** | 整个系统/服务不可用 | 单个服务/组件受影响 | 非关键功能异常 |
| **数据影响** | 数据丢失或损坏 | 数据暂时不可访问 | 无数据影响 |
| **复发频率** | 持续发生或高频复发 | 偶发（每天/每周） | 罕见（每月以上） |
| **恢复能力** | 需要人工干预修复 | 可通过重启恢复 | 自动恢复 |
| **业务影响** | 核心业务中断 | 辅助业务受影响 | 用户基本无感知 |

### 综合判定规则

```
如果任一维度为"高" → 综合严重程度 = 高（P1）
如果两个及以上维度为"中" → 综合严重程度 = 中（P2）
其余情况 → 综合严重程度 = 低（P3）
```

### 响应要求

| 严重程度 | 响应要求 |
|----------|----------|
| **高（P1）** | 立即响应，优先提供规避方案，同步进行根因分析 |
| **中（P2）** | 尽快响应，按标准四阶段法分析 |
| **低（P3）** | 计划性处理，记录问题，安排修复 |

---

## 参考资料

当需要更详细信息时，阅读以下参考文档：

### 核心分析参考
- `references/kernel-panic-types.md` - 内核panic类型详细说明
- `references/segfault-types.md` - 段错误类型详细说明
- `references/perf-methodology.md` - USE方法详细指南
- `references/deadlock-analysis.md` - 死锁分析详细指南
- `references/command-reference.md` - 常用命令速查

### 扩展场景参考
- `references/network-troubleshooting.md` - 网络故障诊断指南
- `references/boot-troubleshooting.md` - 启动故障诊断指南
- `references/container-troubleshooting.md` - 容器与虚拟化故障诊断指南
- `references/security-incident.md` - 安全事件响应指南
- `references/log-patterns.md` - 日志错误模式匹配库
- `references/software-packages.md` - 软件包责任领域表

### 辅助工具
- `scripts/diagnose.sh` - 主入口诊断脚本（支持 auto/kernel/userspace/perf/hang/network/storage 模式）
- `scripts/quick_diagnosis.sh` - 智能问题诊断脚本（自动检测问题类型）
- `scripts/check_tools.sh` - 分析工具检查脚本
- `scripts/collect_info.sh` - 系统信息收集脚本
