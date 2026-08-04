import { NextResponse } from 'next/server'
import { getConfigRepository } from '@/lib/database/repositories'
import { getSession } from '@/lib/auth'
import { getDefaultSubject, getDefaultHtml, getDefaultResultSubject, getDefaultResultHtml, isEmailConfigured } from '@/lib/email'

const DEFAULTS = {
  autoDeleteDays: 7,
  autoDeleteApprovedDays: 30,
  autoDeleteRejectedDays: 30,
}

async function getConfig(key: string, fallback: number | string): Promise<number | string> {
  const value = await getConfigRepository().get(key)
  if (value?.trim()) return isNaN(Number(value)) ? value : Number(value)
  return fallback
}

async function setConfig(key: string, value: string) {
  await getConfigRepository().set(key, value)
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  try {
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
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  try {
    const body = await request.json()
    const numKeys = ['autoDeleteDays', 'autoDeleteApprovedDays', 'autoDeleteRejectedDays'] as const
    for (const key of numKeys) {
      if (body[key] !== undefined) {
        const days = Number(body[key])
        if (!Number.isInteger(days) || days < 1) {
          return NextResponse.json({ error: `"${key}" 必须为正整数` }, { status: 400 })
        }
        await setConfig(key, String(days))
      }
    }

    const strKeys = [
      'emailSubjectApply', 'emailSubjectUpdate', 'emailSubjectApproved',
      'emailSubjectRejected', 'emailBodyHtml', 'emailBodyResult', 'owoUrl',
    ] as const
    for (const key of strKeys) {
      if (body[key] !== undefined) await setConfig(key, String(body[key]))
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '更新设置失败' }, { status: 500 })
  }
}
