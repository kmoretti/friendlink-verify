'use client'

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface ManagedLink {
  name: string
  link: string
  avatar: string
  descr: string
  feeds?: string
  friendslink?: string
  siteshot?: string
  topimg?: string
  tags?: string[]
}

interface LinkGroup {
  class_name: string
  class_desc: string
  link_list: ManagedLink[]
}

interface GroupEditor {
  mode: 'create' | 'edit'
  originalName: string
  name: string
  desc: string
}

interface LinkEditor {
  originalGroupName: string
  originalLink: string
  targetGroupName: string
  name: string
  link: string
  avatar: string
  descr: string
  feeds: string
  friendslink: string
  screenshot: string
  tags: string
}

const DEFAULT_GROUP_DESC = '我的网络朋友们~'

function apiError(data: { error?: string } | null, fallback: string) {
  return data?.error || fallback
}

export default function LinkGroupManager() {
  const router = useRouter()
  const [groups, setGroups] = useState<LinkGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [groupEditor, setGroupEditor] = useState<GroupEditor | null>(null)
  const [linkEditor, setLinkEditor] = useState<LinkEditor | null>(null)
  const [saving, setSaving] = useState(false)

  const loadGroups = useCallback(async () => {
    setLoading(true)
    setError('')
    setUnavailable(false)
    try {
      const res = await fetch('/api/links')
      if (res.status === 401) {
        router.push('/admin/login')
        return
      }
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const message = apiError(data, '加载友链分组失败')
        setUnavailable(res.status === 502)
        throw new Error(message)
      }
      setGroups(data.groups || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载友链分组失败')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const openCreateGroup = () => {
    setGroupEditor({ mode: 'create', originalName: '', name: '', desc: DEFAULT_GROUP_DESC })
  }

  const openEditGroup = (group: LinkGroup) => {
    setGroupEditor({ mode: 'edit', originalName: group.class_name, name: group.class_name, desc: group.class_desc })
  }

  const saveGroup = async () => {
    if (!groupEditor || !groupEditor.name.trim()) {
      toast.error('分组名称不能为空')
      return
    }
    setSaving(true)
    try {
      const isCreate = groupEditor.mode === 'create'
      const res = await fetch(
        isCreate
          ? '/api/links/groups'
          : `/api/links/groups/${encodeURIComponent(groupEditor.originalName)}`,
        {
          method: isCreate ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: groupEditor.name, desc: groupEditor.desc }),
        }
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(apiError(data, '保存分组失败'))
      setGroupEditor(null)
      await loadGroups()
      toast.success(isCreate ? '分组已创建' : '分组已保存')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '保存分组失败')
    } finally {
      setSaving(false)
    }
  }

  const deleteGroup = async (group: LinkGroup) => {
    if (group.link_list.length > 0) {
      toast.error('分组中仍有友链，请先移动友链后再删除')
      return
    }
    if (!window.confirm(`确定删除分组“${group.class_name}”吗？`)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/links/groups/${encodeURIComponent(group.class_name)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(apiError(data, '删除分组失败'))
      await loadGroups()
      toast.success('分组已删除')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '删除分组失败')
    } finally {
      setSaving(false)
    }
  }

  const openEditLink = (group: LinkGroup, link: ManagedLink) => {
    setLinkEditor({
      originalGroupName: group.class_name,
      originalLink: link.link,
      targetGroupName: group.class_name,
      name: link.name,
      link: link.link,
      avatar: link.avatar,
      descr: link.descr || '',
      feeds: link.feeds || '',
      friendslink: link.friendslink || '',
      screenshot: link.siteshot || link.topimg || '',
      tags: (link.tags || []).join(', '),
    })
  }

  const saveLink = async () => {
    if (!linkEditor) return
    if (!linkEditor.name.trim() || !linkEditor.link.trim() || !linkEditor.avatar.trim()) {
      toast.error('站点名称、地址和头像不能为空')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/links/entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...linkEditor,
          tags: linkEditor.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(apiError(data, '保存友链失败'))
      setLinkEditor(null)
      await loadGroups()
      toast.success('友链已保存并同步到 GitHub')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '保存友链失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className="mb-6 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>友链分组管理</h2>
          <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>直接管理 GitHub links.yml 中已通过的友链</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadGroups}
            disabled={loading || saving}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}
          >
            刷新
          </button>
          <button
            onClick={openCreateGroup}
            disabled={saving}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all hover:scale-105 disabled:opacity-50"
            style={{ backgroundColor: 'var(--btn-primary-bg)' }}
          >
            + 新建分组
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>正在读取 GitHub 友链…</div>
      ) : unavailable ? (
        <div className="p-8 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>GitHub 友链暂不可用</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{error || '请先配置 GitHub Token、仓库和文件路径。'}</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
          <button onClick={loadGroups} className="mt-3 text-xs font-medium text-blue-600 hover:underline">重试</button>
        </div>
      ) : groups.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>暂时没有友链分组</p>
          <button onClick={openCreateGroup} className="mt-3 text-xs font-medium text-blue-600 hover:underline">创建第一个分组</button>
        </div>
      ) : (
        <div className="space-y-4 p-5">
          {groups.map((group) => (
            <div key={group.class_name} className="overflow-hidden rounded-xl" style={{ border: '1px solid var(--border)' }}>
              <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3" style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{group.class_name}</h3>
                    <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>{group.link_list.length} 条</span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{group.class_desc || '暂无分组描述'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditGroup(group)} disabled={saving} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-950/30">编辑分组</button>
                  <button onClick={() => deleteGroup(group)} disabled={saving || group.link_list.length > 0} className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40" style={{ color: '#dc2626', backgroundColor: 'var(--badge-rejected-bg)' }}>删除</button>
                </div>
              </div>

              {group.link_list.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>空分组，可以删除</div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {group.link_list.map((link) => (
                    <div key={`${group.class_name}-${link.link}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg" style={{ backgroundColor: 'var(--accent-bg)' }}>
                        {link.avatar ? <img src={link.avatar} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>{link.name}</span>
                          {(link.tags || []).map((tag) => <span key={tag} className="rounded px-1.5 py-0.5 text-[10px]" style={{ color: 'var(--badge-update-text)', backgroundColor: 'var(--badge-update-bg)' }}>{tag}</span>)}
                        </div>
                        <a href={link.link} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate text-xs text-blue-600 hover:underline">{link.link}</a>
                        {link.descr && <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>{link.descr}</p>}
                      </div>
                      <button onClick={() => openEditLink(group, link)} disabled={saving} className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-950/30">编辑 / 移动</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {groupEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="编辑友链分组">
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{groupEditor.mode === 'create' ? '新建友链分组' : '编辑友链分组'}</h3>
            <div className="mt-5 space-y-4">
              <label className="block"><span className="mb-1 block text-xs font-medium" style={{ color: 'var(--text)' }}>分组名称</span><input autoFocus value={groupEditor.name} onChange={(event) => setGroupEditor({ ...groupEditor, name: event.target.value })} maxLength={80} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} /></label>
              <label className="block"><span className="mb-1 block text-xs font-medium" style={{ color: 'var(--text)' }}>分组描述</span><textarea value={groupEditor.desc} onChange={(event) => setGroupEditor({ ...groupEditor, desc: event.target.value })} maxLength={500} rows={3} className="w-full resize-y rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} /></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => setGroupEditor(null)} disabled={saving} className="rounded-lg px-4 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>取消</button><button onClick={saveGroup} disabled={saving} className="rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-50" style={{ backgroundColor: 'var(--btn-primary-bg)' }}>{saving ? '保存中…' : '保存分组'}</button></div>
          </div>
        </div>
      )}

      {linkEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="编辑友链">
          <div className="my-8 w-full max-w-2xl rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>编辑友链</h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>保存后会立即更新 GitHub YAML；清空可选字段会移除对应 YAML 字段。</p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-xs font-medium" style={{ color: 'var(--text)' }}>所属分组</span><select value={linkEditor.targetGroupName} onChange={(event) => setLinkEditor({ ...linkEditor, targetGroupName: event.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>{groups.map((group) => <option key={group.class_name} value={group.class_name}>{group.class_name}</option>)}</select></label>
              <label className="block"><span className="mb-1 block text-xs font-medium" style={{ color: 'var(--text)' }}>站点名称 *</span><input value={linkEditor.name} onChange={(event) => setLinkEditor({ ...linkEditor, name: event.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} /></label>
              <label className="block"><span className="mb-1 block text-xs font-medium" style={{ color: 'var(--text)' }}>站点地址 *</span><input type="url" value={linkEditor.link} onChange={(event) => setLinkEditor({ ...linkEditor, link: event.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} /></label>
              <label className="block"><span className="mb-1 block text-xs font-medium" style={{ color: 'var(--text)' }}>头像地址 *</span><input type="url" value={linkEditor.avatar} onChange={(event) => setLinkEditor({ ...linkEditor, avatar: event.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} /></label>
              <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium" style={{ color: 'var(--text)' }}>站点描述</span><textarea rows={3} value={linkEditor.descr} onChange={(event) => setLinkEditor({ ...linkEditor, descr: event.target.value })} className="w-full resize-y rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} /></label>
              <label className="block"><span className="mb-1 block text-xs font-medium" style={{ color: 'var(--text)' }}>RSS 地址</span><input type="url" value={linkEditor.feeds} onChange={(event) => setLinkEditor({ ...linkEditor, feeds: event.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} /></label>
              <label className="block"><span className="mb-1 block text-xs font-medium" style={{ color: 'var(--text)' }}>友链页面</span><input type="url" value={linkEditor.friendslink} onChange={(event) => setLinkEditor({ ...linkEditor, friendslink: event.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} /></label>
              <label className="block"><span className="mb-1 block text-xs font-medium" style={{ color: 'var(--text)' }}>站点截图 URL</span><input type="url" value={linkEditor.screenshot} onChange={(event) => setLinkEditor({ ...linkEditor, screenshot: event.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} /></label>
              <label className="block"><span className="mb-1 block text-xs font-medium" style={{ color: 'var(--text)' }}>Tags</span><input value={linkEditor.tags} onChange={(event) => setLinkEditor({ ...linkEditor, tags: event.target.value })} placeholder="例如：大佬, 技术" className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} /><span className="mt-1 block text-[11px]" style={{ color: 'var(--text-muted)' }}>使用逗号分隔；清空后移除 tags 字段。</span></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => setLinkEditor(null)} disabled={saving} className="rounded-lg px-4 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--accent-bg)' }}>取消</button><button onClick={saveLink} disabled={saving} className="rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-50" style={{ backgroundColor: 'var(--btn-primary-bg)' }}>{saving ? '保存中…' : '保存友链'}</button></div>
          </div>
        </div>
      )}
    </section>
  )
}
