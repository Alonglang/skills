# Zsh 插件推荐

## 核心插件（推荐必装）

### 1. zsh-autosuggestions
**功能**: 基于命令历史的自动建议

**特点**:
- 根据历史输入自动补全命令
- 灰色显示建议，按 Tab 键采纳
- 按 → 或 Ctrl+F 采纳建议

**安装**: 
```bash
git clone https://github.com/zsh-users/zsh-autosuggestions \
  ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
```

---

### 2. zsh-syntax-highlighting
**功能**: 命令语法高亮

**特点**:
- 正确的命令显示绿色
- 错误的命令显示红色
- 路径高亮显示

**安装**:
```bash
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git \
  ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
```

---

## oh-my-zsh 内置插件

### 3. extract (x)
**功能**: 统一解压命令

**特点**:
- 输入 `x 文件名` 自动解压
- 支持 tar.gz, zip, rar, 7z 等格式

**启用**: 添加到 plugins 列表

---

### 4. sudo
**功能**: 快速添加 sudo

**特点**:
- 按两次 Esc 自动在命令前加 sudo
- 光标在行首时效果最佳

**启用**: 添加到 plugins 列表

---

### 5. z
**功能**: 快速目录跳转

**特点**:
- 记录访问过的目录
- 输入部分目录名自动跳转
- 基于频率自动排序

**启用**: 添加到 plugins 列表

---

### 6. copypath
**功能**: 复制路径到剪贴板

**特点**:
- `copypath ~/.config` 复制绝对路径
- `copypwd` 复制当前目录

**启用**: 添加到 plugins 列表

---

### 7. copyfile
**功能**: 复制文件内容

**特点**:
- `copyfile file.txt` 复制文件内容到剪贴板

**启用**: 添加到 plugins 列表

---

### 8. docker
**功能**: Docker 命令补全

**特点**:
- Docker 命令自动补全
- 容器/镜像名称补全

**前提**: 已安装 Docker

**启用**: 添加到 plugins 列表

---

### 9. kubectl
**功能**: Kubernetes 命令补全

**特点**:
- kubectl 命令自动补全
- 资源名称、命名空间补全

**前提**: 已安装 kubectl

**启用**: 添加到 plugins 列表

---

### 10. terraform
**功能**: Terraform 命令补全

**特点**:
- terraform 命令自动补全
- 资源类型补全

**前提**: 已安装 Terraform

**启用**: 添加到 plugins 列表

---

## 高级插件

### 11. fzf-tab
**功能**: 使用 fzf 增强 zsh 补全

**特点**:
- 模糊搜索补全选项
- 预览功能
- 更好的补全体验

**安装**:
```bash
git clone https://github.com/Aloxaf/fzf-tab \
  ~/.oh-my-zsh/custom/plugins/fzf-tab
```

---

### 12. zsh-completions
**功能**: 额外的命令补全

**特点**:
- 超过 100 个命令的补全
- 包含 kubectl, helm, docker 等

**安装**:
```bash
git clone https://github.com/zsh-users/zsh-completions \
  ~/.oh-my-zsh/custom/plugins/zsh-completions
```

---

## 插件推荐组合

### 基础组合（日常使用）
```zsh
plugins=(git zsh-autosuggestions zsh-syntax-highlighting extract sudo z)
```

### 开发运维组合
```zsh
plugins=(git docker kubectl terraform zsh-autosuggestions zsh-syntax-highlighting extract sudo z)
```

### 高级用户组合
```zsh
plugins=(git docker kubectl terraform zsh-autosuggestions zsh-syntax-highlighting extract sudo z fzf-tab zsh-completions)
```

---

## 插件性能优化

### 避免加载过多插件
每个插件都会增加 shell 启动时间。使用 `zsh -xv` 可以测量加载时间。

### 延迟加载不常用插件
```zsh
# 在 .zshrc 中
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

# 延迟加载 terraform
autoload -Uz compinit && compinit
```

### 使用 bullet- Trains 主题优化
如果不需要 git 状态显示，可以禁用：
```zsh
# 在 .zshrc 中
ZSH_THEME="robbyrussell"
```
