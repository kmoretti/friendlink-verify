# 友链审核系统 (FriendLink Verify)

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-ready-green?logo=mongodb)](https://www.mongodb.com)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![GitHub stars](https://img.shields.io/github/stars/shangskr/friendlink-verify?style=social)](https://github.com/shangskr/friendlink-verify)
[![GitHub forks](https://img.shields.io/github/forks/shangskr/friendlink-verify?style=social)](https://github.com/shangskr/friendlink-verify)
[![GitHub repo size](https://img.shields.io/github/repo-size/shangskr/friendlink-verify)](https://github.com/shangskr/friendlink-verify)

在任何网站嵌入友链提交表单，接收申请。管理员审核后自动推送到 GitHub 仓库，支持邮件通知。

## 预览

![首页嵌入展示](https://raw.githubusercontent.com/shangskr/friendlink-verify/main/img/1.png)
![管理后台](https://raw.githubusercontent.com/shangskr/friendlink-verify/main/img/2.png)
![嵌入表单](https://raw.githubusercontent.com/shangskr/friendlink-verify/main/img/3.png)

## 功能特性

- **表单嵌入** — Iframe、Script、自包含 HTML、Hexo/Butterfly 四种方式，支持新增和更新友链
- **审核管理** — 后台面板查看/筛选/审核待处理申请，支持通过/拒绝（可填写拒绝原因）
- **分组选择** — 通过时选择友链分组（对应 `class_name`），自动追加到 YAML 对应位置
- **GitHub 自动推送** — 审核通过后自动追加或更新 YAML 到仓库
- **邮件通知** — 新提交通知管理员 + 审核结果通知提交者（模板可后台编辑，支持 Markdown）
- **表情选择器** — 拒绝原因输入支持 OwO 表情（URL 可后台配置）
- **自动清理** — 按状态分别设置保留天数，打开后台时自动清理过期记录（非定时触发）
- **站点截图** — 提交时可上传站点截图，审核时方便预览；自动兼容 `siteshot` 和 `topimg` 两种字段名
- **暗黑模式** — 全站深色/浅色切换，支持定时自动切换

## 部署到 Vercel

### 前置条件

1. **MongoDB 数据库** — 推荐 [MongoDB Atlas](https://www.mongodb.com/atlas) 免费版
2. **GitHub Token** (可选) — 审核通过后自动推送到仓库
3. **SMTP 邮箱** (可选) — 发送邮件通知

### 步骤

1. Fork / Clone 本项目到你的 GitHub 仓库
2. 访问 [vercel.com](https://vercel.com) → Add New → Project
3. 选择本项目仓库，在 **Environment Variables** 中添加：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `MONGODB_URI` | 是 | MongoDB 连接字符串 |
| `ADMIN_USERNAME` | 是 | 管理员登录用户名 |
| `ADMIN_PASSWORD` | 是 | 管理员登录密码 |
| `JWT_SECRET` | 是 | JWT 加密密钥（随机字符串） |
| `NEXT_PUBLIC_APP_URL` | 推荐 | 部署后的域名，如 `https://your-app.vercel.app`（不设则邮件链接和嵌入脚本可能异常） |
| `GITHUB_TOKEN` | 否 | GitHub Personal Access Token |
| `GITHUB_REPO` | 否 | 仓库名 `owner/repo` |
| `GITHUB_FILE_PATH` | 否 | 友链文件路径，如 `link.yml` |
| `EMAIL_USER` | 否 | SMTP 发件邮箱 |
| `EMAIL_PASS` | 否 | SMTP 授权码 |
| `EMAIL_NAME` | 否 | 发件人显示名称（默认 `EMAIL_USER`） |
| `EMAIL_RECIPIENT` | 否 | 管理员接收通知的邮箱 |
| `SMTP_SERVER` | 否 | SMTP 服务器，如 `smtp.163.com` |
| `SMTP_PORT` | 否 | SMTP 端口，默认 `465` |
| `NEXT_PUBLIC_DARK_MODE_START` | 否 | 定时进入夜间，如 `18:00` |
| `NEXT_PUBLIC_DARK_MODE_END` | 否 | 定时退出夜间，如 `06:00` |

4. 点击 **Deploy**，部署完成后即可使用

### 获取 GitHub Token（可选）

用于审核通过后自动推送友链到仓库。只需勾选一个权限：

| Token 类型 | 勾选范围 |
|------------|----------|
| **Fine-grained** | Repository permissions → **Contents: Read and write** |
| **Classic** | 只勾选 **`public_repo`**（公开仓库）或 **`repo`**（私有仓库） |

步骤：
1. 访问 GitHub **Settings → Developer settings → Personal access tokens**
2. 点击 **Generate new token**，Note 填 `friendlink-verify`
3. Expiration 建议选 **No expiration**
4. 按上表勾选 → Generate → **复制 token**
5. 设置环境变量 `GITHUB_TOKEN`、`GITHUB_REPO`（`owner/repo`）、`GITHUB_FILE_PATH`（如 `link.yml`）

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制环境变量模板文件并重命名为 `.env.local`：

```bash
copy env.example .env.local
```

打开 `.env.local`，填写以下必填项：

| 变量 | 填写方法 |
|------|----------|
| `MONGODB_URI` | 注册 [MongoDB Atlas](https://www.mongodb.com/atlas) → 创建免费集群 → Connect → Drivers → 复制连接字符串，把 `<password>` 换成数据库用户密码 |
| `ADMIN_USERNAME` | 随便设，如 `admin` |
| `ADMIN_PASSWORD` | 随便设一个密码 |
| `JWT_SECRET` | 随便一个随机字符串，如 `abc123xyz` |
| `NEXT_PUBLIC_APP_URL` | 本地开发填 `http://localhost:3000` |

> `GITHUB_*`、`EMAIL_*`、`SMTP_*`、`NEXT_PUBLIC_DARK_MODE_*` 都是可选的，不填不影响本地运行。

### 3. 启动

```bash
npm run dev
```

浏览器打开 `http://localhost:3000` 即可。

> **注意:** Windows 上如果 `npm run dev` 报错，请用 `npm run build && npm run start`（生产模式）。

## API 接口

所有 API 前缀为你的部署域名，例如 `https://your-app.vercel.app/api/...`。

### 提交友链

```
POST /api/submissions
Content-Type: application/json

{
  "name": "站点名称",
  "url": "https://example.com",
  "description": "站点描述",
  "avatar": "https://example.com/avatar.png",
   "siteshot": "https://example.com/screenshot.png",
   "topimg": "https://example.com/screenshot.png",
   "email": "you@example.com",
   "type": "apply",
   "originalUrl": ""
 }
 ```

 | 参数 | 必填 | 说明 |
 |------|------|------|
 | `name` | 是 | 站点名称 |
 | `url` | 是 | 站点地址 |
 | `description` | 否 | 站点描述 |
 | `avatar` | 否 | 头像 URL |
 | `siteshot` | 否 | 站点截图 URL （Butterfly 主题兼容） |
 | `topimg` | 否 | 站点截图 URL |
 | `email` | 是 | 提交者邮箱（用于审核结果通知） |
 | `type` | 否 | `apply` 申请 / `update` 更新，默认 `apply` |
 | `originalUrl` | 否 | 原站点地址（type=update 时必填） |

成功返回 `201`，失败返回 `400` / `422`。

### 审核提交

```
PATCH /api/submissions/:id
Content-Type: application/json

{
  "status": "approved",
  "reason": "",
  "className": "友情链接",
  "screenshotField": "siteshot"
}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `status` | 是 | `approved` 通过 / `rejected` 拒绝 |
| `reason` | 否 | 拒绝原因（仅 rejected 时使用） |
| `className` | 否 | 友链分组 `class_name`（仅 apply 类型，仅 approved 时使用） |
| `screenshotField` | 否 | 截图字段名 `siteshot` / `topimg`（不传则自动检测 YAML 约定） |

通过后自动推送到 GitHub；拒绝时 `reason` 会出现在通知邮件中。

### 删除提交

```
DELETE /api/submissions/:id
```

需要管理员登录（Cookie 携带 JWT）。

### 获取提交列表

```
GET /api/submissions?page=1&limit=10
```

| 参数 | 说明 |
|------|------|
| `page` | 页码，默认 `1` |
| `limit` | 每页条数，默认 `10`，最大 `100` |

返回 `{ submissions, total, page, totalPages }`，需要管理员登录。

### 后台设置

```
GET  /api/admin/settings    # 获取设置
PUT  /api/admin/settings    # 更新设置（需要管理员登录）
```

## 嵌入方式

### 方式一：Iframe

```html
<!-- 申请友链 -->
<iframe src="https://你的域名.vercel.app/embed" width="100%" height="520" style="border:none;border-radius:8px;"></iframe>

<!-- 更新友链 -->
<iframe src="https://你的域名.vercel.app/embed?mode=update" width="100%" height="520" style="border:none;border-radius:8px;"></iframe>
```

### 方式二：Script

```html
<!-- 申请友链 -->
<script src="https://你的域名.vercel.app/embed.js"></script>

<!-- 更新友链 -->
<script src="https://你的域名.vercel.app/embed.js" data-mode="update"></script>
```

Script 方式会在 `<script>` 标签位置自动插入一个 `div` 并加载表单 iframe。

### 方式三：自包含 HTML（通用）

适合任何静态站点，直接 POST 到 API：

```html
<div id="fl-form">
  <form id="fl-f">
    <input id="fl-name" required placeholder="站点名称">
    <input id="fl-url" type="url" required placeholder="https://example.com">
    <input id="fl-desc" placeholder="站点描述">
    <input id="fl-avatar" type="url" placeholder="https://example.com/avatar.png">
    <input id="fl-siteshot" type="url" placeholder="https://example.com/screenshot.png (Butterfly)">
    <input id="fl-topimg" type="url" placeholder="https://example.com/screenshot.png">
    <input id="fl-email" type="email" required placeholder="you@example.com">
    <button type="submit">提交</button>
  </form>
</div>
<script>
document.getElementById('fl-f').addEventListener('submit', function(e) {
  e.preventDefault();
  fetch('https://你的域名.vercel.app/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('fl-name').value,
      url: document.getElementById('fl-url').value,
      description: document.getElementById('fl-desc').value,
      avatar: document.getElementById('fl-avatar').value,
      siteshot: document.getElementById('fl-siteshot').value,
      topimg: document.getElementById('fl-topimg').value,
      email: document.getElementById('fl-email').value,
      type: 'apply',
    })
  });
});
</script>
```

### 方式四：Hexo + Butterfly 主题


#### 步骤 1：创建 CSS 文件

在 `themes/butterfly/source/css/link.css` 中写入全部样式：

```css
#fl-wrap {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 20px 0;
    --fl-text: #363636;
    --fl-text-secondary: #666;
    --fl-text-muted: #999;
    --fl-bg: rgba(255, 255, 255, 0.88);
    --fl-border: 1px solid rgb(169, 169, 169);
    --fl-input-bg: #fff;
    --fl-input-border: #d1d5db;
    --fl-input-text: #363636;
    --fl-err-bg: #fef2f2;
    --fl-err-border: #fecaca;
    --fl-err-text: #dc2626;
    --fl-btn-bg: #363636;
    --fl-btn-hover: #555;
    --fl-btn-disabled: #bbb;
    --fl-success-h3: #363636;
    backdrop-filter: blur(5px) saturate(150%);
}

[data-theme='dark'] #fl-wrap {
    --fl-text: #c0c0c0;
    --fl-text-secondary: #aaa;
    --fl-text-muted: #999;
    --fl-bg: rgba(25, 25, 25, 0.88);
    --fl-border: 1px solid rgb(80, 80, 80);
    --fl-input-bg: rgb(42, 42, 42);
    --fl-input-border: rgb(80, 80, 80);
    --fl-input-text: #eee;
    --fl-err-bg: rgba(100, 30, 30, 0.3);
    --fl-err-border: rgb(120, 30, 30);
    --fl-err-text: #ffa0a0;
    --fl-btn-bg: #65b0ff;
    --fl-btn-hover: #4a9fe8;
    --fl-btn-disabled: #555;
    --fl-success-h3: #eee;
}

#fl-wrap label {
    display: flex; align-items: center; gap: 8px;
    cursor: pointer; font-size: 14px; padding: 4px 0;
    color: var(--fl-text);
}

#fl-wrap input[type="checkbox"] {
    width: 16px; height: 16px;
    accent-color: #65b0ff; cursor: pointer;
}

#fl-wrap .fl-hint { font-size: 13px; color: var(--fl-text-muted); }
#fl-wrap .fl-hint.fl-sm { margin: -10px 0 14px; font-size: 11px; }

#fl-wrap .fl-form {
    display: none; margin-top: 12px; padding: 20px;
    background: var(--fl-bg);
    backdrop-filter: blur(5px) saturate(150%);
    border: var(--fl-border); border-radius: 12px;
}

#fl-wrap .fl-field { margin-bottom: 14px; }

#fl-wrap .fl-label {
    display: block; font-size: 13px; font-weight: 500;
    color: var(--fl-text); margin-bottom: 4px;
}

#fl-wrap .fl-star { color: #ef4444; }

#fl-wrap .fl-input {
    width: 100%; padding: 8px 10px; font-size: 14px;
    border: 1px solid var(--fl-input-border); border-radius: 6px;
    outline: none; box-sizing: border-box;
    color: var(--fl-input-text); background: var(--fl-input-bg);
}

#fl-wrap .fl-input:focus {
    border-color: #65b0ff;
    box-shadow: 0 0 0 2px rgba(101, 176, 255, .2);
}

#fl-wrap .fl-err {
    display: none; padding: 8px 12px;
    background: var(--fl-err-bg); border: 1px solid var(--fl-err-border);
    border-radius: 6px; color: var(--fl-err-text);
    font-size: 13px; margin-bottom: 14px;
}

#fl-wrap .fl-btn {
    width: 100%; padding: 9px 16px; font-size: 14px;
    font-weight: 500; color: #fff; background: var(--fl-btn-bg);
    border: none; border-radius: 6px; cursor: pointer;
}

#fl-wrap .fl-btn:hover { background: var(--fl-btn-hover); }
#fl-wrap .fl-btn:disabled { background: var(--fl-btn-disabled); cursor: not-allowed; }

#fl-wrap .fl-success { text-align: center; padding: 48px 24px; }

#fl-wrap .fl-success h3 {
    margin: 0 0 4px; font-size: 16px;
    font-weight: 600; color: var(--fl-success-h3);
}

#fl-wrap .fl-success p {
    margin: 0; font-size: 14px;
    color: var(--fl-text-secondary); line-height: 1.5;
}

#fl-wrap>h3 {
    margin: 0 0 4px; font-size: 15px;
    font-weight: 600; color: var(--fl-text);
}

#fl-wrap>p {
    margin: 0 0 8px; font-size: 13px;
    color: var(--fl-text-secondary);
}

#fl-wrap .fl-form h3 {
    margin: 0 0 12px; font-size: 15px;
    font-weight: 600; color: var(--fl-text);
}

#fl-wrap .fl-update-divider {
    border-top: 1px solid var(--fl-border);
    margin: 16px 0; padding-top: 16px;
}

#fl-wrap .fl-update-divider p {
    margin: 0 0 12px; font-size: 13px;
    color: var(--fl-text-secondary); font-weight: 500;
}
```

#### 步骤 2：创建页面文件

在 `source/link/index.md` 的 `---` 下方添加：

```html
{% raw %}
<link rel="stylesheet" href="/css/link.css">

<div id="fl-wrap">
  <h3>申请条件</h3>
  <p>请先确认满足以下条件：</p>
  <label><input type="checkbox" id="fl-cb1"> 我已添加安小歪博客的友情链接</label>
  <label><input type="checkbox" id="fl-cb2"> 我的网站现在可以在中国大陆区域正常访问</label>
  <label><input type="checkbox" id="fl-cb3"> 网站内容符合中国大陆法律法规</label>

  <div id="fl-options" style="display:none">
    <div class="fl-hint">请选择操作</div>
    <label><input type="checkbox" id="fl-cb-apply"> 申请友链</label>
    <label><input type="checkbox" id="fl-cb-update"> 更新友链</label>

    <div class="fl-form" id="fl-form-apply">
      <h3>申请友链</h3>
      <form id="fl-f-apply">
        <div class="fl-field">
          <label class="fl-label">站点名称 <span class="fl-star">*</span></label>
          <input class="fl-input" id="fl-an" required placeholder="我的博客">
        </div>
        <div class="fl-field">
          <label class="fl-label">站点地址 <span class="fl-star">*</span></label>
          <input class="fl-input" id="fl-au" type="url" required placeholder="https://example.com">
        </div>
        <div class="fl-field">
          <label class="fl-label">站点描述</label>
          <input class="fl-input" id="fl-ad" placeholder="一个关于技术和设计的博客">
        </div>
        <div class="fl-field">
          <label class="fl-label">头像地址</label>
          <input class="fl-input" id="fl-aa" type="url" placeholder="https://example.com/avatar.png">
        </div>
        <div class="fl-field">
          <label class="fl-label">站点截图</label>
          <input class="fl-input" id="fl-as" type="url" placeholder="https://example.com/screenshot.png">
        </div>
        <div class="fl-field">
          <label class="fl-label">邮箱 <span class="fl-star">*</span></label>
          <input class="fl-input" id="fl-ae" type="email" required placeholder="you@example.com">
        </div>
        <div class="fl-hint fl-sm">用于接收审核结果通知</div>
        <div class="fl-err" id="fl-err-apply"></div>
        <button type="submit" class="fl-btn" id="fl-sb-apply">提交</button>
      </form>
    </div>

    <div class="fl-form" id="fl-form-update">
      <h3>更新友链</h3>
      <form id="fl-f-update">
        <div class="fl-field">
          <label class="fl-label">原站点地址 <span class="fl-star">*</span></label>
          <input class="fl-input" id="fl-uorig" type="url" required placeholder="https://原来的地址.com">
        </div>
        <div class="fl-update-divider">
          <p>新的信息（只填需要修改的字段）</p>
        </div>
        <div class="fl-field">
          <label class="fl-label">新站点名称 <span class="fl-star">*</span></label>
          <input class="fl-input" id="fl-un" required placeholder="我的博客">
        </div>
        <div class="fl-field">
          <label class="fl-label">新站点地址 <span class="fl-star">*</span></label>
          <input class="fl-input" id="fl-uu" type="url" required placeholder="https://example.com">
        </div>
        <div class="fl-field">
          <label class="fl-label">新站点描述</label>
          <input class="fl-input" id="fl-ud" placeholder="一个关于技术和设计的博客">
        </div>
        <div class="fl-field">
          <label class="fl-label">新头像地址</label>
          <input class="fl-input" id="fl-ua" type="url" placeholder="https://example.com/avatar.png">
        </div>
        <div class="fl-field">
          <label class="fl-label">新站点截图</label>
          <input class="fl-input" id="fl-us" type="url" placeholder="https://example.com/screenshot.png">
        </div>
        <div class="fl-field">
          <label class="fl-label">邮箱 <span class="fl-star">*</span></label>
          <input class="fl-input" id="fl-ue" type="email" required placeholder="you@example.com">
        </div>
        <div class="fl-hint fl-sm">用于接收审核结果通知</div>
        <div class="fl-err" id="fl-err-update"></div>
        <button type="submit" class="fl-btn" id="fl-sb-update">提交</button>
      </form>
    </div>
  </div>
</div>

<script>
var API = 'https://你的域名.vercel.app/api/submissions';
var cb1=document.getElementById('fl-cb1'),cb2=document.getElementById('fl-cb2'),cb3=document.getElementById('fl-cb3'),opts=document.getElementById('fl-options');

function updateOpts(){opts.style.display=(cb1.checked&&cb2.checked&&cb3.checked)?'block':'none';opts.querySelectorAll('#fl-options input[type="checkbox"]').forEach(function(c){c.checked=false});document.querySelectorAll('#fl-options .fl-form').forEach(function(f){f.style.display='none'})}
cb1.addEventListener('change',updateOpts);cb2.addEventListener('change',updateOpts);cb3.addEventListener('change',updateOpts);

document.getElementById('fl-cb-apply').addEventListener('change',function(){document.getElementById('fl-form-apply').style.display=this.checked?'block':'none';if(this.checked)document.getElementById('fl-cb-update').checked=false,document.getElementById('fl-form-update').style.display='none'});
document.getElementById('fl-cb-update').addEventListener('change',function(){document.getElementById('fl-form-update').style.display=this.checked?'block':'none';if(this.checked)document.getElementById('fl-cb-apply').checked=false,document.getElementById('fl-form-apply').style.display='none'});

function submitForm(cbId,formId,getData){
  document.getElementById(formId).querySelector('form').addEventListener('submit',function(e){
    e.preventDefault();var btn=this.querySelector('.fl-btn'),err=this.querySelector('.fl-err');btn.disabled=true;btn.textContent='提交中...';err.style.display='none';
    fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(getData(this))}).then(function(r){
      if(!r.ok)return r.json().then(function(d){throw new Error(d.error||'提交失败')});
      document.getElementById(formId).innerHTML='<div class="fl-success"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 16px"><polyline points="20 6 9 17 4 12"/></svg><h3>提交成功</h3><p>感谢您！友链申请已提交，等待管理员审核。<br>审核结果将通过邮件通知您。</p></div>';
    }).catch(function(e){err.textContent=e.message;err.style.display='block';btn.disabled=false;btn.textContent='提交'});
  });
}

submitForm('fl-cb-apply','fl-form-apply',function(f){return{type:'apply',name:f.querySelector('#fl-an').value,url:f.querySelector('#fl-au').value,description:f.querySelector('#fl-ad').value,avatar:f.querySelector('#fl-aa').value,siteshot:f.querySelector('#fl-as').value,email:f.querySelector('#fl-ae').value}});
submitForm('fl-cb-update','fl-form-update',function(f){return{type:'update',originalUrl:f.querySelector('#fl-uorig').value,name:f.querySelector('#fl-un').value,url:f.querySelector('#fl-uu').value,description:f.querySelector('#fl-ud').value,avatar:f.querySelector('#fl-ua').value,siteshot:f.querySelector('#fl-us').value,email:f.querySelector('#fl-ue').value}});
</script>
{% endraw %}
```

效果：三个复选框全部勾选后，选择"申请友链"或"更新友链"，填写表单提交，等待管理员审核。

## 管理后台

访问 `https://你的域名.vercel.app/admin` 登录（账号和密码在环境变量 `ADMIN_USERNAME`/`ADMIN_PASSWORD` 中配置）。

### 功能一览

- **提交列表** — 分页展示，支持按状态筛选（全部/待审核/已通过/已拒绝），可切换每页条数
- **审核操作**：
  - **通过（申请）** — 检测 YAML 截图字段约定，若无法自动检测则弹窗选择 `siteshot` / `topimg`，之后选择友链分组后确认，自动推送至 GitHub
  - **通过（更新）** — 检测 YAML 截图字段约定（同申请），跳过分组选择，直接确认
  - **拒绝** — 弹出 Markdown 编辑框，支持输入拒绝原因，可选 OwO 表情，原因随邮件发送
  - **删除** — 自定义确认弹窗，删除数据库记录
- **设置面板** — 标签页切换（自动清理 / 表情包 / 邮件通知）：
  - **自动清理** — 按状态分别设置保留天数，打开后台时自动清理（非定时触发）
  - **表情包设置** — 配置 OwO JSON 链接，拒绝弹窗中显示表情选择器
  - **邮件模板** — 在线编辑通知标题和 HTML 模板，支持占位符
- **暗黑模式** — 手动切换深色/浅色

## 邮件通知模板

后台面板 > 邮件通知 > 编辑模板。

**管理员通知模板：**
- `emailSubjectApply` / `emailSubjectUpdate` — 通知主题
- `emailBodyHtml` — 邮件 HTML

**审核结果通知模板：**
- `emailSubjectApproved` / `emailSubjectRejected` — 通知主题
- `emailBodyResult` — 邮件 HTML

通用占位符：

| 占位符 | 说明 |
|--------|------|
| `{name}` | 站点名称 |
| `{url}` | 站点地址 |
| `{description}` | 站点描述 |
| `{email}` | 提交者邮箱 |
| `{type}` | 类型（申请友链 / 更新友链） |
| `{originalUrl}` | 原站点地址（仅更新类型） |
| `{time}` | 提交时间 |
| `{adminUrl}` | 后台审核链接 |

审核结果模板额外支持：

| 占位符 | 说明 |
|--------|------|
| `{resultTitle}` | 结果标题，如"申请已通过" |
| `{resultAction}` | 操作文本，如"通过"/"拒绝" |
| `{descriptionRow}` | 描述表格行 |
| `{reasonRow}` | 拒绝原因表格行 |

## link.yml 格式

审核通过后，友链数据以 Butterfly YAML 格式推送到 GitHub：

```yaml
- class_name: 友情链接
  class_desc: 我的小伙伴们
  link_list:
    - name: 站点名称
      link: https://example.com
      avatar: https://example.com/avatar.png
      siteshot: https://example.com/screenshot.png   # 也兼容 topimg 字段
      descr: 站点描述
```

系统自动适配 `siteshot` 和 `topimg` 两种截图字段名：

- **新增友链** — 扫描全部分组已有数据使用的字段名（`siteshot` 或 `topimg`），保持一致；若 YAML 中无任何截图记录，后台弹窗让管理员手动选择
- **更新友链** — 通过 `originalUrl` 匹配 YAML 中的 `link` 字段找到原记录替换，保留原记录的截图字段名
- **提交时** — 传 `siteshot` 或 `topimg` 皆可

## 项目结构

```
├── app/
│   ├── page.tsx              # 首页
│   ├── embed/page.tsx        # 嵌入表单
│   ├── embed-script/route.ts # JS 嵌入脚本
│   ├── admin/                # 管理后台
│   └── api/                  # API 路由
│       ├── auth/             # 登录/登出/鉴权
│       ├── submissions/      # 提交/审核/清理
│       └── admin/settings/   # 后台设置
├── components/
│   └── admin/                # 后台界面组件
├── lib/
│   ├── db.ts                 # MongoDB 连接
│   ├── auth.ts               # JWT 鉴权
│   ├── github.ts             # GitHub API
│   ├── email.ts              # SMTP 邮件
│   └── models/               # 数据模型
└── env.example               # 环境变量模板
```
