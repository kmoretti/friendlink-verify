import { and, asc, desc, eq, isNull, like, lt, or, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type {
  ConfigRepository,
  CreateSubmissionInput,
  SubmissionListOptions,
  SubmissionListResult,
  SubmissionRecord,
  SubmissionRepository,
  SubmissionStatus,
} from '../types'
import { getMysqlDatabase } from './mysql'
import { getSqliteDatabase } from './sqlite'
import { mysqlConfigs, mysqlSubmissions, sqliteConfigs, sqliteSubmissions } from './schema'

const CLAIM_TIMEOUT_MS = 10 * 60 * 1000

type RawSubmission = Record<string, unknown>

function toDate(value: number | Date | string): Date {
  return value instanceof Date ? value : new Date(typeof value === 'number' ? value : String(value))
}

function toSubmission(row: RawSubmission): SubmissionRecord {
  return {
    _id: String(row.id),
    name: String(row.name || ''),
    url: String(row.url || ''),
    description: String(row.description || ''),
    avatar: String(row.avatar || ''),
    friendslink: String(row.friendslink || ''),
    siteshot: String(row.siteshot || ''),
    topimg: String(row.topimg || ''),
    feeds: String(row.feeds || ''),
    email: String(row.email || ''),
    type: row.type === 'update' ? 'update' : 'apply',
    originalUrl: String(row.originalUrl || ''),
    status: row.status === 'approved' || row.status === 'rejected' ? row.status : 'pending',
    createdAt: toDate(row.createdAt as number | Date | string),
    updatedAt: toDate(row.updatedAt as number | Date | string),
  }
}

function submissionValues(id: string, input: CreateSubmissionInput | SubmissionRecord) {
  return {
    id,
    name: input.name,
    url: input.url,
    description: input.description || '',
    avatar: input.avatar || '',
    friendslink: input.friendslink || '',
    siteshot: input.siteshot || '',
    topimg: input.topimg || '',
    feeds: input.feeds || '',
    email: input.email || '',
    type: input.type,
    originalUrl: input.originalUrl || '',
    status: input.status,
    processingToken: null,
    createdAt: 'createdAt' in input ? input.createdAt.getTime() : Date.now(),
    updatedAt: 'updatedAt' in input ? input.updatedAt.getTime() : Date.now(),
  }
}

function conditions(table: typeof sqliteSubmissions | typeof mysqlSubmissions, options: SubmissionListOptions) {
  const values = [
    options.search ? like(table.name, `%${options.search}%`) : undefined,
    options.status ? eq(table.status, options.status) : undefined,
  ].filter(Boolean)
  return values.length ? and(...values) : undefined
}

export class SqliteSubmissionRepository implements SubmissionRepository {
  private db = getSqliteDatabase()
  private table = sqliteSubmissions

  async findById(id: string) {
    const row = await this.db.select().from(this.table).where(eq(this.table.id, id)).get()
    return row ? toSubmission(row as RawSubmission) : null
  }

  async list(options: SubmissionListOptions): Promise<SubmissionListResult> {
    const condition = conditions(this.table, options)
    const rows = await this.db.select().from(this.table).where(condition).orderBy(desc(this.table.createdAt)).limit(options.limit).offset((options.page - 1) * options.limit).all()
    const countRows = await this.db.select({ count: sql<number>`count(*)` }).from(this.table).where(condition).all()
    return { submissions: rows.map((row) => toSubmission(row as RawSubmission)), total: Number(countRows[0]?.count || 0) }
  }

  async listAll() {
    const rows = await this.db.select().from(this.table).orderBy(asc(this.table.createdAt)).all()
    return rows.map((row) => toSubmission(row as RawSubmission))
  }

  async create(input: CreateSubmissionInput) {
    const id = randomUUID()
    const now = Date.now()
    await this.db.insert(this.table).values({ ...submissionValues(id, input), createdAt: now, updatedAt: now })
    return (await this.findById(id))!
  }

  async updateStatus(id: string, status: SubmissionStatus) {
    await this.db.update(this.table).set({ status, updatedAt: Date.now() }).where(eq(this.table.id, id))
    return this.findById(id)
  }

  async claimPending(id: string, token: string) {
    const staleBefore = Date.now() - CLAIM_TIMEOUT_MS
    await this.db.update(this.table).set({ processingToken: token, updatedAt: Date.now() }).where(and(
      eq(this.table.id, id),
      eq(this.table.status, 'pending'),
      or(isNull(this.table.processingToken), lt(this.table.updatedAt, staleBefore)),
    ))
    const claimed = await this.db.select({ id: this.table.id }).from(this.table).where(and(eq(this.table.id, id), eq(this.table.processingToken, token))).get()
    return claimed ? this.findById(id) : null
  }

  async completeClaim(id: string, token: string, status: SubmissionStatus) {
    await this.db.update(this.table).set({ status, processingToken: null, updatedAt: Date.now() }).where(and(eq(this.table.id, id), eq(this.table.processingToken, token)))
    const completed = await this.db.select({ id: this.table.id }).from(this.table).where(and(eq(this.table.id, id), eq(this.table.status, status), isNull(this.table.processingToken))).get()
    return completed ? this.findById(id) : null
  }

  async releaseClaim(id: string, token: string) {
    await this.db.update(this.table).set({ processingToken: null, updatedAt: Date.now() }).where(and(eq(this.table.id, id), eq(this.table.processingToken, token)))
  }

  async deleteById(id: string) {
    if (!(await this.findById(id))) return false
    await this.db.delete(this.table).where(eq(this.table.id, id))
    return true
  }

  async deleteExpired(status: SubmissionStatus, cutoff: Date) {
    const condition = and(eq(this.table.status, status), lt(this.table.createdAt, cutoff.getTime()))
    const rows = await this.db.select({ id: this.table.id }).from(this.table).where(condition).all()
    if (rows.length) await this.db.delete(this.table).where(condition)
    return rows.length
  }

  async upsert(record: SubmissionRecord) {
    await this.db.insert(this.table).values(submissionValues(record._id, record)).onConflictDoUpdate({ target: this.table.id, set: submissionValues(record._id, record) })
  }

  async ping() { await this.db.run(sql`SELECT 1`) }
}

export class SqliteConfigRepository implements ConfigRepository {
  private db = getSqliteDatabase()
  private table = sqliteConfigs

  async get(key: string) {
    const row = await this.db.select().from(this.table).where(eq(this.table.key, key)).get()
    return row?.value ?? null
  }

  async set(key: string, value: string) {
    await this.db.insert(this.table).values({ key, value }).onConflictDoUpdate({ target: this.table.key, set: { value } })
  }

  async listAll() { return this.db.select().from(this.table).all() }
  async ping() { await this.db.run(sql`SELECT 1`) }
}

export class MysqlSubmissionRepository implements SubmissionRepository {
  private db = getMysqlDatabase()
  private table = mysqlSubmissions

  async findById(id: string) {
    const rows = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1)
    return rows[0] ? toSubmission(rows[0] as RawSubmission) : null
  }

  async list(options: SubmissionListOptions): Promise<SubmissionListResult> {
    const condition = conditions(this.table, options)
    const rows = await this.db.select().from(this.table).where(condition).orderBy(desc(this.table.createdAt)).limit(options.limit).offset((options.page - 1) * options.limit)
    const countRows = await this.db.select({ count: sql<number>`count(*)` }).from(this.table).where(condition)
    return { submissions: rows.map((row) => toSubmission(row as RawSubmission)), total: Number(countRows[0]?.count || 0) }
  }

  async listAll() {
    const rows = await this.db.select().from(this.table).orderBy(asc(this.table.createdAt))
    return rows.map((row) => toSubmission(row as RawSubmission))
  }

  async create(input: CreateSubmissionInput) {
    const id = randomUUID()
    const now = Date.now()
    await this.db.insert(this.table).values({ ...submissionValues(id, input), createdAt: now, updatedAt: now })
    return (await this.findById(id))!
  }

  async updateStatus(id: string, status: SubmissionStatus) {
    await this.db.update(this.table).set({ status, updatedAt: Date.now() }).where(eq(this.table.id, id))
    return this.findById(id)
  }

  async claimPending(id: string, token: string) {
    const staleBefore = Date.now() - CLAIM_TIMEOUT_MS
    await this.db.update(this.table).set({ processingToken: token, updatedAt: Date.now() }).where(and(
      eq(this.table.id, id),
      eq(this.table.status, 'pending'),
      or(isNull(this.table.processingToken), lt(this.table.updatedAt, staleBefore)),
    ))
    const claimed = await this.db.select({ id: this.table.id }).from(this.table).where(and(eq(this.table.id, id), eq(this.table.processingToken, token))).limit(1)
    return claimed[0] ? this.findById(id) : null
  }

  async completeClaim(id: string, token: string, status: SubmissionStatus) {
    await this.db.update(this.table).set({ status, processingToken: null, updatedAt: Date.now() }).where(and(eq(this.table.id, id), eq(this.table.processingToken, token)))
    const completed = await this.db.select({ id: this.table.id }).from(this.table).where(and(eq(this.table.id, id), eq(this.table.status, status), isNull(this.table.processingToken))).limit(1)
    return completed[0] ? this.findById(id) : null
  }

  async releaseClaim(id: string, token: string) {
    await this.db.update(this.table).set({ processingToken: null, updatedAt: Date.now() }).where(and(eq(this.table.id, id), eq(this.table.processingToken, token)))
  }

  async deleteById(id: string) {
    if (!(await this.findById(id))) return false
    await this.db.delete(this.table).where(eq(this.table.id, id))
    return true
  }

  async deleteExpired(status: SubmissionStatus, cutoff: Date) {
    const condition = and(eq(this.table.status, status), lt(this.table.createdAt, cutoff.getTime()))
    const rows = await this.db.select({ id: this.table.id }).from(this.table).where(condition)
    if (rows.length) await this.db.delete(this.table).where(condition)
    return rows.length
  }

  async upsert(record: SubmissionRecord) {
    await this.db.insert(this.table).values(submissionValues(record._id, record)).onDuplicateKeyUpdate({ set: submissionValues(record._id, record) })
  }

  async ping() { await this.db.execute(sql`SELECT 1`) }
}

export class MysqlConfigRepository implements ConfigRepository {
  private db = getMysqlDatabase()
  private table = mysqlConfigs

  async get(key: string) {
    const rows = await this.db.select().from(this.table).where(eq(this.table.key, key)).limit(1)
    return rows[0]?.value ?? null
  }

  async set(key: string, value: string) {
    await this.db.insert(this.table).values({ key, value }).onDuplicateKeyUpdate({ set: { value } })
  }

  async listAll() { return this.db.select().from(this.table) }
  async ping() { await this.db.execute(sql`SELECT 1`) }
}
