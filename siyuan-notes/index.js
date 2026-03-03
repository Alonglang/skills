/**
 * 思源笔记全功能操作工具
 * 支持：查询/搜索、创建/编辑/删除块与文档、笔记本管理、属性操作、导出、通知等
 * 基于思源笔记官方 API：https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 调试模式（通过环境变量或命令行参数开启）
const DEBUG_MODE = process.env.DEBUG === 'true' || process.argv.includes('--debug');

// 加载 .env 文件（始终使用脚本所在目录的 .env）
function loadEnvFile() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#')) {
                    const [key, ...valueParts] = trimmedLine.split('=');
                    if (key && valueParts.length > 0) {
                        const value = valueParts.join('=').trim();
                        process.env[key.trim()] = value;
                    }
                }
            });
            if (DEBUG_MODE) console.log('✅ 已加载 .env 配置文件:', envPath);
        } else {
            if (DEBUG_MODE) console.log('⚠️  未找到 .env 文件:', envPath);
        }
    } catch (error) {
        if (DEBUG_MODE) console.log('⚠️  .env 文件加载失败:', error.message);
    }
}

loadEnvFile();

// ─── 配置 ─────────────────────────────────────────────────────────────────────

const SIYUAN_HOST          = process.env.SIYUAN_HOST          || 'localhost';
const SIYUAN_PORT          = process.env.SIYUAN_PORT          || '6806';
const SIYUAN_API_TOKEN     = process.env.SIYUAN_API_TOKEN     || '';
const SIYUAN_USE_HTTPS     = process.env.SIYUAN_USE_HTTPS     === 'true';
const SIYUAN_BASIC_AUTH_USER = process.env.SIYUAN_BASIC_AUTH_USER || '';
const SIYUAN_BASIC_AUTH_PASS = process.env.SIYUAN_BASIC_AUTH_PASS || '';

const API_BASE_URL = `${SIYUAN_USE_HTTPS ? 'https' : 'http'}://${SIYUAN_HOST}${SIYUAN_PORT ? ':' + SIYUAN_PORT : ''}`;

if (DEBUG_MODE) {
    console.log(`📡 服务器地址: ${API_BASE_URL}`);
    console.log(`🔑 API Token: ${SIYUAN_API_TOKEN ? '已配置' : '未配置'}`);
    console.log(`🔐 Basic Auth: ${SIYUAN_BASIC_AUTH_USER ? `用户: ${SIYUAN_BASIC_AUTH_USER}` : '未配置'}`);
}

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

/**
 * 检查环境配置是否完整
 */
function checkEnvironmentConfig() {
    if (!SIYUAN_API_TOKEN || SIYUAN_API_TOKEN.trim() === '') {
        console.error(`
❌ 错误: 未配置思源笔记 API Token

配置步骤:
1. 打开思源笔记 → 设置 → 关于 → 复制 API Token
2. cp .env.example .env
3. 编辑 .env 文件，填入配置：

# 本地默认配置
SIYUAN_HOST=localhost
SIYUAN_PORT=6806
SIYUAN_USE_HTTPS=false
SIYUAN_API_TOKEN=your_token_here

# 远程 + HTTPS + Basic Auth
SIYUAN_HOST=note.example.com
SIYUAN_PORT=
SIYUAN_USE_HTTPS=true
SIYUAN_API_TOKEN=your_token
SIYUAN_BASIC_AUTH_USER=username
SIYUAN_BASIC_AUTH_PASS=password
        `);
        return false;
    }
    return true;
}

/**
 * 构建请求头
 * 支持 Basic Auth（外层代理）+ Token（思源认证）两种模式共存
 */
function buildHeaders(extraHeaders = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...extraHeaders
    };

    if (SIYUAN_BASIC_AUTH_USER && SIYUAN_BASIC_AUTH_PASS) {
        // 有 Basic Auth 中间层时：Basic Auth 放 Authorization 头，Token 通过 URL 参数传递
        const credentials = Buffer.from(`${SIYUAN_BASIC_AUTH_USER}:${SIYUAN_BASIC_AUTH_PASS}`).toString('base64');
        headers.Authorization = `Basic ${credentials}`;
    } else {
        headers.Authorization = `Token ${SIYUAN_API_TOKEN}`;
    }

    return headers;
}

/**
 * 构建带 token 参数的 URL（仅在 Basic Auth 模式下需要）
 */
function buildURL(endpoint) {
    const base = `${API_BASE_URL}${endpoint}`;
    if (SIYUAN_BASIC_AUTH_USER && SIYUAN_BASIC_AUTH_PASS) {
        return `${base}?token=${encodeURIComponent(SIYUAN_API_TOKEN)}`;
    }
    return base;
}

// ─── 核心 API 调用函数 ─────────────────────────────────────────────────────────

/**
 * 通用思源 API 调用函数（JSON 请求体）
 * 这是所有其他函数的基础，你也可以直接用它调用任意 API 端点
 *
 * @param {string} endpoint - API 路径，例如 '/api/block/insertBlock'
 * @param {Object} params   - 请求参数对象
 * @returns {Promise<any>}  - 返回 data 字段的内容
 *
 * @example
 * // 直接调用任意 API
 * await callSiyuanAPI('/api/system/version', {})
 * await callSiyuanAPI('/api/block/updateBlock', { id: 'xxx', dataType: 'markdown', data: '新内容' })
 */
async function callSiyuanAPI(endpoint, params = {}) {
    if (!checkEnvironmentConfig()) throw new Error('环境配置不完整，请先配置 .env 文件');

    const url = buildURL(endpoint);
    const headers = buildHeaders();

    if (DEBUG_MODE) console.log(`🔗 POST ${endpoint}`, JSON.stringify(params).slice(0, 200));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            const errorMap = {
                401: '认证失败，请检查 API Token 或 Basic Auth 配置',
                403: '权限不足，请检查 API 权限设置（发布模式下需开放权限）',
                404: 'API 端点未找到，请确认思源笔记版本和服务是否运行',
                500: '服务器内部错误，请检查思源笔记状态',
                503: '服务不可用，请确认思源笔记正在运行',
            };
            throw new Error(errorMap[response.status] || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.code !== 0) {
            throw new Error(`思源 API 错误 [${endpoint}]: ${result.msg || '未知错误'}`);
        }

        return result.data;
    } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
            throw new Error(`无法连接到思源笔记 (${API_BASE_URL})，请确认服务正在运行`);
        }
        throw error;
    }
}

/**
 * 执行思源 SQL 查询（等同于 callSiyuanAPI('/api/query/sql', { stmt })）
 * 注意：发布模式下需开放读权限才能访问此接口
 *
 * @param {string} sqlQuery - SQL 查询语句
 * @returns {Promise<Array>} 查询结果数组
 */
async function executeSiyuanQuery(sqlQuery) {
    const data = await callSiyuanAPI('/api/query/sql', { stmt: sqlQuery });
    return data || [];
}

// ─── 系统 ──────────────────────────────────────────────────────────────────────

/**
 * 获取系统版本
 * @returns {Promise<string>} 版本字符串，例如 "3.1.0"
 */
async function getSystemVersion() {
    return await callSiyuanAPI('/api/system/version', {});
}

/**
 * 获取系统当前时间（毫秒时间戳）
 */
async function getSystemTime() {
    return await callSiyuanAPI('/api/system/currentTime', {});
}

/**
 * 检查思源笔记连接状态
 * @returns {Promise<boolean>}
 */
async function checkConnection() {
    if (!checkEnvironmentConfig()) return false;
    try {
        await getSystemVersion();
        return true;
    } catch (error) {
        console.error('思源笔记连接失败:', error.message);
        console.log('\n请检查：');
        console.log('1. 思源笔记是否正在运行');
        console.log('2. 端口配置是否正确（默认 6806）');
        console.log('3. API Token 是否正确');
        return false;
    }
}

// ─── 笔记本操作 ────────────────────────────────────────────────────────────────

/**
 * 列出所有笔记本
 * @returns {Promise<Array>} 笔记本列表 [{id, name, icon, sort, closed}]
 */
async function listNotebooks() {
    const data = await callSiyuanAPI('/api/notebook/lsNotebooks', {});
    return data?.notebooks || [];
}

/**
 * 创建笔记本
 * @param {string} name - 笔记本名称
 * @returns {Promise<Object>} 新建笔记本信息 {id, name, icon, sort, closed}
 */
async function createNotebook(name) {
    const data = await callSiyuanAPI('/api/notebook/createNotebook', { name });
    return data?.notebook;
}

/**
 * 重命名笔记本
 * @param {string} notebookId - 笔记本 ID
 * @param {string} name - 新名称
 */
async function renameNotebook(notebookId, name) {
    return await callSiyuanAPI('/api/notebook/renameNotebook', { notebook: notebookId, name });
}

/**
 * 删除笔记本
 * @param {string} notebookId - 笔记本 ID
 */
async function removeNotebook(notebookId) {
    return await callSiyuanAPI('/api/notebook/removeNotebook', { notebook: notebookId });
}

/**
 * 打开笔记本
 * @param {string} notebookId - 笔记本 ID
 */
async function openNotebook(notebookId) {
    return await callSiyuanAPI('/api/notebook/openNotebook', { notebook: notebookId });
}

/**
 * 关闭笔记本
 * @param {string} notebookId - 笔记本 ID
 */
async function closeNotebook(notebookId) {
    return await callSiyuanAPI('/api/notebook/closeNotebook', { notebook: notebookId });
}

/**
 * 获取笔记本配置
 * @param {string} notebookId - 笔记本 ID
 * @returns {Promise<Object>} {box, conf, name}
 */
async function getNotebookConf(notebookId) {
    return await callSiyuanAPI('/api/notebook/getNotebookConf', { notebook: notebookId });
}

// ─── 文档操作 ──────────────────────────────────────────────────────────────────

/**
 * 通过 Markdown 创建文档
 * @param {string} notebookId - 笔记本 ID
 * @param {string} hpath      - 文档路径（人类可读路径），例如 "/日记/2024-01-01"
 * @param {string} markdown   - 初始内容（GFM Markdown，可为空字符串）
 * @returns {Promise<string>} 新建文档的 ID
 *
 * @example
 * // 在"日记"笔记本下创建今日日记
 * const docId = await createDocument('20210817205410-2kvfpfn', '/日记/2024-01-15', '## 今日记录\n\n')
 */
async function createDocument(notebookId, hpath, markdown = '') {
    return await callSiyuanAPI('/api/filetree/createDocWithMd', {
        notebook: notebookId,
        path: hpath,
        markdown
    });
}

/**
 * 重命名文档（通过 ID）
 * @param {string} docId - 文档 ID
 * @param {string} title - 新标题
 */
async function renameDocument(docId, title) {
    return await callSiyuanAPI('/api/filetree/renameDocByID', { id: docId, title });
}

/**
 * 删除文档（通过 ID）
 * @param {string} docId - 文档 ID
 */
async function deleteDocument(docId) {
    return await callSiyuanAPI('/api/filetree/removeDocByID', { id: docId });
}

/**
 * 移动文档（通过 ID）
 * @param {string[]} fromIDs - 源文档 ID 数组
 * @param {string}   toID    - 目标父文档 ID 或笔记本 ID
 */
async function moveDocuments(fromIDs, toID) {
    return await callSiyuanAPI('/api/filetree/moveDocsByID', { fromIDs, toID });
}

/**
 * 根据块 ID 获取人类可读路径
 * @param {string} id - 块 ID
 * @returns {Promise<string>} 例如 "/日记/2024-01"
 */
async function getHPathByID(id) {
    return await callSiyuanAPI('/api/filetree/getHPathByID', { id });
}

/**
 * 根据人类可读路径获取文档 ID 列表
 * @param {string} hpath      - 人类可读路径
 * @param {string} notebookId - 笔记本 ID
 * @returns {Promise<string[]>} 文档 ID 数组
 */
async function getIDsByHPath(hpath, notebookId) {
    return await callSiyuanAPI('/api/filetree/getIDsByHPath', { path: hpath, notebook: notebookId });
}

// ─── 块操作（写） ──────────────────────────────────────────────────────────────

/**
 * 插入块（在指定位置插入）
 * @param {string} data       - 插入内容（Markdown 或 DOM 字符串）
 * @param {string} dataType   - 'markdown' 或 'dom'
 * @param {string} previousID - 前一个块的 ID（三者至少一个有值）
 * @param {string} parentID   - 父块 ID（插入为子块）
 * @param {string} nextID     - 后一个块的 ID
 * @returns {Promise<Object>} 操作结果，含新块 ID
 *
 * @example
 * // 在某块后插入一段 Markdown
 * await insertBlock('## 新章节\n\n内容...', 'markdown', '20211229114650-vrek5x6')
 *
 * // 在文档末尾追加内容（使用 appendBlock 更简便）
 * await insertBlock('新内容', 'markdown', '', '文档ID')
 */
async function insertBlock(data, dataType = 'markdown', previousID = '', parentID = '', nextID = '') {
    const params = { data, dataType };
    if (nextID)     params.nextID = nextID;
    if (previousID) params.previousID = previousID;
    if (parentID)   params.parentID = parentID;

    if (!nextID && !previousID && !parentID) {
        throw new Error('insertBlock: nextID、previousID、parentID 三者必须至少有一个有值');
    }
    return await callSiyuanAPI('/api/block/insertBlock', params);
}

/**
 * 在父块末尾追加子块
 * @param {string} data     - 内容（Markdown 或 DOM）
 * @param {string} dataType - 'markdown' 或 'dom'
 * @param {string} parentID - 父块 ID（文档 ID 或容器块 ID）
 * @returns {Promise<Object>} 操作结果，含新块 ID
 *
 * @example
 * // 向某文档末尾追加内容
 * await appendBlock('- 新的待办事项', 'markdown', docId)
 */
async function appendBlock(data, dataType = 'markdown', parentID) {
    return await callSiyuanAPI('/api/block/appendBlock', { data, dataType, parentID });
}

/**
 * 在父块开头插入子块
 * @param {string} data     - 内容（Markdown 或 DOM）
 * @param {string} dataType - 'markdown' 或 'dom'
 * @param {string} parentID - 父块 ID
 * @returns {Promise<Object>} 操作结果，含新块 ID
 */
async function prependBlock(data, dataType = 'markdown', parentID) {
    return await callSiyuanAPI('/api/block/prependBlock', { data, dataType, parentID });
}

/**
 * 更新块内容
 * @param {string} id       - 要更新的块 ID
 * @param {string} data     - 新内容（Markdown 或 DOM）
 * @param {string} dataType - 'markdown' 或 'dom'
 * @returns {Promise<Object>} 操作结果
 *
 * @example
 * await updateBlock('20211230161520-querkps', '更新后的内容', 'markdown')
 */
async function updateBlock(id, data, dataType = 'markdown') {
    return await callSiyuanAPI('/api/block/updateBlock', { id, data, dataType });
}

/**
 * 删除块
 * @param {string} id - 要删除的块 ID
 * @returns {Promise<Object>} 操作结果
 */
async function deleteBlock(id) {
    return await callSiyuanAPI('/api/block/deleteBlock', { id });
}

/**
 * 移动块到指定位置
 * @param {string} id         - 要移动的块 ID
 * @param {string} previousID - 目标位置的前一个块 ID（与 parentID 二选一）
 * @param {string} parentID   - 目标父块 ID
 */
async function moveBlock(id, previousID = '', parentID = '') {
    if (!previousID && !parentID) {
        throw new Error('moveBlock: previousID 和 parentID 不能同时为空');
    }
    return await callSiyuanAPI('/api/block/moveBlock', { id, previousID, parentID });
}

/**
 * 折叠块
 * @param {string} id - 块 ID
 */
async function foldBlock(id) {
    return await callSiyuanAPI('/api/block/foldBlock', { id });
}

/**
 * 展开块
 * @param {string} id - 块 ID
 */
async function unfoldBlock(id) {
    return await callSiyuanAPI('/api/block/unfoldBlock', { id });
}

/**
 * 获取块的 kramdown 源码
 * @param {string} id - 块 ID
 * @returns {Promise<Object>} {id, kramdown}
 */
async function getBlockKramdown(id) {
    return await callSiyuanAPI('/api/block/getBlockKramdown', { id });
}

/**
 * 获取子块列表
 * @param {string} id - 父块 ID
 * @returns {Promise<Array>} [{id, type, subType}]
 */
async function getChildBlocks(id) {
    return await callSiyuanAPI('/api/block/getChildBlocks', { id });
}

// ─── 属性操作 ──────────────────────────────────────────────────────────────────

/**
 * 设置块属性
 * @param {string} id     - 块 ID
 * @param {Object} attrs  - 属性对象，自定义属性需加 "custom-" 前缀
 * @returns {Promise<null>}
 *
 * @example
 * // 设置内置属性和自定义属性
 * await setBlockAttrs('20210912214605-uhi5gco', {
 *   name: '重要文档',
 *   'custom-priority': 'high',
 *   'custom-status': 'in-progress'
 * })
 */
async function setBlockAttrs(id, attrs) {
    return await callSiyuanAPI('/api/attr/setBlockAttrs', { id, attrs });
}

/**
 * 获取块属性
 * @param {string} id - 块 ID
 * @returns {Promise<Object>} 属性键值对
 */
async function getBlockAttrs(id) {
    return await callSiyuanAPI('/api/attr/getBlockAttrs', { id });
}

// ─── 导出 ──────────────────────────────────────────────────────────────────────

/**
 * 导出文档为 Markdown 文本
 * @param {string} docId - 文档块 ID
 * @returns {Promise<Object>} {hPath, content}
 *
 * @example
 * const result = await exportDocMarkdown('20210808180320-fqgskfj')
 * console.log(result.content)  // Markdown 内容
 */
async function exportDocMarkdown(docId) {
    return await callSiyuanAPI('/api/export/exportMdContent', { id: docId });
}

// ─── 通知 ──────────────────────────────────────────────────────────────────────

/**
 * 向思源笔记推送消息通知（会在界面右上角显示）
 * @param {string} msg      - 消息内容
 * @param {number} timeout  - 显示时长（毫秒），默认 7000
 * @returns {Promise<Object>} {id: 消息ID}
 */
async function pushMessage(msg, timeout = 7000) {
    return await callSiyuanAPI('/api/notification/pushMsg', { msg, timeout });
}

/**
 * 向思源笔记推送错误消息通知
 * @param {string} msg      - 错误消息内容
 * @param {number} timeout  - 显示时长（毫秒），默认 7000
 * @returns {Promise<Object>} {id: 消息ID}
 */
async function pushErrorMessage(msg, timeout = 7000) {
    return await callSiyuanAPI('/api/notification/pushErrMsg', { msg, timeout });
}

// ─── 文件操作 ──────────────────────────────────────────────────────────────────

/**
 * 获取工作空间下的文件内容
 * @param {string} filePath - 工作空间路径下的文件路径
 * @returns {Promise<Buffer|string>} 文件内容
 *
 * @example
 * await getFile('/data/20210808180117-6v0mkxr/20200923234011-ieuun1p.sy')
 */
async function getFile(filePath) {
    // getFile 返回的是文件内容而非 JSON，需特殊处理
    if (!checkEnvironmentConfig()) throw new Error('环境配置不完整');

    const url = buildURL('/api/file/getFile');
    const headers = buildHeaders();

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ path: filePath })
    });

    if (response.status === 202) {
        const result = await response.json();
        throw new Error(`获取文件失败: ${result.msg || '未知错误'} (code: ${result.code})`);
    }

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 获取文件失败`);
    }

    return await response.text();
}

/**
 * 列出工作空间下指定目录的文件
 * @param {string} dirPath - 目录路径
 * @returns {Promise<Array>} [{isDir, isSymlink, name, updated}]
 */
async function listFiles(dirPath) {
    return await callSiyuanAPI('/api/file/readDir', { path: dirPath });
}

/**
 * 删除工作空间下的文件
 * @param {string} filePath - 文件路径
 */
async function removeFile(filePath) {
    return await callSiyuanAPI('/api/file/removeFile', { path: filePath });
}

// ─── 查询函数（读操作，基于 SQL） ──────────────────────────────────────────────

/**
 * 搜索包含关键词的笔记内容
 * @param {string} keyword   - 搜索关键词
 * @param {number} limit     - 返回结果数量
 * @param {string} blockType - 块类型过滤（p/h/l/d/c/t/b 等，null 表示不限）
 * @returns {Promise<Array>} 匹配的块列表
 *
 * @example
 * // 搜索所有包含"工作总结"的段落
 * await searchNotes('工作总结', 15, 'p')
 * // 搜索标题
 * await searchNotes('项目', 10, 'h')
 */
async function searchNotes(keyword, limit = 20, blockType = null) {
    let sql = `
        SELECT id, content, type, subtype, created, updated, root_id, parent_id, box, path, hpath
        FROM blocks
        WHERE markdown LIKE '%${keyword.replace(/'/g, "''")}%'
    `;

    if (blockType) sql += ` AND type = '${blockType.replace(/'/g, "''")}'`;

    sql += ` ORDER BY updated DESC LIMIT ${Math.max(1, Math.min(parseInt(limit) || 20, 1000))}`;

    return await executeSiyuanQuery(sql);
}

/**
 * 查询所有文档块
 * @param {string} notebookId - 笔记本 ID 过滤（可选）
 * @param {number} limit      - 返回数量上限
 * @returns {Promise<Array>} 文档列表
 */
async function listDocuments(notebookId = null, limit = 64) {
    let sql = `
        SELECT id, content, type, subtype, created, updated, box, path, hpath
        FROM blocks
        WHERE type = 'd'
    `;

    if (notebookId) sql += ` AND box = '${notebookId}'`;
    sql += ` ORDER BY updated DESC LIMIT ${limit}`;

    return await executeSiyuanQuery(sql);
}

/**
 * 查询指定文档下的标题块
 * @param {string} rootId       - 根文档 ID
 * @param {string} headingType  - 标题级别（h1/h2/h3/h4/h5/h6，null 表示全部）
 * @returns {Promise<Array>} 标题列表
 */
async function getDocumentHeadings(rootId, headingType = null) {
    let sql = `
        SELECT id, content, subtype, created, updated, parent_id
        FROM blocks
        WHERE root_id = '${rootId}' AND type = 'h'
    `;

    if (headingType) sql += ` AND subtype = '${headingType.replace(/'/g, "''")}'`;
    sql += ' ORDER BY created ASC';

    return await executeSiyuanQuery(sql);
}

/**
 * 查询指定文档的所有子块
 * @param {string} rootId    - 根文档 ID
 * @param {string} blockType - 块类型过滤（可选）
 * @returns {Promise<Array>} 子块列表
 */
async function getDocumentBlocks(rootId, blockType = null) {
    let sql = `
        SELECT id, content, type, subtype, created, updated, parent_id, ial
        FROM blocks
        WHERE root_id = '${rootId}'
    `;

    if (blockType) sql += ` AND type = '${blockType.replace(/'/g, "''")}'`;
    sql += ' ORDER BY created ASC';

    return await executeSiyuanQuery(sql);
}

/**
 * 按标签搜索（使用 blocks.tag 字段精确匹配）
 * @param {string} tag   - 标签名（不含 #）
 * @param {number} limit - 返回数量
 * @returns {Promise<Array>} 含该标签的块列表
 */
async function searchByTag(tag, limit = 20) {
    // tag 字段格式为 "#tag1 #tag2# #tag3#"，使用 tag 字段比 content 更精确
    const sql = `
        SELECT id, content, type, subtype, created, updated, root_id, hpath, tag
        FROM blocks
        WHERE tag LIKE '%#${tag.replace(/'/g, "''")}%'
        ORDER BY updated DESC
        LIMIT ${limit}
    `;

    return await executeSiyuanQuery(sql);
}

/**
 * 查询块的反向链接（引用了这个块的所有块）
 * @param {string} defBlockId - 被引用的块 ID
 * @param {number} limit      - 返回数量
 * @returns {Promise<Array>} 反向链接块列表
 */
async function getBacklinks(defBlockId, limit = 999) {
    const sql = `
        SELECT * FROM blocks
        WHERE id IN (
            SELECT block_id FROM refs WHERE def_block_id = '${defBlockId}'
        )
        ORDER BY updated DESC
        LIMIT ${limit}
    `;

    return await executeSiyuanQuery(sql);
}

/**
 * 查询任务列表
 * @param {string} status - 任务状态：'[ ]' 未完成，'[x]' 已完成，'' 全部
 * @param {number} days   - 查询最近 N 天（基于创建时间）
 * @param {number} limit  - 返回数量
 * @returns {Promise<Array>} 任务块列表
 */
async function searchTasks(status = '[ ]', days = 7, limit = 50) {
    const safeDays = Math.max(1, Math.min(parseInt(days) || 7, 365));
    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 50, 1000));

    // 使用纯 SQL 时间函数，避免 JS 端时区问题
    let sql = `
        SELECT * FROM blocks
        WHERE type = 'i' AND subtype = 't'
        AND created > strftime('%Y%m%d%H%M%S', datetime('now', '-${safeDays} day'))
    `;

    if (status) {
        sql += ` AND markdown LIKE '* ${status.replace(/'/g, "''")} %'`;
    }

    sql += ` ORDER BY updated DESC LIMIT ${safeLimit}`;

    return await executeSiyuanQuery(sql);
}

/**
 * 查询 Daily Note（日记）
 * @param {string} startDate - 开始日期，格式 YYYYMMDD
 * @param {string} endDate   - 结束日期，格式 YYYYMMDD
 * @returns {Promise<Array>} Daily Note 文档列表
 */
async function getDailyNotes(startDate, endDate) {
    const sql = `
        SELECT DISTINCT B.* FROM blocks AS B
        JOIN attributes AS A ON B.id = A.block_id
        WHERE A.name LIKE 'custom-dailynote-%'
        AND B.type = 'd'
        AND A.value >= '${startDate}'
        AND A.value <= '${endDate}'
        ORDER BY A.value DESC
    `;

    return await executeSiyuanQuery(sql);
}

/**
 * 查询包含特定属性的块
 * @param {string} attrName  - 属性名（自定义属性需加 custom- 前缀）
 * @param {string} attrValue - 属性值（可选，不填则匹配所有含该属性的块）
 * @param {number} limit     - 返回数量
 * @returns {Promise<Array>} 含该属性的块列表
 */
async function searchByAttribute(attrName, attrValue = null, limit = 20) {
    let sql = `
        SELECT * FROM blocks
        WHERE id IN (
            SELECT block_id FROM attributes
            WHERE name = '${attrName}'
    `;

    if (attrValue !== null) sql += ` AND value = '${attrValue}'`;

    sql += `) ORDER BY updated DESC LIMIT ${limit}`;

    return await executeSiyuanQuery(sql);
}

/**
 * 查询书签
 * @param {string} bookmarkName - 书签名（可选，不填则返回所有书签）
 * @returns {Promise<Array>} 书签块列表
 */
async function getBookmarks(bookmarkName = null) {
    let sql = `
        SELECT * FROM blocks
        WHERE id IN (
            SELECT block_id FROM attributes
            WHERE name = 'bookmark'
    `;

    if (bookmarkName) sql += ` AND value = '${bookmarkName}'`;

    sql += ') ORDER BY updated DESC';

    return await executeSiyuanQuery(sql);
}

/**
 * 随机漫游文档内的标题块
 * @param {string} rootId - 文档 ID（可选，不填则从所有文档随机）
 * @returns {Promise<Array>} 随机标题块（1 条）
 */
async function getRandomHeading(rootId = null) {
    let sql = 'SELECT * FROM blocks WHERE type = \'h\'';
    if (rootId) sql += ` AND root_id = '${rootId}'`;
    sql += ' ORDER BY random() LIMIT 1';

    return await executeSiyuanQuery(sql);
}

/**
 * 查询最近创建或修改的块
 * @param {number} days      - 最近 N 天
 * @param {string} orderBy   - 排序字段：'updated' 或 'created'
 * @param {string} blockType - 块类型过滤（可选）
 * @param {number} limit     - 返回数量
 * @returns {Promise<Array>} 最近块列表
 */
async function getRecentBlocks(days = 7, orderBy = 'updated', blockType = null, limit = 50) {
    const allowedOrderFields = ['updated', 'created'];
    const safeOrderBy = allowedOrderFields.includes(orderBy) ? orderBy : 'updated';

    // 使用 SQLite strftime 函数计算时间阈值，避免 JS 端时区问题
    let sql = `
        SELECT id, content, type, subtype, created, updated, root_id, box, hpath
        FROM blocks
        WHERE ${safeOrderBy} > strftime('%Y%m%d%H%M%S', datetime('now', '-${days} day'))
    `;

    if (blockType) sql += ` AND type = '${blockType.replace(/'/g, "''")}'`;

    sql += ` ORDER BY ${safeOrderBy} DESC LIMIT ${Math.max(1, Math.min(parseInt(limit) || 50, 1000))}`;

    return await executeSiyuanQuery(sql);
}

/**
 * 查询笔记本下未被引用的文档
 * @param {string} notebookId - 笔记本 ID
 * @param {number} limit      - 返回数量
 * @returns {Promise<Array>} 未被引用的文档列表
 */
async function getUnreferencedDocuments(notebookId, limit = 128) {
    const sql = `
        SELECT * FROM blocks AS B
        WHERE B.type = 'd'
        AND box = '${notebookId}'
        AND B.id NOT IN (
            SELECT DISTINCT R.def_block_id FROM refs AS R
        )
        ORDER BY updated DESC
        LIMIT ${limit}
    `;

    return await executeSiyuanQuery(sql);
}

// ─── 格式化工具 ────────────────────────────────────────────────────────────────

/**
 * 格式化思源时间戳为可读字符串
 * @param {string} timeStr - 思源时间戳（YYYYMMDDHHMMSS）
 * @returns {string} 例如 "2024-01-15 10:30:00"
 */
function formatSiyuanTime(timeStr) {
    if (!timeStr || timeStr.length !== 14) return '未知时间';

    return `${timeStr.slice(0, 4)}-${timeStr.slice(4, 6)}-${timeStr.slice(6, 8)} ` +
           `${timeStr.slice(8, 10)}:${timeStr.slice(10, 12)}:${timeStr.slice(12, 14)}`;
}

/**
 * 格式化查询结果为可读文本
 * @param {Array}  results - 查询结果数组
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的文本
 */
function formatResults(results, options = {}) {
    const {
        showIndex     = true,
        showTime      = true,
        showType      = true,
        showPath      = false,
        contentLength = 100,
        separator     = '\n'
    } = options;

    if (!results || results.length === 0) return '查询结果为空';

    return results.map((item, index) => {
        const parts = [];

        if (showIndex) parts.push(`${index + 1}.`);
        if (showTime && (item.updated || item.created)) {
            parts.push(`[${formatSiyuanTime(item.updated || item.created)}]`);
        }
        if (showType) {
            parts.push(`${item.subtype || item.type || 'unknown'}:`);
        }

        const content = item.content || '(无内容)';
        parts.push(content.length > contentLength ? content.slice(0, contentLength) + '...' : content);

        if (showPath && item.hpath) parts.push(`(${item.hpath})`);

        return parts.join(' ');
    }).join(separator);
}

/**
 * 格式化查询结果为结构化数据
 * @param {Array} results - 查询结果数组
 * @returns {Object} {success, count, message, data}
 */
function formatStructuredResults(results) {
    if (!results || results.length === 0) {
        return { success: true, count: 0, message: '查询结果为空', data: [] };
    }

    return {
        success: true,
        count: results.length,
        message: `找到 ${results.length} 条结果`,
        data: results.map(item => ({
            id:       item.id,
            content:  item.content || '',
            type:     item.type    || '',
            subtype:  item.subtype || '',
            created:  formatSiyuanTime(item.created),
            updated:  formatSiyuanTime(item.updated),
            path:     item.hpath   || '',
            root_id:  item.root_id || ''
        }))
    };
}

/**
 * 生成思源嵌入块格式的 SQL 查询字符串
 * 用于复制到思源笔记的嵌入块中直接使用
 * @param {string} whereClause - WHERE 子句（不含 WHERE 关键字）
 * @returns {string} 嵌入块格式
 */
function generateEmbedBlock(whereClause) {
    return `{{select * from blocks WHERE ${whereClause}}}`;
}

// ─── 命令行入口 ────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);

    if (args[0] !== 'check' && args[0] !== 'version' && !checkEnvironmentConfig()) return;

    if (args.length === 0) {
        console.log(`
思源笔记全功能操作工具

用法: node index.js <命令> [参数]

── 查询命令 ──────────────────────────────────────
  search <关键词> [类型]          搜索内容 (类型: p/h/l/d/c 等)
  docs [笔记本ID]                列出文档
  headings <文档ID> [h1-h6]      查询文档标题
  blocks <文档ID> [类型]          查询文档子块
  tag <标签名>                   按标签搜索
  backlinks <块ID>               查询反向链接
  tasks [状态] [天数]            查询任务 (状态: "[ ]"/"[x]"/"-")
  daily <开始日期> <结束日期>    查询日记 (日期格式: YYYYMMDD)
  attr <属性名> [属性值]         查询含属性的块
  bookmarks [书签名]             查询书签
  random [文档ID]                随机漫游标题
  recent [天数] [类型]           查询最近修改内容

── 写操作命令 ────────────────────────────────────
  notebooks                      列出所有笔记本
  create-notebook <名称>         创建笔记本
  create-doc <笔记本ID> <路径> [内容]  创建文档
  append <父块ID> <内容>         向块末尾追加内容
  update <块ID> <内容>           更新块内容
  delete <块ID>                  删除块
  attrs-get <块ID>               获取块属性
  attrs-set <块ID> <JSON属性>    设置块属性
  export <文档ID>                导出文档为 Markdown
  notify <消息>                  推送通知到思源界面

── 系统命令 ──────────────────────────────────────
  check                          检查连接状态
  version                        获取版本信息

示例:
  node index.js search "工作总结" p
  node index.js tasks "[ ]" 7
  node index.js create-doc 20210817205410-2kvfpfn /日记/2024-01-15 "## 今日\n\n"
  node index.js append 20220107173950-7f9m1nb "- 新的待办事项"
  node index.js notify "任务完成！"
        `);
        return;
    }

    const command = args[0];

    try {
        switch (command) {
            case 'search': {
                if (!args[1]) { console.error('请提供搜索关键词'); return; }
                const results = await searchNotes(args[1], 20, args[2] || null);
                console.log(formatResults(results));
                break;
            }
            case 'docs': {
                const docs = await listDocuments(args[1] || null);
                console.log(formatResults(docs));
                break;
            }
            case 'headings': {
                if (!args[1]) { console.error('请提供文档 ID'); return; }
                const headings = await getDocumentHeadings(args[1], args[2] || null);
                console.log(formatResults(headings));
                break;
            }
            case 'blocks': {
                if (!args[1]) { console.error('请提供文档 ID'); return; }
                const blocks = await getDocumentBlocks(args[1], args[2] || null);
                console.log(formatResults(blocks));
                break;
            }
            case 'tag': {
                if (!args[1]) { console.error('请提供标签名'); return; }
                const tagResults = await searchByTag(args[1]);
                console.log(formatResults(tagResults));
                break;
            }
            case 'backlinks': {
                if (!args[1]) { console.error('请提供块 ID'); return; }
                const backlinks = await getBacklinks(args[1]);
                console.log(formatResults(backlinks));
                break;
            }
            case 'tasks': {
                const tasks = await searchTasks(args[1] || '[ ]', parseInt(args[2]) || 7);
                console.log(formatResults(tasks));
                break;
            }
            case 'daily': {
                if (!args[2]) { console.error('请提供开始和结束日期 (YYYYMMDD)'); return; }
                const dailyNotes = await getDailyNotes(args[1], args[2]);
                console.log(formatResults(dailyNotes));
                break;
            }
            case 'attr': {
                if (!args[1]) { console.error('请提供属性名'); return; }
                const attrResults = await searchByAttribute(args[1], args[2] || null);
                console.log(formatResults(attrResults));
                break;
            }
            case 'bookmarks': {
                const bookmarks = await getBookmarks(args[1] || null);
                console.log(formatResults(bookmarks));
                break;
            }
            case 'random': {
                const heading = await getRandomHeading(args[1] || null);
                console.log(formatResults(heading));
                break;
            }
            case 'recent': {
                const recent = await getRecentBlocks(parseInt(args[1]) || 7, 'updated', args[2] || null);
                console.log(formatResults(recent));
                break;
            }

            // 写操作命令
            case 'notebooks': {
                const notebooks = await listNotebooks();
                notebooks.forEach((nb, i) => console.log(`${i + 1}. [${nb.id}] ${nb.name} ${nb.closed ? '(已关闭)' : ''}`));
                break;
            }
            case 'create-notebook': {
                if (!args[1]) { console.error('请提供笔记本名称'); return; }
                const nb = await createNotebook(args[1]);
                console.log(`✅ 笔记本已创建: ${nb.name} (ID: ${nb.id})`);
                break;
            }
            case 'create-doc': {
                if (!args[2]) { console.error('请提供笔记本 ID 和文档路径'); return; }
                const docId = await createDocument(args[1], args[2], args[3] || '');
                console.log(`✅ 文档已创建，ID: ${docId}`);
                break;
            }
            case 'append': {
                if (!args[2]) { console.error('请提供父块 ID 和内容'); return; }
                const result = await appendBlock(args[2], 'markdown', args[1]);
                console.log(`✅ 内容已追加，新块 ID: ${result?.[0]?.doOperations?.[0]?.id || '未知'}`);
                break;
            }
            case 'update': {
                if (!args[2]) { console.error('请提供块 ID 和新内容'); return; }
                await updateBlock(args[1], args[2]);
                console.log('✅ 块内容已更新');
                break;
            }
            case 'delete': {
                if (!args[1]) { console.error('请提供块 ID'); return; }
                await deleteBlock(args[1]);
                console.log('✅ 块已删除');
                break;
            }
            case 'attrs-get': {
                if (!args[1]) { console.error('请提供块 ID'); return; }
                const attrs = await getBlockAttrs(args[1]);
                console.log(JSON.stringify(attrs, null, 2));
                break;
            }
            case 'attrs-set': {
                if (!args[2]) { console.error('请提供块 ID 和属性 JSON'); return; }
                const attrs = JSON.parse(args[2]);
                await setBlockAttrs(args[1], attrs);
                console.log('✅ 块属性已设置');
                break;
            }
            case 'export': {
                if (!args[1]) { console.error('请提供文档 ID'); return; }
                const exported = await exportDocMarkdown(args[1]);
                console.log(`路径: ${exported.hPath}\n\n${exported.content}`);
                break;
            }
            case 'notify': {
                if (!args[1]) { console.error('请提供消息内容'); return; }
                await pushMessage(args[1]);
                console.log('✅ 通知已推送');
                break;
            }

            // 系统命令
            case 'version': {
                const version = await getSystemVersion();
                console.log(`思源笔记版本: ${version}`);
                break;
            }
            case 'check': {
                const ok = await checkConnection();
                console.log(ok ? '✅ 思源笔记连接正常' : '❌ 思源笔记连接失败');
                break;
            }

            default:
                console.error(`未知命令: ${command}\n运行 node index.js 查看帮助`);
        }
    } catch (error) {
        console.error('执行失败:', error.message);
    }
}

// ─── 模块导出 ──────────────────────────────────────────────────────────────────

module.exports = {
    // 核心
    callSiyuanAPI,
    executeSiyuanQuery,
    checkConnection,
    checkEnvironmentConfig,

    // 系统
    getSystemVersion,
    getSystemTime,

    // 笔记本
    listNotebooks,
    createNotebook,
    renameNotebook,
    removeNotebook,
    openNotebook,
    closeNotebook,
    getNotebookConf,

    // 文档
    createDocument,
    renameDocument,
    deleteDocument,
    moveDocuments,
    getHPathByID,
    getIDsByHPath,

    // 块（写）
    insertBlock,
    appendBlock,
    prependBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    foldBlock,
    unfoldBlock,
    getBlockKramdown,
    getChildBlocks,

    // 属性
    setBlockAttrs,
    getBlockAttrs,

    // 导出
    exportDocMarkdown,

    // 通知
    pushMessage,
    pushErrorMessage,

    // 文件
    getFile,
    listFiles,
    removeFile,

    // 查询（读）
    searchNotes,
    listDocuments,
    getDocumentHeadings,
    getDocumentBlocks,
    searchByTag,
    getBacklinks,
    searchTasks,
    getDailyNotes,
    searchByAttribute,
    getBookmarks,
    getRandomHeading,
    getRecentBlocks,
    getUnreferencedDocuments,

    // 格式化
    formatSiyuanTime,
    formatResults,
    formatStructuredResults,
    generateEmbedBlock,
};

// 直接运行时执行 main
if (require.main === module) {
    main();
}
