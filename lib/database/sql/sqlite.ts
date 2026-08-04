import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { getSqlitePath } from '../config'
import * as schema from './schema'

export type SqliteDatabase = ReturnType<typeof drizzle<typeof schema>>

let database: SqliteDatabase | null = null
let rawDatabase: Database.Database | null = null

export function getSqliteRawDatabase(): Database.Database {
  if (rawDatabase) return rawDatabase
  const filePath = getSqlitePath()
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true })
  rawDatabase = new Database(filePath)
  rawDatabase.pragma('busy_timeout = 5000')
  rawDatabase.pragma('journal_mode = WAL')
  return rawDatabase
}

export function getSqliteDatabase(): SqliteDatabase {
  if (database) return database
  database = drizzle(getSqliteRawDatabase(), { schema })
  return database
}

export function migrateSqliteDatabase(migrationsFolder = './drizzle/sqlite') {
  migrate(getSqliteDatabase(), { migrationsFolder })
}

export function pingSqlite() {
  getSqliteRawDatabase().prepare('SELECT 1').get()
}

export function closeSqliteDatabase() {
  rawDatabase?.close()
  rawDatabase = null
  database = null
}
