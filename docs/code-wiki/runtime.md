# 运行指南

## 运行前提

### 已从仓库确认

- Node.js：README 标注 `>=18`（`README.md:3-8`）；锁文件中 Next.js 15.5.19 的 engines 要求更具体，建议使用满足其约束的 Node 18.18+ 或 Node 20+（`package-lock.json:4743-4760`）。
- npm：仓库提交 `package-lock.json`，使用 npm 脚本（`package.json:5-10`）。
- 数据库：API、登录后的管理列表、设置和通知模板读取依赖 `DATABASE_PROVIDER`；缺省为 MongoDB，分别使用 `MONGODB_URI`、`SQLITE_PATH` 或 `MYSQL_URL`（`lib/database/config.ts:10-34`）。
- GitHub：只有启用审核通过自动写 YAML 时才需要 `GITHUB_TOKEN`、`GITHUB_REPO`、`GITHUB_FILE_PATH`；当前未配置时审核通过会返回 GitHub 同步失败（`lib/github.ts:36-43`；`app/api/submissions/[id]/route.ts:46-77`）。
- SMTP：只有邮件通知需要 SMTP 变量；邮件不是提交/审核状态保存的硬依赖（`lib/email.ts:256-291`）。

### 运行时未验证

本次没有启动完整生产服务、连接真实 MongoDB/MySQL/GitHub/SMTP，因此以下命令是由仓库脚本和隔离 SQLite 验证确认的入口，不代表生产环境已验证成功。

## 安装依赖

```bash
npm install
```

脚本和 README 来源：`package.json:5-16`、`README.md:86-92`。

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

实际执行 `next dev`（`package.json:5-7`）。运行前应设置 `DATABASE_PROVIDER` 和对应连接变量；README 预期访问 `http://localhost:3000`（`README.md:114-120`）。

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

实际执行 `next build` 和 standalone server（`package.json:7-8`，即 `node .next/standalone/server.js`）；本次已用隔离 SQLite 验证 production server、`/api/health` 和 readiness。

## 质量检查

```bash
npm run lint
npm run typecheck
npm test
```

脚本实际为 `next lint`（`package.json:9`），`typecheck` 使用 `tsc --noEmit`，测试使用 Vitest。`next lint` 仍会显示 Next.js 弃用提示，但当前无 ESLint warning/error；测试覆盖 provider 配置和 SQLite Repository，真实 MySQL/Mongo 需隔离服务。

## 配置后的功能验证路径

以下是基于现有入口推导的低风险手工检查清单，未在本次分析中执行：

1. 打开 `/`，确认嵌入代码和 `/embed` 预览可见。
2. 打开 `/embed`，提交一条申请；检查 MongoDB 中出现 `pending` 记录。
3. 打开 `/admin/login`，使用环境变量账号登录。
4. 在 `/admin` 确认提交列表和分页返回；这一步会触发过期记录清理（`app/api/submissions/route.ts:70-92`）。
5. 访问 `/api/health` 确认进程存活，访问 `/api/health?ready=1` 确认当前 provider 已就绪。
6. 如果配置 GitHub，审核一条新增申请，确认默认分组“网上邻居”及目标 YAML 的 `link_list`、截图字段和 tags。
7. 在后台“友链分组管理”编辑一条已通过友链，移动到另一分组并保存，确认 GitHub YAML 更新。
8. 如果配置 SMTP 且申请记录有邮箱，分别检查管理员通知和结果通知。
9. 从 `/admin` 注销，确认再次访问后台会转登录页。

## API 快速参考

### 公开提交

```text
POST /api/submissions
Content-Type: application/json
```

服务端要求 `name`、`url`、`avatar`、`friendslink`；`type=update` 时还要求 `originalUrl`，成功返回 201（`app/api/submissions/route.ts:119-178`）。响应支持 `Access-Control-Allow-Origin: *`。

### 管理员列表

```text
GET /api/submissions?page=1&limit=10
```

需要 session；`limit` 被限制到 1–100；请求期间按状态执行自动清理（`app/api/submissions/route.ts:70-109`）。

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

无需登录，支持状态和名称搜索，返回有限业务字段并带 CORS；当前内部按较大上限读取，仍不适合无限增长的数据集（`app/api/submissions/route.ts:39-67`）。

## 部署

项目同时支持 Vercel 和 Docker 自托管。Vercel 继续使用 MongoDB Atlas/外部 MongoDB；Docker 提供 SQLite、MySQL 8.4、MongoDB 8 三套 Compose（`Dockerfile`、`compose.*.yaml`）。部署前需在平台配置 `.env` 中列出的变量，并确认：

- `DATABASE_PROVIDER` 和对应数据库变量可从部署环境访问；Mongo 为 `MONGODB_URI`，SQLite 为 `SQLITE_PATH`，MySQL 为 `MYSQL_URL`。
- `JWT_SECRET` 是强随机值，不能依赖 `lib/auth.ts:4-6` 的 fallback。
- GitHub Token 对目标仓库具有 Contents 写权限。
- `NEXT_PUBLIC_APP_URL` 是实际公开 URL，否则跨站 Script 的 iframe 地址可能退化为相对路径。
- Docker CLI 当前未安装，因此镜像构建和 Compose 三套数据库的真实启动仍需服务器验收。
- SMTP 服务器允许当前部署环境连接；当前 Nodemailer TLS 关闭证书验证，需人工评估（`lib/email.ts:62-72`）。

## 停止与清理

- 开发进程：在终端按 `Ctrl+C`。
- 本地生成物：`.next/` 已被 `.gitignore` 忽略；不要删除用户的 `.env.local` 或数据库数据来“清理”。
- SQL schema migration：`npm run db:migrate`；Mongo 分支安全跳过。
- Mongo → SQL 数据迁移：先 `npm run db:migrate-data -- --dry-run`，确认后再加 `--apply`；备份命令见 `docs/database-migration.md`。
- Docker 停止应用但保留卷：`docker compose -f compose.<provider>.yaml down`；不要随意使用 `down -v`。
- 自动清理仍只在管理员列表 API 请求中触发。

## 常见故障排查

| 现象 | 重点检查 | 证据/处理 |
|---|---|---|
| API 返回数据库错误 | `DATABASE_PROVIDER`、对应连接变量、数据库网络和健康状态 | `lib/database/config.ts`、`lib/database/repositories.ts`；先确认连接配置，不要在未授权时修改数据库 |
| 无法登录 | `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`JWT_SECRET` | `lib/auth.ts:4-37`；生产不要使用 fallback secret |
| 审核通过返回 502 | 三个 `GITHUB_*` 变量、Token 权限、仓库路径和 YAML 结构 | `lib/github.ts:74-212`；API 将同步失败映射为 502 |
| 邮件不发送 | SMTP 五项变量、申请者 email、服务器端口和日志 | `lib/email.ts:28-44,256-291`；邮件失败不会改变主业务结果 |
| 跨站 Script 不显示表单 | `NEXT_PUBLIC_APP_URL` 和 `/embed.js` rewrite | `app/embed-script/route.ts:3-17`；`next.config.js:2-9` |
| 公开列表响应过大/慢 | `public=1` 当前使用较大上限、搜索和 provider 性能 | `app/api/submissions/route.ts:39-67`；生产大数据量应增加分页/限流 |
| 后台状态筛选结果不全 | 当前筛选只作用于已加载页 | `components/admin/SubmissionTable.tsx:49-56`；需产品确认是否改为服务端筛选 |
