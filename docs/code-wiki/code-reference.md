# 关键代码索引

> 行号以本次多数据库改造后的工作树为准，后续代码变化可能使行号漂移。此页选择影响启动、核心业务、外部边界和维护决策的符号，不罗列所有小函数。

## 启动、页面与客户端协调

| 符号 | 类型 | 位置 | 输入/输出与职责 | 副作用/关系 |
|---|---|---|---|---|
| `RootLayout` | React Server Component | `app/layout.tsx:10-27` | 接收 `children`，输出 HTML 根布局 | 注入暗色初始化脚本、全局 CSS、Toast |
| `HomePage` | Client Component | `app/page.tsx:6-293` | 展示嵌入说明、生成代码和预览 | 使用 Clipboard API；不直接写业务数据 |
| `EmbedForm` | Client Component | `app/embed/page.tsx:6-324` | 表单状态和 `mode`/`dark` 参数 | POST `/api/submissions`；成功后显示完成态 |
| `EmbedPage` | 页面包装器 | `app/embed/page.tsx:326-331` | Suspense 包装 `EmbedForm` | 因 `useSearchParams` 需要客户端边界 |
| `GET`（embed script） | Route Handler | `app/embed-script/route.ts:3-38` | 输出 JavaScript 文本 | 读取 `NEXT_PUBLIC_APP_URL`，动态创建 iframe |
| `AdminPage` | Server Component | `app/admin/page.tsx:5-8` | 无输入；输出后台或重定向 | 调用 `getSession`，未授权时 redirect |
| `AdminDashboard` | Client Component | `app/admin/dashboard-client.tsx:51-611` | 管理后台所有状态和操作编排 | 调用列表/辅助/审核/删除/设置 API；挂载 Modal |
| `SubmissionTable` | Client Component | `components/admin/SubmissionTable.tsx:49-264` | 接收分页数据与回调，输出表格 | 当前页本地筛选；将操作交回 Dashboard |
| `SettingsPanel` | Client Component | `components/admin/SettingsPanel.tsx:8-316` | 设置加载、编辑和保存 | GET/PUT `/api/admin/settings`，显示 Toast |

## 认证与数据库

| 符号 | 类型 | 位置 | 输入/输出 | 关键边界 |
|---|---|---|---|---|
| `createToken` | 函数 | `lib/auth.ts:9-14` | username → 24h JWT | payload 含 username、role；HS256 |
| `verifyToken` | 函数 | `lib/auth.ts:16-23` | token → payload/null | `jwtVerify` 失败返回 null |
| `getSession` | 函数 | `lib/auth.ts:25-30` | Cookie → session/null | 读取 `session` Cookie |
| `isAdmin` | 函数 | `lib/auth.ts:32-37` | username/password → boolean | 与环境变量直接比较 |
| `getDatabaseProvider` | 函数 | `lib/database/config.ts:10-17` | 环境变量 → provider | 缺省 mongodb，拒绝未知 provider |
| `dbConnect` | 函数 | `lib/db.ts:18-35` | 无显式参数 → Mongoose | `globalThis._mongooseCache` 缓存连接和 Promise |
| `getSubmissionRepository` | 函数 | `lib/database/repositories.ts:5-13` | provider → Repository | Mongo/Mongoose 或 Drizzle SQL |
| `SubmissionRepository` | 接口 | `lib/database/types.ts:28-39` | 数据库无关 CRUD | 统一 `_id`、分页、清理和 ping |
| `ISubmission` | 接口 | `lib/models/submission.ts:3-18` | Mongo adapter/迁移源类型 | 站点字段、类型、状态、时间戳 |
| `SubmissionSchema` | Schema | `lib/models/submission.ts:20-44` | MongoDB 文档约束 | enum 为 `apply/update` 和三种状态 |
| `IConfig` | 接口 | `lib/models/config.ts:3-6` | Mongo adapter 配置键值类型 | key/value 均为 string |
| `ConfigRepository` | 接口 | `lib/database/types.ts:41-46` | 数据库无关配置读写 | 所有 provider 统一 get/set |
| `ConfigSchema` | Schema | `lib/models/config.ts:8-11` | MongoDB 配置结构 | key unique |

## API Route Handlers

| 路由 | 方法/位置 | 主要行为 | 外部关系 |
|---|---|---|---|
| 登录 | `app/api/auth/login/route.ts:4-40` | 校验输入和账号，签发 Cookie | `isAdmin`、`createToken` |
| 注销 | `app/api/auth/logout/route.ts:3-12` | 将 session Cookie maxAge 设为 0 | 无数据库依赖 |
| 当前用户 | `app/api/auth/me/route.ts:4-10` | 返回认证状态和用户名 | `getSession` |
| 健康检查 | `app/api/health/route.ts:1-21` | 存活或数据库 readiness | Repository、provider ping |
| 提交 GET | `app/api/submissions/route.ts:25-109` | GitHub 状态/分组/截图辅助查询、公开查询、管理员清理+分页 | Repository、认证、GitHub |
| 提交 OPTIONS | `app/api/submissions/route.ts:111-120` | CORS 预检 | 允许 POST/OPTIONS |
| 提交 POST | `app/api/submissions/route.ts:122-178` | 校验并创建 pending 记录 | Repository、管理员邮件 |
| 单条 PATCH | `app/api/submissions/[id]/route.ts:8-87` | 审核通过/拒绝 | Repository、GitHub、结果邮件 |
| 单条 DELETE | `app/api/submissions/[id]/route.ts:90-105` | 删除记录 | Repository、session |
| 设置 GET | `app/api/admin/settings/route.ts:24-43` | 组合默认值和持久化配置 | Repository、邮件默认模板 |
| 设置 PUT | `app/api/admin/settings/route.ts:46-75` | 校验并逐项 upsert | Repository |
| 友链管理 GET | `app/api/links/route.ts:1-21` | 读取 GitHub 分组 | session、GitHub |
| 分组 POST | `app/api/links/groups/route.ts:1-31` | 新建分组 | session、GitHub |
| 分组 PATCH/DELETE | `app/api/links/groups/[groupName]/route.ts:1-58` | 编辑/删除分组 | session、GitHub |
| 友链 PATCH | `app/api/links/entries/route.ts:1-64` | 编辑和移动已通过友链 | session、GitHub |

## 提交与审核核心

| 符号 | 位置 | 输入/输出 | 关键行为 |
|---|---|---|---|
| `getConfig`（submissions） | `app/api/submissions/route.ts:21-24` | key → number | 读取状态保留天数，缺省使用默认值 |
| `POST /api/submissions` | `app/api/submissions/route.ts:122-178` | JSON → 201 Submission | 要求 name/url/avatar/friendslink；更新要求 originalUrl；状态初始 pending |
| `PATCH /api/submissions/:id` | `app/api/submissions/[id]/route.ts:8-107` | action JSON → 更新文档 | pending 才可处理；approved 先同步 GitHub |
| `DELETE /api/submissions/:id` | `app/api/submissions/[id]/route.ts:109-134` | id → 删除结果 | 需要管理员 session |

## 数据库适配器

| 符号 | 位置 | 输入/输出 | 关键边界 |
|---|---|---|---|
| `MongoSubmissionRepository` / `MongoConfigRepository` | `lib/database/mongodb/repositories.ts` | Mongoose CRUD → 领域记录 | ObjectId 转字符串 `_id` |
| `SqliteSubmissionRepository` / `SqliteConfigRepository` | `lib/database/sql/repositories.ts` | Drizzle + better-sqlite3 CRUD | SQLite 单实例、WAL |
| `MysqlSubmissionRepository` / `MysqlConfigRepository` | `lib/database/sql/repositories.ts` | Drizzle + mysql2 CRUD | MySQL 8.4 Compose |
| `migrateDatabase` | `scripts/database.ts` | provider → schema migration | Mongo 分支 no-op |
| `migrate-from-mongodb` | `scripts/migrate-from-mongodb.ts` | Mongo → SQL dry-run/apply | 默认 dry-run、apply 幂等 upsert |

## GitHub 适配器

| 符号 | 类型/位置 | 输入/输出 | 副作用/边界 |
|---|---|---|---|
| `sanitizeUrl` | 函数，`lib/github.ts:101-109` | URL → 规范 URL | 补协议、去尾斜杠 |
| `getYmlContent` | 函数，`lib/github.ts:213-224` | Octokit + repo/path → SHA/groups | GitHub Contents API + YAML 解析和结构校验 |
| `writeYml` | 函数，`lib/github.ts:228-241` | groups + message + SHA | 全量序列化并写回 GitHub |
| `detectScreenshotField` | 函数，`lib/github.ts:243-251` | groups → siteshot/topimg/null | 按遍历顺序选择第一个截图约定 |
| `addLink` | 函数，`lib/github.ts:300-323` | LinkEntry + className + field → true | 默认使用/创建“网上邻居”；指定不存在分组时报错；写入 tags |
| `getClassNames` | 函数，`lib/github.ts:325-341` | 无 → string[] | 异常返回空数组；默认组作为可选项 |
| `updateLink` | 函数，`lib/github.ts:343-390` | originalUrl + LinkEntry → true | 标准化 URL 精确匹配，保留额外字段和 tags |
| `getScreenshotField` | 函数，`lib/github.ts:392-404` | 无 → field/null | 异常返回 null |
| `getGitHubStatus` | 函数，`lib/github.ts:402-405` | 无 → 配置状态 | 只检查环境变量，不验证远程 |
| `getLinkGroups` | 函数，`lib/github.ts:408-412` | 无 → YAML 分组 | 管理后台唯一数据源 |
| `createLinkGroup` / `updateLinkGroup` / `deleteLinkGroup` | 函数，`lib/github.ts:414-471` | 分组数据 → 最新分组 | 新建/编辑分组；只允许删除空分组 |
| `updateManagedLink` | 函数，`lib/github.ts:473-523` | 原分组/原链接/编辑字段 → 最新分组 | 编辑、移动、tags 清洗；每次基于 SHA 写回 |

## 邮件与配置

| 符号 | 位置 | 职责 | 关键边界 |
|---|---|---|---|
| `getSmtpConfig` | `lib/email.ts:28-45` | 读取 SMTP 环境变量 | 管理员通知要求 recipient；结果通知可回退 |
| `getDefaultHtml` | `lib/email.ts:81-113` | 默认管理员 HTML 模板 | 使用占位符 |
| `getDefaultResultHtml` | `lib/email.ts:121-150` | 默认结果 HTML 模板 | 使用 result/reason 占位符 |
| `mdToHtml` | `lib/email.ts:152-163` | 有限 Markdown → HTML | 正则转换，未做完整解析/转义 |
| `mergeTemplate` | `lib/email.ts:165-195` | 模板 + SubmissionInfo → HTML/主题 | 字段直接插入 HTML |
| `mergeResultTemplate` | `lib/email.ts:197-239` | 模板 + status/reason → HTML | reason 经有限 Markdown 转换 |
| `sendNotification` | `lib/email.ts:256-272` | 提交 → 管理员邮件 | SMTP 未配置/失败不抛出给主流程 |
| `sendResultNotification` | `lib/email.ts:274-291` | 状态结果 → 申请者邮件 | 没有邮箱或失败则跳过/记录 |
| `isEmailConfigured` | `lib/email.ts:293-295` | 无 → boolean | 与管理员通知的 recipient 要求不完全相同 |
| `setConfig` | `app/api/admin/settings/route.ts:18-20` | key/value → upsert | 多次调用不是事务 |
| `parsePositiveInt` | `app/api/submissions/route.ts:20-23` | query string → 正整数 | 非法 page/limit 回退默认值 |

## 调用链速查

### 新提交

```text
EmbedForm.handleSubmit
  → POST /api/submissions
  → getSubmissionRepository()
  → repository.create
  → sendNotification
  → getConfig / Nodemailer
```

### 审核通过（新增）

```text
AdminDashboard.handleAction
  → PATCH /api/submissions/:id
  → addLink
  → getYmlContent → yaml.load
  → writeYml → GitHub Contents API
  → repository.completeClaim(approved)
  → sendResultNotification
```

### 审核通过（更新）

```text
AdminDashboard.handleAction
  → PATCH /api/submissions/:id
  → updateLink(originalUrl)
  → sanitizeUrl + link_list.findIndex
  → writeYml
  → repository.completeClaim(approved)
```
