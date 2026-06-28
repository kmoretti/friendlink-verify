'use client'

/* eslint-disable @next/next/no-img-element */

interface Submission {
  _id: string
  name: string
  url: string
  description: string
  avatar: string
  friendslink: string
  siteshot: string
  feeds: string
  email: string
  type: 'apply' | 'update'
  originalUrl: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface SubmissionTableProps {
  submissions: Submission[]
  loading: boolean
  filter: string
  onFilterChange: (f: string) => void
  actionId: string | null
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (p: number) => void
  onLimitChange: (limit: number) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onDelete: (id: string) => void
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: '待审核', bg: 'var(--badge-pending-bg)', text: 'var(--badge-pending-text)' },
  approved: { label: '已通过', bg: 'var(--badge-approved-bg)', text: 'var(--badge-approved-text)' },
  rejected: { label: '已拒绝', bg: 'var(--badge-rejected-bg)', text: 'var(--badge-rejected-text)' },
}

const TYPE_CFG: Record<string, { label: string; bg: string; text: string }> = {
  apply: { label: '申请', bg: 'var(--badge-apply-bg)', text: 'var(--badge-apply-text)' },
  update: { label: '更新', bg: 'var(--badge-update-bg)', text: 'var(--badge-update-text)' },
}

export default function SubmissionTable({
  submissions, loading, filter, onFilterChange, actionId,
  page, totalPages, total, limit, onPageChange, onLimitChange,
  onApprove, onReject, onDelete,
}: SubmissionTableProps) {
  const filtered = submissions.filter((s) =>
    filter === 'all' ? true : s.status === filter
  )

  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem' }} className="overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>提交列表</h2>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5" style={{ backgroundColor: 'var(--accent-bg)' }}>
          {[
            { key: 'all', label: '全部' },
            { key: 'pending', label: '待审核' },
            { key: 'approved', label: '已通过' },
            { key: 'rejected', label: '已拒绝' },
          ].map((f) => (
            <button key={f.key} onClick={() => onFilterChange(f.key)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
              style={{
                backgroundColor: filter === f.key ? 'var(--bg-card)' : 'transparent',
                color: filter === f.key ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: filter === f.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          <div className="inline-block w-6 h-6 border-2 rounded-full animate-spin mb-2" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text)' }} />
          <div>加载中...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center">
          <svg className="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>暂无提交记录</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-muted)' }}>
                <th className="text-left px-5 py-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>站点</th>
                <th className="text-left px-5 py-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>地址</th>
                <th className="text-left px-5 py-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>状态</th>
                <th className="text-left px-5 py-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>类型</th>
                <th className="text-left px-5 py-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>日期</th>
                <th className="text-right px-5 py-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr key={s._id} className="group" style={{
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: idx % 2 === 1 ? 'var(--bg-muted)' : 'transparent',
                  transition: 'background-color 0.15s',
                }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold uppercase flex-shrink-0 overflow-hidden transition-transform group-hover:scale-105"
                        style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--text-muted)' }}>
                        {s.avatar ? (
                          <img src={s.avatar} alt="" className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.textContent = s.name.charAt(0) }} />
                        ) : (
                          s.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{s.name}</div>
                        {s.email && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.email}</div>}
                        {s.description && <div className="text-[11px] line-clamp-1 mt-0.5" style={{ color: 'var(--text-subtle, #9ca3af)' }}>{s.description}</div>}
                        {s.feeds && (
                          <a href={s.feeds} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-[11px] hover:underline"
                            style={{ color: '#ea580c' }}>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="4" cy="20" r="3"/>
                              <path d="M4 11a9 9 0 019 9h-3a6 6 0 00-6-6v-3z"/>
                              <path d="M4 4a16 16 0 0116 16h-3a13 13 0 00-13-13v-3z"/>
                            </svg>
                            RSS
                          </a>
                        )}
                        {s.friendslink && (
                          <a href={s.friendslink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-[11px] hover:underline"
                            style={{ color: '#7c3aed' }}>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            友链页
                          </a>
                        )}
                        {s.siteshot && (
                          <img src={s.siteshot} alt="screenshot" className="mt-1.5 rounded-lg" style={{ width: 120, height: 72, objectFit: 'cover', border: '1px solid var(--border)' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs truncate block max-w-[200px] hover:underline"
                      style={{ color: '#2563eb' }}>{s.url}</a>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: STATUS_CFG[s.status].bg, color: STATUS_CFG[s.status].text }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_CFG[s.status].text }} />
                      {STATUS_CFG[s.status].label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
                      style={{ backgroundColor: TYPE_CFG[s.type].bg, color: TYPE_CFG[s.type].text }}>
                      {TYPE_CFG[s.type].label}
                    </span>
                    {s.type === 'update' && s.originalUrl && (
                      <div className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>原: {s.originalUrl}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(s.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {s.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onApprove(s._id)} disabled={actionId === s._id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50 transition-all hover:scale-105"
                          style={{ color: 'var(--badge-approved-text)', backgroundColor: 'var(--badge-approved-bg)' }}>
                          {actionId === s._id ? '...' : '通过'}
                        </button>
                        <button onClick={() => onReject(s._id)} disabled={actionId === s._id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50 transition-all hover:scale-105"
                          style={{ color: 'var(--badge-rejected-text)', backgroundColor: 'var(--badge-rejected-bg)' }}>
                          {actionId === s._id ? '...' : '拒绝'}
                        </button>
                        <button onClick={() => onDelete(s._id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>删除</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{STATUS_CFG[s.status].label}</span>
                        <button onClick={() => onDelete(s._id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>删除</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-muted)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>共 {total} 条</span>
          <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 text-xs border rounded-lg focus:outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n} 条/页</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-30 transition-all hover:scale-105"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 7) return true
              if (p === 1 || p === totalPages) return true
              if (Math.abs(p - page) <= 1) return true
              return false
            })
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="px-1 text-xs" style={{ color: 'var(--text-muted)' }}>...</span>
                )}
                <button onClick={() => onPageChange(p)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all"
                  style={{
                    backgroundColor: p === page ? 'var(--btn-primary-bg)' : 'transparent',
                    color: p === page ? '#fff' : 'var(--text-muted)',
                  }}>
                  {p}
                </button>
              </span>
            ))}
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-30 transition-all hover:scale-105"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}
