# 豆瓣去广告 Loon 插件

插件文件：[Douban_AdBlock.plugin](./Douban_AdBlock.plugin)

## 功能

- 去除豆瓣 App 开屏广告。
- 屏蔽 `common_ads` 通用广告接口，尽可能去除部分信息流广告。
- 屏蔽电影页广告横幅及 `dale_ad` 广告图片。
- 使用精确 URL 路径匹配，不会直接封禁整个豆瓣域名。

## 安装

1. 将 `Douban_AdBlock.plugin` 放到一个可通过 HTTPS 直接访问的位置，例如 GitHub 仓库。
2. 在 Loon 中打开“配置 → 插件”，点击右上角 `+`，粘贴插件的 Raw URL。
3. 启用插件，并确保 Loon 已安装、信任并开启 MITM 证书。
4. 完全退出豆瓣 App 后重新打开；若仍显示旧开屏，请清理豆瓣缓存或等待已缓存广告过期。

## 说明

豆瓣不同版本使用的接口可能不同。独立请求 `common_ads` 的广告可以直接拦截；如果某个版本把广告条目混在正常信息流 JSON 中，本插件不会粗暴拦截整条信息流，以免首页或小组内容加载失败。

如果信息流仍有广告，可在 Loon 的请求记录里搜索 `ad`、`ads`、`splash` 或 `banner`，提供对应请求 URL（请先去掉 Cookie、Token 等隐私参数），再补充精确规则。
