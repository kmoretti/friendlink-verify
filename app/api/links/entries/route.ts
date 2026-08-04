import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { LinkManagementError, updateManagedLink } from '@/lib/github'

const MAX_TEXT_LENGTH = 2000

function errorResponse(error: unknown) {
  if (error instanceof LinkManagementError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode })
  }
  console.error('[友链] 编辑失败', error)
  return NextResponse.json({ error: 'GitHub 友链服务暂不可用' }, { status: 502 })
}

function isText(value: unknown, maxLength = MAX_TEXT_LENGTH): value is string {
  return typeof value === 'string' && value.length <= maxLength
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  try {
    const body = await request.json()
    const requiredKeys = ['originalGroupName', 'originalLink', 'targetGroupName', 'name', 'link', 'avatar']
    if (requiredKeys.some((key) => typeof body[key] !== 'string' || !body[key].trim())) {
      return NextResponse.json({ error: '原分组、原链接、目标分组、名称、地址和头像不能为空' }, { status: 400 })
    }

    const optionalKeys = ['descr', 'feeds', 'friendslink', 'screenshot']
    if (optionalKeys.some((key) => body[key] !== undefined && !isText(body[key]))) {
      return NextResponse.json({ error: '友链字段格式无效或内容过长' }, { status: 400 })
    }
    if (body.tags !== undefined && !Array.isArray(body.tags) && typeof body.tags !== 'string') {
      return NextResponse.json({ error: 'tags 格式无效' }, { status: 400 })
    }
    if (Array.isArray(body.tags) && body.tags.some((tag: unknown) => typeof tag !== 'string' || tag.length > 80)) {
      return NextResponse.json({ error: 'tags 中包含无效或过长标签' }, { status: 400 })
    }

    const groups = await updateManagedLink({
      originalGroupName: body.originalGroupName,
      originalLink: body.originalLink,
      targetGroupName: body.targetGroupName,
      name: body.name,
      link: body.link,
      avatar: body.avatar,
      descr: body.descr || '',
      feeds: body.feeds,
      friendslink: body.friendslink,
      screenshot: body.screenshot,
      tags: body.tags,
    })
    return NextResponse.json({ groups })
  } catch (error) {
    return errorResponse(error)
  }
}
