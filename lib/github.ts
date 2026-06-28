import { Octokit } from 'octokit'
import yaml from 'js-yaml'

interface LinkEntry {
  name: string
  url: string
  description?: string
  avatar?: string
  feeds?: string
  siteshot?: string
  topimg?: string
}

interface YmlGroup {
  class_name: string
  class_desc: string
  link_list: {
    name: string
    link: string
    avatar: string
    feeds?: string
    siteshot?: string
    topimg?: string
    descr: string
  }[]
}

interface GitHubConfig {
  token: string
  repo: string
  path: string
}

function getConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  const path = process.env.GITHUB_FILE_PATH

  if (!token || !repo || !path) return null
  return { token, repo, path }
}

function sanitizeUrl(url: string): string {
  if (!url) return url
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`
  }
  return url.replace(/\/+$/, '')
}

async function getYmlContent(octokit: Octokit, owner: string, repo: string, path: string) {
  const { data } = await octokit.rest.repos.getContent({ owner, repo, path })
  const content = Buffer.from(
    (data as { content: string }).content,
    'base64'
  ).toString('utf-8')
  const sha = (data as { sha: string }).sha
  const groups = yaml.load(content) as YmlGroup[]
  return { sha, groups }
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

export async function addLink(entry: LinkEntry, className?: string, screenshotField?: 'siteshot' | 'topimg') {
  const config = getConfig()
  if (!config) throw new Error('GitHub not configured')

  const octokit = new Octokit({ auth: config.token })
  const [owner, repo] = config.repo.split('/')

  try {
    const { sha, groups } = await getYmlContent(octokit, owner, repo, config.path)
    let targetGroup: YmlGroup | undefined
    if (className) {
      targetGroup = groups.find((g) => g.class_name === className)
    }
    if (!targetGroup) {
      targetGroup = groups[groups.length - 1]
    }

    const field = screenshotField || detectScreenshotField(groups) || 'siteshot'
    const newEntry: YmlGroup['link_list'][number] = {
      name: entry.name,
      link: sanitizeUrl(entry.url),
      avatar: sanitizeUrl(entry.avatar || ''),
      descr: entry.description || '',
    }
    const screenshot = sanitizeUrl(entry.siteshot || entry.topimg || '')
    if (screenshot) newEntry[field] = screenshot
    if (entry.feeds) newEntry.feeds = sanitizeUrl(entry.feeds)

    if (targetGroup) {
      targetGroup.link_list.push(newEntry)
    } else {
      groups.push({
        class_name: className || '友情链接',
        class_desc: '我的小伙伴们',
        link_list: [newEntry],
      })
    }
    await writeYml(octokit, owner, repo, config.path, groups, `Add friend link: ${entry.name}`, sha)
    return true
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      const field = screenshotField || 'siteshot'
      const newEntry: YmlGroup['link_list'][number] = {
        name: entry.name,
        link: sanitizeUrl(entry.url),
        avatar: sanitizeUrl(entry.avatar || ''),
        descr: entry.description || '',
      }
      const screenshot = sanitizeUrl(entry.siteshot || entry.topimg || '')
      if (screenshot) newEntry[field] = screenshot
      if (entry.feeds) newEntry.feeds = sanitizeUrl(entry.feeds)

      const groups: YmlGroup[] = [{
        class_name: className || '友情链接',
        class_desc: '我的小伙伴们',
        link_list: [newEntry],
      }]
      await writeYml(octokit, owner, repo, config.path, groups, `Add friend link: ${entry.name}`)
      return true
    }
    throw error
  }
}

export async function getClassNames(): Promise<string[]> {
  const config = getConfig()
  if (!config) return []

  const octokit = new Octokit({ auth: config.token })
  const [owner, repo] = config.repo.split('/')

  try {
    const { groups } = await getYmlContent(octokit, owner, repo, config.path)
    return groups.map((g) => g.class_name)
  } catch {
    return []
  }
}

export async function updateLink(originalUrl: string, entry: LinkEntry) {
  const config = getConfig()
  if (!config) throw new Error('GitHub not configured')

  const octokit = new Octokit({ auth: config.token })
  const [owner, repo] = config.repo.split('/')
  const origUrl = sanitizeUrl(originalUrl)

  const { sha, groups } = await getYmlContent(octokit, owner, repo, config.path)

  let found = false
  for (const group of groups) {
    const idx = group.link_list.findIndex(
      (l) => sanitizeUrl(l.link) === origUrl
    )
    if (idx !== -1) {
      const existing = group.link_list[idx]
      const updated = {
        name: entry.name,
        link: sanitizeUrl(entry.url),
        avatar: sanitizeUrl(entry.avatar || existing.avatar),
        descr: entry.description || existing.descr,
      } as YmlGroup['link_list'][number]
      if (entry.feeds) {
        updated.feeds = sanitizeUrl(entry.feeds)
      } else if (existing.feeds) {
        updated.feeds = existing.feeds
      }
      const newScreenshot = sanitizeUrl(entry.siteshot || entry.topimg || '')
      if (newScreenshot) {
        if (existing.topimg && !existing.siteshot) {
          updated.topimg = newScreenshot
        } else {
          updated.siteshot = newScreenshot
        }
      } else {
        if (existing.topimg) updated.topimg = existing.topimg
        if (existing.siteshot) updated.siteshot = existing.siteshot
      }
      group.link_list[idx] = updated
      found = true
      break
    }
  }

  if (!found) throw new Error(`未找到原链接 ${originalUrl} 对应的友链记录`)

  await writeYml(octokit, owner, repo, config.path, groups, `Update friend link: ${entry.name}`, sha)
  return true
}

export async function getScreenshotField(): Promise<'siteshot' | 'topimg' | null> {
  const config = getConfig()
  if (!config) return null

  const octokit = new Octokit({ auth: config.token })
  const [owner, repo] = config.repo.split('/')

  try {
    const { groups } = await getYmlContent(octokit, owner, repo, config.path)
    return detectScreenshotField(groups)
  } catch {
    return null
  }
}

export function getGitHubStatus() {
  const config = getConfig()
  if (!config) {
    return { configured: false }
  }
  return {
    configured: true,
    repo: config.repo,
    path: config.path,
  }
}
