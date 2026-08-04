import fs from 'node:fs'
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { getDatabaseProvider, getMongoUri, getSqlitePath } from '@/lib/database/config'
import { getConfigRepository, getSubmissionRepository } from '@/lib/database/repositories'
import type { ConfigRepository, SubmissionRecord, SubmissionRepository } from '@/lib/database/types'
import { MongoConfigRepository, MongoSubmissionRepository } from '@/lib/database/mongodb/repositories'
import { migrateDatabase } from './database'

function hasFlag(name: string) { return process.argv.includes(name) }

function printSummary(records: SubmissionRecord[], configs: Array<{ key: string; value: string }>, targetRecords: SubmissionRecord[]) {
  const statuses = records.reduce<Record<string, number>>((result, record) => {
    result[record.status] = (result[record.status] || 0) + 1
    return result
  }, {})
  const targetIds = new Set(targetRecords.map((record) => record._id))
  const conflicts = records.filter((record) => targetIds.has(record._id)).length
  console.log(JSON.stringify({
    source: { submissions: records.length, configs: configs.length, statuses },
    target: { submissions: targetRecords.length },
    conflicts,
    mode: hasFlag('--apply') ? 'apply' : 'dry-run',
  }, null, 2))
}

async function migrate() {
  const provider = getDatabaseProvider()
  if (provider === 'mongodb') {
    throw new Error('MongoDB → SQL 迁移目标必须将 DATABASE_PROVIDER 设置为 sqlite 或 mysql')
  }
  getMongoUri()

  const sourceSubmissions: SubmissionRepository = new MongoSubmissionRepository()
  const sourceConfigs: ConfigRepository = new MongoConfigRepository()
  const submissions = await sourceSubmissions.listAll()
  const configs = await sourceConfigs.listAll()

  let targetSubmissions: SubmissionRepository | null = null
  let targetConfigs: ConfigRepository | null = null
  let targetRecords: SubmissionRecord[] = []

  if (hasFlag('--apply')) {
    await migrateDatabase()
    targetSubmissions = getSubmissionRepository()
    targetConfigs = getConfigRepository()
    targetRecords = await targetSubmissions.listAll()
  } else if (provider === 'mysql' || fs.existsSync(getSqlitePath())) {
    // Dry-run only reads an already initialized target. A fresh SQLite path is
    // deliberately not opened, so dry-run does not create a database file.
    targetSubmissions = getSubmissionRepository()
    try {
      targetRecords = await targetSubmissions.listAll()
    } catch {
      console.log('目标 schema 尚未初始化；dry-run 仍保持只读，并按空目标库统计。')
    }
  } else {
    console.log('SQLite 目标文件尚不存在；dry-run 保持只读，并按空目标库统计。')
  }

  printSummary(submissions, configs, targetRecords)
  if (!hasFlag('--apply')) {
    console.log('这是 dry-run，未写入目标数据库。使用 --apply 执行 schema migration 和幂等 upsert。')
    return
  }

  for (const record of submissions) await targetSubmissions!.upsert(record)
  for (const config of configs) await targetConfigs!.set(config.key, config.value)

  const migrated = await targetSubmissions!.listAll()
  const migratedIds = new Set(migrated.map((record) => record._id))
  const missing = submissions.filter((record) => !migratedIds.has(record._id))
  if (missing.length) throw new Error(`迁移校验失败：缺少 ${missing.length} 条 Submission`)
  const targetConfigsAfter = await targetConfigs!.listAll()
  const configKeys = new Set(targetConfigsAfter.map((config) => config.key))
  const missingConfigs = configs.filter((config) => !configKeys.has(config.key))
  if (missingConfigs.length) throw new Error(`迁移校验失败：缺少 ${missingConfigs.length} 条 Config`)
  console.log(`迁移完成：${submissions.length} 条 Submission，${configs.length} 条 Config。`)
}

migrate().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
