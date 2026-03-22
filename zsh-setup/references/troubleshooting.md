# Zsh 故障排除指南

## 常见问题

### 1. chsh 命令不可用

**症状**:
```
bash: chsh: command not found
```

**原因**: 
- 非 root 用户
- 系统限制

**解决方案**:

**方法 1: 使用 usermod**
```bash
sudo usermod -s /usr/bin/zsh $USER
```

**方法 2: 手动编辑 /etc/passwd**
```bash
sudo vim /etc/passwd
# 找到你的用户行，将 /bin/bash 改为 /usr/bin/zsh
```

**方法 3: 添加到 shell 列表**
```bash
# Ubuntu/Debian
sudo apt install zsh
sudo -s
echo /usr/bin/zsh >> /etc/shells
chsh -s /usr/bin/zsh
```

---

### 2. oh-my-zsh 安装失败

**症状**:
```
curl: (7) Failed to connect to raw.githubusercontent.com
```

**原因**: 网络问题或代理设置

**解决方案**:

**方法 1: 使用 Gitee 镜像**
```bash
git clone https://gitee.com/mirrors/oh-my-zsh.git ~/.oh-my-zsh
```

**方法 2: 使用 wget**
```bash
wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O install.sh
CHSH=no RUNZSH=no sh install.sh
rm install.sh
```

**方法 3: 手动安装**
```bash
# 克隆仓库
git clone https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh

# 创建模板配置
cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc

# 设置插件目录
mkdir -p ~/.oh-my-zsh/custom/plugins
```

---

### 3. Powerlevel10k 主题不显示

**症状**: 终端只显示简单提示符

**原因**: 字体不支持图标显示

**解决方案**:

**方法 1: 安装 Nerd Fonts**
```bash
# Ubuntu/Debian
sudo apt install fonts-firacode

# macOS
brew install font-firacode-nerd-font
```

**方法 2: 使用 Meslo Nerd Font**
1. 下载: https://github.com/romkatv/powerlevel10k#fonts
2. 解压并双击安装
3. 在终端设置中选择 "MesloLGS NF"

**方法 3: 禁用图标（临时）**
在 `.p10k.zsh` 中设置：
```zsh
POWERLEVEL10K_MODE='awesome-fontconfig'
# 或
POWERLEVEL10K_MODE='nerdfont-complete'
```

---

### 4. 插件不工作

**症状**: 插件功能没有生效

**诊断步骤**:

```bash
# 1. 检查插件是否安装
ls ~/.oh-my-zsh/custom/plugins/

# 2. 检查 .zshrc 中的 plugins 配置
grep '^plugins=' ~/.zshrc

# 3. 调试插件加载
zsh -xv 2>&1 | grep -E "(plugin|loading)" | less
```

**常见原因**:

1. **语法高亮插件顺序错误**
   - 必须在 plugins 列表最后
   ```zsh
   plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
   #                    ↑                    ↑
   ```

2. **插件未正确克隆**
   ```bash
   # 重新安装
   rm -rf ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
   git clone https://github.com/zsh-users/zsh-syntax-highlighting.git \
     ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
   ```

---

### 5. .zshrc 语法错误

**症状**:
```
/home/user/.zshrc:.:10: file not found: /etc/zshrc
```

**原因**: oh-my-zsh 默认尝试加载 `/etc/zshrc`

**解决方案**:
```bash
# 在 .zshrc 中禁用
DISABLE_AUTO_TITLE="true"
```

---

### 6. 启动速度慢

**诊断**:
```bash
# 测量启动时间
time zsh -i -c exit

# 详细分析
zsh -xv 2>&1 | grep -v "^$" | wc -l
```

**优化方法**:

1. **禁用不需要的插件**
2. **延迟加载插件**
3. **使用 cache**
```bash
# 在 .zshrc 中
zstyle ':omz:*' cache-creation yes
```

4. **使用 starship 替代 Powerlevel10k** (可选)
```bash
# 安装 starship
curl -sS https://starship.rs/install.sh | sh

# 在 .zshrc 中添加
eval "$(starship init zsh)"
```

---

### 7. bashrc 迁移后报错

**症状**: 迁移后 zsh 报错

**常见问题**:

1. **`[ ]` vs `[[ ]]`**
   ```bash
   # 错误
   if [ $var = "test" ]; then
   
   # 正确
   if [[ $var == "test" ]]; then
   ```

2. **字符串引号**
   ```bash
   # 错误
   if [ $var ]; then
   
   # 正确
   if [[ -n $var ]]; then
   # 或
   if [ -n "$var" ]; then
   ```

3. **命令替换**
   ```bash
   # zsh 支持，但更推荐
   var=$(command)
   ```

---

### 8. Git 提示符不显示

**症状**: 终端不显示 git 分支信息

**解决方案**:

1. **确保主题支持 git**
   ```zsh
   # Powerlevel10k 配置中启用
   typeset -g POWERLEVEL9K_SHOW_CHANGESET=true
   ```

2. **检查 git 插件加载**
   ```bash
   # 在 .zshrc 中确认
   plugins=(git)
   ```

3. **检查 git 仓库**
   ```bash
   git status
   ```

---

### 9. 自动建议不显示

**症状**: 输入命令时没有灰色建议

**解决方案**:

1. **检查插件安装**
   ```bash
   ls ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
   ```

2. **检查配置**
   在 `.zshrc` 中添加：
   ```zsh
   # 建议样式
   ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=8"
   ```

3. **检查历史记录**
   ```bash
   # 确保有历史记录
   history
   ```

---

### 10. 颜色显示问题

**症状**: 颜色显示不正确或乱码

**解决方案**:

1. **设置终端支持 256 色**
   ```bash
   export TERM=xterm-256color
   ```

2. **启用颜色**
   ```bash
   # 在 .zshrc 中
   export CLICOLOR=1
   alias ls='ls --color=auto'
   ```

3. **使用 ls-icons**
   如果 `ls` 不显示颜色，安装 `coreutils` 最新版本。

---

## 性能基准

典型 zsh 启动时间：

| 配置 | 启动时间 |
|------|----------|
| 裸 zsh | ~50ms |
| + oh-my-zsh | ~100-200ms |
| + 5 个插件 | ~200-400ms |
| + Powerlevel10k | ~300-500ms |

如果启动超过 1 秒，检查是否有问题的插件或配置。
