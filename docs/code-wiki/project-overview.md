# 项目概览

## 一句话说明

`friendlink-verify` 是一个可嵌入任意网站的友链申请系统：访客提交或更新站点信息，管理员在后台审核，审核通过后将数据追加/更新到 GitHub 仓库中的 YAML 友链文件，并可通过 SMTP 发送通知。

## 目标用户与主要能力

| 用户 | 能力 | 入口/证据 |
|---|---|---|
| 访客/友链申请者 | 填写站点名称、地址、头像、友链页、RSS、截图 URL、邮箱；支持申请和更新 | `app/embed/page.tsx:6-69` |
| 站点部署者 | 复制 Iframe、Script、自包含 HTML、Butterfly 示例 | `app/page.tsx:128-282`；`README.md:185-1231` |
| 管理员 | 登录、分页查看、状态筛选、审核通过/拒绝、删除 | `app/admin/login/page.tsx:7-101`；`components/admin/SubmissionTable.tsx:49-264` |
| 管理员 | 配置清理天数、OwO 地址、邮件主题和 HTML 模板 | `components/admin/SettingsPanel.tsx:8-316` |
| GitHub/SMTP | 分别承担审核后的 YAML 写入、已通过友链管理和可选通知 | `lib/github.ts:300-523`；`lib/email.ts:256-295` |

## 技术栈

| 类别 | 实际使用 | 证据 |
|---|---|---|
| 语言 | TypeScript、TSX | `tsconfig.json:1-34`；源码目录 |
| Web 框架 | Next.js `15.5.19`，App Router | `package.json:11-20`；`app/` 路由结构 |
| UI | React `18.3.1`、Tailwind CSS `3.4.19`、CSS 变量 | `package.json:12-34`；`tailwind.config.ts:3-13`；`app/globals.css:1-56` |
| 运行时 | Node.js；README 声明 `>=18`，锁文件中的 Next.js 约束更具体 | `README.md:3-8`；`package-lock.json:4743-4760` |
| 包管理 | npm，提交 `package-lock.json` | `package.json:5-10`；`package-lock.json:1-5` |
| 数据库 | MongoDB，通过 Mongoose `8.24.0` | `lib/db.ts:1-35`；`lib/models/*.ts` |
| 认证 | `jose` HS256 JWT，HttpOnly Cookie `session` | `lib/auth.ts:1-37`；`app/api/auth/login/route.ts:22-31` |
| GitHub | `octokit` Contents API，读写 YAML | `lib/github.ts:1-2,53-82` |
| 邮件 | `nodemailer` SMTP | `lib/email.ts:1,62-73` |
| YAML | `js-yaml` | `lib/github.ts:2,59,75` |

## 仓库画像

```text
friendlink-verify/
├── app/                  # 页面、布局和 Next.js Route Handlers
├── components/           # 管理后台和 Toast 客户端组件
├── lib/                  # 数据库、认证、邮件、GitHub 和 Mongoose 模型
├── img/                  # README 预览图片
├── public/               # 静态资源
├── README.md             # 面向使用者的部署和嵌入说明
├── docs.md               # 既有架构总结文档
├── env.example           # 环境变量模板
└── package.json          # 脚本与依赖
```

### 顶层目录职责

| 路径 | 职责 | 关系证据 |
|---|---|---|
| `app/` | App Router 页面、后台入口、嵌入入口和 API | 页面直接导入 `lib/auth`；API 路由导入 `lib/*` |
| `app/api/` | HTTP 边界：认证、提交、审核、设置 | `app/api/submissions/route.ts:1-7` |
| `components/admin/` | 后台展示和配置编辑 | `app/admin/dashboard-client.tsx:7-8,394-411` |
| `lib/` | 可复用服务和外部系统适配器 | `lib/email.ts:2-3`、`lib/github.ts:1-2` |
| `lib/models/` | MongoDB 文档模型 | `lib/models/submission.ts:1-44`、`config.ts:1-14` |
| `public/`、`img/` | 静态资源和文档预览素材 | 根目录文件清单；不参与核心业务流程 |

## 入口与边界

### 页面入口

- `/`：部署者首页，展示嵌入代码并预览 `/embed`。
- `/embed`：客户端友链提交表单，读取 `mode=update` 和 `dark=1`。
- `/embed.js`：由 `next.config.js` 重写到 `/embed-script`，返回动态脚本；脚本创建 `/embed` Iframe。
- `/admin`：服务端检查 session，未登录重定向到 `/admin/login`。
- `/admin/login`：调用 `/api/auth/login`。

证据：`app/page.tsx:1-293`、`app/embed/page.tsx:1-331`、`app/admin/page.tsx:1-10`、`next.config.js:2-9`。

### API 入口

| 路径 | 作用 |
|---|---|
| `/api/auth/login` | 校验环境变量账号密码并签发 session Cookie |
| `/api/auth/logout` | 清除 session Cookie |
| `/api/auth/me` | 查询当前 session |
| `/api/submissions` | 公开创建/查询；管理员分页列表；GitHub 辅助查询；OPTIONS |
| `/api/submissions/:id` | 管理员审核 PATCH、删除 DELETE |
| `/api/admin/settings` | 管理员读取/写入数据库配置 |

完整流程和访问边界见 [architecture.md](./architecture.md) 与 [data-and-flows.md](./data-and-flows.md)。

## 术语表

| 术语 | 含义 |
|---|---|
| `Submission` | MongoDB 中的一条友链申请或更新申请记录 |
| `apply` | 新增友链申请类型 |
| `update` | 以 `originalUrl` 定位已有 YAML 友链的更新申请 |
| `pending` / `approved` / `rejected` | 提交审核状态 |
| `class_name` | Butterfly YAML 中的友链分组名；后台可编辑，审核新增默认使用“网上邻居” |
| `siteshot` / `topimg` | 两种兼容的截图字段名；新增时由管理员/远程 YAML 约定决定 |
| `friendslink` | 申请者站点中展示友链的页面地址 |
| `tags` | 可选的 YAML 字符串数组；后台用逗号分隔编辑，空值时移除字段 |
| `Config` | MongoDB 键值配置文档，保存清理策略、邮件模板和 OwO 地址 |
| OwO | 后台拒绝原因输入使用的外部表情 JSON 数据源 |

## 规模与分析限制

截至提交 `83931d2`，Git 跟踪清单包含约 30 个业务源码/配置/文档文件和少量 PNG/ICO 资源；没有专门测试目录、CI 工作流或部署 manifest。准确文件计数与扫描忽略项以 [references.md](./references.md) 为准。

> “主要模块职责”已结合目录、导入关系、路由注册和配置交叉验证；仅凭目录名称无法确认的行为没有作为事实写入。
