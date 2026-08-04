import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getLinkGroups, LinkManagementError } from '@/lib/github'

function errorResponse(error: unknown) {
  if (error instanceof LinkManagementError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode })
  }
  console.error('[友链管理] 请求失败', error)
  return NextResponse.json({ error: 'GitHub 友链服务暂不可用' }, { status: 502 })
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  try {
    return NextResponse.json({ groups: await getLinkGroups() })
  } catch (error) {
    return errorResponse(error)
  }
}
