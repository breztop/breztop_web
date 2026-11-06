# 在线简历

主站 `/resume/` 当前只展示姓名、技术方向及精选项目，保留中英日三语和原生锚点导航。页面不展示个人履历、能力自述、发展愿景或宣传口号；邮箱与 GitHub 收在轻量页脚。

## 内容维护

只修改 `locales/translations.js`：`profile` 管理公开邮箱、GitHub 与打印用作品集网址，`featuredProjects` 管理项目顺序、技术栈和详情路径，`translations` 管理三语项目名称、类别和职责。每个项目只保留两条具体工作，完整介绍和图片维护在现有作品集中。然后在仓库根目录执行：

```powershell
node scripts/render-resume.mjs
node scripts/build-site.mjs
```

`index.html` 是生成文件，不直接编辑。生成器负责 HTML 转义、三语字段完整性检查及默认中文页面生成。构建会运行 `node scripts/render-resume.mjs --check`，发现页面过期就停止并提示重新生成，不会悄悄改写源码。

公司、工作年限、学历和城市暂不展示，发布数据中也不保留这些字段或占位内容。

当前条目为用户指定的 CardChess、breconn 与 BreFlow。CardChess 沿用主站已有的 `https://cardchess.brez.top`，breconn 链接到现有作品详情。BreFlow 所属仓库本次公开访问返回 404，因此暂不输出源码按钮；以后确认公开入口后再填写其 `href`。CardChess 的线上连通性本次未确认，浏览器验收只验证其链接配置和新标签页属性。职责依据作品集与 BreFlow 的库、投屏及录制示例文档整理，不补写雇佣经历、商业成果或未经验证的性能指标。改变项目选择时，同步调整 `featuredProjects` 和三语 `projects.items`；生成器校验数量与字段完整性。

## 交互与打印

`js/app.js` 管理语言偏好、手机菜单、当前章节高亮及打印按钮；不会隐藏正文或接管锚点历史。`#home` 为姓名区，`#about` 为精选项目，旧 `#future` 也定位至精选项目，`#contact` 为联系页脚；`#projects` 在启用脚本时转往作品集。语言存储不可用时仍可正常阅读和切换语言。

主站首页的 Resume 招牌、导览和无脚本入口标注“暂不开放”，但仍保留进入本页的预览链接。此状态提示不禁用链接。

全部样式合并为 `css/resume.css`。点击“打印 / 保存 PDF”调用浏览器打印，使用 A4 黑白排版，隐藏导航和操作按钮，保留正文、邮箱、GitHub 与作品集网址。无脚本时可使用浏览器自身的打印功能。不提供空文件下载，也不随站点发布验收生成的 PDF。

## 验证与发布

```powershell
node --test scripts/*.test.mjs
node scripts/build-site.mjs
node scripts/test-resume.mjs
```

浏览器验收使用本地 `.preview/node_modules/playwright` 和 Chrome，可通过 `CHROME_PATH` 指定浏览器。检查六种尺寸、三语、连续正文、原生锚点和历史、菜单及键盘、存储不可用、无脚本、减少动态效果和三语 A4 打印；截图、PDF 样张与结果保存在 `.preview/resume-acceptance/`，不参与发布。

发布白名单只包含本页 HTML、一个 CSS、应用模块和语言模块，构建产物统一进入主站 `dist/`。

## 迁移归档

原独立工程 `G:\1_Code\1web\resume` 只保留 `MOVED.md`。迁移前的 159 个文件（含 Git 历史）经过 SHA-256 核对后，完整归档到主站本地 `.preview/migration-backups/original-resume-20261106/`，不参与提交或发布。

旧域名重定向属于托管配置，未随本地优化修改。正式发布并验证新入口后，再单独处理旧域名。
