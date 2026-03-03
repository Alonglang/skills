# 技能文件管理结构

## 目录结构

```
/Users/alonglang/
├── .agents/skills/                    # ⭐ 主技能目录 (所有技能的实际位置)
│   ├── 2234839-siyuan-notes-skill/     # 思源笔记技能
│   ├── active-maintenance/
│   ├── agent-browser/                  # 浏览器自动化
│   ├── bilibili-analyzer/              # B站视频分析
│   ├── email-best-practices/           # 邮件最佳实践
│   ├── find-skills/                    # 技能查找工具
│   ├── hippocampus-memory/
│   ├── idea-coach/
│   ├── maishou/                        # 购物比价
│   ├── openclaw-autoupdate/
│   ├── openclaw-config/                # OpenClaw配置管理
│   ├── peekaboo/
│   ├── pixiv-skill/                    # Pixiv插画搜索
│   ├── python-executor/                # Python执行器
│   ├── secucheck/                      # 安全审计
│   ├── skill-vetter/
│   └── tubescribe/                     # YouTube视频总结
│
├── .openclaw/skills/                   # 🔗 符号链接目录
│   ├── 2234839-siyuan-notes-skill -> ../../.agents/skills/2234839-siyuan-notes-skill
│   ├── siyuan-skill -> ../../.agents/skills/2234839-siyuan-notes-skill (别名)
│   └── [其他 16 个技能的符号链接...]
│
└── .config/opencode/skills/            # 🔗 符号链接目录
    ├── find-skills -> /Users/alonglang/.agents/skills/find-skills
    └── openclaw-config -> /Users/alonglang/.agents/skills/openclaw-config
```

## 管理原则

1. **主位置**: `.agents/skills/` 是所有技能的主存储位置
2. **链接集中**: 其他位置通过符号链接引用主位置
3. **单一真相**: 所有技能的实际内容只存在一个地方
4. **易于维护**: 更新、修改、删除只需在主目录操作

## 使用说明

### 添加新技能

```bash
# 在主目录创建
mkdir ~/.agents/skills/my-new-skill
cd ~/.agents/skills/my-new-skill

# 创建SKILL.md
cat > SKILL.md << 'EOF'
---
name: my-new-skill
description: 我的技能描述
---

# 我的技能
技能内容...
EOF

# 在其他位置创建链接
ln -s ~/.agents/skills/my-new-skill ~/.openclaw/skills/my-new-skill
ln -s ~/.agents/skills/my-new-skill ~/.config/opencode/skills/my-new-skill
```

### 删除技能

```bash
# 只需删除主目录，其他位置的链接会自动失效
rm -rf ~/.agents/skills/my-new-skill
# 清理无效链接（可选）
find ~/.openclaw/skills ~/.config/opencode/skills -xtype l -delete
```

### 更新技能

```bash
# 直接编辑主目录中的文件
vim ~/.agents/skills/my-new-skill/SKILL.md
# 所有链接会自动反映更改
```

## 当前技能列表 (17个)

1. **2234839-siyuan-notes-skill** ⭐ - 思源笔记查询工具（已优化中文版）
2. **active-maintenance** -主动维护
3. **agent-browser** - 浏览器自动化（已优化中文版）
4. **bilibili-analyzer** - B站视频分析（中文）
5. **email-best-practices** - 邮件最佳实践（已优化中文版）
6. **find-skills** - 技能查找工具（已优化中文版）
7. **hippocampus-memory** - 海马体记忆
8. **idea-coach** - 创意教练
9. **maishou** - 购物比价（中文，已优化）
10. **openclaw-autoupdate** - OpenClaw自动更新
11. **openclaw-config** - OpenClaw配置管理（已优化中文版）
12. **peekaboo** - 躲猫猫
13. **pixiv-skill** - Pixiv插画搜索（已优化中文版）
14. **python-executor** - Python执行器（已优化中文版）
15. **secucheck** - 安全审计（已优化中文版）
16. **skill-vetter** - 技能审查
17. **tubescribe** - YouTube视频总结（已优化中文版）

### 别名链接

- `siyuan-skill` -> `2234839-siyuan-notes-skill` (兼容别名)

## 验证链接

```bash
# 检查所有链接是否有效
find ~/.openclaw/skills ~/.config/opencode/skills -type l | while read link; do
  if [ ! -e "$link" ]; then
    echo "无效链接: $link"
  fi
done

# 应该输出: 空行 (所有链接都有效)
```

## 优势

✅ **集中管理**: 所有技能在一个位置，易于查找和维护
✅ **避免重复**: 不再有多个技能副本
✅ **同步更新**: 修改一次，所有位置自动同步
✅ **节省空间**: 使用符号链接节省存储空间
✅ **一致性**: 确保所有系统使用相同版本的技能

## 注意事项

- 始终在 `.agents/skills/` 进行修改
- 删除技能前确保没有重要数据
- 符号链接在不同文件系统中可能不可用（本地环境无此问题）
- 建议定期验证链接完整性

---

创建时间: 2026-03-02
最后更新: 2026-03-02
