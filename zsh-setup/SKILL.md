---
name: zsh-setup
description: Zsh + Oh-My-Zsh 完整安装配置技能。当用户请求"安装 zsh"、"配置 zsh"、"设置 oh-my-zsh"、"配置 zsh 插件"、"把 bash 迁移到 zsh"或"帮我配置终端环境"时，必须触发此技能。
---

# Zsh Setup - Zsh + Oh-My-Zsh 完整安装配置技能

## 概述

本技能自动化完成以下任务：
1. 检测系统环境和现有配置
2. 安装 zsh
3. 安装 oh-my-zsh
4. 安装 Powerlevel10k 主题
5. 安装常用插件（自动 + 可选）
6. 迁移现有 bashrc 配置到 zshrc
7. 设置 zsh 为默认 shell
8. 验证配置正确性

## 完整工作流程

### Step 1: 环境检测

运行 `scripts/01_detect_env.sh` 获取系统信息：

```bash
bash ~/.agents/skills/zsh-setup/scripts/01_detect_env.sh
```

**输出示例（JSON）：**
```json
{
  "os": "Ubuntu",
  "os_version": "22.04",
  "package_manager": "apt",
  "zsh_installed": false,
  "ohmyzsh_installed": false,
  "has_bashrc": true,
  "has_zshrc": true,
  "current_shell": "/bin/bash"
}
```

### Step 2: 安装 Zsh

根据操作系统选择安装命令：

| 操作系统 | 包管理器 | 安装命令 |
|----------|----------|----------|
| Ubuntu/Debian | apt | `apt update && apt install -y zsh` |
| CentOS/RHEL 7 | yum | `yum install -y zsh` |
| CentOS/RHEL 8+/AlmaLinux/Rocky | dnf | `dnf install -y zsh` |
| openEuler | dnf | `dnf install -y zsh` |
| Fedora | dnf | `dnf install -y zsh` |
| macOS | brew | `brew install zsh` |

**执行：**
```bash
bash ~/.agents/skills/zsh-setup/scripts/02_install_zsh.sh
```

**验证：**
```bash
zsh --version
```

### Step 3: 安装 Oh-My-Zsh

```bash
bash ~/.agents/skills/zsh-setup/scripts/03_install_ohmyzsh.sh
```

如果 oh-my-zsh 已安装，跳过此步骤。

### Step 4: 安装 Powerlevel10k 主题

```bash
bash ~/.agents/skills/zsh-setup/scripts/04_install_theme.sh
```

此步骤安装主题到 `$ZSH_CUSTOM/themes/powerlevel10k`，并更新 `.zshrc` 中的 `ZSH_THEME` 设置。

### Step 5: 安装插件

**自动安装的核心插件：**
- `zsh-autosuggestions` - 命令自动建议（基于历史）
- `zsh-syntax-highlighting` - 命令语法高亮

**可选插件（需要用户确认）：**
- `docker` - Docker 命令补全
- `kubectl` - Kubernetes 命令补全
- `terraform` - Terraform 支持

```bash
bash ~/.agents/skills/zsh-setup/scripts/05_install_plugins.sh
```

**交互提示：**
```
检测到已安装 Docker，是否安装 docker 插件？ [y/N]:
检测到已安装 kubectl，是否安装 kubectl 插件？ [y/N]:
检测到已安装 terraform，是否安装 terraform 插件？ [y/N]:
```

### Step 6: 迁移 Bashrc 配置

自动读取 `~/.bashrc` 并迁移以下内容到 `~/.zshrc`：

| 内容类型 | 迁移方式 |
|----------|----------|
| `alias` 定义 | 直接保留 |
| `export` 环境变量 | 直接保留 |
| `PATH` 设置 | 直接保留 |
| `source` 命令 | 保持不变 |
| `if [ ... ]` | 转换为 `if [[ ... ]]` |
| 函数定义 | 转换为 zsh 语法 |

```bash
bash ~/.agents/skills/zsh-setup/scripts/06_migrate_bashrc.sh
```

**迁移后的位置：**
迁移内容会追加到 `.zshrc` 的 "# User configuration" 区域之后，保留 oh-my-zsh 的配置结构。

### Step 7: 设置默认 Shell

依次尝试以下方法：

1. **chsh（标准方法）**
   ```bash
   chsh -s $(which zsh)
   ```

2. **usermod（root 用户）**
   ```bash
   usermod -s /usr/bin/zsh root
   ```

3. **手动修改 /etc/passwd（备用）**
   ```bash
   # 需要用户手动执行
   vim /etc/passwd
   # 将 root:x:...:/bin/bash 改为 root:x:...:/usr/bin/zsh
   ```

```bash
bash ~/.agents/skills/zsh-setup/scripts/07_set_default_shell.sh
```

### Step 8: 验证配置

```bash
bash ~/.agents/skills/zsh-setup/scripts/08_verify.sh
```

**验证项目：**
1. zsh 版本检查
2. oh-my-zsh 安装检查
3. 主题安装检查
4. 插件安装检查
5. `.zshrc` 语法检查（`zsh -n ~/.zshrc`）
6. 默认 shell 检查

---

## 快速执行命令

如果用户需要完整安装，可以一键执行：

```bash
# 检测环境
source ~/.agents/skills/zsh-setup/scripts/01_detect_env.sh

# 安装 zsh
sudo apt update && sudo apt install -y zsh  # Ubuntu
# 或 sudo dnf install -y zsh                  # Fedora/openEuler

# 安装 oh-my-zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# 安装 Powerlevel10k
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ~/.oh-my-zsh/custom/themes/powerlevel10k

# 安装核心插件
git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting

# 设置主题和插件
sed -i 's/^ZSH_THEME="robbyrussell"/ZSH_THEME="powerlevel10k\/powerlevel10k"/' ~/.zshrc
sed -i 's/plugins=(git)/plugins=(git zsh-autosuggestions zsh-syntax-highlighting)/' ~/.zshrc

# 设置默认 shell
sudo usermod -s /usr/bin/zsh root
```

---

## 故障排除

### 问题：chsh 命令不可用

**原因：** 非 root 用户或系统限制

**解决：** 使用 `usermod -s /usr/bin/zsh root` 或手动修改 `/etc/passwd`

### 问题：oh-my-zsh 安装失败

**原因：** 网络问题或 curl 不可用

**解决：**
```bash
# 检查 curl
curl --version

# 使用 wget 替代
wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O install.sh
sh install.sh
```

### 问题：Powerlevel10k 主题不显示

**原因：** 字体不支持

**解决：** 安装 Nerd Fonts 或 Meslo Nerd Font

### 问题：插件不工作

**原因：** 插件未正确加载

**解决：** 检查 `.zshrc` 中的 plugins 配置，确保格式正确：
```zsh
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
```

### 问题：bashrc 迁移后报错

**原因：** bash 特有语法不兼容

**解决：** 手动检查迁移的内容，将 `[` 替换为 `[[`，`$()` 语法在 zsh 中兼容

---

## 参考文档

- `references/plugins.md` - 插件推荐列表和功能说明
- `references/troubleshooting.md` - 常见问题解决方案

---

## 首次使用提示

完成安装后，告知用户：

1. **重新登录终端** 或运行 `zsh` 启动新 shell
2. **Powerlevel10k 配置向导** 会在首次启动时自动运行
   - 选择你喜欢的提示符风格
   - 选择图标显示方式
   - 根据喜好配置其他选项
3. 如需重新配置，运行 `p10k configure`

---

## 环境变量

技能使用以下环境变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `ZSH_CUSTOM` | `~/.oh-my-zsh/custom` | 自定义插件/主题目录 |
