# 知时 · 上海生活日历（在线版项目）

**状态：GitHub + Vercel 可部署源码，尚未发布为公开网址。**

保留原有桌面/手机日历、2026 年法定假期及补班、农历节气、生活推荐、黄历民俗、彩色备忘。新增：

- 上海天气：网页打开时向 [Open-Meteo](https://open-meteo.com/) 实时请求上海 16 日内天气，失败时明确提示。免费接口用于非商业用途并须署名。
- 上海城市活动：`site/data/events.json` 为**已经人工校对过的参考活动库**；页面根据日期过滤已结束活动及显示常设地点。活动取消、余票变化仍需查原始来源。
- 官方活动资讯：GitHub Actions 启用后每 6 小时**尝试**抓取上海市文化和旅游局公开资讯栏目，保留新闻标题、原文、发布日期，作为“待核实的活动线索”。不会擅自推断音乐剧场次、票价和起止日期。
- 保存备忘：本机浏览器 localStorage，提供 JSON 导入/导出；不上传到公共仓库，浏览器清除数据可能丢失。**跨设备自动同步尚未实现。**
- 个人生辰：不硬编码到公开源码中；用户在网站「我的设置」按需保存到本机。黄历是民俗参考，不是科学预测。

## 如何先在电脑上运行

```bash
cd zhishi-shanghai-online/site
python -m http.server 8000
```

然后在浏览器打开 `http://localhost:8000/`。不要直接双击 `index.html`：浏览器的 file:// 页面通常无法读取独立 JSON 数据。

## 正式上线：GitHub + Vercel（本包已适配）

### 1. 创建 GitHub 仓库

打开 https://github.com/new ，仓库名建议 `zhishi-shanghai-calendar`。可选 **Private**（只有你和授权人员可访问源码，公开网站仍可由 Vercel 发布）；首次创建可勾选 `Add a README file` 初始化 `main` 分支。将本压缩包中 `zhishi-shanghai-online/` 目录内的文件上传到仓库根目录（不是把 zip 直接上传）。包含隐藏目录 `.github/workflows/`。

### 2. 连接 Vercel 的 GitHub 集成

打开 https://vercel.com/new ，选择 **Import Git Repository**；若未出现 GitHub 仓库，请先通过 **Install / Configure GitHub App** 授权 Vercel 访问该仓库。注意：在 ChatGPT 内分别连接 GitHub 和 Vercel，**不等于**两家公司之间也已经互相授权。

选择刚创建的仓库。项目配置：Framework Preset = `Other`；Root Directory = `./`；Output Directory = `site`（仓库根目录 `vercel.json` 已声明）。部署完成后获得网站地址；可在 Vercel 添加自定义域名。

### 3. 启用更新任务

仓库的 `Actions` 页面打开「知时 · 上海官方活动资讯定时检查」，允许工作流执行；可先点击 `Run workflow` 测试。此任务每 6 小时尝试检查上海文旅局公开资讯页面，更新 `site/data/leads.json` 与状态文件；如果文件发生变化，GitHub Actions 尝试推送到主分支，触发 Vercel Git 自动部署。

如提示 `Resource not accessible by integration`，检查仓库的 `Settings → Actions → General → Workflow permissions` 是否允许 Read and write permissions，及是否有分支保护阻止自动推送。

**自动更新能力边界：** 官方资讯抓取是待核实线索，不自动生成演出具体场次。Vercel 自动更新已推送的数据，但 `events.json` 内的已核实活动条目仍需要人工编辑或后续接入正式活动 API。GitHub Actions 定时触发可能延误或因空闲暂停，来源网页反爬/改版也会失败，页面会展示检查状态。

## 更新机制 / 实际能力边界

| 内容 | 更新方式 | 当前是否真正自动 |
|---|---|---|
| 上海天气 | 浏览器直接请求 Open-Meteo | 是，接口可用时 |
| 官方文旅资讯线索 | 定时检查官方栏目，读取公开标题和原文 | **部署工作流后**尝试自动 |
| 具体演出/票务活动日期 | `site/data/events.json` 的编辑确认记录 | 否，需人工核对后更新；避免编造 |
| 常设公园与景点 | 编辑确认清单 | 人工低频维护 |
| 中国法定放假和补班 | 当前仅配置 2026 年国务院已公布日期 | 年度官方通知发布后需维护 |
| 个人备忘、生日 | 浏览器本机存储，手动导入/导出 | 保存自动，跨设备同步否 |

后续若取得剧院、票务或主办方授权 API，可为 `scripts/` 新增结构化活动适配器，只有得到含明确时间和来源的数据才合并入 `events.json`。当前不会在没有可核实源的情况下声称已收录全上海全部演出。

## 编辑活动库

直接编辑 `site/data/events.json`，每条活动必需：

- `id`：稳定且唯一
- `title`、`kind`、`location`、`area`、`source`（https 官方来源优先）
- `start` / `end`：有明确日期则写 `YYYY-MM-DD`，否则两者写 `null` 并明确标为常设地点或官方排期入口
- `time`、`note`：说明场次是否要核实

执行 `python scripts/validate.py` 检查数据。改完 push 到 GitHub 将触发重新部署。日历会自动隐藏已过期的定期活动，但它们仍保留在数据库，可在「全部活动」中查询历史。

## 数据与许可

本站默认不设置登录账号；个人备忘仅在该浏览器的域名下保存。**从以前 `file://` 版本到线上域名，不会自动迁移本地备忘**，请在旧版本自行备份或在新版重新导入。上传到公共仓库之前不要放任何出生信息、地址、账号或私人备忘。

天气来源：Open-Meteo（数据 CC BY 4.0，需保留署名；免费 API 主要面向非商业用途）。活动新闻链接来源：上海市文化和旅游局，仅展示标题、日期、原文 URL，不转载长篇内容。

## 测试

```bash
python scripts/validate.py
python -m unittest discover -s tests -v
```
