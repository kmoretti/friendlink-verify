import { NextResponse } from 'next/server'
import { getConfigRepository, getSubmissionRepository } from '@/lib/database/repositories'
import { getSession } from '@/lib/auth'
import { getGitHubStatus, getClassNames, getScreenshotField } from '@/lib/github'
import { sendNotification } from '@/lib/email'
import type { CreateSubmissionInput, SubmissionStatus } from '@/lib/database/types'

const STATUS_KEYS: Record<SubmissionStatus, string> = {
  pending: 'autoDeleteDays',
  approved: 'autoDeleteApprovedDays',
  rejected: 'autoDeleteRejectedDays',
}

const DEFAULTS: Record<string, number> = {
  autoDeleteDays: 7,
  autoDeleteApprovedDays: 30,
  autoDeleteRejectedDays: 30,
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function isText(value: unknown, maxLength = 5000): value is string {
  return typeof value === 'string' && value.length <= maxLength
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  if (searchParams.get('github') === '1') {
    return NextResponse.json({ github: getGitHubStatus() })
  }

  if (searchParams.get('classNames') === '1') {
    const names = await getClassNames()
    return NextResponse.json({ classNames: names })
  }

  if (searchParams.get('screenshotField') === '1') {
    const field = await getScreenshotField()
    return NextResponse.json({ field })
  }

  if (searchParams.get('public') === '1') {
    try {
      const status = searchParams.get('status')
      const validStatus = status && ['pending', 'approved', 'rejected'].includes(status)
        ? status as SubmissionStatus
        : undefined
      const result = await getSubmissionRepository().list({
        page: 1,
        limit: 10000,
        status: validStatus,
        search: searchParams.get('search') || undefined,
      })
      const submissions = result.submissions.map(({ name, description, friendslink, status, type, feeds }) => ({
        name, description, friendslink, status, type, feeds,
      }))
      return NextResponse.json({ submissions }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    } catch {
      return NextResponse.json(
        { error: '获取提交列表失败' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }
  }

  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const submissionRepository = getSubmissionRepository()
    const configRepository = getConfigRepository()

    let totalCleaned = 0
    for (const [status, configKey] of Object.entries(STATUS_KEYS) as Array<[SubmissionStatus, string]>) {
      const days = await (async () => {
        const value = await configRepository.get(configKey)
        const parsed = value === null ? DEFAULTS[configKey] : Number(value)
        return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULTS[configKey]
      })()
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      totalCleaned += await submissionRepository.deleteExpired(status, cutoff)
    }
    if (totalCleaned > 0) console.log(`自动清理了 ${totalCleaned} 条过期数据`)

    const page = parsePositiveInt(searchParams.get('page'), 1)
    const limit = Math.min(100, parsePositiveInt(searchParams.get('limit'), 10))
    const result = await submissionRepository.list({ page, limit })

    return NextResponse.json({
      submissions: result.submissions,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit),
    })
  } catch {
    return NextResponse.json({ error: '获取提交列表失败' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: Request) {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*' }

  try {
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: '请求数据格式无效' }, { status: 400, headers: corsHeaders })
    }
    const { name, url, description, avatar, friendslink, feeds, siteshot, topimg, email, type, originalUrl } = body as Record<string, unknown>

    if (![name, url, avatar, friendslink].every((value) => isText(value) && value.trim())) {
      return NextResponse.json(
        { error: '站点名称、地址、头像和友链页面不能为空且必须是文本' },
        { status: 400, headers: corsHeaders }
      )
    }

    const optionalFields = [description, feeds, siteshot, topimg, email, originalUrl]
    if (optionalFields.some((value) => value !== undefined && !isText(value))) {
      return NextResponse.json(
        { error: '提交字段格式无效或内容过长' },
        { status: 400, headers: corsHeaders }
      )
    }

    const subType = type === 'update' ? 'update' : 'apply'
    if (subType === 'update' && (!isText(originalUrl) || !originalUrl.trim())) {
      return NextResponse.json(
        { error: '更新友链时必须提供原站点地址' },
        { status: 400, headers: corsHeaders }
      )
    }

    const nameText = name as string
    const urlText = url as string
    const avatarText = avatar as string
    const friendslinkText = friendslink as string
    if (!/^https?:\/\/.+/i.test(urlText)) {
      return NextResponse.json(
        { error: 'URL 必须以 http:// 或 https:// 开头' },
        { status: 400, headers: corsHeaders }
      )
    }

    const input: CreateSubmissionInput = {
      name: nameText,
      url: urlText,
      description: (description as string | undefined) || '',
      avatar: avatarText,
      friendslink: friendslinkText,
      feeds: (feeds as string | undefined) || '',
      siteshot: (siteshot as string | undefined) || '',
      topimg: (topimg as string | undefined) || '',
      email: (email as string | undefined) || '',
      type: subType,
      originalUrl: subType === 'update' ? originalUrl as string : '',
      status: 'pending',
    }
    const submission = await getSubmissionRepository().create(input)
    await sendNotification(submission)

    return NextResponse.json(submission, { status: 201, headers: corsHeaders })
  } catch {
    return NextResponse.json({ error: '提交失败' }, { status: 500, headers: corsHeaders })
  }
}
