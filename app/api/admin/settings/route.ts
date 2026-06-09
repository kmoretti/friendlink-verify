import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Config from '@/lib/models/config'
import { getSession } from '@/lib/auth'
import { getDefaultSubject, getDefaultHtml, getDefaultResultSubject, getDefaultResultHtml, isEmailConfigured } from '@/lib/email'

const DEFAULTS = {
  autoDeleteDays: 7,
  autoDeleteApprovedDays: 30,
  autoDeleteRejectedDays: 30,
}

async function getConfig(key: string, fallback: number | string): Promise<number | string> {
  const doc = await Config.findOne({ key })
  if (doc && String(doc.value).trim()) return isNaN(Number(doc.value)) ? doc.value : Number(doc.value)
  return fallback
}

async function setConfig(key: string, value: string) {
  await Config.findOneAndUpdate(
    { key },
    { value },
    { upsert: true }
  )
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    await dbConnect()
    const settings = {
      autoDeleteDays: Number(await getConfig('autoDeleteDays', DEFAULTS.autoDeleteDays)),
      autoDeleteApprovedDays: Number(await getConfig('autoDeleteApprovedDays', DEFAULTS.autoDeleteApprovedDays)),
      autoDeleteRejectedDays: Number(await getConfig('autoDeleteRejectedDays', DEFAULTS.autoDeleteRejectedDays)),
      emailSubjectApply: String(await getConfig('emailSubjectApply', getDefaultSubject('apply'))),
      emailSubjectUpdate: String(await getConfig('emailSubjectUpdate', getDefaultSubject('update'))),
      emailSubjectApproved: String(await getConfig('emailSubjectApproved', getDefaultResultSubject('approved'))),
      emailSubjectRejected: String(await getConfig('emailSubjectRejected', getDefaultResultSubject('rejected'))),
      emailBodyHtml: String(await getConfig('emailBodyHtml', getDefaultHtml())),
      emailBodyResult: String(await getConfig('emailBodyResult', getDefaultResultHtml())),
      emailConfigured: isEmailConfigured(),
      owoUrl: String(await getConfig('owoUrl', '')),
    }
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const body = await request.json()
    await dbConnect()

    const numKeys = [
      'autoDeleteDays',
      'autoDeleteApprovedDays',
      'autoDeleteRejectedDays',
    ] as const

    for (const key of numKeys) {
      const value = body[key]
      if (value !== undefined) {
        const days = Number(value)
        if (!Number.isInteger(days) || days < 1) {
          return NextResponse.json(
            { error: `"${key}" 必须为正整数` },
            { status: 400 }
          )
        }
        await setConfig(key, String(days))
      }
    }

    const strKeys = [
      'emailSubjectApply',
      'emailSubjectUpdate',
      'emailSubjectApproved',
      'emailSubjectRejected',
      'emailBodyHtml',
      'emailBodyResult',
      'owoUrl',
    ] as const

    for (const key of strKeys) {
      if (body[key] !== undefined) {
        await setConfig(key, String(body[key]))
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '更新设置失败' }, { status: 500 })
  }
}
