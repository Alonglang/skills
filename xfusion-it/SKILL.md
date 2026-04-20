---
name: xfusion-it
description: xfusion 公司 IT 系统集成知识库与操作指引。当用户需要对接 xfusion 公司 IT 系统、开发集成 xfusion IT 工具、实现 xfusion 账号登录/鉴权、集成 UniPortal 单点登录、程序化访问 xfusion 内部系统、读取 xray 文档、或询问 xfusion 内部系统的 API/协议/配置时，必须立即触发此技能。只要用户提到 xfusion IT 系统、xfusion 账号、UniPortal、xfusion 域账号、xfusion OAuth、xray 文档系统、xfusion 内网代理，都应使用此技能。
---

# xfusion IT 系统集成技能

提供 xfusion 公司各 IT 系统的集成模式、接口规范和实现参考，帮助开发者快速对接 xfusion 内部系统。

## 适用场景

- 开发需要 xfusion 账号登录的内部工具或平台
- 对接 xfusion 统一认证中心（UniPortal）
- 程序化/脚本访问 xfusion 内部系统（xray、内网工具等）
- 集成 xfusion 公司其他 IT 系统（未来扩展）
- 排查 xfusion 账号鉴权相关问题

## 当前覆盖的 IT 系统

| 系统 | 功能 | 参考文档 |
|------|------|---------|
| UniPortal | xfusion 统一账号登录（OAuth2） | `references/auth.md` |
| xray | 内部文档管理系统（ShowDoc）读取与访问 | `references/xray.md` |

> 后续扩展：在 `references/` 添加新系统文档，并在上表更新索引。

## 内网访问说明

xfusion 内部系统（如 xray）需要通过公司代理访问：

```
HTTP_PROXY=http://proxy.xfusion.com:8080
HTTPS_PROXY=http://proxy.xfusion.com:8080
```

注意：`no_proxy` 环境变量通常包含 `*.xfusion.com`，Python `requests` 中需显式设置 `proxies` 参数绕过此限制。SSL 证书为自签名，访问时需 `verify=False`。

## 快速上手：xfusion 账号登录

xfusion 使用 **UniPortal** 作为统一身份认证平台，采用标准 OAuth2 Authorization Code Flow。

### 环境地址

| 环境 | UniPortal 基础地址 |
|------|-------------------|
| 开发/测试 | `http://uniportal.beta.xfusion.com/saaslogin1` |
| 生产 | `http://uniportal.xfusion.com/saaslogin1` |

### 登录流程概览（5 步）

```
1. 你的系统生成 state 码，构造 authorize URL
        ↓
2. 用户浏览器跳转到 UniPortal 登录页
        ↓
3. 用户完成鉴权，UniPortal 回调你的系统（带 code + state）
        ↓
4. 你的系统用 code 换取 access_token，再获取用户信息
        ↓
5. 生成你的系统内部 session/token，完成登录
```

详细实现（含代码示例）：**阅读 `references/auth.md`**

## 注意事项

- 不要在代码里硬编码 `client_secret`，从配置文件或环境变量读取
- `state` 参数必须唯一且有过期时间（防 CSRF），推荐用 Redis 存储，TTL 10 分钟
- 回调 URL 需提前在 UniPortal 注册，不能随意更改
- **Access Token 有效期仅 10 分钟**，Refresh Token 30 天；及时刷新
- Session token 建议 TTL 设置为 2 小时，支持 refresh token 续期
- 程序化登录（脚本场景）详见 `references/auth.md` 中的"程序化登录"章节
- 访问 xray 等内部系统需配置代理 `proxy.xfusion.com:8080`，详见 `references/xray.md`
