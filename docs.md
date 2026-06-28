# 项目架构总结文档

> 本文档由 Trae AI 自动生成，用于快速了解项目全貌。

## 1. 项目简述

- **项目名称**: friendlink-verify (友链审核系统)
- **项目类型**: Web 全栈应用 (Next.js)
- **简述**: 一个友链申请提交与审核管理系统。网站管理员可在任意网站嵌入提交表单，接收友链申请；在后台审批通过后可自动推送到 GitHub 仓库的 YAML 文件中，并支持邮件通知申请者。

## 2. 技术栈

- **核心语言**: TypeScript
- **主要框架**: Next.js 15 (App Router)
- **关键依赖**:
  - `mongoose` — MongoDB ODM，用于数据持久化
  - `jose` — JWT 生成与验证，用于管理员登录会话
  - `octokit` — GitHub API 客户端，用于审核通过后自动推送 YAML 文件
  - `nodemailer` — SMTP 邮件发送，用于通知管理员和申请者
  - `js-yaml` — YAML 解析与序列化，用于操作 GitHub 仓库中的友链文件
  - `react-hot-toast` — 前端轻量级通知组件
- **样式方案**: Tailwind CSS v3 + CSS 变量
- **包管理工具**: npm

## 3. 目录结构说明

```text
friendlink-verify/
├── app/                          # Next.js App Router 页面与 API 路由
│   ├── layout.tsx                # 全局布局（暗黑模式初始化代码内联注入）
│   ├── page.tsx                  # 首页 — 展示嵌入代码示例（iframe / script / HTML）
│   ├── globals.css               # 全局样式（CSS 变量 + Tailwind）
│   ├── admin/                    # 管理后台
│   │   ├── layout.tsx            # 后台布局
│   │   ├── page.tsx              # 后台首页（权限校验 → 重定向或渲染仪表盘）
│   │   ├── dashboard-client.tsx  # 仪表盘客户端组件（提交列表、审核操作、设置面板）
│   │   └── login/
│   │       └── page.tsx          # 管理员登录页
│   ├── embed/
│   │   └── page.tsx              # 嵌入表单页面（供第三方网站 iframe 引用）
│   ├── embed-script/
│   │   └── route.ts              # 动态 JS 脚本路由 (embed.js)，支持 script 标签嵌入
│   └── api/                      # RESTful API 路由
│       ├── submissions/
│       │   ├── route.ts          # GET 查询提交 / POST 创建提交
│       │   └── [id]/
│       │       └── route.ts      # PATCH 审核（通过/拒绝）/ DELETE 删除
│       ├── admin/
│       │   └── settings/
│       │       └── route.ts      # 后台设置（邮件模板）的 GET/PUT
│       └── auth/
│           ├── login/
│           │   └── route.ts      # 管理员登录（JWT 签发）
│           ├── logout/
│           │   └── route.ts      # 注销
│           └── me/
│               └── route.ts      # 获取当前登录用户信息
├── components/
│   ├── toaster.tsx               # Toast 通知提供者封装
│   ├── admin/
│   │   ├── SubmissionTable.tsx   # 提交列表表格组件（筛选、分页、审核操作）
│   │   └── SettingsPanel.tsx     # 设置面板（邮件模板编辑、表情选择器配置）
├── lib/                          # 核心业务逻辑层
│   ├── db.ts                     # MongoDB 连接管理（单例缓存模式）
│   ├── auth.ts                   # JWT 令牌创建/验证/会话获取
│   ├── email.ts                  # SMTP 邮件发送（通知模板渲染）
│   ├── github.ts                 # GitHub YAML 文件读写（获取/追加/更新友链）
│   └── models/
│       ├── submission.ts         # 友链提交记录 Mongoose Schema
│       └── config.ts             # 系统配置键值对 Mongoose Schema
├── img/                          # 截图资源（README 用）
├── public/                       # 静态资源
├── env.example                   # 环境变量模板
├── next.config.js                # Next.js 配置（含 /embed.js 重写规则）
├── tailwind.config.ts            # Tailwind CSS 配置
├── postcss.config.mjs            # PostCSS 配置
├── tsconfig.json                 # TypeScript 配置
├── eslint.config.mjs             # ESLint 配置
├── package.json                  # 项目依赖与脚本
├── .gitignore                    # Git 忽略规则
├── LICENSE                       # MIT 许可证
└── README.md                     # 项目说明文档
```

## 4. 核心模块解析

- **入口文件**: `app/layout.tsx` — 全局根布局，负责 HTML 结构、暗黑模式初始化脚本内联注入、全局样式引入和 Toast 提供者挂载。
- **首页**: `app/page.tsx` — 嵌入指南页面，展示 iframe/script/HTML 三种嵌入方式的代码示例，供使用者复制。
- **嵌入表单**: `app/embed/page.tsx` — 嵌入到第三方网站的友链提交表单（支持 iframe 和 script 两种嵌入方式），支持 `apply`（申请）和 `update`（更新）两种模式。
- **管理后台**: `app/admin/dashboard-client.tsx` — 管理员的完整操作面板，包括提交列表查看/筛选、审核通过/拒绝（含拒绝原因）、分组选择、自动清理过期记录、暗黑模式切换、设置面板等。
- **GitHub 同步服务**: `lib/github.ts` — 核心业务逻辑，审核通过后从 GitHub 仓库获取 YAML 文件，根据分组（`class_name`）追加或更新友链条目，然后提交 PR 或直接推送。
- **邮件通知服务**: `lib/email.ts` — 通过 SMTP 发送两类邮件：新提交通知管理员、审核结果（通过/拒绝 + 原因）通知申请者，邮件模板支持从数据库动态加载和 Markdown 渲染。
- **认证模块**: `lib/auth.ts` — 基于 jose 库的 JWT 认证，管理员登录后签发 24h 有效 token，通过 cookie 管理会话。

## 5. 启动与构建

- **安装依赖**: `npm install`
- **配置环境**: 复制 `env.example` 为 `.env.local`，填写 `MONGODB_URI`、`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`JWT_SECRET` 等必填项
- **本地运行**: `npm run dev`
- **构建打包**: `npm run build`
- **生产启动**: `npm start`
- **代码检查**: `npm run lint`
