# 衣改 FitNote 项目总览

口号：试衣修改，一图说清。

本地服装试衣标注与裁缝工艺交接工具，一份修改单对应一件服装，一次试衣对应一个独立版本。不包含 ERP、财务、库存、云同步或局域网协作。

## 平台与技术栈

- 应用 ID：fitnote（尚未上架，首次发布后不可更改）。
- 名称：衣改 FitNote。
- 运行时：TopArrow Node 24，内置 node:sqlite；不依赖系统安装 Node。
- 语言：简体中文 / English，保存至 SQLite settings.locale；界面及 PDF 固定文案切换，用户填写内容保留原文。
- React 19、TypeScript、Vite；原生 SVG 交互；Lucide 正式图标。
- pdf-lib、fontkit、PDF.js、本地 Noto Sans SC 字体完成离线 PDF 生成和预览。
- fflate 完整业务备份与白名单发布包。
- manifest.json 不设置平台版本编号；内部应用版本统一由 package.json 的 version 管理（当前 1.0.0），顶部常驻、侧栏、设置及 bootstrap 接口一致。修改该字段后重新构建；不手写多个版本号，平台版本编号独立管理。

## 目录与入口

- `manifest.json`：平台配置，入口 `server/standalone.mjs`，健康检查 `/__health`。
- `src/App.tsx`：工作台、列表、独立归档管理、简化新建表单、语言切换、归档删除。
- `src/Backups.tsx`：设置页手动备份、磁盘文件列表、删除与导入恢复。
- `src/Editor.tsx`：图纸标记、照片圈选、项目编辑、撤销重做、版本对比与追踪。
- `src/dialog.tsx`：应用内确认弹层，避免依赖不同 WebView 的原生 confirm 支持。
- `src/i18n.ts`：响应式语言状态，修改语言不重载页面、不丢弃编辑状态。
- `src/locales/`：中文和英文 JSON 文案、标准业务值映射及纯函数翻译核心。
- `src/model.ts`：业务类型、模板引用、状态汇总、差异计算。
- `src/pdf.ts`：A4 中文排版、分页、图纸和照片合成。
- `src/PdfPreview.tsx`：按需加载的本地 PDF.js 页面渲染。
- `src/style.css`：暖米白、墨绿、黄铜色的裁缝工作室视觉及响应式布局。
- `server/index.mjs`：本地 HTTP API、静态资源、文件存储、归档删除及附件清理。
- `server/manual-backups.mjs`：仅手动创建业务快照、校验和事务恢复；无自动备份。
- `server/open-folder.cjs`：调用顶箭内置 Electron 打开备份目录。
- `server/storage.mjs`：SQLite 迁移、版本事务与校验。
- `server/standalone.mjs`：构建后的独立服务，已内联运行时 JS 依赖，正式运行无需 node_modules。
- `public/templates/`：七类服装（含燕尾服、T 恤衫）、正反面共十四张原创 SVG，模板版本 v1 不原位覆盖。
- `public/fonts/`：界面 WOFF2、完整 PDF TTF 及 OFL 许可证。
- `icon.png` / `public/icon.png`：专属衣领、定位针图标，384×384 PNG，159146 字节。
- `public/pdf-worker.js`：构建时从 PDF.js 拷贝的离线模块 Worker。
- `build/`：完整可运行前端，作为交付文件保留并提交。
- `licenses/`：发布所需第三方许可与版权说明。
- `scripts/`：模板生成、构建、白名单 ZIP 打包。
- `tests/`：存储与 HTTP 验收。

## 数据约定

只写环境变量 TOPARROW_DATA_DIR；无环境变量时明确拒绝启动，不回退写代码目录。

- `database/fitnote.db` 及 SQLite WAL 文件。
- `photos/` 原始照片；历史引用文件不随草稿移除而物理删除。
- `exports/` PDF 与发布包。
- `backups/` 手动创建的独立 .fitbackup 文件；首次点击才创建，不自定义路径。
- `logs/` 预留；服务错误当前输出到平台控制台，不记录客户资料。

SQLite 的 `orders` 保存单据身份和归档信息，`versions` 保存独立版本及完整业务快照，`settings` 保存应用设置，`migrations` 保存结构版本。快照内的服装、模板引用、修改项、图形标记、照片及照片标注均有稳定 ID / 明确字段；未为每个嵌套实体另建重复关系表。详见 `fitting_architecture.md`。

## 开发与打包

用平台 Node 调用 `scripts/build.mjs`，同时构建前端和独立服务。设置 TOPARROW_DATA_DIR 后运行 `scripts/package.mjs`，产物在该目录的 exports 中。打包白名单只包含 manifest、图标、build、独立服务及许可证；不会包含 data、Git、源码文档、node_modules 或运行时。

尚需 Windows 实机验收和顶箭市场正式发布审核；英文名称冲突检查在上架前处理。
