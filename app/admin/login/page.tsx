'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '登录失败')
      }

      router.push('/admin')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '发生未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white text-sm font-bold mb-4 hover:opacity-80 transition-opacity">
            FV
          </a>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>管理员登录</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>登录以管理友链提交</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              用户名
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text)' }}
              placeholder="admin"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              密码
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text)' }}
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 text-sm font-medium text-white rounded-lg disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: loading ? '#9ca3af' : 'var(--btn-primary-bg)' }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
