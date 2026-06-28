import nodemailer from 'nodemailer'
import dbConnect from '@/lib/db'
import Config from '@/lib/models/config'

interface SmtpConfig {
  user: string
  pass: string
  recipient: string
  server: string
  port: number
  name: string
}

export interface SubmissionInfo {
  name: string
  url: string
  description: string
  avatar: string
  friendslink: string
  feeds: string
  email: string
  type: 'apply' | 'update'
  originalUrl: string
  createdAt: Date
  reason?: string
}

function getSmtpConfig(requireRecipient = true): SmtpConfig | null {
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASS
  const recipient = process.env.EMAIL_RECIPIENT
  const server = process.env.SMTP_SERVER
  const portStr = process.env.SMTP_PORT

  if (!user || !pass || !server) return null
  if (requireRecipient && !recipient) return null
  return {
    user,
    pass,
    recipient: recipient || user,
    server,
    port: parseInt(portStr || '', 10) || 465,
    name: process.env.EMAIL_NAME || user,
  }
}

async function getConfig(key: string, fallback: string): Promise<string> {
  try {
    await dbConnect()
    const doc = await Config.findOne({ key })
    if (doc && doc.value.trim()) return doc.value
  } catch {
    // fallback
  }
  return fallback
}

function getSender(smtp: SmtpConfig) {
  return { name: smtp.name, address: smtp.user }
}

async function createTransporter(smtp: SmtpConfig) {
  return nodemailer.createTransport({
    host: smtp.server,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })
}

export function getDefaultSubject(type: 'apply' | 'update'): string {
  return type === 'update'
    ? '友链更新通知 - {name} 提交了友链更新'
    : '新友链申请 - {name} 申请添加友链'
}

export function getDefaultHtml(): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:#2563eb;padding:24px 32px;text-align:center;">
      <div style="width:48px;height:48px;border-radius:24px;background:rgba(255,255,255,.2);display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px;">
        <img src="https://q2.qlogo.cn/headimg_dl?dst_uin=2622979530&spec=640" width="48" height="48" style="border-radius:24px;display:block" />
      </div>
      <div style="color:#fff;font-size:18px;font-weight:600;">友链审核系统</div>
      <div style="color:rgba(255,255,255,.7);font-size:13px;margin-top:2px;">{type}</div>
    </div>
    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#64748b;font-size:13px;">站点名称</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-size:13px;font-weight:500;">{name}</td></tr>
        <tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#64748b;font-size:13px;">站点地址</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-size:13px;"><a href="{url}" style="color:#2563eb;text-decoration:none;">{url}</a></td></tr>
        {originalUrlRow}
        <tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#64748b;font-size:13px;">描述</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-size:13px;">{description}</td></tr>
        {friendslinkRow}
        {feedsRow}
        <tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#64748b;font-size:13px;">邮箱</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-size:13px;">{email}</td></tr>
        <tr><td style="padding:8px 16px;color:#64748b;font-size:13px;">提交时间</td><td style="padding:8px 16px;font-size:13px;">{time}</td></tr>
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="{adminUrl}" style="display:inline-block;padding:10px 24px;background:#111827;color:#fff;border-radius:8px;font-size:13px;font-weight:500;text-decoration:none;">前往后台审核</a>
      </div>
      <div style="margin-top:16px;text-align:center;font-size:11px;color:#94a3b8;">此邮件由友链审核系统自动发送，请勿回复。</div>
    </div>
  </div>
</body>
</html>`
}

export function getDefaultResultSubject(status: 'approved' | 'rejected'): string {
  return status === 'approved'
    ? '友链申请已通过 - {name}'
    : '友链申请未通过 - {name}'
}

export function getDefaultResultHtml(): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:540px;margin:32px auto;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.06);">
      <div style="text-align:center;padding:36px 32px 0;">
        <div style="font-size:20px;font-weight:700;color:#0f172a;">{resultTitle}</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">{type}</div>
      </div>
      <div style="padding:24px 32px 32px;">
        <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 8px;">{name}，您好：</p>
        <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 20px;">您提交的友链申请已被{resultAction}，详情如下：</p>
        <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;">
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;width:80px;">站点名称</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#0f172a;">{name}</td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">站点地址</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;"><a href="{url}" style="color:#2563eb;text-decoration:none;font-weight:500;">{url}</a></td></tr>
          {originalUrlRow}
          {descriptionRow}
          {friendslinkRow}
          {feedsRow}
          {reasonRow}
        </table>
        <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:24px;">此邮件由友链审核系统自动发送，请勿回复。</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

function mdToHtml(text: string): string {
  return text
    .replace(/### (.+)/g, '<h3>$1</h3>')
    .replace(/## (.+)/g, '<h2>$1</h2>')
    .replace(/# (.+)/g, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#2563eb;text-decoration:underline;">$1</a>')
    .replace(/\n/g, '<br>')
}

function mergeTemplate(template: string, data: SubmissionInfo): string {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/admin`
  const originalUrlRow = data.type === 'update' && data.originalUrl
    ? `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#64748b;font-size:13px;">原站点地址</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-size:13px;">${data.originalUrl}</td></tr>`
    : ''
  const feedsRow = data.feeds
    ? `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#64748b;font-size:13px;">RSS 订阅</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-size:13px;"><a href="${data.feeds}" style="color:#2563eb;text-decoration:none;">${data.feeds}</a></td></tr>`
    : ''
  const friendslinkRow = data.friendslink
    ? `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#64748b;font-size:13px;">友链页面</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-size:13px;"><a href="${data.friendslink}" style="color:#2563eb;text-decoration:none;">${data.friendslink}</a></td></tr>`
    : ''
  const map: Record<string, string> = {
    '{name}': data.name,
    '{url}': data.url,
    '{description}': data.description || '-',
    '{avatar}': data.avatar,
    '{email}': data.email || '-',
    '{type}': data.type === 'update' ? '更新友链' : '申请友链',
    '{originalUrl}': data.originalUrl || '',
    '{time}': data.createdAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    '{originalUrlRow}': originalUrlRow,
    '{friendslinkRow}': friendslinkRow,
    '{feedsRow}': feedsRow,
    '{adminUrl}': adminUrl,
  }
  let result = template
  for (const [key, val] of Object.entries(map)) {
    result = result.split(key).join(val)
  }
  return result
}

function mergeResultTemplate(template: string, data: SubmissionInfo, status: 'approved' | 'rejected'): string {
  const isApproved = status === 'approved'
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/admin`
  const originalUrlRow = data.type === 'update' && data.originalUrl
    ? `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#64748b;font-size:13px;">原站点地址</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-size:13px;">${data.originalUrl}</td></tr>`
    : ''
  const descriptionRow = data.description
    ? `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#64748b;font-size:13px;">站点描述</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-size:13px;">${data.description}</td></tr>`
    : ''
  const feedsRow = data.feeds
    ? `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#64748b;font-size:13px;">RSS 订阅</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-size:13px;"><a href="${data.feeds}" style="color:#2563eb;text-decoration:none;">${data.feeds}</a></td></tr>`
    : ''
  const friendslinkRow = data.friendslink
    ? `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#64748b;font-size:13px;">友链页面</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-size:13px;"><a href="${data.friendslink}" style="color:#2563eb;text-decoration:none;">${data.friendslink}</a></td></tr>`
    : ''
  const reasonRow = data.reason
    ? `<tr><td style="padding:8px 16px;color:#64748b;font-size:13px;vertical-align:top;padding-top:8px;">拒绝原因</td><td style="padding:8px 16px;font-size:13px;color:#dc2626;background:#fef2f2;border-radius:4px;">${mdToHtml(data.reason)}</td></tr>`
    : ''
  const map: Record<string, string> = {
    '{name}': data.name,
    '{url}': data.url,
    '{description}': data.description || '-',
    '{avatar}': data.avatar,
    '{email}': data.email || '-',
    '{type}': data.type === 'update' ? '更新友链' : '申请友链',
    '{originalUrl}': data.originalUrl || '',
    '{time}': data.createdAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    '{originalUrlRow}': originalUrlRow,
    '{descriptionRow}': descriptionRow,
    '{friendslinkRow}': friendslinkRow,
    '{feedsRow}': feedsRow,
    '{reasonRow}': reasonRow,
    '{adminUrl}': adminUrl,
    '{resultTitle}': isApproved ? '申请已通过' : '申请未通过',
    '{resultAction}': isApproved ? '通过' : '拒绝',
    '{resultIcon}': '',
  }
  let result = template
  for (const [key, val] of Object.entries(map)) {
    result = result.split(key).join(val)
  }
  return result
}

async function sendMail(
  smtp: SmtpConfig,
  to: string,
  subject: string,
  html: string
) {
  const transporter = await createTransporter(smtp)
  await transporter.sendMail({
    from: getSender(smtp),
    to,
    subject,
    html,
  })
}

export async function sendNotification(data: SubmissionInfo) {
  const smtp = getSmtpConfig()
  if (!smtp) return

  const subjectKey = data.type === 'update' ? 'emailSubjectUpdate' : 'emailSubjectApply'
  const [subject, html] = await Promise.all([
    getConfig(subjectKey, getDefaultSubject(data.type)),
    getConfig('emailBodyHtml', getDefaultHtml()),
  ])

  try {
    await sendMail(smtp, smtp.recipient, mergeTemplate(subject, data), mergeTemplate(html, data))
    console.log(`[邮件] 管理员通知发送成功: ${data.name} (${data.type})`)
  } catch (err) {
    console.error(`[邮件] 发送失败: server=${smtp.server}:${smtp.port}, user=${smtp.user}, recipient=${smtp.recipient}`, err)
  }
}

export async function sendResultNotification(data: SubmissionInfo, status: 'approved' | 'rejected', reason?: string) {
  if (reason) data.reason = reason
  const smtp = getSmtpConfig(false)
  if (!smtp || !data.email) return

  const subjectKey = status === 'approved' ? 'emailSubjectApproved' : 'emailSubjectRejected'
  const [subject, html] = await Promise.all([
    getConfig(subjectKey, getDefaultResultSubject(status)),
    getConfig('emailBodyResult', getDefaultResultHtml()),
  ])

  try {
    await sendMail(smtp, data.email, mergeResultTemplate(subject, data, status), mergeResultTemplate(html, data, status))
    console.log(`[邮件] 提交者通知发送成功: ${data.name} -> ${data.email} (${status})`)
  } catch (err) {
    console.error(`[邮件] 提交者通知发送失败: ${data.email}`, err)
  }
}

export function isEmailConfigured(): boolean {
  return getSmtpConfig(false) !== null
}
