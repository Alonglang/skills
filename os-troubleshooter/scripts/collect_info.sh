#!/bin/bash

# 系统信息收集脚本
# 收集系统基本信息用于问题定位

OUTPUT_DIR="${1:-./os-info-$(date +%Y%m%d_%H%M%S)}"
mkdir -p "$OUTPUT_DIR"

echo "收集系统信息到: $OUTPUT_DIR"
echo ""

echo "[1/10] 系统基本信息..."
uname -a > "$OUTPUT_DIR/uname.txt"
cat /etc/os-release > "$OUTPUT_DIR/os-release.txt"
hostname > "$OUTPUT_DIR/hostname.txt"
uptime > "$OUTPUT_DIR/uptime.txt"

echo "[2/10] 内核信息..."
cat /proc/version > "$OUTPUT_DIR/kernel-version.txt"
lsmod > "$OUTPUT_DIR/modules.txt"
cat /proc/cmdline > "$OUTPUT_DIR/cmdline.txt"

echo "[3/10] CPU信息..."
lscpu > "$OUTPUT_DIR/cpu-info.txt"
cat /proc/cpuinfo > "$OUTPUT_DIR/cpuinfo.txt"

echo "[4/10] 内存信息..."
free -h > "$OUTPUT_DIR/memory-info.txt"
cat /proc/meminfo > "$OUTPUT_DIR/meminfo.txt"
cat /proc/vmstat > "$OUTPUT_DIR/vmstat.txt"

echo "[5/10] 磁盘信息..."
df -h > "$OUTPUT_DIR/disk-usage.txt"
mount > "$OUTPUT_DIR/mounts.txt"
cat /proc/partitions > "$OUTPUT_DIR/partitions.txt"
cat /proc/mdstat > "$OUTPUT_DIR/mdstat.txt" 2>/dev/null || true

echo "[6/10] 网络信息..."
ip addr > "$OUTPUT_DIR/network-interfaces.txt"
ip route > "$OUTPUT_DIR/routes.txt"
cat /etc/resolv.conf > "$OUTPUT_DIR/resolv.conf.txt"
ss -tuln > "$OUTPUT_DIR/listening-ports.txt"

echo "[7/10] 进程信息..."
ps auxf > "$OUTPUT_DIR/processes.txt"
top -b -n 1 > "$OUTPUT_DIR/top.txt"

echo "[8/10] 内核日志..."
dmesg > "$OUTPUT_DIR/dmesg.txt"
journalctl -k --no-pager > "$OUTPUT_DIR/kernel-journal.txt" 2>/dev/null || true

echo "[9/10] 系统日志..."
if [ -f /var/log/messages ]; then
    tail -1000 /var/log/messages > "$OUTPUT_DIR/messages.txt"
fi
if [ -f /var/log/syslog ]; then
    tail -1000 /var/log/syslog > "$OUTPUT_DIR/syslog.txt"
fi

echo "[10/10] 系统配置..."
sysctl -a > "$OUTPUT_DIR/sysctl.txt" 2>/dev/null || true
ulimit -a > "$OUTPUT_DIR/limits.txt"

echo ""
echo "========================================"
echo "信息收集完成!"
echo "========================================"
echo "输出目录: $OUTPUT_DIR"
echo ""
echo "文件列表:"
ls -la "$OUTPUT_DIR"
echo ""
echo "打包命令:"
echo "  tar czf $OUTPUT_DIR.tar.gz -C $(dirname $OUTPUT_DIR) $(basename $OUTPUT_DIR)"
