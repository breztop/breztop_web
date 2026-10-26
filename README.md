# brez.top 微风游乐园

主站和 `personal-match-site/` 使用原生 HTML、CSS 和 JavaScript。构建脚本仅做文件校验和白名单复制，无需安装项目依赖。

## 构建与预览

使用 Node.js 24：

```powershell
node scripts/build-site.mjs
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

打开 `http://127.0.0.1:4173/`，从园区导览中的「交友」或碰碰车招牌进入子页。子页资源和返回链接使用相对路径，也支持 GitHub Pages 的项目路径。

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
