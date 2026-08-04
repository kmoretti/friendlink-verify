import { NextResponse } from 'next/server'
import { getDatabaseProvider } from '@/lib/database/config'
import { getConfigRepository, getSubmissionRepository } from '@/lib/database/repositories'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const ready = new URL(request.url).searchParams.get('ready') === '1'
  if (!ready) return NextResponse.json({ status: 'ok' })

  try {
    getDatabaseProvider()
    await Promise.all([
      getSubmissionRepository().ping(),
      getConfigRepository().ping(),
    ])
    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 503 })
  }
}
