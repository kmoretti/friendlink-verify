# 测试与质量门禁

## 当前仓库状态

### 已确认事实

- `package.json` 现在包含 `dev`、`build`、`start`、`lint`、`typecheck`、`test`、Drizzle migration 和 Mongo→SQL migration 脚本（`package.json:5-16`）。
- 已新增 Vitest 配置和数据库测试；当前没有浏览器 E2E 测试。
- 已新增 Dockerfile、`.dockerignore`、三套 Compose；仍未发现 CI workflow。Vercel 继续依赖平台默认 Next.js 识别；Docker CLI 不在当前环境。
- `tsconfig.json` 开启 `strict`、`noEmit` 和 Next 插件（`tsconfig.json:1-34`），`npm run typecheck` 执行 `tsc --noEmit`。
- 本次改造的验证基线为 `main...origin/main`；Docker CLI 不在当前环境中，因此 Docker build/Compose 启动仍需在安装 Docker 的服务器验收。

### 已有验证

本次已执行 `npm run lint`、`npm run typecheck`、`npm test` 和 `npm run build`；均通过。Lint 仍有 Next.js 关于 `next lint` 弃用的提示。Docker CLI 不可用，未执行镜像构建或 Compose 启动；未连接真实 MongoDB/MySQL/GitHub/SMTP。

## 现有质量入口

| 命令 | 实际脚本 | 能证明什么 | 不能证明什么 |
|---|---|---|---|
| `npm run lint` | `next lint` | ESLint 规则通过 | 不证明 API、数据库、GitHub、SMTP 或 UI 流程正确 |
| `npm run build` | `next build` | Next standalone 构建通过 | 未验证真实生产环境和外部服务 |
| `npm start` | `node .next/standalone/server.js` | 隔离 SQLite 下 production server、health/readiness 已验证 | 未验证真实生产网络/数据库和 Docker 容器 |

## 未覆盖的核心场景

### 后端与数据

1. MySQL/Mongo 真实连接、provider 变量缺失、连接缓存和数据库网络。
2. Repository 合约：SQLite 已验证 CRUD/搜索/状态更新/删除/upsert；MySQL/Mongo 仍需隔离服务。
3. 管理员 Cookie、JWT 过期、错误凭据和未授权响应。
4. 分页边界、公开查询、搜索特殊字符和大结果集。
5. 自动清理的状态/日期语义。
6. 设置 API 的数字校验、默认值和部分保存。

### GitHub

1. 真实 Butterfly YAML 的解析和字段兼容。
2. 新增分组选择、默认“网上邻居”创建、指定不存在分组的错误。
3. `siteshot`/`topimg` 检测、更新、tags 和额外字段保留。
4. 分组新建/重命名/描述编辑、非空分组删除保护、友链移动。
4. GitHub 404 新建文件、SHA 冲突、权限不足、网络超时。
5. 并发审核、重复友链和全量 YAML 重写。

### 邮件

1. SMTP 配置判断和端口/secure 行为。
2. 默认/自定义模板占位符替换。
3. 拒绝原因 Markdown 转换、HTML 注入和长文本。
4. SMTP 失败不会影响主流程的实际行为。

### 前端与嵌入

1. `/embed` 的 apply/update 表单和错误态。
2. `/embed.js` 跨站加载、多个 script、`NEXT_PUBLIC_APP_URL` 缺失。
3. iframe 主题初始化和父页主题变化。
4. 后台登录、分页、当前页筛选、审核 Modal、删除和设置。
5. OwO 外部 JSON 和截图 URL 加载失败。

## 建议的最小测试计划

如果后续补测试，建议先为服务端纯逻辑和外部边界建立 seam，而不是直接把所有测试写成端到端：

1. **认证单元测试**：`createToken`/`verifyToken`/`getSession`，特别是缺失 `JWT_SECRET` 的失败策略。
2. **GitHub 纯逻辑测试**：覆盖 `sanitizeUrl`、`normalizeTags`、截图字段检测、Submission→YAML 映射、分组/友链管理和更新保留规则；用 fixture 覆盖 siteshot/topimg、空字段、找不到原链接、非空分组删除。
3. **邮件渲染测试**：占位符、可选行、拒绝原因和 HTML escape；不要连接真实 SMTP。
4. **API 集成测试**：模拟 MongoDB 和 GitHub/邮件适配器，覆盖 400/401/404/502/500 和幂等边界。
5. **浏览器 E2E**：登录、提交、审核、筛选、分页和嵌入；需明确测试数据库与外部服务 mock。
6. **静态质量**：将 `npm run typecheck`（如 `tsc --noEmit`）和测试加入脚本；升级 Next 后迁移 `next lint`。

## 质量风险优先级

| 优先级 | 风险 | 证据 |
|---|---|---|
| 高 | JWT fallback secret、管理员 role 未运行时校验 | `lib/auth.ts:4-6,16-23` |
| 高 | HTML 模板/用户输入未统一转义 | `lib/email.ts:152-239` |
| 高 | GitHub/数据库/邮件无事务和幂等 | `app/api/submissions/[id]/route.ts:25-80` |
| 中 | 公开查询仍使用较大固定上限，SQL 搜索契约还需跨 provider 对齐 | `app/api/submissions/route.ts:39-67`；`lib/database/*/repositories.ts` |
| 中 | 状态筛选/统计只覆盖当前页 | `components/admin/SubmissionTable.tsx:49-56`；`app/admin/dashboard-client.tsx:318-323` |
| 中 | 远程 YAML 只做基本运行时结构校验，字段语义仍依赖真实仓库 | `lib/github.ts:160-196` |

## 人工核验边界

本页不把没有执行过的构建、HTTP、数据库连接、远程写入或 SMTP 发送描述为“通过”。如果要验证完整系统，需要隔离的测试 MongoDB、GitHub fixture/测试仓库、SMTP sandbox 和可重复的浏览器环境；不要直接对生产 GitHub 文件或生产数据库进行测试。
