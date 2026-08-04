# friendlink-verify Code Wiki

> 一个面向站点管理员的友链提交、审核与 GitHub YAML 同步系统。

## 项目速览

- **类型**：Next.js App Router 全栈 Web 应用
- **技术栈**：TypeScript / React / Next.js 15.5.19 / Repository（MongoDB + Mongoose、SQLite/MySQL + Drizzle）/ JWT Cookie / GitHub Contents API / SMTP / Docker
- **适用读者**：首次接手项目的开发者、部署维护者、需要排查审核链路的管理员
- **主要入口**：`/`、`/embed`、`/embed.js`、`/admin`
- **核心数据模型**：`Submission`、`Config`；数据库可选 MongoDB、SQLite、MySQL

系统的主链路是：第三方站点提交友链信息 → 当前数据库 provider 保存为待审核 → 管理员在后台审核 → 通过时改写 GitHub 中的 Butterfly 风格 YAML → 可选地发送邮件通知。已通过友链不复制到数据库，GitHub YAML 仍是唯一事实来源。

## 推荐阅读顺序

1. [项目概览](./project-overview.md)：先理解目标、技术栈、目录和边界。
2. [整体架构](./architecture.md)：理解页面、API、数据库和外部服务如何协作。
3. [模块说明](./modules.md)：按业务职责定位代码。
4. [数据与流程](./data-and-flows.md)：跟踪提交、审核、同步和通知的数据流。
5. [代码索引](./code-reference.md)：按启动、业务、适配器和模型查找关键符号。
6. [运行指南](./runtime.md) 与 [配置说明](./configuration.md)：本地运行和部署排障。
7. [测试现状](./testing.md)：了解当前质量门禁和未覆盖风险。
8. [证据索引](./references.md)：回到源码、配置和文档核对结论。

## 文档导航

| 文档 | 内容 |
|---|---|
| [project-overview.md](./project-overview.md) | 项目目的、技术栈、目录画像、术语和规模 |
| [architecture.md](./architecture.md) | 架构风格、模块边界、启动过程和关键流程图 |
| [modules.md](./modules.md) | 前端、API、领域服务和外部适配器模块 |
| [code-reference.md](./code-reference.md) | 关键函数、路由、组件、模型和副作用索引 |
| [dependencies.md](./dependencies.md) | 外部依赖、内部依赖、升级风险和依赖图 |
| [runtime.md](./runtime.md) | 安装、开发、构建、部署、测试和常见故障 |
| [data-and-flows.md](./data-and-flows.md) | 实体、状态、提交/审核/GitHub/邮件流程 |
| [configuration.md](./configuration.md) | 环境变量、数据库配置和默认值 |
| [testing.md](./testing.md) | 测试文件、脚本、Lint、CI 和测试缺口 |
| [references.md](./references.md) | 证据文件、行号、局限和待人工核验事项 |

## 快速运行

```bash
npm install
npm run dev
```

运行数据库相关功能前，需要配置 `.env.local`；最小要求见[配置说明](./configuration.md)。可运行 `npm run typecheck`、`npm test` 和 `npm run db:migrate`。生产模式命令为：

```bash
npm run build
npm start
```

命令来源于 `package.json:5-10`；环境准备和功能依赖见 `runtime.md`。

## 架构图入口

整体组件图和审核流程图见 [architecture.md](./architecture.md)。最重要的边界是：

- 浏览器/第三方站点只通过公开提交接口写入 `Submission`。
- 管理员 API 通过 `session` HttpOnly Cookie 做会话认证。
- GitHub 和 SMTP 都是可选集成，但审核通过在当前实现中依赖 GitHub 配置；数据库 provider 由 `DATABASE_PROVIDER` 选择。
- 自动清理不是独立定时任务，而是在管理员加载列表时执行。

## 分析元数据

| 项目 | 值 |
|---|---|
| 分析目标 | `E:/kmoretti-github/friendlink-verify` |
| Docker 入口 | `Dockerfile`、`compose.sqlite.yaml`、`compose.mysql.yaml`、`compose.mongodb.yaml` |
| Git 基线 | `a3cb132`（`main`；本次 Docker/多数据库改造仍在工作树中） |
| 分析时间 | 2026-08-04（GMT+8） |
| 扫描范围 | `app/`、`components/`、`lib/`、根目录配置、README、`docs.md`、依赖锁文件、测试/CI/部署入口 |
| 默认忽略 | `.git/`、`node_modules/`、`.next/`、生成缓存、二进制资源和环境变量值 |
| 已有文档 | 根目录 `docs.md`；本目录为独立 Code Wiki，不简单复制旧文档 |
| 局限 | 未启动服务、未连接 MongoDB/GitHub/SMTP、未验证生产 Vercel 环境和远程 YAML 实例；动态运行时行为以“推断/待确认”标注 |

> 本 Wiki 只记录环境变量名称和用途，不记录 Token、密码、连接字符串或其他敏感值。未能从静态代码证明的内容明确标记为“高可信推断”或“待确认”。
