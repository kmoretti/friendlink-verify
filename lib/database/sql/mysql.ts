import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import { getMysqlUrl } from '../config'
import * as schema from './schema'

export type MysqlDatabase = ReturnType<typeof drizzle<typeof schema>>

let database: MysqlDatabase | null = null

export function getMysqlDatabase(): MysqlDatabase {
  if (database) return database
  database = drizzle(getMysqlUrl(), { schema, mode: 'default' })
  return database
}

export async function migrateMysqlDatabase(migrationsFolder = './drizzle/mysql') {
  await migrate(getMysqlDatabase(), { migrationsFolder })
}

export async function pingMysql() {
  await getMysqlDatabase().execute(sql`SELECT 1`)
}

export async function closeMysqlDatabase() {
  const client = getMysqlDatabase().$client
  if ('end' in client && typeof client.end === 'function') await client.end()
  database = null
}
