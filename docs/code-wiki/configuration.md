# 配置说明

## 配置层级

项目配置分为三层：

1. **环境变量**：部署密钥、数据库 provider、管理员账号、GitHub、SMTP、公开 URL 和暗色时间段。
2. **数据库 `Config` 存储**：MongoDB、SQLite 或 MySQL 中都保存后台可编辑的清理策略、邮件模板和 OwO URL。
3. **代码默认值**：环境变量缺失时的部分 fallback，以及数据库配置不存在时的默认清理天数/邮件模板。

证据：`env.example:1-41`、`lib/database/config.ts:1-40`、`lib/database/repositories.ts`、`app/api/admin/settings/route.ts:1-75`、`lib/email.ts:75-150`。

## 环境变量

### 核心运行与认证

| 变量 | 用途 | 是否实际硬依赖 | 来源/行为 |
|---|---|---|---|
| `DATABASE_PROVIDER` | `mongodb`、`sqlite` 或 `mysql` | 否，缺省 mongodb | `lib/database/config.ts:10-17` |
| `MONGODB_URI` | MongoDB 连接字符串 | provider=mongodb 时 | `lib/database/config.ts:20-24`；Mongo 兼容连接仍由 `lib/db.ts` 使用 |
| `SQLITE_PATH` | SQLite 文件路径 | provider=sqlite 时可选 | 默认 `/data/friendlink.db`，见 `lib/database/config.ts:26-28` |
| `MYSQL_URL` | MySQL 连接字符串 | provider=mysql 时 | `lib/database/config.ts:30-34` |
| `ADMIN_USERNAME` | 管理员用户名 | 登录功能是 | `lib/auth.ts:32-37` 直接比较 |
| `ADMIN_PASSWORD` | 管理员密码 | 登录功能是 | `lib/auth.ts:32-37` 直接比较 |
| `JWT_SECRET` | JWT 签名密钥 | 生产必须 | `lib/auth.ts:4-6` 缺失时存在固定 fallback，不应依赖 |
| `NODE_ENV` | 控制 session Cookie 的 `secure` | Next 运行环境 | `app/api/auth/login/route.ts:27-31`、logout |

> 不在 Wiki 中记录这些变量的实际值。生产环境的 `JWT_SECRET` 应为强随机密钥，并建议在配置缺失时显式拒绝启动或登录。

### 公开 URL 与主题

| 变量 | 用途 | 默认/缺失行为 |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Script 生成 iframe 地址、邮件后台链接 | Embed script 缺失时使用空字符串；邮件链接退化为 `/admin` |
| `NEXT_PUBLIC_DARK_MODE_START` | 自动进入暗色的时间，如 `18:00` | 与 END 同时存在时参与根布局初始化 |
| `NEXT_PUBLIC_DARK_MODE_END` | 自动退出暗色的时间，如 `06:00` | 与 START 同时存在时参与时间段判断 |

证据：`app/layout.tsx:18-20`、`app/embed-script/route.ts:3-17`、`lib/email.ts:165-199`。暗色模式还会读取浏览器 `localStorage.dark` 和系统偏好，见 `app/layout.tsx:18-20`。

### GitHub 自动同步

| 变量 | 格式/用途 | 缺失行为 |
|---|---|---|
| `GITHUB_TOKEN` | GitHub API Token | 与其他 GitHub 变量任一缺失即未配置 |
| `GITHUB_REPO` | `owner/repo` | 同上 |
| `GITHUB_FILE_PATH` | 目标 YAML 路径，如 `link.yml` | 同上 |

读取位置：`lib/github.ts:36-43`。GitHub 功能在配置上是可选的，但在当前审核通过实现中，如果未配置会返回 502 而不是仅跳过同步（`app/api/submissions/[id]/route.ts:25-61`）。

### SMTP 通知

| 变量 | 用途 | 必要性 |
|---|---|---|
| `EMAIL_USER` | SMTP 用户/发件地址 | SMTP 基础配置必需 |
| `EMAIL_PASS` | SMTP 密码/授权码 | SMTP 基础配置必需 |
| `EMAIL_NAME` | 发件人显示名 | 可选，默认使用 EMAIL_USER |
| `EMAIL_RECIPIENT` | 管理员通知收件人 | 管理员新提交通知必需；结果通知路径可不要求 |
| `SMTP_SERVER` | SMTP 主机 | SMTP 基础配置必需 |
| `SMTP_PORT` | SMTP 端口 | 可选，无法解析时默认 465 |

行为定义：`lib/email.ts:28-45,256-295`。后台 `emailConfigured` 使用 `isEmailConfigured()`，该判断不要求 `EMAIL_RECIPIENT`，但管理员通知的 `getSmtpConfig()` 要求它，存在显示状态与实际通知条件不完全一致的风险。

## Config 键（所有数据库）

这些键通过 `/api/admin/settings` 读写，值最终都是字符串；数字由 API 读取时转换。

| key | 类型/默认值 | 用途 |
|---|---|---|
| `autoDeleteDays` | 正整数，默认 7 | pending 记录保留天数 |
| `autoDeleteApprovedDays` | 正整数，默认 30 | approved 记录保留天数 |
| `autoDeleteRejectedDays` | 正整数，默认 30 | rejected 记录保留天数 |
| `emailSubjectApply` | 字符串，代码默认 | 新申请管理员通知主题 |
| `emailSubjectUpdate` | 字符串，代码默认 | 更新申请管理员通知主题 |
| `emailSubjectApproved` | 字符串，代码默认 | 通过结果主题 |
| `emailSubjectRejected` | 字符串，代码默认 | 拒绝结果主题 |
| `emailBodyHtml` | HTML 字符串，代码默认 | 管理员通知模板 |
| `emailBodyResult` | HTML 字符串，代码默认 | 申请者结果模板 |
| `owoUrl` | 字符串，默认空 | OwO 表情 JSON 地址 |

证据：`app/api/admin/settings/route.ts:27-103`、`components/admin/SettingsPanel.tsx:32-133`。

## 配置加载路径

```mermaid
flowchart TD
  Env[部署环境变量] --> Auth[lib/auth.ts]
  Env --> DB[Database Provider]
  Env --> GH[lib/github.ts]
  Env --> SMTP[lib/email.ts]
  Env --> Theme[app/layout.tsx]
  DB --> Config[(Submission/Config Repository)]
  Config --> SettingsAPI[/api/admin/settings]
  SettingsAPI --> SettingsUI[SettingsPanel]
  Config --> EmailTemplate[邮件模板读取]
```

## 默认值与安全注意事项

- `lib/auth.ts:4-6` 的 JWT fallback 是安全风险，不是可接受生产默认值。
- `lib/email.ts:62-72` 使用 `tls.rejectUnauthorized: false`，需要确认 SMTP 兼容性需求；安全部署应评估是否恢复证书校验。
- `env.example` 中邮箱示例变量是非空形式；如果直接复制而不替换，系统可能尝试 SMTP 连接并产生日志（`env.example:19-25`）。
- 邮件模板和提交字段会直接拼入 HTML（`lib/email.ts:165-239`）；后台编辑模板属于高信任操作，提交者输入不应默认视为安全 HTML。
- `owoUrl` 来源于管理员配置，但返回图标用 `dangerouslySetInnerHTML`；只使用可信静态 JSON 源或在客户端清洗。
- `NEXT_PUBLIC_*` 会进入客户端构建/页面上下文，不要放入任何秘密值。

## 配置变更流程

1. 登录 `/admin`。
2. `SettingsPanel` GET `/api/admin/settings` 初始化。
3. 修改某一 Tab：清理天数、OwO URL 或邮件模板。
4. PUT `/api/admin/settings`；数字字段必须是大于等于 1 的整数。
5. 服务端逐项通过 Config Repository upsert 写入当前 provider（`app/api/admin/settings/route.ts:12-75`）。

> PUT 没有事务；一次保存包含多个字段时，中途异常可能造成部分设置已经持久化。
