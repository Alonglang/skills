# 思源笔记 Skill 测试报告

## 测试时间
2026-03-03

## 测试环境
- Node.js version: v22.22.0
- 思源笔记版本: 3.1.11
- 服务器: alonglang.com:6806

---

## 测试结果概览

✅ **总体状态**: 测试通过，发现并修复了多个问题

---

## 发现的问题及修复

### 问题 1: listDocuments 函数缺少 type 字段
- **位置**: `index.js:638`
- **严重程度**: 中
- **问题描述**: SQL 查询 `SELECT id, content, created, updated, box, path, hpath` 缺少 `type` 字段
- **影响**: `formatResults()` 和 `formatStructuredResults()` 无法正确显示文档类型，显示 "unknown" 或空字符串
- **修复**: 在 SELECT 中添加了 `type, subtype` 字段
- **验证**: 
  - 修复前: `1. [2026-03-02 20:20:01] unknown: Linux.md`
  - 修复后: `1. [2026-03-02 20:20:01] d: Linux.md`
- **状态**: ✅ 已修复并验证

### 问题 2: searchNotes 函数存在 SQL 注入漏洞
- **位置**: `index.js:624`
- **严重程度**: 高
- **问题描述**: `blockType` 参数直接插入 SQL 查询，没有进行转义
- **影响**: 攻击者可以通过 `blockType="d' OR '1'='1"` 执行 SQL 注入攻击
- **修复**: 添加了 `blockType.replace(/'/g, "''")` 转义
- **验证**: 
  - 修复前: 返回 5 条结果（注入成功）
  - 修复后: 返回 0 条结果（注入被阻止）
- **额外修复**: 添加了 limit 参数验证（限制在 1-1000 之间）
- **状态**: ✅ 已修复并验证

### 问题 3: getDocumentHeadings 函数存在 SQL 注入漏洞
- **位置**: `index.js:663`
- **严重程度**: 高
- **问题描述**: `headingType` 参数直接插入 SQL 查询，没有进行转义
- **影响**: 攻击者可以通过 `headingType="h1' OR '1'='1"` 执行 SQL 注入攻击
- **修复**: 添加了 `headingType.replace(/'/g, "''")` 转义
- **验证**: 注入攻击被阻止
- **状态**: ✅ 已修复并验证

### 问题 4: getDocumentBlocks 函数存在 SQL 注入漏洞
- **位置**: `index.js:682`
- **严重程度**: 高
- **问题描述**: `blockType` 参数直接插入 SQL 查询，没有进行转义
- **影响**: 攻击者可以执行 SQL 注入攻击
- **修复**: 添加了 `blockType.replace(/'/g, "''")` 转义
- **验证**: 注入攻击被阻止
- **状态**: ✅ 已修复并验证

### 问题 5: getRecentBlocks 函数存在 SQL 注入漏洞
- **位置**: `index.js:841`
- **严重程度**: 高
- **问题描述**: `blockType` 参数直接插入 SQL 查询，没有进行转义；`orderBy` 参数也没有验证
- **影响**: 攻击者可以执行 SQL 注入攻击
- **修复**: 
  - 添加了 `blockType.replace(/'/g, "''")` 转义
  - 添加了 `orderBy` 参数白名单验证（只允许 'updated' 或 'created'）
  - 添加了 limit 参数验证（限制在 1-1000 之间）
- **验证**: 注入攻击被阻止
- **状态**: ✅ 已修复并验证

### 问题 6: searchTasks 函数参数缺少验证
- **位置**: `index.js:738-745`
- **严重程度**: 中
- **问题描述**: `days` 和 `limit` 参数没有验证，`status` 参数没有转义
- **影响**: 可能导致性能问题（超大 limit）或意外结果（负数 days）
- **修复**: 
  - 添加了 `days` 验证（限制在 1-365 之间）
  - 添加了 `limit` 验证（限制在 1-1000 之间）
  - 添加了 `status.replace(/'/g, "''")` 转义
- **验证**: 参数被正确限制
- **状态**: ✅ 已修复并验证

---

## 功能测试结果

### 基础功能测试
- ✅ 模块加载正常
- ✅ 连接检查通过
- ✅ 版本查询正常
- ✅ 列出笔记本正常（6 个笔记本）
- ✅ 列出文档正常
- ✅ 搜索功能正常
- ✅ 格式化输出正常

### 查询函数测试
- ✅ searchNotes: 正常
- ✅ listDocuments: 正常（已修复）
- ✅ getDocumentHeadings: 正常
- ✅ getDocumentBlocks: 正常
- ✅ searchByTag: 正常
- ✅ getBacklinks: 正常
- ✅ searchTasks: 正常
- ✅ getDailyNotes: 正常
- ✅ searchByAttribute: 正常
- ✅ getBookmarks: 正常
- ✅ getRandomHeading: 正常
- ✅ getRecentBlocks: 正常
- ✅ getUnreferencedDocuments: 正常
- ✅ 所有查询函数都包含 type 和 subtype 字段

### 写操作测试
- ✅ listNotebooks: 正常
- ✅ getNotebookConf: 正常
- ✅ createNotebook: 正常
- ✅ createDocument: 正常
- ✅ appendBlock: 正常
- ✅ updateBlock: 正常
- ✅ deleteBlock: 正常
- ✅ setBlockAttrs: 正常
- ✅ getBlockAttrs: 正常
- ✅ exportDocMarkdown: 正常
- ✅ pushMessage: 正常
- ✅ getChildBlocks: 正常
- ✅ getHPathByID: 正常

### 辅助功能测试
- ✅ formatSiyuanTime: 正常
- ✅ formatResults: 正常（包括空数组和 null 处理）
- ✅ formatStructuredResults: 正常
- ✅ generateEmbedBlock: 正常

### 安全测试
- ✅ SQL 注入防护（所有查询函数）
- ✅ 参数验证（limit, days, orderBy 等）
- ✅ 错误处理（无效 ID、无效笔记本等）

### 命令行接口测试
- ✅ 帮助命令正常
- ✅ 所有查询命令正常
- ✅ 所有写操作命令正常
- ✅ 系统命令正常
- ✅ 参数验证正常
- ✅ 错误提示正常

### 边界条件测试
- ✅ 空搜索关键词
- ✅ 特殊字符（包括引号）
- ✅ 不存在的文档/块 ID
- ✅ 超大 limit 值
- ✅ 负数参数
- ✅ 无效数据类型

---

## eval_set.json 测试

### 测试用例统计
- 总测试用例: 20
- 应该触发: 13
- 不应该触发: 7

### 样本查询测试
✅ "帮我在思源里找一下最近写的关于项目进展的笔记" - 可以正常处理
✅ "查一下我思源笔记里标签是'工作'的所有内容" - 可以正常处理
✅ "获取块属性" - 可以正常处理

---

## 性能测试
- 连接测试: < 100ms
- 简单查询: < 200ms
- 复杂查询: < 500ms
- 全部核心功能测试: 54ms

---

## 建议

1. **考虑添加 ESLint**: 用于代码质量检查
2. **考虑添加单元测试框架**: 如 Jest 或 Mocha
3. **考虑添加输入验证库**: 如 Joi 或 validator.js 用于更严格的参数验证
4. **文档完善**: SKILL.md 已经比较完善，但可以考虑添加更多使用示例

---

## 结论

思源笔记 skill 整体功能完善，所有核心功能都工作正常。本次测试发现了 6 个问题，其中 4 个是 SQL 注入安全漏洞（已全部修复），2 个是参数验证问题（已修复）。所有修复已通过验证，skill 现在可以安全使用。

**总体验证**: ✅ 通过
