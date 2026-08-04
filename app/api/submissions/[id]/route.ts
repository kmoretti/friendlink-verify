import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getSubmissionRepository } from '@/lib/database/repositories'
import { getSession } from '@/lib/auth'
import { addLink, updateLink } from '@/lib/github'
import { sendResultNotification } from '@/lib/email'
import type { SubmissionStatus } from '@/lib/database/types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  const repository = getSubmissionRepository()
  let claimToken: string | null = null
  try {
    const body = await request.json()
    const { status, reason, className, screenshotField } = body
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: '状态必须为 "approved" 或 "rejected"' }, { status: 400 })
    }

    const submission = await repository.findById(id)
    if (!submission) return NextResponse.json({ error: '提交记录未找到' }, { status: 404 })
    if (submission.status !== 'pending') return NextResponse.json({ error: '该提交已被处理' }, { status: 400 })

    claimToken = randomUUID()
    const claimed = await repository.claimPending(id, claimToken)
    if (!claimed) {
      return NextResponse.json({ error: '该提交正在被其他管理员处理，请刷新后重试' }, { status: 409 })
    }

    if (status === 'approved') {
      try {
        if (claimed.type === 'update') {
          await updateLink(claimed.originalUrl, {
            name: claimed.name,
            url: claimed.url,
            description: claimed.description,
            avatar: claimed.avatar,
            friendslink: claimed.friendslink,
            feeds: claimed.feeds,
            siteshot: claimed.siteshot,
            topimg: claimed.topimg,
          })
        } else {
          await addLink({
            name: claimed.name,
            url: claimed.url,
            description: claimed.description,
            avatar: claimed.avatar,
            friendslink: claimed.friendslink,
            feeds: claimed.feeds,
            siteshot: claimed.siteshot,
            topimg: claimed.topimg,
          }, className, screenshotField)
        }
      } catch (err: unknown) {
        await repository.releaseClaim(id, claimToken)
        claimToken = null
        const message = err instanceof Error ? err.message : 'GitHub 同步失败'
        return NextResponse.json({ error: `GitHub 同步失败: ${message}` }, { status: 502 })
      }
    }

    const updated = await repository.completeClaim(id, claimToken, status as SubmissionStatus)
    if (!updated) {
      await repository.releaseClaim(id, claimToken)
      claimToken = null
      return NextResponse.json({ error: '提交记录状态更新失败，请刷新后重试' }, { status: 409 })
    }
    claimToken = null

    try {
      await sendResultNotification(updated, status, reason)
    } catch {
      console.error(`[邮件] 通知提交者失败: ${updated.email}`)
    }
    return NextResponse.json(updated)
  } catch {
    if (claimToken) {
      try { await repository.releaseClaim(id, claimToken) } catch { /* keep the original API error */ }
    }
    return NextResponse.json({ error: '更新提交记录失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  try {
    const deleted = await getSubmissionRepository().deleteById(id)
    if (!deleted) return NextResponse.json({ error: '提交记录未找到' }, { status: 404 })
    return NextResponse.json({ message: '已删除' })
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
