import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { migrateMysqlDatabase } from '@/lib/database/sql/mysql'
import { migrateSqliteDatabase } from '@/lib/database/sql/sqlite'
import { getDatabaseProvider } from '@/lib/database/config'

export async function migrateDatabase() {
  const provider = getDatabaseProvider()
  if (provider === 'sqlite') {
    migrateSqliteDatabase()
    return
  }
  if (provider === 'mysql') {
    await migrateMysqlDatabase()
    return
  }
  console.log('DATABASE_PROVIDER=mongodb：Mongoose 不使用 Drizzle SQL migration，跳过 schema migration。')
}

if (process.argv[1]?.endsWith('database.ts')) {
  migrateDatabase().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
