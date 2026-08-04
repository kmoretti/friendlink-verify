# 已通过友链分组管理 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在管理员后台管理 GitHub `links.yml` 中的已通过友链分组和友链字段，新增 `tags` 支持，并让新增审核默认使用“网上邻居 / 我的网络朋友们~”。

**Architecture:** 继续使用当前 GitHub YAML 作为唯一事实来源，不把已通过友链复制到 MongoDB。新增一组受管理员 JWT Cookie 保护的 `/api/links` Route Handlers，由 `lib/github.ts` 负责读取最新文件、基于最新 SHA 修改并立即写回。后台新增独立的 `LinkGroupManager` 客户端组件，分组编辑和友链编辑/移动均以一次保存对应一次 GitHub 文件提交；失败时保留编辑状态并显示错误。

**Tech Stack:** Next.js 15 App Router Route Handlers、TypeScript、React、Mongoose 现有认证、Octokit GitHub Contents API、js-yaml、Tailwind/CSS 变量。

---

## 已确认的产品规则

- 继续使用原始 YAML 字段和结构：`class_name`、`class_desc`、`link_list`、`name`、`link`、`avatar`、`descr`、`feeds`、`friendslink`、`siteshot`/`topimg`。
- 不增加 `blog` 和 `color`。
- 只新增可选 `tags` 字段；非空保存为 YAML 字符串数组，空输入删除字段。
- 后台数据源是 GitHub YAML，不使用会自动清理的 MongoDB `Submission` 作为已通过友链列表。
- 默认分组名：`网上邻居`；默认描述：`我的网络朋友们~`。
- 默认分组不存在时创建，存在时复用；不强制重命名已有分组。
- 新增审核流程默认选中“网上邻居”，管理员仍可切换；若该分组不存在，审核写入时创建它。
- 分组可以新建、重命名、修改描述；只有空分组可以删除。
- 友链可以编辑全部既有业务字段并移动分组；本次不提供删除单条友链。
- `tags` 后台使用逗号分隔输入，保存时 trim 和去重。
- 每次点击保存立即读取最新 YAML 并写回 GitHub；不修改本地/远端既有 YAML，直到管理员明确保存。

## Task 1: 扩展 GitHub YAML 领域适配器

**Files:**
- Modify: `lib/github.ts`

**Steps:**

1. 为 YAML link 类型增加可选 `tags?: string[]`，并导出可供 API/UI 使用的分组/友链类型（或保持内部类型后导出序列化类型）。
2. 增加常量 `DEFAULT_GROUP_NAME = '网上邻居'` 和 `DEFAULT_GROUP_DESC = '我的网络朋友们~'`。
3. 增加安全的标签归一化函数：只接受字符串数组/逗号字符串的内部输入，trim、去空、去重；不要把 `color`、`blog` 写入 YAML。
4. 修改 `addLink`：
   - 未传分组时使用默认分组，而不是现有实现的最后一个分组。
   - 默认分组不存在时创建默认分组。
   - 已有 YAML 且显式指定的非默认分组不存在时返回明确错误，不再静默写入最后分组。
   - 新链接按现有字段映射写入；有标签时写入 `tags`。
   - 文件不存在时创建包含默认/指定分组的 YAML。
5. 修改 `updateLink` 保留现有未建模字段和已有 tags；审核更新不传 tags 时不要清除已存在的 tags。
6. 增加读取管理数据的函数 `getLinkGroups()`，GitHub 文件不存在时返回空数组，其他 GitHub/YAML 错误继续抛出。
7. 增加分组操作函数：
   - `createLinkGroup(name, desc?)`：名称 trim 后必须非空且不重复；描述缺省使用 `DEFAULT_GROUP_DESC`。
   - `updateLinkGroup(originalName, name, desc)`：名称非空且不能与其他组重复；允许描述为空。
   - `deleteLinkGroup(name)`：只有 `link_list` 为空时允许删除，否则返回可识别的业务错误。
8. 增加友链操作函数 `updateManagedLink(input)`：
   - 通过原分组名 + 原 `link`（规范化 URL）定位记录。
   - 校验 `name`、`link`、`avatar` 非空；`descr`、`feeds`、`friendslink`、截图、tags 可清空。
   - 修改 `name/link/avatar/descr`；可选字段为空时删除对应 YAML key。
   - 站点截图保持已有 key：已有 `topimg` 就更新 `topimg`，已有 `siteshot` 就更新 `siteshot`；没有时使用全局检测结果或 `siteshot`。
   - 支持目标分组名变更；目标分组必须存在，移动后追加到目标组末尾。
   - 不删除单条友链。
9. 所有写操作都基于同一次读取返回的 SHA 调用现有 `writeYml`，确保 GitHub Contents API 的冲突保护仍然有效。

**Verification:**

- 静态检查 `lib/github.ts` 类型无错误。
- 手工审查：默认组不再回退到最后一组；空 tags 不会输出 `tags: []`；topimg/siteshot 不互相改名。

## Task 2: 新增管理员友链 API

**Files:**
- Create: `app/api/links/route.ts`
- Create: `app/api/links/groups/route.ts`
- Create: `app/api/links/groups/[groupName]/route.ts`
- Create: `app/api/links/entries/route.ts`

**Steps:**

1. 所有 handler 统一调用 `getSession()`；无 session 返回 401。GitHub 未配置或远程失败返回 502，不暴露 Token/连接串。
2. `GET /api/links` 调用 `getLinkGroups()`，返回 `{ groups }`。
3. `POST /api/links/groups` 接收 `{ name, desc? }`，创建分组，返回 201 和最新 `{ group }`/`groups`。
4. `PATCH /api/links/groups/:groupName` 接收 `{ name, desc }`，支持重命名和描述编辑，返回最新分组。
5. `DELETE /api/links/groups/:groupName` 只允许空分组删除；非空时返回 409，找不到返回 404。
6. `PATCH /api/links/entries` 接收：
   - `originalGroupName`
   - `originalLink`
   - `targetGroupName`
   - `name`
   - `link`
   - `avatar`
   - `descr`
   - `feeds`
   - `friendslink`
   - `screenshot`
   - `tags`（字符串数组）
7. 对请求体做运行时基本校验和长度限制，拒绝未知截图字段、空必填值和无效目标分组；返回 400/404/409，不使用无差别 500 掩盖业务错误。
8. 不新增删除单条友链 API。

**Verification:**

- `npm run lint`。
- `npx tsc --noEmit`。
- 未配置 GitHub 时确认管理 API 只返回可理解错误，不执行外部写入。

## Task 3: 接入审核默认分组

**Files:**
- Modify: `app/admin/dashboard-client.tsx`

**Steps:**

1. 在分组选择流程中定义/使用默认组名 `网上邻居`。
2. 获取已有分组后，将默认组放在选项首位；若远端尚不存在，仍作为可选的虚拟分组显示。
3. 默认选中 `网上邻居`，管理员可以切换已有分组。
4. 没有任何分组或辅助接口失败时，保留直接 PATCH 路径；后端 `addLink` 负责创建默认组。
5. 不改变更新友链跳过分组选择的现有行为。

**Verification:**

- 代码路径覆盖：已有默认组、没有默认组、没有任何组、GitHub 辅助请求失败四种情况。
- 确认“通过”请求仍携带 `className` 和截图字段。

## Task 4: 实现后台友链分组管理 UI

**Files:**
- Create: `components/admin/LinkGroupManager.tsx`
- Modify: `app/admin/dashboard-client.tsx`

**Steps:**

1. 新建 `LinkGroupManager` 客户端组件，挂载到设置面板和提交列表之间。
2. 初次加载 `GET /api/links`；401 跳转登录；502 显示 GitHub 未配置/不可用的说明；不影响现有提交审核面板。
3. 分组列表显示：名称、描述、友链数量；提供新建、编辑、删除按钮。
4. 分组表单：名称必填、描述可编辑；新建默认填入 `我的网络朋友们~`。
5. 删除使用确认；空分组删除成功后刷新，非空分组显示“请先移动友链”的错误。
6. 友链列表显示：名称、链接、头像、描述摘要、RSS/友链页入口、tags；截图可预览但不改变 `siteshot/topimg` 原字段。
7. 友链编辑表单提供：
   - 名称、链接、头像、描述
   - RSS、友链页面、站点截图 URL
   - tags 逗号输入
   - 目标分组选择
8. 保存后立即 PATCH `/api/links/entries`，成功重新加载 GitHub 数据并显示成功 Toast；失败保留编辑内容并显示错误。
9. 只提供编辑/移动，不提供删除单条友链。
10. 遵循现有 CSS 变量和暗色模式；所有按钮有可见 focus 状态；移动端使用可横向滚动/堆叠布局；不引入新依赖。

**Verification:**

- 逻辑审查新增、编辑、移动、重命名、空组删除和非空组阻止删除。
- 浏览器手工验证需要真实 GitHub 配置；本次不直接对生产 YAML 操作。

## Task 5: 文档、质量验证与回归

**Files:**
- Modify: `README.md`
- Modify: `docs/code-wiki/*`（只同步受影响章节）

**Steps:**

1. 更新 README 的后台功能、YAML `tags` 字段、分组管理和默认分组说明；不把 `friend.json` 当最终格式。
2. 更新 Code Wiki 的模块、API、配置、数据流和引用章节，反映新接口和 tags。
3. 运行 `npm run lint`。
4. 运行 `npx tsc --noEmit`。
5. 如环境允许运行 `npm run build`；不连接 MongoDB、GitHub 或 SMTP，不执行真实 GitHub 写入。
6. 使用 `git diff --check` 检查空白问题，审查 `git diff --stat`，确认只有功能源码和文档变更。
7. 记录未能运行的检查及人工验收步骤，不创建 Git commit 或推送远程。

## 验收标准

- 后台能从 GitHub YAML 读取分组和已通过友链。
- 可以新建分组，默认描述为“我的网络朋友们~”。
- 可以编辑分组名和描述；非空分组无法删除。
- 可以编辑既有 YAML 字段并移动友链；不支持 blog/color，不破坏原有字段。
- tags 通过逗号输入，保存为去重后的 YAML 数组；清空后删除 tags 字段。
- 新增审核默认选中“网上邻居”；不存在时自动创建，描述为“我的网络朋友们~”。
- 每次保存基于最新 SHA 写回 GitHub；失败不伪造成功状态。
- 现有申请、审核、邮件、截图字段兼容行为不回归。
