'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

type Tab = 'cleanup' | 'owo' | 'email'

export default function SettingsPanel() {
  const [tab, setTab] = useState<Tab>('cleanup')

  const [autoDeleteDays, setAutoDeleteDays] = useState(7)
  const [autoDeleteApprovedDays, setAutoDeleteApprovedDays] = useState(30)
  const [autoDeleteRejectedDays, setAutoDeleteRejectedDays] = useState(30)
  const [editingDays, setEditingDays] = useState(false)
  const [pendingDays, setPendingDays] = useState('7')
  const [approvedDays, setApprovedDays] = useState('30')
  const [rejectedDays, setRejectedDays] = useState('30')
  const [savingDays, setSavingDays] = useState(false)

  const [emailConfigured, setEmailConfigured] = useState(false)
  const [emailSubjectApply, setEmailSubjectApply] = useState('')
  const [emailSubjectUpdate, setEmailSubjectUpdate] = useState('')
  const [emailBodyHtml, setEmailBodyHtml] = useState('')
  const [emailSubjectApproved, setEmailSubjectApproved] = useState('')
  const [emailSubjectRejected, setEmailSubjectRejected] = useState('')
  const [emailBodyResult, setEmailBodyResult] = useState('')
  const [editingEmail, setEditingEmail] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingOwo, setSavingOwo] = useState(false)
  const [owoUrl, setOwoUrl] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings').then(async (res) => {
      if (res.ok) {
        const data = await res.json()
        setAutoDeleteDays(data.autoDeleteDays)
        setAutoDeleteApprovedDays(data.autoDeleteApprovedDays)
        setAutoDeleteRejectedDays(data.autoDeleteRejectedDays)
        setPendingDays(String(data.autoDeleteDays))
        setApprovedDays(String(data.autoDeleteApprovedDays))
        setRejectedDays(String(data.autoDeleteRejectedDays))
        setEmailConfigured(data.emailConfigured)
        setEmailSubjectApply(data.emailSubjectApply || '')
        setEmailSubjectUpdate(data.emailSubjectUpdate || '')
        setEmailSubjectApproved(data.emailSubjectApproved || '')
        setEmailSubjectRejected(data.emailSubjectRejected || '')
        setEmailBodyHtml(data.emailBodyHtml || '')
        setEmailBodyResult(data.emailBodyResult || '')
        if (data.owoUrl) setOwoUrl(data.owoUrl)
      }
    }).catch(() => {})
  }, [])

  const handleSaveDays = async () => {
    const all = [
      { key: 'autoDeleteDays', val: parseInt(pendingDays, 10), label: '待审核' },
      { key: 'autoDeleteApprovedDays', val: parseInt(approvedDays, 10), label: '已通过' },
      { key: 'autoDeleteRejectedDays', val: parseInt(rejectedDays, 10), label: '已拒绝' },
    ]
    for (const { val, label } of all) {
      if (!Number.isInteger(val) || val < 1) {
        toast.error(`"${label}" 天数必须为正整数`)
        return
      }
    }
    setSavingDays(true)
    try {
      const body: Record<string, number> = {}
      for (const { key, val } of all) body[key] = val
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存失败')
      }
      setAutoDeleteDays(all[0].val)
      setAutoDeleteApprovedDays(all[1].val)
      setAutoDeleteRejectedDays(all[2].val)
      setEditingDays(false)
      toast.success('自动清理设置已保存')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSavingDays(false)
    }
  }

  const handleSaveEmail = async () => {
    setSavingEmail(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubjectApply, emailSubjectUpdate, emailSubjectApproved, emailSubjectRejected,
          emailBodyHtml, emailBodyResult, owoUrl,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存失败')
      }
      setEditingEmail(false)
      toast.success('邮件模板已保存')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSavingEmail(false)
    }
  }

  const handleSaveOwo = async () => {
    setSavingOwo(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owoUrl }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存失败')
      }
      toast.success('表情包设置已保存')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSavingOwo(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'cleanup', label: '自动清理', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { key: 'owo', label: '表情包', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'email', label: '邮件通知', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ]

  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem' }} className="mb-6 overflow-hidden">
      <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-5 py-3 text-xs font-medium transition-all"
            style={{
              color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
              backgroundColor: tab === t.key ? 'var(--bg)' : 'transparent',
              borderBottom: tab === t.key ? '2px solid var(--text)' : '2px solid transparent',
              marginBottom: '-1px',
            }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'cleanup' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>按状态分别设置保留天数</span>
              {!editingDays && (
                <button onClick={() => setEditingDays(true)} className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                  style={{ color: '#2563eb', backgroundColor: 'var(--accent-bg)' }}>修改</button>
              )}
            </div>
            {!editingDays ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '待审核', value: autoDeleteDays, color: '#f59e0b' },
                  { label: '已通过', value: autoDeleteApprovedDays, color: '#10b981' },
                  { label: '已拒绝', value: autoDeleteRejectedDays, color: '#ef4444' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-muted)' }}>
                    <div className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                    <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}<span className="text-[10px] font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>天</span></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { key: 'pendingDays', label: '待审核', value: pendingDays, set: setPendingDays },
                  { key: 'approvedDays', label: '已通过', value: approvedDays, set: setApprovedDays },
                  { key: 'rejectedDays', label: '已拒绝', value: rejectedDays, set: setRejectedDays },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-16" style={{ color: 'var(--text)' }}>{item.label}</span>
                    <input type="number" min={1} value={item.value} onChange={(e) => item.set(e.target.value)}
                      className="w-16 px-2 py-1.5 text-xs border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>天后自动删除</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2">
                  <button onClick={handleSaveDays} disabled={savingDays}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50 transition-all hover:scale-105"
                    style={{ color: '#fff', backgroundColor: savingDays ? '#9ca3af' : 'var(--btn-primary-bg)' }}>
                    {savingDays ? '保存中...' : '保存'}
                  </button>
                  <button onClick={() => { setEditingDays(false); setPendingDays(String(autoDeleteDays)); setApprovedDays(String(autoDeleteApprovedDays)); setRejectedDays(String(autoDeleteRejectedDays)) }}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg transition-all"
                    style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>取消</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'owo' && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <input value={owoUrl} onChange={(e) => setOwoUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                placeholder="留空则不显示表情选择器" />
              <button onClick={handleSaveOwo} disabled={savingOwo}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                style={{ color: '#2563eb', backgroundColor: 'var(--accent-bg)' }}>
                {savingOwo ? '保存中...' : '保存'}
              </button>
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>配置 OwO 表情 JSON 链接，用于拒绝原因输入时的表情选择。</div>
          </div>
        )}

        {tab === 'email' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>状态：</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ backgroundColor: emailConfigured ? 'var(--badge-approved-bg)' : 'var(--badge-apply-bg)', color: emailConfigured ? 'var(--badge-approved-text)' : 'var(--badge-apply-text)' }}>
                  {emailConfigured ? '已配置' : '未配置'}
                </span>
              </div>
              <button onClick={() => setEditingEmail(!editingEmail)} className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                style={{ color: '#2563eb', backgroundColor: 'var(--accent-bg)' }}>
                {editingEmail ? '收起' : '编辑模板'}
              </button>
            </div>
            <div className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              SMTP 环境变量：<code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text)' }}>EMAIL_USER</code>{' '}
              <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text)' }}>EMAIL_PASS</code>{' '}
              <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text)' }}>EMAIL_RECIPIENT</code>{' '}
              <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text)' }}>SMTP_SERVER</code>{' '}
              <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text)' }}>SMTP_PORT</code>
            </div>
            {!emailConfigured && (
              <div className="text-xs px-3 py-2 rounded-lg mb-3" style={{ color: '#92400e', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                邮件未配置，将不会发送通知。
              </div>
            )}
            {editingEmail && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text)' }}>申请通知主题</label>
                    <input value={emailSubjectApply} onChange={(e) => setEmailSubjectApply(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text)' }}>更新通知主题</label>
                    <input value={emailSubjectUpdate} onChange={(e) => setEmailSubjectUpdate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text)' }}>邮件 HTML 模板</label>
                  <textarea value={emailBodyHtml} onChange={(e) => setEmailBodyHtml(e.target.value)} rows={8}
                    className="w-full px-3 py-2 text-xs border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                    style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text)' }}>通过通知主题</label>
                    <input value={emailSubjectApproved} onChange={(e) => setEmailSubjectApproved(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text)' }}>拒绝通知主题</label>
                    <input value={emailSubjectRejected} onChange={(e) => setEmailSubjectRejected(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text)' }}>审核结果 HTML 模板</label>
                  <textarea value={emailBodyResult} onChange={(e) => setEmailBodyResult(e.target.value)} rows={8}
                    className="w-full px-3 py-2 text-xs border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                    style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={handleSaveEmail} disabled={savingEmail}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50 transition-all hover:scale-105"
                    style={{ color: '#fff', backgroundColor: savingEmail ? '#9ca3af' : 'var(--btn-primary-bg)' }}>
                    {savingEmail ? '保存中...' : '保存模板'}
                  </button>
                  <button onClick={() => setEditingEmail(false)} className="px-4 py-1.5 text-xs font-medium rounded-lg transition-all"
                    style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>取消</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
