---
name: maishou
description:
  获取商品在淘宝(Taobao)、天猫(TMall)、京东(JD.com)、拼多多(PinDuoDuo)、抖音(Douyin)、快手(KuaiShou)的最优价格、优惠券的技能，对比商品价格，当用户想购物或者获取优惠信息时使用。
metadata:
  {
    "openclaw":
      {
        "emoji": "🛍️",
        "requires": {"bins": ["uv"]}
      }
  }
---

# 买手技能

通过执行Shell命令获取商品信息和价格。

## 参数说明

### 来源（source）参数：
- `1`: 淘宝/天猫
- `2`: 京东
- `3`: 拼多多
- `7`: 抖音
- `8`: 快手

## 搜索商品

```shell
uv run {baseDir}/scripts/main.py search --source={source} --keyword='{keyword}'
uv run {baseDir}/scripts/main.py search --source={source} --keyword='{keyword}' --page=2
```

示例：
```shell
# 搜索手机
uv run {baseDir}/scripts/main.py search --source=1 --keyword='手机'

# 搜索第2页结果
uv run {baseDir}/scripts/main.py search --source=2 --keyword='笔记本电脑' --page=2
```

## 商品详情及购买链接

```shell
uv run {baseDir}/scripts/main.py detail --source={source} --id={商品ID}
```

示例：
```shell
# 获取某个商品的详细信息
uv run {baseDir}/scripts/main.py detail --source=1 --id='123456789'
```

## 使用场景

- 比较不同平台商品价格
- 查找优惠券和优惠信息
- 获取商品的历史价格
- 发现最佳购买时机

## 注意事项

1. 需要确保已安装 `uv` 工具
2. 商品ID和来源参数必须正确
3. 商品信息可能随时间变化，建议实时查询
4. 某些平台可能有反爬限制，建议合理使用频率
