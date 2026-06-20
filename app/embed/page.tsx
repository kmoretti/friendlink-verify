'use client'

import { useState, FormEvent, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

function EmbedForm() {
  const searchParams = useSearchParams()
  const isUpdate = searchParams.get('mode') === 'update'
  const isDark = searchParams.get('dark') === '1'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const [form, setForm] = useState({
    name: '',
    url: '',
    description: '',
    avatar: '',
    siteshot: '',
    topimg: '',
    email: '',
    originalUrl: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const body: Record<string, string> = {}
      body.name = form.name
      body.url = form.url
      body.description = form.description
      body.avatar = form.avatar
      body.siteshot = form.siteshot
      body.topimg = form.siteshot
      body.email = form.email
      if (isUpdate) {
        body.type = 'update'
        body.originalUrl = form.originalUrl
      }

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '提交失败')
      }

      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '发生未知错误')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 320,
        padding: 32,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text, #111827)' }}>提交成功</h3>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted, #6b7280)', lineHeight: 1.5 }}>
             感谢您！友链申请已提交，等待管理员审核。<br />审核结果将通过邮件通知您。
          </p>
        </div>
      </div>
    )
  }

  const s = (label: string) => ({
    display: 'block' as const,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text, #374151)',
    marginBottom: 4,
  })

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    fontSize: 14,
    border: '1px solid var(--border, #d1d5db)',
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: 'var(--text, #111827)',
    backgroundColor: 'var(--bg-card, #fff)',
  }

  return (
    <div style={{
      padding: 24,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: 'var(--bg, transparent)',
    }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text, #111827)' }}>
          {isUpdate ? '更新友链' : '提交友链'}
        </h2>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted, #6b7280)' }}>
          {isUpdate ? '更新已存在的友链信息。' : '请填写你的网站信息。'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {isUpdate && (
          <div style={{ marginBottom: 14 }}>
            <label style={s('l')}>
              原站点地址 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              required
              type="url"
              value={form.originalUrl}
              onChange={(e) => setForm({ ...form, originalUrl: e.target.value })}
              placeholder="原来的网站地址"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border, #d1d5db)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={s('l')}>
            站点名称 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="站点名称"
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border, #d1d5db)'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s('l')}>
            站点地址 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            required
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="网站地址"
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border, #d1d5db)'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s('l')}>
            站点描述
          </label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="例如：一个关于技术和设计的博客"
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border, #d1d5db)'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s('l')}>
            头像地址 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            required
            type="url"
            value={form.avatar}
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            placeholder="头像地址"
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border, #d1d5db)'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s('l')}>
            站点截图
          </label>
          <input
            type="url"
            value={form.siteshot}
            onChange={(e) => setForm({ ...form, siteshot: e.target.value })}
            placeholder="站点截图链接（支持siteshot和topimg字段）"
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border, #d1d5db)'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={s('l')}>
            邮箱 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="联系邮箱"
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border, #d1d5db)'; e.target.style.boxShadow = 'none' }}
          />
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted, #9ca3af)' }}>
            用于接收审核结果通知
          </p>
        </div>

        {error && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 6,
            color: '#dc2626',
            fontSize: 13,
            marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '9px 16px',
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: submitting ? '#9ca3af' : 'var(--btn-primary-bg, #111827)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#374151' }}
          onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = window.getComputedStyle(e.currentTarget).getPropertyValue('--btn-primary-bg').trim() || '#111827' }}
        >
          {submitting ? '提交中...' : (isUpdate ? '提交更新' : '提交')}
        </button>
      </form>
    </div>
  )
}

export default function EmbedPage() {
  return (
    <Suspense fallback={null}>
      <EmbedForm />
    </Suspense>
  )
}
