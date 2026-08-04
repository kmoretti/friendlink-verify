import { Octokit } from 'octokit'
import yaml from 'js-yaml'

export const DEFAULT_GROUP_NAME = '网上邻居'
export const DEFAULT_GROUP_DESC = '我的网络朋友们~'

export interface LinkEntry {
  name: string
  url: string
  description?: string
  avatar?: string
  friendslink?: string
  feeds?: string
  siteshot?: string
  topimg?: string
  tags?: string[]
}

export interface YmlLink {
  name: string
  link: string
  avatar: string
  descr: string
  friendslink?: string
  feeds?: string
  siteshot?: string
  topimg?: string
  tags?: string[]
  [key: string]: unknown
}

export interface YmlGroup {
  class_name: string
  class_desc: string
  link_list: YmlLink[]
  [key: string]: unknown
}

export interface ManagedLinkUpdate {
  originalGroupName: string
  originalLink: string
  targetGroupName: string
  name: string
  link: string
  avatar: string
  descr: string
  feeds?: string
  friendslink?: string
  screenshot?: string
  tags?: string[] | string
}

interface GitHubConfig {
  token: string
  repo: string
  path: string
}

export class LinkManagementError extends Error {
  constructor(
    public readonly statusCode: 400 | 404 | 409 | 502,
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'LinkManagementError'
  }
}

function normalizeGitHubPath(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^\/+/, '')
}

function getConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  const rawPath = process.env.GITHUB_FILE_PATH
  const path = rawPath ? normalizeGitHubPath(rawPath) : ''

  if (!token || !repo || !path) return null
  return { token, repo, path }
}

function requireConfig(): GitHubConfig {
  const config = getConfig()
  if (!config) {
    throw new LinkManagementError(502, 'GitHub 未配置', 'GITHUB_NOT_CONFIGURED')
  }
  return config
}

function isNotFound(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status?: number }).status === 404
  )
}

function getOctokit(config: GitHubConfig) {
  const [owner, repo] = config.repo.split('/')
  if (!owner || !repo || config.repo.split('/').length !== 2) {
    throw new LinkManagementError(502, 'GITHUB_REPO 必须是 owner/repo 格式', 'INVALID_GITHUB_REPO')
  }
  return { octokit: new Octokit({ auth: config.token }), owner, repo }
}

export function sanitizeUrl(url: string): string {
  const value = (url || '').trim()
  if (!value) return value
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return `https://${value}`.replace(/\/+$/, '')
  }
  return value.replace(/\/+$/, '')
}

export function normalizeTags(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  return [...new Set(
    values
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  )]
}

function getDefaultGroup(name = DEFAULT_GROUP_NAME): YmlGroup {
  return {
    class_name: name,
    class_desc: DEFAULT_GROUP_DESC,
    link_list: [],
  }
}

function getNewLink(entry: LinkEntry, screenshotField: 'siteshot' | 'topimg'): YmlLink {
  const link: YmlLink = {
    name: entry.name.trim(),
    link: sanitizeUrl(entry.url),
    avatar: sanitizeUrl(entry.avatar || ''),
    descr: entry.description?.trim() || '',
  }

  const screenshot = sanitizeUrl(entry.siteshot || entry.topimg || '')
  if (screenshot) link[screenshotField] = screenshot
  if (entry.feeds?.trim()) link.feeds = sanitizeUrl(entry.feeds)
  if (entry.friendslink?.trim()) link.friendslink = sanitizeUrl(entry.friendslink)

  const tags = normalizeTags(entry.tags)
  if (tags.length > 0) link.tags = tags

  return link
}

function validateGroups(value: unknown): YmlGroup[] {
  if (value == null) return []
  if (!Array.isArray(value)) {
    throw new LinkManagementError(502, 'GitHub YAML 顶层必须是分组数组', 'INVALID_YAML')
  }

  return value.map((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      throw new LinkManagementError(502, `GitHub YAML 第 ${index + 1} 个分组格式无效`, 'INVALID_YAML')
    }

    const group = raw as Partial<YmlGroup>
    if (typeof group.class_name !== 'string' || !Array.isArray(group.link_list)) {
      throw new LinkManagementError(502, `GitHub YAML 第 ${index + 1} 个分组缺少必要字段`, 'INVALID_YAML')
    }

    const linkList = group.link_list.map((rawLink, linkIndex) => {
      if (!rawLink || typeof rawLink !== 'object') {
        throw new LinkManagementError(502, `GitHub YAML 分组“${group.class_name}”第 ${linkIndex + 1} 条友链格式无效`, 'INVALID_YAML')
      }
      const link = { ...(rawLink as Record<string, unknown>) } as YmlLink
      if (link.tags !== undefined) {
        const tags = normalizeTags(link.tags)
        if (tags.length > 0) link.tags = tags
        else delete link.tags
      }
      return link
    })

    return {
      ...group,
      class_name: group.class_name,
      class_desc: typeof group.class_desc === 'string' ? group.class_desc : '',
      link_list: linkList,
    } as YmlGroup
  })
}

async function getYmlContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string
): Promise<{ sha: string; groups: YmlGroup[] }> {
  const { data } = await octokit.rest.repos.getContent({ owner, repo, path })
  if (Array.isArray(data) || !('content' in data) || !('sha' in data)) {
    throw new LinkManagementError(502, 'GitHub 目标路径不是可读的 YAML 文件', 'INVALID_GITHUB_FILE')
  }

  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  const groups = validateGroups(yaml.load(content))
  return { sha: data.sha, groups }
}

async function readGroups(config: GitHubConfig): Promise<{ sha?: string; groups: YmlGroup[] }> {
  const { octokit, owner, repo } = getOctokit(config)
  try {
    return await getYmlContent(octokit, owner, repo, config.path)
  } catch (error) {
    if (isNotFound(error)) return { groups: [] }
    throw error
  }
}

async function writeYml(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  groups: YmlGroup[],
  message: string,
  sha?: string
) {
  const ymlStr = yaml.dump(groups, { lineWidth: -1, noRefs: true, quotingType: "'" })
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(ymlStr).toString('base64'),
    sha,
  })
}

function detectScreenshotField(groups: YmlGroup[]): 'siteshot' | 'topimg' | null {
  for (const group of groups) {
    for (const link of group.link_list) {
      if (link.topimg && !link.siteshot) return 'topimg'
      if (link.siteshot) return 'siteshot'
    }
  }
  return null
}

function findGroup(groups: YmlGroup[], name: string): YmlGroup | undefined {
  return groups.find((group) => group.class_name === name)
}

function requireGroupName(name: unknown, label = '分组名称'): string {
  if (typeof name !== 'string' || !name.trim()) {
    throw new LinkManagementError(400, `${label}不能为空`, 'INVALID_GROUP_NAME')
  }
  return name.trim()
}

function requireLinkField(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new LinkManagementError(400, `${label}不能为空`, 'INVALID_LINK_FIELD')
  }
  return value.trim()
}

function setOptionalField(link: YmlLink, key: 'feeds' | 'friendslink', value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    link[key] = sanitizeUrl(value)
  } else {
    delete link[key]
  }
}

function updateScreenshotFields(
  updated: YmlLink,
  existing: YmlLink,
  screenshot: unknown,
  groups: YmlGroup[]
) {
  delete updated.siteshot
  delete updated.topimg

  if (typeof screenshot !== 'string' || !screenshot.trim()) return

  const value = sanitizeUrl(screenshot)
  if (existing.siteshot) updated.siteshot = value
  if (existing.topimg) updated.topimg = value
  if (!existing.siteshot && !existing.topimg) {
    const field = detectScreenshotField(groups) || 'siteshot'
    updated[field] = value
  }
}

export async function addLink(
  entry: LinkEntry,
  className?: string,
  screenshotField?: 'siteshot' | 'topimg'
) {
  const config = requireConfig()
  const { octokit, owner, repo } = getOctokit(config)
  const { sha, groups } = await readGroups(config)
  const requestedName = className?.trim() || DEFAULT_GROUP_NAME
  let targetGroup = findGroup(groups, requestedName)

  if (!targetGroup) {
    if (groups.length > 0 && requestedName !== DEFAULT_GROUP_NAME) {
      throw new LinkManagementError(404, `未找到友链分组“${requestedName}”`, 'GROUP_NOT_FOUND')
    }
    targetGroup = getDefaultGroup(requestedName)
    groups.push(targetGroup)
  }

  const field = screenshotField || detectScreenshotField(groups) || 'siteshot'
  targetGroup.link_list.push(getNewLink(entry, field))
  await writeYml(octokit, owner, repo, config.path, groups, `Add friend link: ${entry.name}`, sha)
  return true
}

export async function getClassNames(): Promise<string[]> {
  const config = getConfig()
  if (!config) return []

  try {
    const { groups } = await readGroups(config)
    const names = groups.map((group) => group.class_name)
    if (!names.includes(DEFAULT_GROUP_NAME)) names.unshift(DEFAULT_GROUP_NAME)
    return names
  } catch {
    return []
  }
}

export async function updateLink(originalUrl: string, entry: LinkEntry) {
  const config = requireConfig()
  const { octokit, owner, repo } = getOctokit(config)
  const { sha, groups } = await getYmlContent(octokit, owner, repo, config.path)
  const origUrl = sanitizeUrl(originalUrl)

  let found = false
  for (const group of groups) {
    const idx = group.link_list.findIndex((link) => sanitizeUrl(link.link) === origUrl)
    if (idx === -1) continue

    const existing = group.link_list[idx]
    const updated: YmlLink = {
      ...existing,
      name: entry.name,
      link: sanitizeUrl(entry.url),
      avatar: sanitizeUrl(entry.avatar || existing.avatar),
      descr: entry.description || existing.descr,
    }

    if (entry.feeds) updated.feeds = sanitizeUrl(entry.feeds)
    else if (existing.feeds) updated.feeds = existing.feeds
    if (entry.friendslink) updated.friendslink = sanitizeUrl(entry.friendslink)
    else if (existing.friendslink) updated.friendslink = existing.friendslink

    const newScreenshot = sanitizeUrl(entry.siteshot || entry.topimg || '')
    if (newScreenshot) {
      if (existing.topimg && !existing.siteshot) updated.topimg = newScreenshot
      else updated.siteshot = newScreenshot
    } else {
      if (existing.topimg) updated.topimg = existing.topimg
      if (existing.siteshot) updated.siteshot = existing.siteshot
    }

    if (entry.tags !== undefined) {
      const tags = normalizeTags(entry.tags)
      if (tags.length > 0) updated.tags = tags
      else delete updated.tags
    }

    group.link_list[idx] = updated
    found = true
    break
  }

  if (!found) throw new LinkManagementError(404, `未找到原链接“${originalUrl}”对应的友链记录`, 'LINK_NOT_FOUND')

  await writeYml(octokit, owner, repo, config.path, groups, `Update friend link: ${entry.name}`, sha)
  return true
}

export async function getScreenshotField(): Promise<'siteshot' | 'topimg' | null> {
  const config = getConfig()
  if (!config) return null

  try {
    const { groups } = await readGroups(config)
    return detectScreenshotField(groups)
  } catch {
    return null
  }
}

export function getGitHubStatus() {
  const config = getConfig()
  if (!config) return { configured: false }
  return { configured: true, repo: config.repo, path: config.path }
}

export async function getLinkGroups(): Promise<YmlGroup[]> {
  const config = requireConfig()
  const { groups } = await readGroups(config)
  return groups
}

export async function createLinkGroup(name: string, desc?: string): Promise<YmlGroup[]> {
  const config = requireConfig()
  const { octokit, owner, repo } = getOctokit(config)
  const { sha, groups } = await readGroups(config)
  const groupName = requireGroupName(name)

  if (findGroup(groups, groupName)) {
    throw new LinkManagementError(409, `友链分组“${groupName}”已存在`, 'GROUP_EXISTS')
  }

  groups.push({
    class_name: groupName,
    class_desc: typeof desc === 'string' ? desc.trim() : DEFAULT_GROUP_DESC,
    link_list: [],
  })
  await writeYml(octokit, owner, repo, config.path, groups, `Create friend link group: ${groupName}`, sha)
  return groups
}

export async function updateLinkGroup(
  originalName: string,
  name: string,
  desc: string
): Promise<YmlGroup[]> {
  const config = requireConfig()
  const { octokit, owner, repo } = getOctokit(config)
  const { sha, groups } = await getYmlContent(octokit, owner, repo, config.path)
  const oldName = requireGroupName(originalName, '原分组名称')
  const groupName = requireGroupName(name)
  const group = findGroup(groups, oldName)

  if (!group) throw new LinkManagementError(404, `未找到友链分组“${oldName}”`, 'GROUP_NOT_FOUND')
  if (groupName !== oldName && findGroup(groups, groupName)) {
    throw new LinkManagementError(409, `友链分组“${groupName}”已存在`, 'GROUP_EXISTS')
  }

  group.class_name = groupName
  group.class_desc = typeof desc === 'string' ? desc.trim() : ''
  await writeYml(octokit, owner, repo, config.path, groups, `Update friend link group: ${groupName}`, sha)
  return groups
}

export async function deleteLinkGroup(name: string): Promise<YmlGroup[]> {
  const config = requireConfig()
  const { octokit, owner, repo } = getOctokit(config)
  const { sha, groups } = await getYmlContent(octokit, owner, repo, config.path)
  const groupName = requireGroupName(name)
  const index = groups.findIndex((group) => group.class_name === groupName)

  if (index === -1) throw new LinkManagementError(404, `未找到友链分组“${groupName}”`, 'GROUP_NOT_FOUND')
  if (groups[index].link_list.length > 0) {
    throw new LinkManagementError(409, '分组中仍有友链，请先移动友链后再删除', 'GROUP_NOT_EMPTY')
  }

  groups.splice(index, 1)
  await writeYml(octokit, owner, repo, config.path, groups, `Delete friend link group: ${groupName}`, sha)
  return groups
}

export async function updateManagedLink(input: ManagedLinkUpdate): Promise<YmlGroup[]> {
  const config = requireConfig()
  const { octokit, owner, repo } = getOctokit(config)
  const { sha, groups } = await getYmlContent(octokit, owner, repo, config.path)
  const originalGroupName = requireGroupName(input.originalGroupName, '原分组名称')
  const targetGroupName = requireGroupName(input.targetGroupName, '目标分组名称')
  const originalLink = requireLinkField(input.originalLink, '原链接')
  const name = requireLinkField(input.name, '站点名称')
  const linkUrl = requireLinkField(input.link, '站点地址')
  const avatar = requireLinkField(input.avatar, '头像地址')
  const sourceGroup = findGroup(groups, originalGroupName)
  const targetGroup = findGroup(groups, targetGroupName)

  if (!sourceGroup) throw new LinkManagementError(404, `未找到友链分组“${originalGroupName}”`, 'GROUP_NOT_FOUND')
  if (!targetGroup) throw new LinkManagementError(404, `未找到目标分组“${targetGroupName}”`, 'GROUP_NOT_FOUND')

  const originalIndex = sourceGroup.link_list.findIndex((linkItem) => sanitizeUrl(linkItem.link) === sanitizeUrl(originalLink))
  if (originalIndex === -1) throw new LinkManagementError(404, `未找到原链接“${originalLink}”`, 'LINK_NOT_FOUND')

  const duplicate = targetGroup.link_list.some((linkItem, index) => {
    const isOriginal = sourceGroup === targetGroup && index === originalIndex
    return !isOriginal && sanitizeUrl(linkItem.link) === sanitizeUrl(linkUrl)
  })
  if (duplicate) throw new LinkManagementError(409, '目标分组中已存在相同站点地址', 'LINK_EXISTS')

  const existing = sourceGroup.link_list[originalIndex]
  const updated: YmlLink = {
    ...existing,
    name,
    link: sanitizeUrl(linkUrl),
    avatar: sanitizeUrl(avatar),
    descr: typeof input.descr === 'string' ? input.descr.trim() : '',
  }
  setOptionalField(updated, 'feeds', input.feeds)
  setOptionalField(updated, 'friendslink', input.friendslink)
  updateScreenshotFields(updated, existing, input.screenshot, groups)

  const tags = normalizeTags(input.tags)
  if (tags.length > 0) updated.tags = tags
  else delete updated.tags

  if (sourceGroup === targetGroup) {
    sourceGroup.link_list[originalIndex] = updated
  } else {
    sourceGroup.link_list.splice(originalIndex, 1)
    targetGroup.link_list.push(updated)
  }

  await writeYml(octokit, owner, repo, config.path, groups, `Update managed friend link: ${name}`, sha)
  return groups
}
