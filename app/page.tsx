'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [copied, setCopied] = useState<'iframe' | 'script' | null>(null)
  const [dark, setDark] = useState(false)
  const [previewMode, setPreviewMode] = useState<'apply' | 'update'>('apply')
  const [appUrl, setAppUrl] = useState('')
  const inited = useRef(false)

  useEffect(() => {
    if (!inited.current) {
      inited.current = true
      setAppUrl(process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
      const d = localStorage.getItem('dark')
      setDark(d === '1')
    }
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('dark', next ? '1' : '0')
    document.documentElement.classList.toggle('dark', next)
  }

  const embedHost = 'https://你的域名.vercel.app'
  const iframeCode = `<iframe src="${embedHost}/embed" width="100%" height="520" style="border:none;border-radius:8px;max-width:480px;margin:0 auto;display:block;"></iframe>`
  const iframeUpdateCode = `<iframe src="${embedHost}/embed?mode=update" width="100%" height="520" style="border:none;border-radius:8px;max-width:480px;margin:0 auto;display:block;"></iframe>`
  const scriptCode = `<script src="${embedHost}/embed.js"></script>`
  const scriptUpdateCode = `<script src="${embedHost}/embed.js" data-mode="update"></script>`

  const copyToClipboard = async (text: string, type: 'iframe' | 'script') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="font-semibold text-sm">友链审核</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark} className="text-sm p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--text-muted)' }}>
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
            <a href="/admin" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
              管理后台
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs mb-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
            友链提交审核系统
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ color: 'var(--text)' }}>
            友链提交与审核管理
          </h1>
          <p className="mt-4 text-base max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            在任何网站嵌入表单，接收友链申请。审核通过后自动推送到 GitHub 仓库。
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text)' }}
            >
              进入后台
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <a
              href="#embed"
              className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
            >
              获取嵌入代码
            </a>
          </div>
        </section>

        <section className="border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="mx-auto max-w-4xl px-6 py-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { title: '接收提交', desc: '在任何网站嵌入表单，访客可直接提交友链申请。' },
                { title: '审核管理', desc: '后台管理面板，轻松审核待处理的友链申请。' },
                { title: '自动推送', desc: '审核通过后自动将友链数据推送到你的 GitHub 仓库。' },
              ].map((item, i) => (
                <div key={i} className="text-center sm:text-left">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 mx-auto sm:mx-0" style={{ backgroundColor: 'var(--bg-muted)' }}>
                    <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="embed" className="border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>嵌入表单</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>将友链提交表单嵌入到任意网站，支持多种方式。</p>
            </div>

            <div className="flex items-center gap-4 mb-6 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setPreviewMode('apply')}
                className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                style={{
                  backgroundColor: previewMode === 'apply' ? 'var(--accent-bg)' : 'transparent',
                  color: previewMode === 'apply' ? 'var(--text)' : 'var(--text-muted)',
                }}
              >
                申请友链
              </button>
              <button
                onClick={() => setPreviewMode('update')}
                className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                style={{
                  backgroundColor: previewMode === 'update' ? 'var(--accent-bg)' : 'transparent',
                  color: previewMode === 'update' ? 'var(--text)' : 'var(--text-muted)',
                }}
              >
                更新友链
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
                      <svg className="w-3 h-3" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>Iframe 嵌入</span>
                  </div>
                  <button onClick={() => copyToClipboard(previewMode === 'update' ? iframeUpdateCode : iframeCode, 'iframe')} className="text-xs font-medium transition-colors" style={{ color: '#3b82f6' }}>
                    {copied === 'iframe' ? '已复制!' : '复制'}
                  </button>
                </div>
                <pre className="text-xs rounded-lg p-3 overflow-x-auto border leading-relaxed" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-muted)', borderColor: 'var(--border)' }}>{previewMode === 'update' ? iframeUpdateCode : iframeCode}</pre>
              </div>

              <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
                      <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-muted)' }}>JS</span>
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>Script 嵌入</span>
                  </div>
                  <button onClick={() => copyToClipboard(previewMode === 'update' ? scriptUpdateCode : scriptCode, 'script')} className="text-xs font-medium transition-colors" style={{ color: '#3b82f6' }}>
                    {copied === 'script' ? '已复制!' : '复制'}
                  </button>
                </div>
                <pre className="text-xs rounded-lg p-3 overflow-x-auto border leading-relaxed" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-muted)', borderColor: 'var(--border)' }}>{previewMode === 'update' ? scriptUpdateCode : scriptCode}</pre>
              </div>

              <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
                      <svg className="w-3 h-3" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>自包含 HTML</span>
                  </div>
                </div>
                <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>适合任何静态站点，直接 POST 到 API：</div>
                <pre className="text-xs rounded-lg p-3 overflow-x-auto border leading-relaxed" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-muted)', borderColor: 'var(--border)', maxHeight: 200 }}>
{previewMode === 'update' ? `<form id="fl-f">
  <input id="fl-originalUrl" type="url" required placeholder="原来的网站地址">
  <input id="fl-name" required placeholder="站点名称">
  <input id="fl-url" type="url" required placeholder="网站地址">
  <input id="fl-desc" placeholder="例如：一个关于技术和设计的博客">
  <input id="fl-avatar" type="url" required placeholder="头像地址">
  <input id="fl-siteshot" type="url" placeholder="站点截图链接（支持siteshot和topimg字段）">
  <input id="fl-email" type="email" required placeholder="联系邮箱">
  <button type="submit">提交更新</button>
</form>
<script>
document.getElementById('fl-f').addEventListener('submit', function(e) {
  e.preventDefault();
  fetch('${embedHost}/api/submissions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      originalUrl: document.getElementById('fl-originalUrl').value,
      name: document.getElementById('fl-name').value,
      url: document.getElementById('fl-url').value,
      description: document.getElementById('fl-desc').value,
      avatar: document.getElementById('fl-avatar').value,
      siteshot: document.getElementById('fl-siteshot').value,
      email: document.getElementById('fl-email').value,
      type: 'update',
    })
  });
});
<\/script>` : `<form id="fl-f">
  <input id="fl-name" required placeholder="站点名称">
  <input id="fl-url" type="url" required placeholder="网站地址">
  <input id="fl-desc" placeholder="例如：一个关于技术和设计的博客">
  <input id="fl-avatar" type="url" required placeholder="头像地址">
  <input id="fl-siteshot" type="url" placeholder="站点截图链接（支持siteshot和topimg字段）">
  <input id="fl-email" type="email" required placeholder="联系邮箱">
  <button type="submit">提交</button>
</form>
<script>
document.getElementById('fl-f').addEventListener('submit', function(e) {
  e.preventDefault();
  fetch('${embedHost}/api/submissions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name: document.getElementById('fl-name').value,
      url: document.getElementById('fl-url').value,
      description: document.getElementById('fl-desc').value,
      avatar: document.getElementById('fl-avatar').value,
      siteshot: document.getElementById('fl-siteshot').value,
      email: document.getElementById('fl-email').value,
      type: 'apply',
    })
  });
});
<\/script>`}
                </pre>
              </div>

              <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
                      <svg className="w-3 h-3" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>Butterfly 主题</span>
                  </div>
                </div>
                <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Hexo + Butterfly 友链页嵌入，详情查看 README：</div>
                <pre className="text-xs rounded-lg p-3 overflow-x-auto border leading-relaxed" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
{`<iframe src="${embedHost}/embed${previewMode === 'update' ? '?mode=update' : ''}"
  width="100%" height="520"
  style="border:none;border-radius:8px;">
</iframe>`}
                </pre>
              </div>
            </div>

            <div className="mt-8 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
              <div className="px-5 py-3 border-b text-xs font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>表单预览</div>
              <iframe src={`/embed${previewMode === 'update' ? '?mode=update' : ''}${dark ? `${previewMode === 'update' ? '&' : '?'}dark=1` : ''}`} width="100%" height="520" style={{ border: 'none', width: '100%' }} title="友链表单预览" />
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-4xl px-6 py-6 text-center text-xs" style={{ color: 'var(--text-subtle)' }}>
          友链审核系统 · <a href="https://github.com/shangskr/friendlink-verify" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>项目地址</a> by 安小歪
        </div>
      </footer>
    </div>
  )
}
