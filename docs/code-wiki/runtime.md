# 运行指南

## 运行前提

### 已从仓库确认

- Node.js：README 标注 `>=18`（`README.md:3-8`）；锁文件中 Next.js 15.5.19 的 engines 要求更具体，建议使用满足其约束的 Node 18.18+ 或 Node 20+（`package-lock.json:4743-4760`）。
- npm：仓库提交 `package-lock.json`，使用 npm 脚本（`package.json:5-10`）。
- MongoDB：API、登录后的管理列表、设置和通知模板读取都依赖 `MONGODB_URI`（`lib/db.ts:18-35`）。
- GitHub：只有启用审核通过自动写 YAML 时才需要 `GITHUB_TOKEN`、`GITHUB_REPO`、`GITHUB_FILE_PATH`；当前未配置时审核通过会返回 GitHub 同步失败（`lib/github.ts:36-43`；`app/api/submissions/[id]/route.ts:46-77`）。
- SMTP：只有邮件通知需要 SMTP 变量；邮件不是提交/审核状态保存的硬依赖（`lib/email.ts:256-291`）。

### 运行时未验证

本次没有启动服务、连接 MongoDB、调用 GitHub 或 SMTP，因此以下命令是由仓库脚本确认的入口，不代表生产环境已验证成功。

## 安装依赖

```bash
npm install
```

脚本和 README 来源：`package.json:5-10`、`README.md:86-92`。

## 环境配置

Windows 文档建议：

```powershell
copy env.example .env.local
```

然后填写必需和可选环境变量，完整分类见 [configuration.md](./configuration.md)。不要把真实 `.env.local` 提交到 Git；`.gitignore:1-5` 已忽略 `.env`、`.env.local` 和本地环境文件。

## 本地开发

```bash
npm run dev
```

实际执行 `next dev`（`package.json:5-7`）。README 预期访问 `http://localhost:3000`（`README.md:114-120`）。

页面入口：

- `http://localhost:3000/`：部署者首页。
- `http://localhost:3000/embed`：嵌入表单。
- `http://localhost:3000/admin`：管理员入口；未登录会转到 `/admin/login`。
- `http://localhost:3000/embed.js`：Script 嵌入入口，经 rewrite 到 `/embed-script`。

## 构建与生产启动

```bash
npm run build
npm start
```

实际执行 `next build` 和 `next start`（`package.json:7-8`）。README 提醒 Windows 上开发模式异常时可尝试生产构建/启动，但本次未执行构建验证（`README.md:120-123`）。

## 质量检查

```bash
npm run lint
```

脚本实际为 `next lint`（`package.json:9`）。只读分析子会话报告该命令当前无 ESLint warning/error，但有 Next.js 关于 `next lint` 将弃用的提示；本次恢复阶段没有重复执行。仓库没有独立 `typecheck` 脚本，`tsconfig.json` 的 `strict` 只说明编译配置，不等于已运行类型检查。

## 配置后的功能验证路径

以下是基于现有入口推导的低风险手工检查清单，未在本次分析中执行：

1. 打开 `/`，确认嵌入代码和 `/embed` 预览可见。
2. 打开 `/embed`，提交一条申请；检查 MongoDB 中出现 `pending` 记录。
3. 打开 `/admin/login`，使用环境变量账号登录。
4. 在 `/admin` 确认提交列表和分页返回；这一步会触发过期记录清理（`app/api/submissions/route.ts:64-84`）。
5. 如果配置 GitHub，审核一条新增申请，确认默认分组“网上邻居”及目标 YAML 的 `link_list`、截图字段和 tags。
6. 在后台“友链分组管理”编辑一条已通过友链，移动到另一分组并保存，确认 GitHub YAML 更新。
7. 如果配置 SMTP 且申请记录有邮箱，分别检查管理员通知和结果通知。
8. 从 `/admin` 注销，确认再次访问后台会转登录页。

## API 快速参考

### 公开提交

```text
POST /api/submissions
Content-Type: application/json
```

服务端要求 `name`、`url`、`avatar`、`friendslink`；`type=update` 时还要求 `originalUrl`，成功返回 201（`app/api/submissions/route.ts:115-172`）。响应支持 `Access-Control-Allow-Origin: *`。

### 管理员列表

```text
GET /api/submissions?page=1&limit=10
```

需要 session；`limit` 被限制到 1–100；请求期间按状态执行自动清理（`app/api/submissions/route.ts:64-101`）。

### 审核/删除

```text
PATCH /api/submissions/:id
DELETE /api/submissions/:id
```

PATCH 需要 `{ status: "approved" | "rejected" }`，新增通过时还可以传 `className`、`screenshotField`；更新通过时由远端记录决定截图字段（`app/api/submissions/[id]/route.ts:8-107`；`lib/github.ts:339-388`）。

### 公开查询

```text
GET /api/submissions?public=1&status=approved&search=博客
```

无需登录，支持状态和名称搜索，返回有限业务字段并带 CORS；当前没有分页或结果数量上限（`app/api/submissions/route.ts:43-61`）。

## 部署

README 以 Vercel 为目标部署平台（`README.md:35-68`），但仓库没有 `vercel.json`、CI 工作流或其他部署 manifest；部署行为主要依赖 Vercel 对 Next.js 的默认识别。部署前需在平台配置 `.env` 中列出的变量，并确认：

- `MONGODB_URI` 可从部署环境访问。
- `JWT_SECRET` 是强随机值，不能依赖 `lib/auth.ts:4-6` 的 fallback。
- GitHub Token 对目标仓库具有 Contents 写权限。
- `NEXT_PUBLIC_APP_URL` 是实际公开 URL，否则跨站 Script 的 iframe 地址可能退化为相对路径。
- SMTP 服务器允许当前部署环境连接；当前 Nodemailer TLS 关闭证书验证，需人工评估（`lib/email.ts:62-72`）。

## 停止与清理

- 开发进程：在终端按 `Ctrl+C`。
- 本地生成物：`.next/` 已被 `.gitignore` 忽略；不要删除用户的 `.env.local` 或数据库数据来“清理”。
- 项目没有数据库迁移、种子或清理命令；自动清理只在管理员列表 API 请求中触发。

## 常见故障排查

| 现象 | 重点检查 | 证据/处理 |
|---|---|---|
| API 返回数据库错误 | `MONGODB_URI`、网络白名单、MongoDB 状态 | `lib/db.ts:18-35`；先确认连接配置，不要在未授权时修改数据库 |
| 无法登录 | `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`JWT_SECRET` | `lib/auth.ts:4-37`；生产不要使用 fallback secret |
| 审核通过返回 502 | 三个 `GITHUB_*` 变量、Token 权限、仓库路径和 YAML 结构 | `lib/github.ts:74-212`；API 将同步失败映射为 502 |
| 邮件不发送 | SMTP 五项变量、申请者 email、服务器端口和日志 | `lib/email.ts:28-44,256-291`；邮件失败不会改变主业务结果 |
| 跨站 Script 不显示表单 | `NEXT_PUBLIC_APP_URL` 和 `/embed.js` rewrite | `app/embed-script/route.ts:3-17`；`next.config.js:2-9` |
| 公开列表响应过大/慢 | `public=1` 无分页、search 未转义 | `app/api/submissions/route.ts:43-61`；属于待改进边界 |
| 后台状态筛选结果不全 | 当前筛选只作用于已加载页 | `components/admin/SubmissionTable.tsx:49-56`；需产品确认是否改为服务端筛选 |
