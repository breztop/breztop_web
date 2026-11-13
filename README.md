# brez.top

原生 HTML、CSS 和 JavaScript。构建脚本仅做文件校验和白名单复制，无需安装项目依赖。

首页代码按职责拆分：`js/index.js` 负责场景和漫游交互，`js/park-art.js` 生成园林插画及公共材质，`js/park-clock.js` 管理昼夜切换，`js/park-tools.js` 处理分享与全屏，`js/park-camera.js` 负责首页和好吃小镇的开场运镜。样式集中在 `css/index.css`，修改组件时直接维护其基础规则及对应的媒体查询。

## 构建与预览

使用 Node.js 24：

```powershell
node scripts/build-site.mjs
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

作品集从独立的 **Project / 风车塔** 进入 `project-show/`；Resume 继续指向原简历站。
`scripts/public-files.mjs` 是发布文件白名单。构建只复制这些文件到 `dist/`

## B 站 Toy 版本

`b-toy` 分支在主站源码上增加独立构建，使用 Node.js 24 和 Python 3：

```sh
node scripts/build-toy.mjs
```

命令会先校验并构建主站，再生成 `dist-toy/` 和可直接上传的 `brez-toy.zip`。ZIP 根目录含 `index.html`，包内只包含发布白名单中的资源，不含仓库源码和本机资料。

Toy 构建将所有本地页面链接补全为相对路径和 `index.html`，移除第三方统计，将博客、站外游戏、账号、GitHub 和邮箱等站外入口转换为不可跳转的文字；B 站个人主页和本地子页保持可访问。原有游乐园场景、导览、昼夜循环、作品介绍、简历语言切换和交友页心愿选择继续保留。机器人目的地也仅允许作者的 B 站主页，分享按钮根据当前 `/toy/<slug>/` 路径生成 B 站 Toy 链接。

主站源码和 `node scripts/build-site.mjs` 的产物仍保留原有入口与 SEO。Toy 包保留指向主站的 canonical，但不带 `robots.txt` 和 sitemap，因为上传包无法设置 B 站域名根目录的抓取规则。

本地检查：

```sh
node --test scripts/*.test.mjs
geckodriver --host 127.0.0.1 --port 4459 --allow-system-access
# 在另一个终端运行；测试会自行启动严格的 Toy 子路径预览服务。
python3 scripts/test-toy.py
```

登录 [Toy 发布平台](https://www.bilibili.com/toy/publish)，上传 `brez-toy.zip`，填写名称、简介、图标与封面，先使用链接可见模式在网页和 B 站 App 中测试，再发布为所有人可见。本地浏览器检查不替代 App 内的 WebView、分享和安全区验收；实际发布仍需要账号的 Toy 权限和平台审核。

适配依据：[官方 FAQ](https://www.bilibili.com/opus/1241171666570051585)、[官方仓库内容自检清单](https://github.com/bilibili/toy/blob/main/skills/toy/references/content-checklist.md)。

## 测试

默认使用 Firefox/Chrome。浏览器脚本只依赖 Python 标准库；先构建并启动本机预览，再在另一个终端启动 geckodriver：

```sh
geckodriver --host 127.0.0.1 --port 4459 --allow-system-access
python3 scripts/test-firefox.py --url http://127.0.0.1:4173/
```

浏览器验收使用 320、390、768、1024、1440px 及手机横屏，检查各站入口完整性、地图标签、导览末项、键盘/焦点恢复、无脚本导航及分享回退。使用 Caddy 预览时还应请求不存在的根路径和嵌套路径，确认状态为 404 且显示品牌错误页。

## 搜索收录与内容使用

首页以“微风中的快乐”为主要站点名，直接在 HTML head 中提供 canonical、Open Graph、Twitter Card，以及关联的 `WebSite`、`Person`、`WebPage` JSON-LD。正文中的页面入口只保留一份静态 HTML 导航；脚本增强原有链接并将导航移动到导览弹窗，无 JavaScript 时仍能访问这些入口。

根目录的 `robots.txt` 允许公开内容抓取并声明 `https://brez.top/sitemap.xml`。其中的注释及 `content-usage.txt` 说明：允许使用原创公开内容，使用时必须署名“微风中的快乐”、附原始链接，禁止断章取义。注释和声明不属于爬虫协议的强制执行机制。两份文件均已加入发布白名单；个人交友页继续保留原有 `noindex`，不在 sitemap 中。

构建并将 `dist/` 发布到现有站点后，完成以下操作：

1. 确认 `https://brez.top/`、`https://brez.top/robots.txt`、`https://brez.top/sitemap.xml` 均返回 200，线上 robots 中包含本站规则和 Sitemap 地址，首页没有 `noindex` 或登录限制。
2. 在 [Google Search Console](https://search.google.com/search-console/) 验证 `brez.top`，提交 `https://brez.top/sitemap.xml`，再通过网址检查对 `https://brez.top/` 请求编入索引。域名资源可通过 DNS 验证，无需在页面中放置验证码；如使用 HTML 标签验证，必须使用控制台提供的真实标记。
3. 在 [Bing Webmaster Tools](https://www.bing.com/webmasters/) 添加并验证站点，提交同一份 sitemap，再使用 URL Inspection 检查首页并请求索引。
4. 如果 Cloudflare 在 robots 前追加了管理规则，检查是否出现与本站许可冲突的抓取限制；同时在各站长平台的实时网址检查中确认真实爬虫未被 WAF 或挑战页阻挡。自定义 Googlebot/Bingbot 请求头返回 200 只能说明普通请求路径正常，不能代替真实爬虫检查。

抓取许可、站点地图和索引申请都不能保证收录，处理状态以站长平台为准。

参考：[Google 站点名结构化数据](https://developers.google.com/search/docs/appearance/site-names)、[Google 请求重新抓取](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)、[Bing Sitemaps](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed)、[Bing URL Inspection](https://www.bing.com/webmasters/help/url-inspection-55a30305)、[Cloudflare robots.txt 管理规则](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/)。
