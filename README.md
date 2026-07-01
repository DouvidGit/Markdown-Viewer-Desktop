# Markdown Viewer

轻量的 Windows 桌面 Markdown 编辑、预览和导出工具。  
A lightweight Windows desktop app for editing, previewing, and exporting Markdown.

## 功能 / Features

- 实时 Markdown 编辑与预览 / Live Markdown editing and preview
- 多标签页、搜索、同步滚动 / Tabs, search, and synced scrolling
- 明暗主题、字体和字号设置 / Light/dark themes with font controls
- 保存 `.md`，导出 HTML 和 PDF / Save `.md`, export HTML and PDF
- 支持从系统打开 `.md`、`.markdown`、`.txt` 文件 / Open `.md`, `.markdown`, and `.txt` files from Windows

## 下载使用 / Download

推荐从 GitHub Releases 下载打包好的 Windows 版本。  
Download the packaged Windows build from GitHub Releases.

如果你想从源码运行 / To run from source:

```bash
npm install
npm start
```

打包 Windows 目录版 / Build the Windows unpacked app:

```bash
npm run dist
```

生成的程序会在 `dist/win-unpacked/Markdown Viewer.exe`。  
The app will be generated at `dist/win-unpacked/Markdown Viewer.exe`.

## 设为默认 Markdown 打开方式 / Set as Default Markdown App

先运行一次打包，然后在 PowerShell 中执行：  
Build the app first, then run this in PowerShell:

```powershell
.\set-md-default.ps1
```

## 版本记录 / Changelog

### v1.0.0

- 首个公开版本 / Initial public release
- 支持实时编辑预览、多标签页、搜索、主题和字体设置 / Live preview, tabs, search, themes, and font controls
- 支持保存 Markdown，导出 HTML 和 PDF / Save Markdown, export HTML and PDF
- 提供 Windows 打包版本 / Windows packaged build available

## License

MIT
