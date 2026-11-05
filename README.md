# brez.top 微风游乐园

主站、`personal-match-site/` 和 `project-show/` 均使用原生 HTML、CSS 和 JavaScript。构建脚本仅做文件校验和白名单复制，无需安装项目依赖。

首页代码按职责拆分：`js/index.js` 负责场景和漫游交互，`js/park-art.js` 生成园林插画及公共材质，`js/park-clock.js` 管理昼夜切换，`js/park-tools.js` 处理分享与全屏，`js/park-camera.js` 负责首页和好吃小镇的开场运镜。样式集中在 `css/index.css`，修改组件时直接维护其基础规则及对应的媒体查询。

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

首页场景铺满屏幕，不再为底栏预留空白。起点用「乐园方向 →」木牌提示向右探索，和树懒、机器人及控制按钮分别布置；底部路线栏、拖动文字和首次悬浮提示已移除。每次打开或通过浏览器返回首页，镜头先展示园区全景，再在约 3.4 秒内推近树懒；手动操作、调整窗口或切到后台会结束运镜，减少动态效果时直接显示近景。导览始终由访客主动打开，可从右上角或入口导览亭前往设施；站内页面同页打开、站外链接新标签页打开。下载设施标注暂未开放，简历链接正常开放。手机默认 10 分钟昼夜循环；减少动态效果时固定时段，隐藏页面停止昼夜计时。

好吃小镇和 404 使用与主页一致的园林材质、摊位及滑板树懒。小镇取消独立的暗色文字开场，改用同一套镜头；两个摊位仍支持关注、复制口令和前往私信。404 保持独立静态页面，缺失路径下无需额外加载资源即可显示插画和返回链接。

小镇使用公共绘图函数生成内联 SVG，与主页共享昼夜偏好、材质和树懒比例。摊位旁的木牌保留食物画面的完整性；方向按钮跟随角色，背景拖动、点击道路、键盘及滚轮均可移动。404 的树懒向左进入出口区后返回主页，拖动需松手确认，取消操作和窗口缩放不会跳转。

小镇代码按职责放在同一目录：`main.js` 管理漫游与操作，`art.js` 组合场景并调用公共园林绘图函数，`styles.css` 维护页面布局和动画。修改插画后运行 `node scripts/render-town-art.mjs`，同步生成无脚本使用的 `street.svg`；构建会检查生成图与源代码是否一致，过期时提示重新生成，不会自动修改源码。

构建后可运行 `node scripts/test-scenes.mjs`，使用本地预览环境里的 Playwright 与 Chrome 检查六种尺寸、昼夜、真实拖动、复制回退、无脚本导航及 404 出口；通过 `CHROME_PATH` 指定其他 Chrome 路径。截图与结果写入不参与发布的 `.preview/scenes-acceptance/`。现有 Firefox 脚本继续保留，两个浏览器的实际运行结果分别记录。

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
