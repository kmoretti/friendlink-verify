import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createLinkGroup, LinkManagementError } from '@/lib/github'

function errorResponse(error: unknown) {
  if (error instanceof LinkManagementError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode })
  }
  console.error('[友链分组] 创建失败', error)
  return NextResponse.json({ error: 'GitHub 友链服务暂不可用' }, { status: 502 })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  try {
    const body = await request.json()
    if (typeof body.name !== 'string' || body.name.trim().length > 80) {
      return NextResponse.json({ error: '分组名称不能为空且不能超过 80 个字符' }, { status: 400 })
    }
    if (body.desc !== undefined && typeof body.desc !== 'string') {
      return NextResponse.json({ error: '分组描述格式无效' }, { status: 400 })
    }
    const groups = await createLinkGroup(body.name, body.desc)
    return NextResponse.json({ groups }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
