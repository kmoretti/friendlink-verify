import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Submission from '@/lib/models/submission'
import Config from '@/lib/models/config'
import { getSession } from '@/lib/auth'
import { getGitHubStatus, getClassNames, getScreenshotField } from '@/lib/github'
import { sendNotification } from '@/lib/email'

const STATUS_KEYS: Record<string, string> = {
  pending: 'autoDeleteDays',
  approved: 'autoDeleteApprovedDays',
  rejected: 'autoDeleteRejectedDays',
}

const DEFAULTS: Record<string, number> = {
  autoDeleteDays: 7,
  autoDeleteApprovedDays: 30,
  autoDeleteRejectedDays: 30,
}

async function getConfig(key: string): Promise<number> {
  const doc = await Config.findOne({ key })
  return doc ? Number(doc.value) : DEFAULTS[key]
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
      await dbConnect()
      const filter: Record<string, unknown> = {}
      const status = searchParams.get('status')
      if (status) filter.status = status
      const search = searchParams.get('search')
      if (search) filter.name = { $regex: search, $options: 'i' }
      const submissions = await Submission.find(filter, 'name description status type feeds')
        .sort({ createdAt: -1 }).lean()
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
    await dbConnect()

    let totalCleaned = 0
    for (const [status, configKey] of Object.entries(STATUS_KEYS)) {
      const days = await getConfig(configKey)
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const result = await Submission.deleteMany({
        status,
        createdAt: { $lt: cutoff },
      })
      totalCleaned += result.deletedCount
    }
    if (totalCleaned > 0) {
      console.log(`自动清理了 ${totalCleaned} 条过期数据`)
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const skip = (page - 1) * limit

    const [submissions, total] = await Promise.all([
      Submission.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Submission.countDocuments(),
    ])

    return NextResponse.json({ submissions, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json(
      { error: '获取提交列表失败' },
      { status: 500 }
    )
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
    const { name, url, description, avatar, feeds, siteshot, topimg, email, type, originalUrl } = body

    if (!name || !url || !avatar) {
      return NextResponse.json(
        { error: '站点名称、地址和头像不能为空' },
        { status: 400, headers: corsHeaders }
      )
    }

    const subType = type === 'update' ? 'update' : 'apply'

    if (subType === 'update' && !originalUrl) {
      return NextResponse.json(
        { error: '更新友链时必须提供原站点地址' },
        { status: 400, headers: corsHeaders }
      )
    }

    const urlPattern = /^https?:\/\/.+/i
    if (!urlPattern.test(url)) {
      return NextResponse.json(
        { error: 'URL 必须以 http:// 或 https:// 开头' },
        { status: 400, headers: corsHeaders }
      )
    }

    await dbConnect()

    const submission = await Submission.create({
      name,
      url,
      description: description || '',
      avatar: avatar || '',
      feeds: feeds || '',
      siteshot: siteshot || '',
      topimg: topimg || '',
      email: email || '',
      type: subType,
      originalUrl: subType === 'update' ? originalUrl : '',
      status: 'pending',
    })

    await sendNotification(submission)

    return NextResponse.json(submission, { status: 201, headers: corsHeaders })
  } catch {
    return NextResponse.json(
      { error: '提交失败' },
      { status: 500, headers: corsHeaders }
    )
  }
}
