import type { DatabaseProvider } from './types'

export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseConfigurationError'
  }
}

export function getDatabaseProvider(): DatabaseProvider {
  const value = (process.env.DATABASE_PROVIDER || 'mongodb').trim().toLowerCase()
  if (value === 'mongodb' || value === 'sqlite' || value === 'mysql') return value
  throw new DatabaseConfigurationError(
    `DATABASE_PROVIDER 必须是 mongodb、sqlite 或 mysql，当前值为 ${value || '(空)'}`
  )
}

export function getMongoUri(): string {
  const value = process.env.MONGODB_URI?.trim()
  if (!value) throw new DatabaseConfigurationError('请配置 MONGODB_URI')
  return value
}

export function getSqlitePath(): string {
  return process.env.SQLITE_PATH?.trim() || '/data/friendlink.db'
}

export function getMysqlUrl(): string {
  const value = process.env.MYSQL_URL?.trim()
  if (!value) throw new DatabaseConfigurationError('请配置 MYSQL_URL')
  return value
}

export function assertSqlProvider(provider: DatabaseProvider): asserts provider is 'sqlite' | 'mysql' {
  if (provider === 'mongodb') {
    throw new DatabaseConfigurationError('该操作需要 DATABASE_PROVIDER=sqlite 或 mysql')
  }
}
