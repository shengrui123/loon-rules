# Stash 全球应用与网站图标集

共 **5,309 个图标条目**：应用、网站、开发工具、自托管服务，以及补充策略组图标。数量包含同一品牌的深浅色、旧版和不同设计变体，**不代表 5,309 个独立 App，也无法保证覆盖世界上大多数 App/网站**。

## 文件

| 文件 | 条目 | 内容 |
| --- | ---: | --- |
| [stash-global.json](stash-global.json) | 5,309 | 完整合集，任选此文件或下面的分包 |
| [dashboard.json](dashboard.json) | 4,240 | 国际应用、网站、工具及深浅色变体 |
| [apps.json](apps.json) | 722 | 国内外应用及辅助图标补充 |
| [qure.json](qure.json) | 347 | Qure 彩色应用、流媒体、地区和策略图标 |

名称保留上游文件名，并添加来源后缀避免重名。例如 `github [dashboard]`、`WeChat [qure]`。可搜索英文品牌名；不承诺所有条目都能用中文搜索。不同来源的同品牌图标保留，便于选择外观。历史品牌、已停服应用也可能被收录。

## Stash 格式依据

- [Stash 官方：策略组图标](https://stash.wiki/configuration/proxy-group-icon)：策略组 `icon` 为图片 URL，支持 JPG 和 PNG。本合集全部使用 HTTPS PNG，不使用 SVG、WebP、ICO 或动态 favicon 接口。
- [Stash 官方：URL Schema](https://stash.wiki/faq/url-schema)：支持 `stash://install-icon-set?url=` 与 `https://link.stash.ws/install-icon-set/`。
- 当前上述官方页面未提供完整的图标集 JSON Schema。这里采用现有 Stash 图标集使用的 `name` / `icons`、条目 `name` / `url` 结构，可对照 [GroupIcons 的 Stash 图标集](https://github.com/mphin/group_icons/blob/main/GroupIcons_emoji.json)。不能将社区结构校验称为官方认证。

每个可导入文件均为无注释、无尾逗号的 UTF-8 标准 JSON，仅包含以下字段；来源和校验信息另存，不混入导入文件：

```json
{
  "name": "图标集名称",
  "icons": [
    {
      "name": "图标名称",
      "url": "https://example.com/icon.png"
    }
  ]
}
```

示例域名仅解释结构；交付 JSON 中全部为真实上游 PNG 地址。

## 导入

1. 将所选 JSON 上传到可公开访问的 HTTPS 静态地址，例如 GitHub 仓库的 Raw 地址。需要返回 JSON 原文，不能使用 GitHub 文件预览页。
2. 按官方格式打开安装链接：`https://link.stash.ws/install-icon-set/` 后拼接 JSON 地址去掉 `https://` 的部分。
3. 在 Stash 完成导入，并为策略组选择图标。也可以直接复制任一条目的 `url` 填入策略组的 `icon` 字段。

发布仓库为 `shengrui123/loon-rules`，分支为 `main`，完整集地址：

```text
https://raw.githubusercontent.com/shengrui123/loon-rules/main/stash-icons/stash-global.json
```

对应安装地址：

```text
https://link.stash.ws/install-icon-set/raw.githubusercontent.com/shengrui123/loon-rules/main/stash-icons/stash-global.json
```

安装入口：[一键导入完整图标集](https://link.stash.ws/install-icon-set/raw.githubusercontent.com/shengrui123/loon-rules/main/stash-icons/stash-global.json)。大合集首次加载可能较慢，可以只导入需要的分包；分包与完整集内容重叠，无需全部导入。

## 来源与维护

- [Homarr Labs Dashboard Icons](https://github.com/homarr-labs/dashboard-icons)：使用 `png/` 目录。
- [fmz200/wool_scripts](https://github.com/fmz200/wool_scripts)：使用 `icons/apps/` 目录。
- [Koolson/Qure](https://github.com/Koolson/Qure)：使用 `IconSet/Color/` 目录。

JSON 仅引用远程图片，没有重新绘制或改动品牌图标。图标的著作权、商标及使用条件遵循对应品牌和原项目声明；本项目不将第三方图片重新授权。所有 URL 锁定到 `sources/` 记录的 Git 提交/树版本，特殊字符已做 URL 编码，避免上游移动分支更新造成图标被替换。固定版本也意味着图标不会自动更新。

仓库文件清单用于核实每个路径真实存在。重新生成与在线校验只需 Python 3 标准库：

```sh
python3 stash-icons/build.py
python3 stash-icons/build.py --check-links
```

生成器验证字段、类型、名称和 URL 唯一性、HTTPS 与 PNG 路径。在线校验对每张图片发送 GET，验证 HTTP 200、PNG 签名、IHDR 和有效尺寸，报告写入 `validation-report.json`。这不等于完整图片解码或 Stash 真机导入测试。远程资源的后续可用性仍取决于 GitHub 和当前网络。

更新时替换 `sources/` 中对应版本和该版本的真实路径清单，再运行生成器和在线校验；不要只修改版本号而沿用未经核实的路径。

本次全量检查：原始 5,320 条中 5,309 条通过，11 条响应内容不符合 PNG 文件头要求，已从来源清单及所有交付 JSON 中剔除。`validation-report.json` 保留原始检查结果和排除记录；最终合集没有这些失败条目。
