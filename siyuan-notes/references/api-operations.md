# 思源笔记 API 操作参考

> 官方文档：https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md
> 所有请求均为 POST，Content-Type: application/json，需 Authorization: Token <token>

---

## 系统 `/api/system`

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/system/version` | 无 | `string` 版本号 |
| `/api/system/currentTime` | 无 | `number` 毫秒时间戳 |
| `/api/system/bootProgress` | 无 | `{progress, details}` |
| `/api/system/exit` | `{force?: boolean}` | 无 |

---

## 笔记本 `/api/notebook`

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/notebook/lsNotebooks` | 无 | `{notebooks: [{id,name,icon,sort,closed}]}` |
| `/api/notebook/openNotebook` | `{notebook}` | 无 |
| `/api/notebook/closeNotebook` | `{notebook}` | 无 |
| `/api/notebook/renameNotebook` | `{notebook, name}` | 无 |
| `/api/notebook/createNotebook` | `{name}` | `{notebook: {id,name,...}}` |
| `/api/notebook/removeNotebook` | `{notebook}` | 无 |
| `/api/notebook/getNotebookConf` | `{notebook}` | `{box, conf, name}` |
| `/api/notebook/setNotebookConf` | `{notebook, conf}` | `{conf}` |

---

## 文档树 `/api/filetree`

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/filetree/createDocWithMd` | `{notebook, path, markdown}` | `string` 新文档 ID |
| `/api/filetree/renameDocByID` | `{id, title}` | 无 |
| `/api/filetree/removeDocByID` | `{id}` | 无 |
| `/api/filetree/moveDocsByID` | `{fromIDs: string[], toID}` | 无 |
| `/api/filetree/getHPathByID` | `{id}` | `string` 人类可读路径 |
| `/api/filetree/getIDsByHPath` | `{path, notebook}` | `string[]` 文档 ID 数组 |
| `/api/filetree/listDocsByPath` | `{notebook, path, sort?}` | `{box, path, files:[]}` |

---

## 块操作 `/api/block`

### 读操作

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/block/getBlockKramdown` | `{id}` | `{id, kramdown}` |
| `/api/block/getChildBlocks` | `{id}` | `[{id,type,subType}]` |
| `/api/block/getBlockDOM` | `{id}` | `{id, dom, rootID}` |
| `/api/block/getBlockBreadcrumb` | `{id}` | `[{id,name,type,subType,children}]` |

### 写操作

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/block/insertBlock` | `{dataType, data, nextID?/previousID?/parentID?}` | `[{doOperations:[{id,...}]}]` |
| `/api/block/appendBlock` | `{dataType, data, parentID}` | `[{doOperations:[{id,...}]}]` |
| `/api/block/prependBlock` | `{dataType, data, parentID}` | `[{doOperations:[{id,...}]}]` |
| `/api/block/updateBlock` | `{id, dataType, data}` | `[{doOperations:[{id,...}]}]` |
| `/api/block/deleteBlock` | `{id}` | `[{doOperations:[{id,...}]}]` |
| `/api/block/moveBlock` | `{id, previousID?/parentID?}` | `[{doOperations:[{id,...}]}]` |
| `/api/block/foldBlock` | `{id}` | 无 |
| `/api/block/unfoldBlock` | `{id}` | 无 |

**dataType 取值**：`"markdown"` 或 `"dom"`

**insertBlock 定位规则（三者至少填一）**：
- `previousID`：插入到该块之后
- `nextID`：插入到该块之前
- `parentID`：插入为该块的子块（末尾）

---

## 属性 `/api/attr`

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/attr/setBlockAttrs` | `{id, attrs: {key: value}}` | `null` |
| `/api/attr/getBlockAttrs` | `{id}` | `{key: value, ...}` |

**属性命名规则**：
- 内置属性：`name`、`alias`、`memo`、`bookmark`
- 自定义属性：必须加 `custom-` 前缀，如 `custom-priority`、`custom-status`

---

## SQL 查询 `/api/query`

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/query/sql` | `{stmt}` | `Array` 查询结果 |

**注意**：嵌入块模式只能 `select * from blocks`；API 模式支持完整 SQL（JOIN、子查询、GROUP BY 等）

---

## 搜索 `/api/search`

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/search/fullTextSearchBlock` | `{query, method?, types?, paths?, groupBy?, orderBy?}` | `{blocks, matchedBlockCount, matchedRootCount}` |

**method**：`0` 关键词，`1` 查询语法，`2` SQL，`3` 正则
**types**：`{document,heading,list,listItem,codeBlock,mathBlock,table,blockquote,superBlock,paragraph}`

---

## 导出 `/api/export`

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/export/exportMdContent` | `{id}` | `{hPath, content}` |
| `/api/export/exportResources` | `{paths}` | `{zip}` (zip 文件路径) |

---

## 通知 `/api/notification`

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/notification/pushMsg` | `{msg, timeout?}` | `{id}` |
| `/api/notification/pushErrMsg` | `{msg, timeout?}` | `{id}` |

**timeout**：毫秒，默认 7000

---

## 文件 `/api/file`

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/file/getFile` | `{path}` | 文件内容（非 JSON，HTTP 202 表示失败） |
| `/api/file/putFile` | `{path, isDir, modTime, file}` (multipart) | 无 |
| `/api/file/removeFile` | `{path}` | 无 |
| `/api/file/renameFile` | `{path, newPath}` | 无 |
| `/api/file/readDir` | `{path}` | `[{isDir,isSymlink,name,updated}]` |

**路径**：相对于工作空间根目录，如 `/data/20210808180117-xxx/xxx.sy`

---

## 数据库视图 `/api/av`（树形视图/数据库块）

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/av/getAttributeView` | `{id}` | 视图完整数据 |
| `/api/av/renderAttributeView` | `{id, viewID?, query?, page?, pageSize?}` | 渲染后的视图数据 |
| `/api/av/searchAttributeView` | `{keyword, excludes?}` | `[{avID,avName,blockIDs}]` |

---

## 模板 `/api/template`

| 端点 | 参数 | 返回 |
|------|------|------|
| `/api/template/render` | `{id, path}` | `{content, path}` |
| `/api/template/renderSprig` | `{template}` | `string` 渲染结果 |

---

## 数据库表结构速查

### blocks 表（最常用）

| 字段 | 说明 | 示例 |
|------|------|------|
| `id` | 块 ID | `20210104091228-d0rzbmm` |
| `parent_id` | 父块 ID | — |
| `root_id` | 所在文档 ID | — |
| `box` | 笔记本 ID | — |
| `path` | 文件路径 | `/xxx/xxx.sy` |
| `hpath` | 人类可读路径 | `/日记/2024-01` |
| `content` | 纯文本内容 | — |
| `markdown` | Markdown 内容 | — |
| `type` | 块类型 | `d/h/p/l/i/b/s/c/t/m/av` |
| `subtype` | 子类型 | `h1-h6/u/o/t` |
| `tag` | 标签 | `#tag1 #tag2#` |
| `created` | 创建时间 | `20210104091228` |
| `updated` | 更新时间 | `20210104091228` |

**type 对照**：
- `d` 文档、`h` 标题、`p` 段落、`l` 列表块、`i` 列表项、`b` 引述块
- `s` 超级块、`c` 代码块、`t` 表格块、`m` 数学公式、`av` 数据库

**subtype 对照**：
- 标题：`h1`~`h6`
- 列表项：`u` 无序、`o` 有序、`t` 任务

### refs 表（反向链接）

| 字段 | 说明 |
|------|------|
| `block_id` | 引用所在块 ID |
| `def_block_id` | 被引用块 ID |
| `def_block_root_id` | 被引用块所在文档 ID |

### attributes 表（自定义属性）

| 字段 | 说明 |
|------|------|
| `block_id` | 块 ID |
| `name` | 属性名（自定义属性含 `custom-` 前缀） |
| `value` | 属性值 |

---

## 常用 SQL 片段

```sql
-- 任务列表项（type='i' subtype='t'，NOT type='l'）
SELECT * FROM blocks WHERE type='i' AND subtype='t' AND markdown LIKE '* [ ] %'

-- 最近 N 天内容
WHERE updated > strftime('%Y%m%d%H%M%S', datetime('now', '-7 day'))

-- Daily Note 日记文档
SELECT DISTINCT B.* FROM blocks B JOIN attributes A ON B.id=A.block_id
WHERE A.name LIKE 'custom-dailynote-%' AND B.type='d'

-- 反向链接
SELECT * FROM blocks WHERE id IN (
    SELECT block_id FROM refs WHERE def_block_id='<id>'
)

-- 含自定义属性的块
SELECT * FROM blocks WHERE id IN (
    SELECT block_id FROM attributes WHERE name='custom-xxx' AND value='yyy'
)
```
