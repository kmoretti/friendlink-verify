import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Submission from '@/lib/models/submission'
import { getSession } from '@/lib/auth'
import { addLink, updateLink } from '@/lib/github'
import { sendResultNotification } from '@/lib/email'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { status, reason, className, screenshotField } = body

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '状态必须为 "approved" 或 "rejected"' },
        { status: 400 }
      )
    }

    await dbConnect()

    const submission = await Submission.findById(id)
    if (!submission) {
      return NextResponse.json(
        { error: '提交记录未找到' },
        { status: 404 }
      )
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: '该提交已被处理' },
        { status: 400 }
      )
    }

    if (status === 'approved') {
      try {
        if (submission.type === 'update') {
          await updateLink(submission.originalUrl, {
            name: submission.name,
            url: submission.url,
            description: submission.description,
            avatar: submission.avatar,
            siteshot: submission.siteshot,
            topimg: submission.topimg,
          })
        } else {
          await addLink({
            name: submission.name,
            url: submission.url,
            description: submission.description,
            avatar: submission.avatar,
            siteshot: submission.siteshot,
            topimg: submission.topimg,
          }, className, screenshotField)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'GitHub 同步失败'
        return NextResponse.json(
          { error: `GitHub 同步失败: ${message}` },
          { status: 502 }
        )
      }
    }

    submission.status = status
    await submission.save()

    try {
      await sendResultNotification({
        name: submission.name,
        url: submission.url,
        description: submission.description,
        avatar: submission.avatar,
        email: submission.email,
        type: submission.type,
        originalUrl: submission.originalUrl,
        createdAt: submission.createdAt,
      }, status, reason)
    } catch {
      console.error(`[邮件] 通知提交者失败: ${submission.email}`)
    }

    return NextResponse.json(submission)
  } catch {
    return NextResponse.json(
      { error: '更新提交记录失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    await dbConnect()
    const submission = await Submission.findByIdAndDelete(id)
    if (!submission) {
      return NextResponse.json(
        { error: '提交记录未找到' },
        { status: 404 }
      )
    }
    return NextResponse.json({ message: '已删除' })
  } catch {
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    )
  }
}
