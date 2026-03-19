---
name: siyuan-notes
description: 思源笔记全功能操作技能。当用户的请求涉及思源笔记（或简称"思源"）的任何操作时，必须触发此技能。支持：查找/检索/浏览笔记内容、创建/新建文档或块、编辑/修改/更新笔记、删除笔记或块、管理笔记本（创建/重命名/删除）、向笔记追加内容、设置块属性、导出文档为 Markdown、推送通知到思源界面。只要用户提及思源笔记，不管什么操作都使用此技能。
---

## 调用方式

**方式1：命令行（快速操作）**
```bash
node index.js <命令> [参数]
```

**方式2：JS 代码（复杂逻辑，推荐）**
```bash
node -e "
const siyuan = require('./index.js');
(async () => {
  // 你的逻辑
})();
"
```

**注意**：
- 用技能时显示的 "Base directory for this skill" 路径作为 `cwd` 参数
- 不要用 `cd` 命令，用 `workdir`/`cwd` 参数控制工作目录
- 优先用 `node -e` 执行，避免创建临时文件

---

## 命令速查

### 查询命令
```bash
node index.js search <关键词> [类型]     # 搜索内容（类型：p段落/h标题/d文档）
node index.js docs [笔记本ID]           # 列出文档
node index.js headings <文档ID> [h1-h6] # 文档标题
node index.js blocks <文档ID> [类型]    # 文档子块
node index.js tag <标签名>              # 按标签搜索
node index.js backlinks <块ID>          # 反向链接
node index.js tasks ["[ ]"|"[x]"] [天数] # 任务列表
node index.js daily <开始> <结束>       # 日记（YYYYMMDD）
node index.js attr <属性名> [属性值]    # 按属性查询
node index.js bookmarks [书签名]        # 书签
node index.js recent [天数] [类型]      # 最近修改内容
node index.js random [文档ID]           # 随机漫游
```

### 写操作命令
```bash
node index.js notebooks                           # 列出所有笔记本
node index.js create-notebook <名称>              # 创建笔记本
node index.js create-doc <笔记本ID> <路径> [内容] # 创建文档
node index.js append <父块ID> <内容>              # 追加内容
node index.js update <块ID> <内容>               # 更新块
node index.js delete <块ID>                      # 删除块
node index.js attrs-get <块ID>                   # 获取块属性
node index.js attrs-set <块ID> <JSON>            # 设置块属性
node index.js export <文档ID>                    # 导出 Markdown
node index.js notify <消息>                      # 推送通知
```

### 系统命令
```bash
node index.js check    # 检查连接
node index.js version  # 版本信息
```

---

## 核心 API 函数

```javascript
const siyuan = require('./index.js');

// ── 通用 API 调用（可调用任意端点）────────────────
await siyuan.callSiyuanAPI('/api/block/updateBlock', { id, dataType: 'markdown', data: '新内容' })
await siyuan.executeSiyuanQuery('SELECT * FROM blocks WHERE type="d" LIMIT 10')

// ── 查询操作 ──────────────────────────────────────
await siyuan.searchNotes('关键词', 20, 'p')        // 搜索段落
await siyuan.searchNotes('关键词', 10, 'h')        // 搜索标题
await siyuan.searchByTag('标签名', 20)             // 按标签
await siyuan.getRecentBlocks(7, 'updated')         // 最近7天
await siyuan.searchTasks('[ ]', 7)                // 未完成任务
await siyuan.getDailyNotes('20240101', '20240131') // 日记
await siyuan.getBacklinks('块ID')                  // 反向链接
await siyuan.listDocuments('笔记本ID')             // 文档列表
await siyuan.getDocumentHeadings('文档ID')         // 文档标题
await siyuan.searchByAttribute('custom-status', 'done') // 按属性

// ── 笔记本操作 ────────────────────────────────────
await siyuan.listNotebooks()
await siyuan.createNotebook('新笔记本')
await siyuan.renameNotebook(notebookId, '新名称')
await siyuan.removeNotebook(notebookId)

// ── 文档操作 ──────────────────────────────────────
await siyuan.createDocument(notebookId, '/路径/文档名', '## 标题\n\n内容')
await siyuan.renameDocument(docId, '新标题')
await siyuan.deleteDocument(docId)
await siyuan.moveDocuments([docId1, docId2], targetId)
await siyuan.exportDocMarkdown(docId)              // 返回 {hPath, content}

// ── 块写操作 ──────────────────────────────────────
await siyuan.appendBlock('- 新内容', 'markdown', parentID)    // 末尾追加
await siyuan.prependBlock('# 标题', 'markdown', parentID)     // 开头插入
await siyuan.insertBlock('内容', 'markdown', previousID)      // 指定位置插入
await siyuan.updateBlock(id, '新内容', 'markdown')            // 更新块
await siyuan.deleteBlock(id)                                  // 删除块
await siyuan.moveBlock(id, previousID)                        // 移动块

// ── 属性操作 ──────────────────────────────────────
await siyuan.getBlockAttrs(id)
await siyuan.setBlockAttrs(id, { 'custom-priority': 'high', 'custom-status': 'done' })

// ── 通知 ──────────────────────────────────────────
await siyuan.pushMessage('操作完成', 5000)
await siyuan.pushErrorMessage('发生错误')

// ── 格式化输出 ────────────────────────────────────
siyuan.formatResults(results)            // 简洁文本
siyuan.formatStructuredResults(results)  // 结构化 JSON
```

---

## 写操作示例

### 创建文档并写入内容
```javascript
const siyuan = require('./index.js');
(async () => {
  // 1. 找到目标笔记本
  const notebooks = await siyuan.listNotebooks();
  const nb = notebooks.find(n => n.name.includes('日记'));

  // 2. 创建文档
  const today = new Date().toISOString().slice(0,10);
  const docId = await siyuan.createDocument(nb.id, `/日记/${today}`, `# ${today}\n\n`);

  // 3. 追加内容
  await siyuan.appendBlock('## 今日记录\n\n- 完成了 XXX', 'markdown', docId);
  console.log('文档已创建:', docId);
})();
```

### 更新块内容
```javascript
(async () => {
  // 先搜索找到块 ID
  const results = await siyuan.searchNotes('旧内容', 5, 'p');
  const blockId = results[0].id;

  // 更新
  await siyuan.updateBlock(blockId, '新内容（已更新）', 'markdown');
})();
```

### 批量设置属性
```javascript
(async () => {
  const tasks = await siyuan.searchTasks('[x]', 7);
  for (const task of tasks) {
    await siyuan.setBlockAttrs(task.id, { 'custom-status': 'archived' });
  }
})();
```

---

## SQL 查询参考

### 常用查询模式
```sql
-- 搜索包含关键词的段落
SELECT id, content, hpath, updated FROM blocks
WHERE markdown LIKE '%关键词%' AND type='p'
ORDER BY updated DESC LIMIT 20

-- 任务列表（注意：type='i' subtype='t'，不是 type='l'）
SELECT * FROM blocks WHERE type='i' AND subtype='t'
AND markdown LIKE '* [ ] %'
AND created > strftime('%Y%m%d%H%M%S', datetime('now', '-7 day'))

-- Daily Note 日记
SELECT DISTINCT B.* FROM blocks B JOIN attributes A ON B.id=A.block_id
WHERE A.name LIKE 'custom-dailynote-%' AND B.type='d'
AND A.value >= '20240101' AND A.value <= '20240131'
ORDER BY A.value DESC

-- 反向链接
SELECT * FROM blocks WHERE id IN (
    SELECT block_id FROM refs WHERE def_block_id='<块ID>'
) LIMIT 999

-- 按自定义属性查询
SELECT * FROM blocks WHERE id IN (
    SELECT block_id FROM attributes
    WHERE name='custom-status' AND value='in-progress'
)

-- 最近 N 天修改
SELECT id, content, type, hpath, updated FROM blocks
WHERE updated > strftime('%Y%m%d%H%M%S', datetime('now', '-7 day'))
ORDER BY updated DESC LIMIT 50
```

### 数据库表速查

**blocks 常用字段**：`id`、`type`(`d/h/p/l/i/b/s/c/t/m`)、`subtype`(`h1-h6/u/o/t`)、`content`、`markdown`、`tag`(`#tag1 #tag2#`)、`root_id`、`box`、`hpath`、`created`、`updated`

**refs 表**：`block_id`（引用所在）→ `def_block_id`（被引用块）

**attributes 表**：`block_id`、`name`（自定义属性含 `custom-` 前缀）、`value`

> 完整 API 端点参考：`references/api-operations.md`

---

## 配置说明

```bash
cp .env.example .env
# 编辑 .env：
SIYUAN_HOST=localhost
SIYUAN_PORT=6806
SIYUAN_USE_HTTPS=false
SIYUAN_API_TOKEN=your_token_here

# 远程 + HTTPS + Basic Auth 代理：
# SIYUAN_HOST=note.example.com
# SIYUAN_PORT=
# SIYUAN_USE_HTTPS=true
# SIYUAN_BASIC_AUTH_USER=username
# SIYUAN_BASIC_AUTH_PASS=password
```
