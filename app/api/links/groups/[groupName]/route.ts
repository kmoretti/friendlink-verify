import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { deleteLinkGroup, LinkManagementError, updateLinkGroup } from '@/lib/github'

function errorResponse(error: unknown) {
  if (error instanceof LinkManagementError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode })
  }
  console.error('[友链分组] 操作失败', error)
  return NextResponse.json({ error: 'GitHub 友链服务暂不可用' }, { status: 502 })
}

async function getGroupName(params: Promise<{ groupName: string }>) {
  const { groupName } = await params
  return decodeURIComponent(groupName)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupName: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  try {
    const originalName = await getGroupName(params)
    const body = await request.json()
    if (typeof body.name !== 'string' || body.name.trim().length > 80) {
      return NextResponse.json({ error: '分组名称不能为空且不能超过 80 个字符' }, { status: 400 })
    }
    if (typeof body.desc !== 'string' || body.desc.length > 500) {
      return NextResponse.json({ error: '分组描述格式无效或超过 500 个字符' }, { status: 400 })
    }
    const groups = await updateLinkGroup(originalName, body.name, body.desc)
    return NextResponse.json({ groups })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupName: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  try {
    const groups = await deleteLinkGroup(await getGroupName(params))
    return NextResponse.json({ groups })
  } catch (error) {
    return errorResponse(error)
  }
}
