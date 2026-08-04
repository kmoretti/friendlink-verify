import { afterEach, describe, expect, it } from 'vitest'
import { DatabaseConfigurationError, getDatabaseProvider, getSqlitePath } from '../config'

afterEach(() => {
  delete process.env.DATABASE_PROVIDER
  delete process.env.SQLITE_PATH
})

describe('database configuration', () => {
  it('defaults to MongoDB for existing deployments', () => {
    delete process.env.DATABASE_PROVIDER
    expect(getDatabaseProvider()).toBe('mongodb')
  })

  it('accepts SQLite and its default path', () => {
    process.env.DATABASE_PROVIDER = 'sqlite'
    expect(getDatabaseProvider()).toBe('sqlite')
    expect(getSqlitePath()).toBe('/data/friendlink.db')
  })

  it('rejects an unknown provider', () => {
    process.env.DATABASE_PROVIDER = 'postgres'
    expect(() => getDatabaseProvider()).toThrow(DatabaseConfigurationError)
  })
})
