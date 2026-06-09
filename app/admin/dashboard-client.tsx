'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import SettingsPanel from '@/components/admin/SettingsPanel'
import SubmissionTable from '@/components/admin/SubmissionTable'

interface Submission {
  _id: string
  name: string
  url: string
  description: string
  avatar: string
  siteshot: string
  email: string
  type: 'apply' | 'update'
  originalUrl: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface GitHubStatus {
  configured: boolean
  repo?: string
  path?: string
}

const STAT_STYLES: Record<string, { icon: string, bar: string, bg: string, text: string }> = {
  total: {
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    bar: '#6366f1', bg: 'rgba(99,102,241,0.08)', text: '#6366f1',
  },
  pending: {
    icon: 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    bar: '#f59e0b', bg: 'rgba(245,158,11,0.08)', text: '#f59e0b',
  },
  approved: {
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    bar: '#10b981', bg: 'rgba(16,185,129,0.08)', text: '#10b981',
  },
  rejected: {
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    bar: '#ef4444', bg: 'rgba(239,68,68,0.08)', text: '#ef4444',
  },
}

export default function AdminDashboard() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [actionId, setActionId] = useState<string | null>(null)
  const [gitHubStatus, setGitHubStatus] = useState<GitHubStatus>({ configured: false })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(10)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [owoData, setOwoData] = useState<Record<string, { type: string; container: { text: string; icon: string }[] }>>({})
  const [owoCategory, setOwoCategory] = useState('')
  const [owoVisible, setOwoVisible] = useState(false)

  const [dark, setDark] = useState(false)
  const [showClassModal, setShowClassModal] = useState(false)
  const [classNames, setClassNames] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [targetId, setTargetId] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState('')

  const [showScreenshotModal, setShowScreenshotModal] = useState(false)
  const [screenshotField, setScreenshotField] = useState<'siteshot' | 'topimg'>('siteshot')
  const [screenshotTargetId, setScreenshotTargetId] = useState('')
  const [pendingSkipClass, setPendingSkipClass] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('dark', next ? '1' : '0')
    document.documentElement.classList.toggle('dark', next)
  }

  const fetchSubmissions = useCallback(async (p: number) => {
    try {
      const res = await fetch(`/api/submissions?page=${p}&limit=${limit}`)
      if (res.status === 401) {
        router.push('/admin/login')
        return
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '请求失败')
      }
      const data = await res.json()
      if (data.submissions) {
        setSubmissions(data.submissions)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setPage(data.page)
      } else {
        setSubmissions([])
        setTotal(0)
        setTotalPages(1)
      }
    } catch {
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }, [router, limit])

  const fetchGitHubStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/submissions?github=1')
      if (res.ok) {
        const data = await res.json()
        setGitHubStatus(data.github)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchSubmissions(1)
    fetchGitHubStatus()
  }, [fetchSubmissions, fetchGitHubStatus])

  const fetchOwo = async () => {
    if (!owoUrl) return
    try {
      const res = await fetch(owoUrl)
      if (res.ok) {
        const data = await res.json()
        setOwoData(data)
        const keys = Object.keys(data)
        if (keys.length > 0) setOwoCategory(keys[0])
      }
    } catch {
      // ignore
    }
  }

  const [owoUrl, setOwoUrl] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings').then(async (res) => {
      if (res.ok) {
        const data = await res.json()
        if (data.owoUrl) setOwoUrl(data.owoUrl)
      }
    }).catch(() => {})
  }, [])

  const insertEmoji = (icon: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = rejectReason
    setRejectReason(text.substring(0, start) + icon + text.substring(end))
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + icon.length
    }, 0)
  }

  const openRejectModal = (id: string) => {
    setRejectTargetId(id)
    setRejectReason('')
    setShowRejectModal(true)
    fetchOwo()
  }

  const openApproveFlow = async (id: string) => {
    const sub = submissions.find(s => s._id === id)
    if (!sub) return

    const isUpdate = sub.type === 'update'
    try {
      const res = await fetch('/api/submissions?screenshotField=1')
      if (res.ok) {
        const data = await res.json()
        const sf = data.field as 'siteshot' | 'topimg' | null
        if (sf) {
          setScreenshotField(sf)
          if (isUpdate) {
            handleAction(id, 'approved', undefined, undefined, sf)
          } else {
            openClassSelector(id, sf)
          }
        } else {
          setScreenshotTargetId(id)
          setPendingSkipClass(isUpdate)
          setShowScreenshotModal(true)
        }
      } else {
        isUpdate ? handleAction(id, 'approved') : openClassSelector(id)
      }
    } catch {
      isUpdate ? handleAction(id, 'approved') : openClassSelector(id)
    }
  }

  const openClassSelector = async (id: string, field?: 'siteshot' | 'topimg') => {
    setTargetId(id)
    if (field) setScreenshotField(field as 'siteshot' | 'topimg')
    try {
      const res = await fetch('/api/submissions?classNames=1')
      if (res.ok) {
        const data = await res.json()
        if (data.classNames && data.classNames.length > 0) {
          setClassNames(data.classNames)
          setSelectedClass(data.classNames[0])
          setShowClassModal(true)
          return
        }
      }
    } catch {
      // fallback
    }
    handleAction(id, 'approved', undefined, undefined, field)
  }

  const handleAction = async (id: string, action: 'approved' | 'rejected', reason?: string, className?: string, screenshotField?: string) => {
    setActionId(id)
    try {
      const body: Record<string, string> = { status: action }
      if (reason) body.reason = reason
      if (className) body.className = className
      if (screenshotField) body.screenshotField = screenshotField
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '操作失败')
      }

      toast.success(
        action === 'approved'
          ? '已通过并推送到 GitHub'
          : '已拒绝'
      )

      setSubmissions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status: action } : s))
      )
      if (filter !== 'all') fetchSubmissions(page)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setActionId(null)
    }
  }

  const openDeleteModal = (id: string) => {
    setDeleteTargetId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      const id = deleteTargetId
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '删除失败')
      }
      toast.success('已删除')
      const remaining = submissions.filter((s) => s._id !== id)
      setSubmissions(remaining)
      if (remaining.length === 0 && page > 1) {
        fetchSubmissions(page - 1)
      }
      setShowDeleteModal(false)
      setDeleteTargetId('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '删除失败')
      setShowDeleteModal(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setSubmissions([])
    setLoading(true)
    fetchSubmissions(1)
  }

  const handleFilterChange = (f: string) => {
    setFilter(f)
  }

  const stats = [
    { key: 'total', label: '总计', value: total, count: total },
    { key: 'pending', label: '待审核', value: submissions.filter((s) => s.status === 'pending').length, count: total },
    { key: 'approved', label: '已通过', value: submissions.filter((s) => s.status === 'approved').length, count: total },
    { key: 'rejected', label: '已拒绝', value: submissions.filter((s) => s.status === 'rejected').length, count: total },
  ]

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <header style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center hover:shadow-md hover:scale-105 transition-all" style={{ boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </a>
            <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>友链管理后台</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-md" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>
              {gitHubStatus.configured ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  {gitHubStatus.repo}/{gitHubStatus.path}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                  GitHub 未配置
                </span>
              )}
            </span>
            <button onClick={toggleDark} className="text-sm p-2 rounded-lg transition-all hover:scale-105" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>
              {dark ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-105" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => {
            const style = STAT_STYLES[s.key]
            return (
              <div key={s.key} style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                borderLeft: `3px solid ${style.bar}`,
              }} className="p-4 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: style.bg }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: style.text }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{s.value}</div>
              </div>
            )
          })}
        </div>

        <SettingsPanel />

        <SubmissionTable
          submissions={submissions}
          loading={loading}
          filter={filter}
          onFilterChange={handleFilterChange}
          actionId={actionId}
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={fetchSubmissions}
          onLimitChange={handleLimitChange}
          onApprove={openApproveFlow}
          onReject={openRejectModal}
          onDelete={openDeleteModal}
        />
      </main>

      {showClassModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)', borderRadius: '16px',
            padding: '28px', width: '360px', maxWidth: '90vw',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          }}>
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>选择友链分组</h3>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>选择将友链添加到哪个分组：</p>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontSize: '14px',
                border: '1px solid var(--border)', borderRadius: '10px',
                backgroundColor: 'var(--bg)', color: 'var(--text)',
                outline: 'none', marginBottom: '20px',
              }}
            >
              {classNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowClassModal(false)} className="px-4 py-2 text-xs font-medium rounded-lg transition-all hover:scale-105" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>
                取消
              </button>
              <button
                onClick={() => { setShowClassModal(false); handleAction(targetId, 'approved', undefined, selectedClass, screenshotField) }}
                className="px-5 py-2 text-xs font-medium rounded-lg transition-all hover:scale-105"
                style={{ color: '#fff', backgroundColor: '#059669', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}
              >
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)', borderRadius: '16px',
            padding: '28px', width: '500px', maxWidth: '90vw',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          }}>
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>拒绝原因</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>支持 Markdown 语法，留空则不发送通知。</p>
            <textarea
              ref={textareaRef}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 leading-relaxed transition-shadow"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
              placeholder="输入拒绝原因..."
            />
            <div className="mt-3">
              <button onClick={() => setOwoVisible(!owoVisible)} className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>
                {owoVisible ? '收起表情' : '表情'}
              </button>
              {owoVisible && Object.keys(owoData).length > 0 && (
                <div className="mt-2 rounded-xl" style={{ border: '1px solid var(--border)', maxHeight: 220, overflow: 'auto' }}>
                  <div className="flex gap-1 p-2 flex-wrap" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-muted)' }}>
                    {Object.keys(owoData).map((cat) => (
                      <button key={cat} onClick={() => setOwoCategory(cat)} className="px-2.5 py-1 text-xs rounded-lg transition-colors"
                        style={{ color: owoCategory === cat ? '#fff' : 'var(--text-muted)', backgroundColor: owoCategory === cat ? '#6b7280' : 'transparent' }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="p-2.5 grid grid-cols-8 gap-1">
                    {owoData[owoCategory]?.container.map((item, i) => (
                      <button key={i} onClick={() => insertEmoji(item.icon)} dangerouslySetInnerHTML={{ __html: item.icon }}
                        className="p-1.5 rounded-lg hover:scale-110 transition-all" style={{ backgroundColor: 'var(--accent-bg)', cursor: 'pointer' }} title={item.text} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-xs font-medium rounded-lg transition-all hover:scale-105" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>
                取消
              </button>
              <button
                onClick={() => { setShowRejectModal(false); handleAction(rejectTargetId, 'rejected', rejectReason) }}
                className="px-5 py-2 text-xs font-medium rounded-lg transition-all hover:scale-105"
                style={{ color: '#fff', backgroundColor: '#dc2626', boxShadow: '0 2px 8px rgba(220,38,38,0.25)' }}
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {showScreenshotModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)', borderRadius: '16px',
            padding: '28px', width: '360px', maxWidth: '90vw',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          }}>
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>选择截图字段</h3>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>YAML 中无截图记录，请选择截图字段名：</p>
            <div className="flex gap-3 mb-5">
              <button onClick={() => setScreenshotField('siteshot')} style={{
                flex: 1, padding: '10px 12px', fontSize: '14px', borderRadius: '10px',
                border: `2px solid ${screenshotField === 'siteshot' ? '#6366f1' : 'var(--border)'}`,
                backgroundColor: screenshotField === 'siteshot' ? 'rgba(99,102,241,0.08)' : 'var(--bg)',
                color: 'var(--text)', cursor: 'pointer',
              }}>
                siteshot
              </button>
              <button onClick={() => setScreenshotField('topimg')} style={{
                flex: 1, padding: '10px 12px', fontSize: '14px', borderRadius: '10px',
                border: `2px solid ${screenshotField === 'topimg' ? '#6366f1' : 'var(--border)'}`,
                backgroundColor: screenshotField === 'topimg' ? 'rgba(99,102,241,0.08)' : 'var(--bg)',
                color: 'var(--text)', cursor: 'pointer',
              }}>
                topimg
              </button>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowScreenshotModal(false)} className="px-4 py-2 text-xs font-medium rounded-lg transition-all hover:scale-105" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>
                取消
              </button>
              <button
                onClick={() => {
                  setShowScreenshotModal(false)
                  if (pendingSkipClass) {
                    handleAction(screenshotTargetId, 'approved', undefined, undefined, screenshotField)
                  } else {
                    openClassSelector(screenshotTargetId, screenshotField)
                  }
                }}
                className="px-5 py-2 text-xs font-medium rounded-lg transition-all hover:scale-105"
                style={{ color: '#fff', backgroundColor: '#059669', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)', borderRadius: '16px',
            padding: '28px', width: '380px', maxWidth: '90vw',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>确认删除</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>此操作不可撤销。</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium rounded-lg transition-all hover:scale-105" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>
                取消
              </button>
              <button onClick={confirmDelete} className="px-5 py-2 text-xs font-medium rounded-lg transition-all hover:scale-105" style={{ color: '#fff', backgroundColor: '#dc2626', boxShadow: '0 2px 8px rgba(220,38,38,0.25)' }}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
