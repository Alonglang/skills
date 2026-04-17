# UniPortal OAuth2 账号登录

xfusion 公司统一认证平台，基于标准 OAuth2 Authorization Code Flow。

## 目录

- [环境配置](#环境配置)
- [OAuth2 端点](#oauth2-端点)
- [完整登录流程](#完整登录流程)
- [接口详情](#接口详情)
- [Session 管理](#session-管理)
- [退出登录](#退出登录)
- [Moss 项目参考实现](#moss-项目参考实现)
- [常见问题](#常见问题)

---

## 环境配置

每套环境有独立的 UniPortal 地址和 OAuth 应用凭证，需向 xfusion IT 申请注册。

| 参数 | 开发/测试环境 | 生产环境 |
|------|--------------|---------|
| `w3login_url`（基础地址） | `http://uniportal.beta.xfusion.com/saaslogin1` | `http://uniportal.xfusion.com/saaslogin1` |
| `w3login_out`（登出地址） | `https://uniportal.beta.xfusion.com/uniportal1/logout` | `https://uniportal.xfusion.com/uniportal1/logout` |
| `client_id` | 各应用独立申请 | 各应用独立申请 |
| `client_secret` | 各应用独立申请 | 各应用独立申请 |
| `app_id` | 各应用独立申请 | 各应用独立申请 |
| `callback_url` | 你的应用回调基础地址 | 你的应用回调基础地址 |

> **callback_url** 是你的系统地址，回调接口路径固定为 `/w3setCookie`，
> 即完整回调 URL = `{callback_url}/w3setCookie`。

---

## OAuth2 端点

所有端点以 `{w3login_url}` 为前缀：

| 端点 | 方法 | 用途 |
|------|------|------|
| `/oauth2/authorize` | GET | 获取用户授权，跳转登录页 |
| `/oauth2/accesstoken` | POST | 用授权码换 access_token |
| `/oauth2/userinfo` | GET | 用 access_token 获取用户信息 |

---

## 完整登录流程

### 第 1 步：发起登录跳转

你的系统生成随机 `state` 码（防 CSRF），构造授权 URL，将用户浏览器重定向过去。

**构造 authorize URL：**

```
GET {w3login_url}/oauth2/authorize
  ?response_type=code
  &display=page
  &state={state_code}
  &scope=base.profile
  &client_id={client_id}
  &redirect_uri={callback_url}/w3setCookie
```

**参数说明：**

| 参数 | 值 | 说明 |
|------|----|------|
| `response_type` | `code` | 固定值，Authorization Code Flow |
| `display` | `page` | 固定值，整页显示登录 |
| `state` | 随机字符串 | 防 CSRF，需存储到 Redis 并设置 TTL（建议 10 分钟） |
| `scope` | `base.profile` | 请求用户基础信息权限 |
| `client_id` | 你的应用 client_id | 向 xfusion IT 申请 |
| `redirect_uri` | `{callback_url}/w3setCookie` | 必须与注册时一致 |

> **state 的作用**：将 `state` 与当前用户要访问的页面 URL 关联存储到 Redis，
> 回调时用 `state` 取回原始 URL，完成登录后跳转回去。

### 第 2 步：用户在 UniPortal 登录

用户在 UniPortal 页面输入 xfusion 域账号密码完成认证。
UniPortal 将回调你的系统：

```
GET {callback_url}/w3setCookie?code={auth_code}&state={state_code}
```

### 第 3 步：用授权码换 access_token

```
POST {w3login_url}/oauth2/accesstoken
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "client_id": "{client_id}",
  "client_secret": "{client_secret}",
  "redirect_uri": "{callback_url}",
  "code": "{auth_code}"
}
```

**成功响应：**

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

### 第 4 步：用 access_token 获取用户信息

```
GET {w3login_url}/oauth2/userinfo
  ?access_token={access_token}
  &scope=base.profile
  &client_id={client_id}
```

**成功响应（重要字段）：**

```json
{
  "uid": "00012345",          // xfusion 工号，系统内唯一标识
  "employeeType": "xfusion",  // 公司 ID（映射为 companyId）
  "name": "张三",
  "email": "zhangsan@xfusion.com",
  ...
}
```

> **注意**：`uid` 是 xfusion 员工工号，作为系统内唯一用户标识使用。
> `employeeType` 在 Moss 中被映射为 `companyId`。

### 第 5 步：生成内部 Session，完成登录

用获取到的用户信息在你的系统中创建/更新用户记录，生成内部 session token，
通过 HTTP Cookie 返回给浏览器：

```
Set-Cookie: token={session_token}; Max-Age=7200; HttpOnly
```

---

## 接口详情

### authorize 接口

**触发方式**：构造 URL 后直接做 HTTP 302 重定向（浏览器跳转），不是 API 调用。

### accesstoken 接口

- **Content-Type**：`application/json`（POST JSON body，不是 form）
- **错误处理**：检查 HTTP status code，非 200 表示失败

### userinfo 接口

- **方式**：GET 请求，参数通过 query string 传递
- **access_token**：直接在 query string 中传递（不是 Bearer Header）

---

## Session 管理

xfusion 账号登录成功后，通常由你的系统维护自己的 session：

### 推荐方案（Moss 的做法）

1. **Session token**：用 AES 加密生成内部 token，包含用户 ID、权限、所属组等信息
2. **存储**：将 `session_token → uid` 的映射存入 Redis，TTL = 2 小时
3. **用户信息缓存**：将用户详细信息以 `uid → user_info` 存入 Redis
4. **Cookie**：将 `session_token` 写入 `token` Cookie，`HttpOnly=True`，`Max-Age=7200`
5. **验证**：每次请求从 Cookie 取 `token`，查 Redis 验证有效性

### Token 刷新

通过 refresh_token 换新的 access_token（UniPortal 接口），
然后重新获取用户信息并刷新内部 session。

---

## 退出登录

1. 从 Redis 删除 session token 记录
2. 清除浏览器 Cookie
3. 可选：重定向到 UniPortal 登出地址 `{w3login_out}`

---

## Moss 项目参考实现

Moss 项目（`/home/projects/Moss`）实现了完整的 xfusion 账号登录，可作为参考：

| 文件 | 说明 |
|------|------|
| `account/apps/gw/router.py` | HTTP 路由：登录跳转、回调处理、查询用户、刷新 token、退出 |
| `account/libs/user_magnage_handler.py` | 核心业务逻辑：`LoginManageServiceApplication` 类 |
| `account/config/settings.toml.develop` | 开发环境配置（含 OAuth 参数） |
| `account/config/settings.toml.master` | 生产环境配置 |

**核心类方法：**

| 方法 | 说明 |
|------|------|
| `redirect_login(redirect_url)` | 生成 state，返回 UniPortal authorize URL |
| `w3authorization_login(auth_code, state)` | 处理回调，完成登录 |
| `w3login_preprocess(auth_code, redirect_url)` | 换 token + 获取用户信息 |
| `get_access_token_by_authorization_code(auth_code, ...)` | 调用 `/oauth2/accesstoken` |
| `get_user_info_by_access_token(access_token, ...)` | 调用 `/oauth2/userinfo` |
| `get_user_from_redis(session_id)` | 用 session_id 查询用户信息 |

**路由端点：**

| 路由 | 说明 |
|------|------|
| `GET /w3RedirectLogin?redirectUrl=xxx` | 发起登录，返回 302 跳转到 UniPortal |
| `GET /w3setCookie?code=xxx&state=xxx` | UniPortal 登录后的回调地址 |
| `GET /w3logout` | 退出登录 |
| `GET /userinfo` | 查询当前登录用户信息 |
| `POST /refreshToken` | 刷新 session token |

---

## 常见问题

**Q: 回调 URL 不匹配报错**
> `redirect_uri` 必须与向 UniPortal 注册时完全一致（包括协议、端口、路径）。
> 开发时特别注意 HTTP vs HTTPS，以及是否带了端口号。

**Q: state 验证失败**
> state 存在 Redis 的 TTL 是 10 分钟，用户超时后需要重新发起登录。
> 同一个 state 只能使用一次（用完即删）。

**Q: 获取 userinfo 返回 401**
> access_token 可能已过期（通常 1 小时）。检查 token 有效期，
> 考虑在登录时同时保存 refresh_token 以便续期。

**Q: 如何区分开发和生产环境**
> 通过配置文件区分（如 Moss 的 `settings.toml.develop` 和 `settings.toml.master`）。
> 不同环境的 `client_id`/`client_secret` 是独立的，需要分别申请。
