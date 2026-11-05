# brez.top 微风游乐园

主站、`personal-match-site/` 和 `project-show/` 均使用原生 HTML、CSS 和 JavaScript。构建脚本仅做文件校验和白名单复制，无需安装项目依赖。

## 构建与预览

使用 Node.js 24：

```powershell
node scripts/build-site.mjs
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

打开 `http://127.0.0.1:4173/`，从园区导览中的「交友」或碰碰车招牌进入子页。子页资源和返回链接使用相对路径，也支持 GitHub Pages 的项目路径。

作品集从独立的 **Project / 风车塔** 进入 `project-show/`；Resume 继续指向原简历站。原 Vue 作品站的首页、作品库和 16 个独立详情页已经转成可直接浏览的 HTML，各自的 CSS 设计完整保留，搜索与分类改为原生 JavaScript。旧 `project_show` 工程已清理，原始图片保存在本地 `artwork/`，该目录已加入 Git 排除且不参与发布。开发说明见 `project-show/README.md`，新增文件时同步更新 `scripts/portfolio-files.mjs` 发布白名单。

`scripts/public-files.mjs` 是发布文件白名单。构建只复制这些文件到 `dist/`，校验缺失资源、个人电话特征、常见密钥特征及子页的隐私约束。它是基础检查，不能替代对新增内容的人工审查。

推送 `main` 后，现有 GitHub Actions 会构建、压缩并发布 `dist/` 到 `gp-pages`。使用 Caddy 时，先构建，再使用仓库里的 Caddyfile；站点根目录为 `/var/www/breztop_web/dist`，避免从仓库根目录提供 `.git` 或本地文件。Caddy 配置需按自己的实际部署路径调整。

## 个人页迁移和隐私

`personal-match-site` 已迁入此仓库，当前开发入口为 `personal-match-site/index.html`，样式与交互分别在同目录的 `styles.css` 和 `main.js` 中维护。原路径仅保留 `MOVED.md` 位置说明。

旧 Next.js 工程、个人资料、Word/PDF 文档和旧生成文件的本地备份已按要求清理。当前子项目只保留原生网页、所需资源和开发说明。

- 公开页只使用昵称、公开介绍和用户指定的公开邮箱；不携带原配置里的电话、微信、精确地点或简历附件。
- 不导入原工程的 `profile.config.js`、`docs/`、`output/`、`.next/`、`out/`、`.openai/`、环境文件或 source map。
- 子页不加载第三方字体、图片和统计脚本，不提交表单、不写入 Cookie 或本地存储。心愿选择只在当前页面内存中生效。点击邮箱后由访客的邮箱软件处理发送，网站本身不会发送邮件。
- `noindex`、`nofollow`、`noarchive` 和 `no-referrer` 用于减少索引与来源传递。它们**不是访问权限控制**；任何能打开网页的人仍能阅读、复制页面，托管服务也可能产生访问日志。
- `.gitignore` 和发布白名单用于减少误加入文件的风险；它们不能撤回已经提交到 Git 历史或已经发布过的资料。

目前这份精简后的页面可以随公开仓库管理。若以后需要保留更完整的个人资料，建议把原稿放在独立私有仓库，仅将审核后的公开静态文件复制到这里。只上传构建产物也无法隐藏已写入 HTML、JavaScript、图片或 PDF 的资料；真正不公开的内容需要服务端鉴权。


## 导航与评审修复验证

首访只显示可关闭的探索提示，导览始终由访客主动打开。固定导览及底部路线支持直接前往设施；站内页面同页打开、站外链接新标签页打开。下载设施标注暂未开放，简历链接正常开放。手机默认 10 分钟昼夜循环；减少动态效果时固定时段，隐藏页面停止昼夜计时。

分享图 `og.png`（1200×630）来自现有 SVG 首屏，主屏图标为 180×180。它们通过发布白名单复制，不作为首页内容图片加载。构建检查同时校验图片尺寸、Sitemap 的发布范围和 noindex 政策。

```sh
node --test scripts/check-site.test.mjs
node scripts/build-site.mjs
node scripts/check-site.mjs dist
```

默认使用无头 Firefox。浏览器脚本只依赖 Python 标准库；先构建并启动本机预览，再在另一个终端启动 geckodriver：

```sh
geckodriver --host 127.0.0.1 --port 4459 --allow-system-access
python3 scripts/test-firefox.py --url http://127.0.0.1:4173/
```

如 geckodriver 未自动找到 Firefox，可传入 `--firefox-binary /path/to/firefox`。脚本创建独立浏览器会话并在结束时关闭，检查入口边界及实际点击命中、真实鼠标跳转、End 键终点、导览焦点恢复、分享回退、动画滑行与后台计时暂停。线上网址使用 HTTPS，本机与内网预览可按实际配置使用 HTTP。

浏览器验收使用 320、390、768、1024、1440px 及手机横屏，检查各站入口完整性、地图标签、导览末项、键盘/焦点恢复、无脚本导航及分享回退。使用 Caddy 预览时还应请求不存在的根路径和嵌套路径，确认状态为 404 且显示品牌错误页。

下载 DNS、其他子站的品牌及 CardChess 的 HTTP ICP 拦截属于外部配置；主站代码无法修复。发布后应复查线上 404 内容及分享图片响应。
