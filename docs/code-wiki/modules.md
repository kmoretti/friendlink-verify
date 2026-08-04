# 模块说明

本页按业务边界组织模块，而不是按文件名机械罗列。每个模块至少以代表性文件和导入/调用关系交叉验证。

## 1. 访客提交与嵌入模块

### 职责

为第三方站点提供申请/更新入口，并将表单数据提交到公开 API。

### 入口与核心文件

| 文件 | 作用 |
|---|---|
| `app/page.tsx:6-293` | 面向部署者的首页、嵌入代码展示、申请/更新预览 |
| `app/embed/page.tsx:6-331` | 客户端表单，读取 `mode`/`dark` 查询参数并 POST |
| `app/embed-script/route.ts:3-38` | 动态返回创建 Iframe 的 JavaScript |
| `next.config.js:2-9` | `/embed.js` → `/embed-script` 重写 |

### 对外契约

- `GET /embed`：表单页面；`mode=update` 开启更新字段。
- `GET /embed.js`：外站 script 嵌入入口；`data-mode="update"` 开启更新模式。
- `POST /api/submissions`：要求 `name`、`url`、`avatar`、`friendslink`；更新类型还要求 `originalUrl`（`app/api/submissions/route.ts:115-145`）。

### 数据流

```text
外部页面 → Iframe/动态 Iframe → EmbedForm.handleSubmit
  → POST /api/submissions → Submission.create → pending
```

### 维护注意事项

- 首页的自包含 HTML 示例没有带 `friendslink`，按当前 API 契约直接复制会失败；见 `app/page.tsx:200-254` 与 `app/api/submissions/route.ts:122-136`。
- 首页读取了 `NEXT_PUBLIC_APP_URL` 到 `appUrl`，但嵌入代码仍使用硬编码占位主机 `https://你的域名.vercel.app`（`app/page.tsx:10-33`）。
- `/embed` 同时把 `siteshot` 复制到 `topimg`（`app/embed/page.tsx:37-46`），这是兼容字段策略，不是两个独立输入。
- 外部父页后续切换暗色不会实时同步已加载的 Iframe；Script 只在初始化时读取 `.dark`（`app/embed-script/route.ts:12-17`）。

## 2. 管理员认证模块

### 职责

使用环境变量中的单一管理员账号密码登录，签发 24 小时 JWT 会话 Cookie。

### 核心文件

- `app/admin/login/page.tsx:7-101`：登录 UI 和请求。
- `app/admin/page.tsx:5-8`：服务端路由守卫。
- `app/api/auth/login/route.ts:4-40`：校验并签发 Cookie。
- `app/api/auth/logout/route.ts:3-12`：清除 Cookie。
- `app/api/auth/me/route.ts:4-10`：返回认证状态。
- `lib/auth.ts:1-37`：JWT 创建、验证、session 读取和账号比较。

### 依赖与副作用

登录成功会设置 `session` HttpOnly Cookie；受保护 API 通过 `getSession()` 验证。JWT payload 包含 `username` 与 `role: 'admin'`，但当前接口只判断 session 是否存在，没有额外运行时 role 校验（`lib/auth.ts:16-30`、`app/api/submissions/[id]/route.ts:13-16`）。

### 维护风险

- 缺少 `JWT_SECRET` 时使用固定 fallback；生产应在配置缺失时拒绝启动/登录。
- 登录没有限流、失败锁定或验证码。
- 用户名/密码直接与环境变量比较，没有多用户或密码哈希模型；这是当前单管理员设计的边界。

## 3. 管理后台模块

### 职责

加载提交列表，协调审核前置选择和后端操作，并展示统计、设置、主题和通知。

### 组件关系

```text
app/admin/page.tsx
  └─ AdminDashboard (app/admin/dashboard-client.tsx)
       ├─ SettingsPanel (components/admin/SettingsPanel.tsx)
       ├─ SubmissionTable (components/admin/SubmissionTable.tsx)
       └─ 内联 Modal：分组、截图字段、拒绝原因、删除确认
```

关系证据：`app/admin/dashboard-client.tsx:394-411`、`components/admin/SubmissionTable.tsx:21-36`。

### 关键流程

- 初始加载：`GET /api/submissions?page=...&limit=...` 和 `GET /api/submissions?github=1`（`app/admin/dashboard-client.tsx:95-139`）。
- 通过：先探测截图字段，再按新增/更新分别选择分组或直接审核，最终 PATCH（`app/admin/dashboard-client.tsx:187-270`）。
- 拒绝：输入 Markdown 原因，可从 OwO JSON 加图标，然后 PATCH（`app/admin/dashboard-client.tsx:174-185,464-514`）。
- 删除：确认 Modal 后 DELETE（`app/admin/dashboard-client.tsx:272-300`）。
- 注销：POST `/api/auth/logout` 后跳转登录（`app/admin/dashboard-client.tsx:302-305`）。

### 维护注意事项

- `SubmissionTable` 的状态筛选仅针对当前已加载页（`components/admin/SubmissionTable.tsx:49-56`）。
- 仪表盘统计的状态数量也是当前页数量，而 `total` 是全库总数（`app/admin/dashboard-client.tsx:318-323`）。
- Dashboard 与 SettingsPanel 分别加载 `owoUrl`，保存后可能出现局部状态不一致（`app/admin/dashboard-client.tsx:156-165`；`components/admin/SettingsPanel.tsx:32-52`）。
- OwO 图标通过 `dangerouslySetInnerHTML` 渲染，数据源是管理员配置的 URL（`app/admin/dashboard-client.tsx:141-154,495-498`），应只使用可信源或加清洗。

## 4. 提交 API 与生命周期模块

### 职责

处理公开创建、公开查询、管理员分页查询、自动清理、辅助查询、审核和删除。

### 核心文件

- `app/api/submissions/route.ts:26-172`：GET/OPTIONS/POST。
- `app/api/submissions/[id]/route.ts:8-135`：PATCH/DELETE。
- `lib/models/submission.ts:3-44`：提交 schema。

### 依赖

`submissions` 路由导入 `dbConnect`、`Submission`、`Config`、`getSession`、GitHub 读查询函数和管理员邮件函数（`app/api/submissions/route.ts:1-7`）；单条路由导入数据库、认证、GitHub 写函数和结果邮件（`app/api/submissions/[id]/route.ts:1-6`）。

### 维护注意事项

- POST 对主 `url` 只做简单协议正则，其他 URL、邮箱、字段长度没有统一 schema 验证（`app/api/submissions/route.ts:118-145`）。
- 公开查询无需登录、无分页，搜索直接进入 MongoDB `$regex`（`app/api/submissions/route.ts:43-61`）。
- `github=1`、`classNames=1`、`screenshotField=1` 位于管理员 session 检查之前（`app/api/submissions/route.ts:29-41,64-67`）。
- 清理发生在管理员列表请求内，按 `createdAt` 和状态专属保留天数执行（`app/api/submissions/route.ts:70-84`）。

## 5. MongoDB 持久化模块

### 职责

缓存 Mongoose 连接并定义 `Submission`/`Config` 两种文档模型。

### 核心文件

- `lib/db.ts:1-35`：`globalThis._mongooseCache` 单例连接/Promise 缓存。
- `lib/models/submission.ts:3-44`：站点字段、申请类型、审核状态、timestamps。
- `lib/models/config.ts:3-14`：唯一 key + 字符串 value。

### 维护注意事项

- `MONGODB_URI` 缺失时 `dbConnect` 抛错。
- `Submission` 没有拒绝原因字段；结果邮件中的 reason 不会持久化。
- 没有从模型层看到 URL 唯一索引、状态变更审计或通知投递状态字段。

## 6. GitHub YAML 适配器

### 职责

读取 GitHub 仓库中的 Butterfly 风格 YAML，追加新友链或按原链接更新已有友链，再整体写回文件。

### 核心文件与符号

- `lib/github.ts:4-54`：`LinkEntry`、`YmlLink`、`YmlGroup` 和管理更新类型。
- `lib/github.ts:101-241`：URL/Tags 规范化、YAML 读写和运行时结构校验。
- `lib/github.ts:300-323`：`addLink` 和默认“网上邻居”分组。
- `lib/github.ts:348-404`：`updateLink`、截图字段兼容和配置状态。
- `lib/github.ts:408-535`：分组和已通过友链管理操作。

### 数据映射

`Submission` 字段 → YAML：

- `name` → `name`
- `url` → `link`，去掉末尾 `/`，缺协议时补 `https://`
- `description` → `descr`
- `avatar` → `avatar`
- `friendslink` → `friendslink`
- `feeds` → `feeds`
- `siteshot/topimg` → 由 `siteshot` 或 `topimg` 选择的字段

### 维护注意事项

- 新增审核未指定分组时使用“网上邻居”；指定的不存在分组会返回错误，不再静默追加到最后一组（`lib/github.ts:300-323`）。
- 管理后台编辑友链时保留原有未建模字段；可选字段可清空，tags 会 trim/去重，空 tags 会删除 YAML 字段（`lib/github.ts:473-535`）。
- YAML 会做顶层、分组和友链对象的运行时基本校验；全量 `yaml.dump` 仍可能改变注释/格式信息（`lib/github.ts:167-210,228-241`）。
- 管理 API 使用 GitHub YAML 作为唯一数据源，每次保存基于最新 SHA；不支持删除单条友链，只有空分组可删除。

## 7. 已通过友链分组管理模块

### 职责

直接管理 GitHub YAML 中的分组和已通过友链，不依赖会自动清理的 MongoDB `Submission` 记录。

### 核心文件

- `components/admin/LinkGroupManager.tsx:1-430`：分组列表、分组编辑/新建/删除、友链编辑/移动和 tags 输入。
- `app/api/links/route.ts:1-21`：读取全部分组。
- `app/api/links/groups/route.ts:1-31`：新建分组。
- `app/api/links/groups/[groupName]/route.ts:1-58`：编辑/删除分组。
- `app/api/links/entries/route.ts:1-64`：编辑/移动友链。
- `lib/github.ts:408-535`：YAML 分组和友链管理操作。

### 数据边界

- 分组删除只允许 `link_list` 为空。
- 友链编辑保留原字段结构，仅增加可选 `tags: string[]`；不写入 `blog` 或 `color`。
- `siteshot`/`topimg` 会沿用原记录字段名。
- 所有管理 API 需要管理员 session；GitHub 失败返回 502，不伪造保存成功。

## 8. 邮件通知模块

### 职责

使用 SMTP 发送管理员新提交通知和申请者审核结果通知；模板可从 MongoDB `Config` 覆盖。

### 核心文件与符号

- `lib/email.ts:28-73`：SMTP 配置和传输器。
- `lib/email.ts:75-150`：默认主题和 HTML。
- `lib/email.ts:152-239`：有限 Markdown 转换和模板占位符合并。
- `lib/email.ts:256-295`：发送通知和配置判断。

### 行为边界

- 管理员通知需要 SMTP 基础变量和 `EMAIL_RECIPIENT`。
- 结果通知需要 SMTP 基础变量、提交记录邮箱；收件人是提交者邮箱。
- 发送失败只记录日志，不阻断创建/审核主结果（`lib/email.ts:266-291`）。

### 维护风险

模板和用户字段直接插入 HTML，没有统一 HTML escape；拒绝原因的有限 Markdown 转换也未先转义（`lib/email.ts:152-239`）。SMTP transport 设置 `tls.rejectUnauthorized: false`（`lib/email.ts:62-72`），需要确认是否是有意的兼容策略。

## 9. 管理设置模块

### 职责

读取和更新清理天数、邮件模板以及 OwO JSON 地址。

### 核心文件

- `app/api/admin/settings/route.ts:27-103`：鉴权、读取默认值、逐项 upsert。
- `components/admin/SettingsPanel.tsx:8-316`：三个 Tab 的 UI、校验、保存和 Toast。
- `lib/models/config.ts:3-14`：键值文档。

### 维护注意事项

- 数字设置要求正整数；字符串设置可写入任意内容。
- PUT 逐项写入，不是事务；中途失败可能部分成功。
- 后台显示的 `emailConfigured` 不要求 `EMAIL_RECIPIENT`，但管理员通知实际要求它，存在状态语义不一致风险。
