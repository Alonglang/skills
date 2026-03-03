---
name: email-best-practices
description: 用于构建可投递、合规、用户友好的电子邮件的指导。当处理电子邮件投递问题、电子邮件进入垃圾邮件、高退回率、设置 SPF/DKIM/DMARC 身份验证、实现电子邮件捕获、确保合规 (CAN-SPAM、GDPR、CASL)、处理 webhook、重试逻辑或决定事务性与营销时使用。
---

# 电子邮件最佳实践

用于构建可投递、合规、用户友好的电子邮件的指导。

## 架构概览

```
[用户] → [电子邮件表单] → [验证] → [双重选择加入]
                                               ↓
                                     [记录同意]
                                               ↓
[抑制检查] ←──────────────[准备发送]
        ↓
[幂等发送 + 重试] ──────→ [电子邮件 API]
                                        ↓
                               [Webhook 事件]
                                        ↓
               ┌────────┬────────┬─────────────┐
               ↓        ↓        ↓             ↓
          已投递  已退回  已投诉  已打开/已点击
                        ↓        ↓
               [抑制列表更新]
                        ↓
               [列表清理作业]
```

## 快速参考

| 需要... | 请参阅 |
|------------|-----|
| 设置 SPF/DKIM/DMARC，修复垃圾邮件问题 | [可投递性](./resources/deliverability.md) |
| 构建密码重置、OTP、确认 | [事务性电子邮件](./resources/transactional-emails.md) |
| 规划你的应用需要哪些电子邮件 | [事务性电子邮件目录](./resources/transactional-email-catalog.md) |
| 构建新闻通讯注册、验证电子邮件 | [电子邮件捕获](./resources/email-capture.md) |
| 发送新闻通讯、促销 | [营销电子邮件](./resources/marketing-emails.md) |
| 确保 CAN-SPAM/GDPR/CASL 合规 | [合规性](./resources/compliance.md) |
| 决定事务性 vs 营销 | [电子邮件类型](./resources/email-types.md) |
| 处理重试、幂等性、错误 | [发送可靠性](./resources/sending-reliability.md) |
| 处理投递事件、设置 webhook | [Webhook 和事件](./resources/webhooks-events.md) |
| 管理退回、投诉、抑制 | [列表管理](./resources/list-management.md) |

## 从这里开始

**新应用？**
从[目录](./resources/transactional-email-catalog.md)开始，规划你的应用需要哪些电子邮件（密码重置、验证等），然后在发送第一封电子邮件之前设置[可投递性](./resources/deliverability.md)（DNS 身份验证）。

**垃圾邮件问题？**
首先检查[可投递性](./resources/deliverability.md)——身份验证问题是最常见的原因。Gmail/Yahoo 拒绝未经身份验证的电子邮件。

**营销电子邮件？**
遵循此路径：[电子邮件捕获](./resources/email-capture.md)（收集同意）→ [合规性](./resources/compliance.md)（法律要求）→ [营销电子邮件](./resources/marketing-emails.md)（最佳实践）。

**生产就绪发送？**
添加可靠性：[发送可靠性](./resources/sending-reliability.md)（重试 + 幂等性）→ [Webhook 和事件](./resources/webhooks-events.md)（跟踪投递）→ [列表管理](./resources/list-management.md)（处理退回）。
