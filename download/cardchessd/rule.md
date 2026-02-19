# download/cardchessd 文件放置规则

## 目录结构

```
download/cardchessd/
├── cardchess.apk   # Android 安装包
├── cardchess.exe   # Windows 安装包
└── rule.md         # 本文件
```

## 命名规则

| 平台 | 文件名 | 说明 |
|------|--------|------|
| Android | `cardchess.apk` | 名称固定，下载页自动识别 |
| Windows | `cardchess.exe` | 名称固定，下载页自动识别 |

> 文件名不可更改，否则下载链接失效。需要更新版本时直接覆盖同名文件即可。

## 注意事项

- 不需要修改任何 HTML/JS，直接替换文件即可更新版本
- 若需修改文件名，同步更新 `cardchessd.html` 中 `PLATFORMS` 对象的 `file` 字段
