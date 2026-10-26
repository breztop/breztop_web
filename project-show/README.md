# DEV / WORKS 原生作品站

从 `G:\1_Code\1web\project_show` 的公开作品站迁入，保留首页、作品库与 16 个项目各自的详情设计。页面直接使用 HTML、CSS 和 JavaScript，日常开发、构建与发布均不依赖 Vue、Vue Router、Vite 或项目级 npm 安装。

## 开发位置

- `index.html`：作品站首页与六个精选项目。
- `projects/index.html`：全部作品，卡片上的 `data-project`、`data-category`、`data-search` 供原生筛选使用。
- `projects/<项目 id>/index.html`：每个项目的完整独立详情页，包含关联项目及前后翻页链接。
- `styles/base.css`：公共视觉与组件样式；`styles/<项目 id>.css`：对应项目的独立设计。
- `styles/native.css`：返回游乐园、无脚本降级与原生页面补充样式。
- `main.js`：搜索、分类计数、清空筛选和导航高亮。只在当前标签页的 sessionStorage 中保留分类偏好，存储不可用时仍可筛选；不收集或上传访客输入。
- `images/projects/`：实际页面使用的 WebP 变体和 SVG。原始 PNG、开发缓存及旧构建文件未复制。

所有页面都是可直接访问和刷新的真实文件，关闭 JavaScript 仍可浏览完整作品与详情。链接和资源使用相对路径，支持域名根目录与 GitHub Pages 项目子路径。

`data-view-*` 是普通 HTML 属性，用于隔离独立页面的 CSS；没有客户端框架渲染或初始化步骤。修改正文直接编辑 HTML，修改对应样式直接编辑 CSS。

从主站的 **Project / 风车塔** 进入。Resume 保持原来的外部简历入口。每个页面顶部都有返回微风游乐园的链接。

## 构建与资源清单

在 `breztop_web` 根目录运行 `node scripts/build-site.mjs`，再以 `dist/` 为静态服务器目录预览。新增页面、样式或图片时，同时更新 `scripts/portfolio-files.mjs` 中的项目 id 与发布文件白名单。更新项目时同步检查作品库卡片、精选展示及相邻项目链接。

原 `project_show` 工程作为来源保留，未删除或改写。本站只包含公开项目资料与必要资源；`.git`、`.openai`、node_modules 和原工程配置不参与发布。
