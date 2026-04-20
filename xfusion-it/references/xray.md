# xray 文档系统

xfusion 内部文档管理平台，地址：https://xray.xfusion.com/

基于 **Apache Linkis**（xds/xsee）框架构建，底层文档存储使用 **ShowDoc**（PHP）。

## 目录

- [网络访问](#网络访问)
- [系统架构](#系统架构)
- [URL 结构](#url-结构)
- [鉴权登录](#鉴权登录)
- [读取文档](#读取文档)
- [ShowDoc API](#showdoc-api)
- [完整示例（Python）](#完整示例python)

---

## 网络访问

xray 是 xfusion 内部系统，需通过公司代理才能访问：

```
代理地址：http://proxy.xfusion.com:8080
```

SSL 证书为自签名，访问时需禁用证书校验（`verify=False`）。

> **注意**：系统 `no_proxy` 通常包含 `*.xfusion.com`，导致 Python requests 等工具忽略代理设置。需在代码中显式传入 `proxies` 参数。

```python
proxies = {
    "http": "http://proxy.xfusion.com:8080",
    "https": "http://proxy.xfusion.com:8080"
}
```

---

## 系统架构

```
xray 前端（React SPA）
  https://xray.xfusion.com/#/xdoc/index?path=/7/588
        ↓ （iframe 加载）
ShowDoc 前端
  https://xray.xfusion.com/web/#/7/588
        ↓ （PHP API）
ShowDoc API
  https://xray.xfusion.com/server/index.php?s=/api/page/info&page_id=588
```

- `#/xdoc/index?path=/{project_id}/{page_id}` 是 xray 路由，加载 iframe
- iframe 实际指向 `/web/#/{project_id}/{page_id}`（ShowDoc 实例）
- 文档内容通过 ShowDoc PHP API 获取，返回 Markdown 格式

---

## URL 结构

```
https://xray.xfusion.com/#/xdoc/index?path=/{project_id}/{page_id}
```

| 参数 | 说明 |
|------|------|
| `project_id` | ShowDoc 项目 ID（如 `7`） |
| `page_id` | 文档页面 ID（如 `588`） |

URL 中还可附加 `&requestFrom=xray`，表示来源为 xray 系统（可忽略，不影响 API）。

---

## 鉴权登录

xray 使用 xfusion UniPortal IdaaS OAuth2 认证，与其他 xfusion 系统相同。

### 浏览器登录

直接访问 https://xray.xfusion.com，自动跳转到 UniPortal 登录页。

### 程序化登录（脚本）

参考 `references/auth.md` 中「程序化登录」章节。xray 的具体 initLogin 端点：

```
GET https://xray.xfusion.com/api/rest_j/v1/user/initLogin
```

成功登录后，session cookie 中包含：
- `xlinks_user_session_ticket_id_v1` - 主要 session ticket
- `Authorization` - Bearer token
- `LOGIN_FLAG` - 登录状态标记

---

## 读取文档

登录获取 session cookie 后，使用 ShowDoc API 读取文档内容：

### 获取文档页面信息

```
GET https://xray.xfusion.com/server/index.php?s=/api/page/info&page_id={page_id}
```

需携带登录后的 session cookie。

**响应结构：**

```json
{
  "error_code": 0,
  "data": {
    "page_id": 588,
    "item_id": 7,
    "page_title": "Oauth2集成",
    "page_content": "# Oauth2集成\n...",
    "author_username": "tw0015992",
    "page_update_time": 1720000000,
    "cat_name": "接入文档"
  }
}
```

| 字段 | 说明 |
|------|------|
| `page_content` | 文档正文，Markdown 格式 |
| `page_title` | 文档标题 |
| `author_username` | 最后编辑者工号 |
| `item_id` | 所属项目 ID |

### 获取项目页面列表

```
GET https://xray.xfusion.com/server/index.php?s=/api/item/getInfo&item_id={project_id}
```

---

## ShowDoc API

常用 ShowDoc API 端点（均需登录 cookie）：

| 接口 | 说明 |
|------|------|
| `/server/index.php?s=/api/page/info&page_id={id}` | 读取指定页面内容 |
| `/server/index.php?s=/api/item/getInfo&item_id={id}` | 读取项目信息及页面列表 |
| `/server/index.php?s=/api/catalog/getByItem&item_id={id}` | 获取项目目录结构 |

---

## 完整示例（Python）

```python
import requests
import json
import re
import urllib.parse
import base64

proxies = {
    "http": "http://proxy.xfusion.com:8080",
    "https": "http://proxy.xfusion.com:8080"
}

session = requests.Session()

# 步骤 1：获取 OAuth2 confirm URL（含 state、client_id 等）
resp = session.get(
    "https://xray.xfusion.com/api/rest_j/v1/user/initLogin",
    proxies=proxies, verify=False
)
oauth_url = resp.json()["data"]["url"]
confirm_url = urllib.parse.unquote(oauth_url.split("redirect=", 1)[1])

# 解码 p 参数，提取 state 和 client_request_url
p_match = re.search(r'[?&]p=([A-Za-z0-9+/=]+)', confirm_url)
raw_p = p_match.group(1)
raw_p += "=" * (-len(raw_p) % 4)
p_params = dict(urllib.parse.parse_qsl(base64.b64decode(raw_p).decode()))
state = p_params["state"]
client_request_url = urllib.parse.unquote(p_params["client_request_url"])

# 步骤 2：访问 confirm 页，获取 appId/tenantId
r2 = session.get(confirm_url, proxies=proxies, verify=False, allow_redirects=True)
final_qs = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(r2.url).query))
app_id = final_qs.get("appId", "a97bf47ff8dd4e3986b21c06b5850189")
tenant_id = int(final_qs.get("tenantId", 21))

# 步骤 3：账号密码登录 UniPortal（设置 session cookies）
session.post(
    "https://uniportal.xfusion.com/uniportal1/rest/hwidcenter/login",
    json={
        "uid": "l00011553",
        "password": "your_password",
        "loginAccount": "l00011553",
        "lang": "zh_CN",
        "wap": 0,
        "tenantId": tenant_id,
        "appId": app_id,
        "encryptedPasswordSwitch": "off",
        "safeKey": ""
    },
    proxies=proxies, verify=False
)

# 步骤 4：访问 authorize URL，跟随重定向链获取 code
r_auth = session.get(client_request_url, proxies=proxies, verify=False, allow_redirects=False)
location = r_auth.headers.get("Location", "")
while location and "idaasLogin" not in location:
    r_next = session.get(
        location if location.startswith("http") else f"https://uniportal.xfusion.com{location}",
        proxies=proxies, verify=False, allow_redirects=False
    )
    location = r_next.headers.get("Location", "")

code = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(location).query)).get("code", "")

# 步骤 5：用 code 完成 xray 登录
session.get(
    "https://xray.xfusion.com/api/rest_j/v1/user/idaasLogin",
    params={"code": code, "state": state},
    proxies=proxies, verify=False, allow_redirects=True
)

# 步骤 6：读取文档
doc_resp = session.get(
    "https://xray.xfusion.com/server/index.php",
    params={"s": "/api/page/info", "page_id": 588},
    proxies=proxies, verify=False
)
doc = doc_resp.json()["data"]
print(doc["page_title"])
print(doc["page_content"])
```
