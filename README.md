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

## 测试

默认使用 Firefox/Chrome。浏览器脚本只依赖 Python 标准库；先构建并启动本机预览，再在另一个终端启动 geckodriver：

```sh
geckodriver --host 127.0.0.1 --port 4459 --allow-system-access
python3 scripts/test-firefox.py --url http://127.0.0.1:4173/
```

浏览器验收使用 320、390、768、1024、1440px 及手机横屏，检查各站入口完整性、地图标签、导览末项、键盘/焦点恢复、无脚本导航及分享回退。使用 Caddy 预览时还应请求不存在的根路径和嵌套路径，确认状态为 404 且显示品牌错误页。
