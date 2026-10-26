# personal-match-site

来自微风游乐园的双人邀请函，使用原生 HTML、CSS 和 JavaScript。

## 开发文件

- `index.html`：公开介绍、页面结构与邮箱链接。
- `styles.css`：桌面和手机样式。
- `main.js`：心愿选择、邮箱复制、滚动渐入和动画开关，状态仅在当前页面生效。
- `park-scene.svg`、`icon.svg`：本地插画与图标。

修改后，在 `breztop_web` 根目录执行：

```powershell
node scripts/build-site.mjs
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

访问 `http://127.0.0.1:4173/personal-match-site/`。页面直接使用上述文件，发布构建只做校验和复制。

## 发布与隐私

旧 Next.js 工程和个人资料的本地备份已清理，当前目录只保留原生页面、资源和此说明。

对外发布使用主仓库的 `scripts/build-site.mjs` 和 `dist/`。公开介绍中不放私人电话、微信或完整简历附件。
