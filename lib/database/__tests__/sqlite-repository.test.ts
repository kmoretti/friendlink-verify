import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, afterEach, describe, expect, it } from 'vitest'

const dbPath = path.join(os.tmpdir(), `friendlink-verify-${process.pid}.db`)

beforeEach(async () => {
  process.env.DATABASE_PROVIDER = 'sqlite'
  process.env.SQLITE_PATH = dbPath
  const { closeSqliteDatabase, migrateSqliteDatabase } = await import('../sql/sqlite')
  closeSqliteDatabase()
  fs.rmSync(dbPath, { force: true })
  migrateSqliteDatabase()
})

afterEach(async () => {
  const { closeSqliteDatabase } = await import('../sql/sqlite')
  closeSqliteDatabase()
  fs.rmSync(dbPath, { force: true })
  delete process.env.DATABASE_PROVIDER
  delete process.env.SQLITE_PATH
})

describe('SQLite repositories', () => {
  it('creates, lists, filters, updates and deletes submissions', async () => {
    const { SqliteSubmissionRepository } = await import('../sql/repositories')
    const repository = new SqliteSubmissionRepository()
    const record = await repository.create({
      name: 'SQLite Test',
      url: 'https://example.com',
      description: '',
      avatar: 'https://example.com/avatar.png',
      friendslink: 'https://example.com/friends',
      siteshot: '',
      topimg: '',
      feeds: '',
      email: '',
      type: 'apply',
      originalUrl: '',
      status: 'pending',
    })

    expect(record._id).toMatch(/^[0-9a-f-]{36}$/)
    expect((await repository.list({ page: 1, limit: 10, search: 'sqlite' })).total).toBe(1)
    expect((await repository.updateStatus(record._id, 'approved'))?.status).toBe('approved')
    expect(await repository.deleteById(record._id)).toBe(true)
    expect(await repository.findById(record._id)).toBeNull()
  })

  it('claims pending submissions only once and releases failed claims', async () => {
    const { SqliteSubmissionRepository } = await import('../sql/repositories')
    const repository = new SqliteSubmissionRepository()
    const record = await repository.create({
      name: 'Claim Test', url: 'https://example.com', description: '', avatar: '', friendslink: '',
      siteshot: '', topimg: '', feeds: '', email: '', type: 'apply', originalUrl: '', status: 'pending',
    })
    expect(await repository.claimPending(record._id, 'first-token')).not.toBeNull()
    expect(await repository.claimPending(record._id, 'second-token')).toBeNull()
    await repository.releaseClaim(record._id, 'first-token')
    expect(await repository.claimPending(record._id, 'second-token')).not.toBeNull()
    expect((await repository.completeClaim(record._id, 'second-token', 'approved'))?.status).toBe('approved')
  })

  it('upserts migrated records without duplicating them', async () => {
    const { SqliteSubmissionRepository } = await import('../sql/repositories')
    const repository = new SqliteSubmissionRepository()
    const now = new Date()
    const record = {
      _id: 'mongo-id-as-string', name: 'Migrated', url: 'https://example.com', description: '', avatar: '',
      friendslink: '', siteshot: '', topimg: '', feeds: '', email: '', type: 'apply' as const,
      originalUrl: '', status: 'pending' as const, createdAt: now, updatedAt: now,
    }
    await repository.upsert(record)
    await repository.upsert({ ...record, name: 'Migrated again' })
    expect((await repository.list({ page: 1, limit: 10 })).total).toBe(1)
    expect((await repository.findById(record._id))?.name).toBe('Migrated again')
  })
})
