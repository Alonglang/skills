# UniPortal OAuth2 账号登录

xfusion 公司统一认证平台，基于标准 OAuth2 Authorization Code Flow。

## 目录

- [申请 OAuth2 集成](#申请-oauth2-集成)
- [环境配置](#环境配置)
- [OAuth2 端点](#oauth2-端点)
- [完整登录流程](#完整登录流程)
- [接口详情](#接口详情)
- [程序化登录（脚本/Agent 场景）](#程序化登录脚本agent-场景)
- [Session 管理](#session-管理)
- [退出登录](#退出登录)
- [Moss 项目参考实现](#moss-项目参考实现)
- [常见问题](#常见问题)

---

## 申请 OAuth2 集成

> **重要**：IdaaS 应用管理平台（`idm.xfusion.com/idaas/app/`）属于 HEDS（企业 IAM 管理台），**不是**员工自助注册平台。普通员工账号（UniPortal 账号）无法直接登录，需要走以下流程。

### 申请方式：联系 IT 管理员

1. 联系你所在企业（或团队）的 **IT 管理员 / 平台管理员**，由管理员在 IdaaS 平台上为你的应用注册 OAuth2 集成
2. 或者请 IT 管理员为你在 IdaaS 管理台创建账号后，再自行操作

### 管理员操作步骤（需有 IdaaS 管理台账号）

| 环境 | 管理平台地址 |
|------|------------|
| 生产 | https://idm.xfusion.com/idaas/app/#/app/myApp?app_id=a9149d4c1b474650a635a4004d513c81 |
| 测试 | https://idm.beta.xfusion.com/idaas/app/#/app/myApp?app_id=a9149d4c1b474650a635a4004d513c81 |

> **注意**：`idm.xfusion.com` 使用独立的 HEDS 账号体系，与 UniPortal 员工账号不同。登录时账号名格式为管理员账号，而非工号。

1. **选择你的项目**（应用）
2. **点击「OAuth2 集成」**选项
3. **填写必填项**：
   - `client_id`：你的应用唯一标识
   - `redirect_uri`：授权回调地址（必须与代码中一致）
   - `client_secret`：应用密钥
4. **选择需要返回的用户信息字段**
   - 默认只返回 `uid`、`globalUserID`
   - 需要 `email`、`name` 等其他字段 → 必须上传备案文件
   - 备案文件模板下载：
     ```
     https://idm.xfusion.com/idaas/idm/gw/0a309f4cbe634d7c890ee8220b271315:idaas_sso_service/idaas/sso/service/services/app/saml/s3/download?remoteFileName=template/oauth2template/oauth2_extrainfo.xlsx
     ```
5. **提交**，等待审批通过后即可获得 `client_id` 和 `client_secret`

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

> **OAuth 应用申请**：见下方「申请 OAuth2 集成」章节。

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
  "expires_in": 600,
  "refresh_token": "..."
}
```

> **有效期说明**（官方文档数据）：
> - **Authorization Code**：10 分钟有效，且只能使用**一次**
> - **Access Token**：10 分钟（600 秒）
> - **Refresh Token**：30 天

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

## 接口详情

### authorize 接口

**触发方式**：构造 URL 后直接做 HTTP 302 重定向（浏览器跳转），不是 API 调用。

### accesstoken 接口

- **Content-Type**：`application/json`（POST JSON body，不是 form）
- **错误处理**：检查 HTTP status code，非 200 表示失败

### userinfo 接口

- **方式**：GET 请求，参数通过 query string 传递
- **access_token**：直接在 query string 中传递（不是 Bearer Header）

### refresh_token 接口

```
GET {w3login_url}/oauth2/refreshtoken
  ?client_id={client_id}
  &grant_type=refresh_token
  &refresh_token={refresh_token}
```

返回新的 `access_token` 和 `refresh_token`。

---

## 程序化登录（脚本/Agent 场景）

当没有浏览器环境（如 CI/CD、自动化脚本、Agent）时，可直接调用 UniPortal 账号密码登录接口完成 OAuth2 流程，无需人工交互。

> 此方案绕过了浏览器跳转，适合自动化场景。生产系统集成建议仍使用标准 OAuth2 流程。

### 前置：内网代理

xfusion 内部系统需通过公司代理访问，且 SSL 证书为自签名：

```python
proxies = {"http": "http://proxy.xfusion.com:8080", "https": "http://proxy.xfusion.com:8080"}
# verify=False 因自签名证书
```

### 步骤 1：获取 OAuth2 授权 URL

不同于浏览器场景自己构造 URL，程序化场景可调用目标系统的 initLogin 接口获取：

```
GET https://{target-system}/api/rest_j/v1/user/initLogin
```

返回 `redirectUrl`，即 UniPortal OAuth2 authorize URL（含 `client_id`、`state`、`redirect_uri` 等）。

### 步骤 2：访问授权页获取登录参数

```python
import requests, base64, json, urllib.parse

resp = session.get(oauth_url, proxies=proxies, verify=False, allow_redirects=True)
# 从最终 URL 的查询参数中提取 appId、tenantId、p（base64 state 参数）
```

### 步骤 3：直接 POST 账号密码到 UniPortal

```
POST https://uniportal.xfusion.com/uniportal1/rest/hwidcenter/login
Content-Type: application/json

{
  "uid": "{工号，如 l00011553}",
  "password": "{明文密码}",
  "loginAccount": "{工号}",
  "lang": "zh_CN",
  "wap": 0,
  "tenantId": {tenantId},
  "appId": "{appId}",
  "encryptedPasswordSwitch": "off",
  "safeKey": ""
}
```

**关键**：`encryptedPasswordSwitch` 设置为 `"off"` 可使用明文密码，避免前端加密逻辑。

成功时 UniPortal 设置 session cookies（`hwsso_uniportal` 等）。

> **注意**：登录响应本身不含 `authCode`，需要继续步骤 4 跟随 OAuth2 重定向链获取。

### 步骤 4：跟随 OAuth2 重定向链获取授权码

登录完成后，访问目标系统的 OAuth2 authorize URL，UniPortal 会自动（无需再次输入密码）颁发 Authorization Code 并重定向：

```python
# client_request_url 从步骤 1 的 p 参数解码得到，格式如：
# http://uniportal.xfusion.com/saaslogin1/oauth2/authorize?client_id=xxx&...

# 手动跟随重定向链，直到 idaasLogin URL
r_auth = session.get(client_request_url, proxies=proxies, verify=False,
                     allow_redirects=False, timeout=15)
# 302 → /saaslogin1/oauth2/authcode
# 302 → https://{target}/api/rest_j/v1/user/idaasLogin?code=xxx

location = r_auth.headers.get("Location", "")
while location and "idaasLogin" not in location:
    r_next = session.get(
        location if location.startswith("http") else f"https://uniportal.xfusion.com{location}",
        proxies=proxies, verify=False, allow_redirects=False, timeout=15
    )
    location = r_next.headers.get("Location", "")

# 从最终 URL 中提取 code
code = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(location).query)).get("code", "")
```

### 步骤 5：用授权码完成目标系统登录

```python
session.get(
    f"https://{target}/api/rest_j/v1/user/idaasLogin",
    params={"code": code, "state": state},
    proxies=proxies, verify=False, allow_redirects=True
)
# session.cookies 中现在包含目标系统的 session ticket
```

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
> access_token 有效期仅 **10 分钟**，请及时刷新。使用 refresh_token 接口换取新 token，refresh_token 有效期 30 天。

**Q: Authorization Code 换 token 失败**
> Authorization Code 有效期 **10 分钟**，且只能使用**一次**。需在回调后立即换取 token，不可复用。

**Q: 如何区分开发和生产环境**
> 通过配置文件区分（如 Moss 的 `settings.toml.develop` 和 `settings.toml.master`）。
> 不同环境的 `client_id`/`client_secret` 是独立的，需要分别申请。

**Q: 去哪申请 OAuth2 集成**
> 登录 IdaaS 管理平台：
> - 生产：https://idm.xfusion.com/idaas/app/#/app/myApp?app_id=a9149d4c1b474650a635a4004d513c81
> - 测试：https://idm.beta.xfusion.com/idaas/app/#/app/myApp?app_id=a9149d4c1b474650a635a4004d513c81
>
> 在平台上选择项目 → OAuth2 集成 → 填写必填项 → 提交。详见本文档「申请 OAuth2 集成」章节。
