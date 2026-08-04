# 证据索引与待确认事项

## 分析元数据

- **目标**：`E:/kmoretti-github/friendlink-verify`
- **提交**：`83931d2`，分析时分支为 `main`，工作树基线干净
- **时间**：2026-08-04（GMT+8）
- **方法**：只读扫描目录、Git 跟踪清单、README/既有 `docs.md`、Next 配置、package 元数据、页面/API/模型/适配器源码；委托只读子会话分别复核后端、前端、配置/测试。
- **未执行**：未启动 dev/build/start；未连接 MongoDB、GitHub、SMTP；未访问远程 YAML；未修改业务代码、提交 Git 或推送外部系统。

## 按文档章节的证据

### 项目与入口

- 项目目的、功能和部署：`README.md:1-184`
- 既有项目结构和运行总结：`docs.md:1-102`
- 依赖和脚本：`package.json:1-34`
- TypeScript：`tsconfig.json:1-34`
- Tailwind/PostCSS：`tailwind.config.ts:1-13`、`postcss.config.mjs:1-9`
- `/embed.js` rewrite：`next.config.js:1-13`

### 前端

- 根布局、暗色初始化和 Toast：`app/layout.tsx:1-27`
- 首页嵌入代码、预览和复制：`app/page.tsx:1-293`
- 客户端嵌入表单：`app/embed/page.tsx:1-331`
- 动态嵌入脚本：`app/embed-script/route.ts:1-38`
- 管理员路由守卫：`app/admin/page.tsx:1-10`
- 登录页：`app/admin/login/page.tsx:1-101`
- 后台协调状态：`app/admin/dashboard-client.tsx:1-611`
- 提交表格：`components/admin/SubmissionTable.tsx:1-264`
- 设置面板：`components/admin/SettingsPanel.tsx:1-316`
- CSS 主题变量：`app/globals.css:1-56`
- Toast：`components/toaster.tsx:1-18`

### 后端与模型

- MongoDB 连接缓存：`lib/db.ts:1-35`
- JWT 和管理员账号：`lib/auth.ts:1-37`
- Submission schema：`lib/models/submission.ts:1-44`
- Config schema：`lib/models/config.ts:1-14`
- 认证 API：`app/api/auth/login/route.ts:1-40`、`app/api/auth/logout/route.ts:1-13`、`app/api/auth/me/route.ts:1-10`
- 提交查询/创建/清理：`app/api/submissions/route.ts:1-172`
- 审核/删除：`app/api/submissions/[id]/route.ts:1-135`
- 后台设置：`app/api/admin/settings/route.ts:1-103`
- 已通过友链管理：`app/api/links/route.ts:1-22`、`app/api/links/groups/route.ts:1-31`、`app/api/links/groups/[groupName]/route.ts:1-58`、`app/api/links/entries/route.ts:1-64`

### 外部适配器

- GitHub 配置、YAML 读写、追加/更新：`lib/github.ts:1-256`
- SMTP、默认模板、占位符和通知：`lib/email.ts:1-295`
- 环境变量名称模板：`env.example:1-29`

## 扫描范围和默认忽略

- 读取了业务源码、配置、README、既有 docs、依赖元数据和资源清单。
- 默认不把 `.git/`、`node_modules/`、`.next/`、缓存、生成物、二进制资源和环境变量实际值写入 Wiki。
- `img/*.png`、`public/favicon.ico` 只作为资源存在性识别，不读取二进制内容。
- 没有发现仓库自己的 `docs/code-wiki/` 旧文档，因此本次按固定结构新建；根目录 `docs.md` 保留原样。

## 明确的事实与实现漂移

### 首页/README 自包含 HTML 缺少 `friendslink`

- 示例：`README.md:258-294`、`app/page.tsx:200-254`
- API 硬性要求：`app/api/submissions/route.ts:122-136`
- 影响：按示例直接提交会得到缺少友链页面的 400；这是明确文档/示例漂移。

### README 声称 422，但 POST 当前没有 422 分支

- 文档：`README.md:163`
- 实现：`app/api/submissions/route.ts:122-172` 仅看到 400、500 和成功 201。

### “上传截图”实际是截图 URL

- 文档表述：`README.md:32`
- 实现：`app/embed/page.tsx:254-266` 使用 `input type="url"`；API 读取字符串：`app/api/submissions/route.ts:118-161`。

### “创建 PR”没有代码证据

- 既有文档：`docs.md:91` 使用“提交 PR 或直接推送”的表述。
- 实现：`lib/github.ts:224-241` 只调用 `repos.createOrUpdateFileContents`，没有 Pull Request API。

### 邮件模板 Markdown 表述过宽

- 文档：`README.md:27,1248-1253`
- 实现：模板作为 HTML 传给 Nodemailer；只有拒绝原因经过有限 `mdToHtml` 正则转换：`lib/email.ts:152-163,256-268`。

### 状态筛选是当前页本地筛选

- 后端分页无 status 参数：`app/api/submissions/route.ts:64-101`
- 前端本地过滤：`components/admin/SubmissionTable.tsx:49-56`
- 统计也从当前页数组计算：`app/admin/dashboard-client.tsx:318-323`。

### 首页 appUrl 未用于复制代码

- 读取：`app/page.tsx:10-20`
- 硬编码占位主机：`app/page.tsx:29-33`
- 这是高可信的实现/意图偏差，部署者仍需替换域名。

## 高可信风险清单

1. 固定 JWT fallback secret：`lib/auth.ts:4-6`。
2. JWT payload role 未运行时校验，管理员 API 主要只判断 session 存在：`lib/auth.ts:16-30`、`app/api/submissions/[id]/route.ts:13-16`。
3. GitHub 辅助查询在 session 检查前返回：`app/api/submissions/route.ts:29-41`。
4. 公开查询无分页/结果上限，搜索值直接作为正则：`app/api/submissions/route.ts:43-61`。
5. POST 和设置 PUT 缺少统一运行时 schema/长度验证：`app/api/submissions/route.ts:118-161`、`app/api/admin/settings/route.ts:54-103`。
6. 邮件模板、用户字段和拒绝原因没有统一 HTML 转义：`lib/email.ts:152-239`。
7. GitHub、MongoDB、邮件之间无事务、补偿或审核幂等：`app/api/submissions/[id]/route.ts:46-100`。
8. GitHub YAML 做基本运行时结构校验，但仍会全量重写；新增审核没有重复检查，后台编辑会检查目标分组内重复链接：`lib/github.ts:160-196,224-241,473-523`。
9. SMTP 关闭证书校验：`lib/email.ts:62-72`。
10. OwO 外部图标通过 `dangerouslySetInnerHTML` 注入：`app/admin/dashboard-client.tsx:141-154,495-498`。

## 待确认问题

1. 生产是否总是配置强随机 `JWT_SECRET`，是否需要缺失时阻止启动。
2. `github=1`、`classNames=1`、`screenshotField=1` 是否有意公开。
3. 公开查询是否应保留全量历史结果、无分页和 CORS `*`。
4. GitHub 目标仓库是否始终是 `YmlGroup[]`，是否允许直接写默认分支。
5. 指定不存在分组时返回错误是否符合所有部署者预期；新增审核未指定分组时已固定使用“网上邻居”。
6. 管理后台清空已有 descr/feeds/friendslink/截图时，会移除对应 YAML 字段；审核更新仍沿用申请字段的兼容保留规则。
7. 拒绝原因是否需要持久化到 `Submission`，以便后台追溯。
8. 清理天数应从 `createdAt` 还是状态变更时刻开始计算。
9. 邮件模板是否只对可信管理员开放，还是需要 HTML sanitize。
10. `tls.rejectUnauthorized=false` 是否为特定 SMTP 服务的兼容性要求。
11. 是否需要重复申请检测、并发审核幂等和通知失败重试。
12. 是否要求后台筛选/统计跨越全库，而非当前页。
13. `topimg` 是否需要在后台列表中与 `siteshot` 一样预览。

## 人工核验建议

- 用隔离 MongoDB fixture 验证状态、清理和分页。
- 用不具备生产写权限的 GitHub 测试仓库/分支验证 YAML 结构、SHA 冲突、默认分组创建、分组编辑/删除保护和友链移动。
- 用 SMTP sandbox 验证主题、模板、拒绝原因和 TLS 行为。
- 用浏览器在真实第三方 origin 验证 Iframe、Script、CORS、主题和多个嵌入实例。
- 在修复高风险项前补回归测试，尤其是 JWT、HTML 转义、GitHub 映射和审核幂等。
