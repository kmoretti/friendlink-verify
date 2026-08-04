import { getDatabaseProvider } from './config'
import type { ConfigRepository, SubmissionRepository } from './types'
import { MongoConfigRepository, MongoSubmissionRepository } from './mongodb/repositories'
import { MysqlConfigRepository, MysqlSubmissionRepository, SqliteConfigRepository, SqliteSubmissionRepository } from './sql/repositories'

export function getSubmissionRepository(): SubmissionRepository {
  switch (getDatabaseProvider()) {
    case 'mongodb': return new MongoSubmissionRepository()
    case 'sqlite': return new SqliteSubmissionRepository()
    case 'mysql': return new MysqlSubmissionRepository()
  }
}

export function getConfigRepository(): ConfigRepository {
  switch (getDatabaseProvider()) {
    case 'mongodb': return new MongoConfigRepository()
    case 'sqlite': return new SqliteConfigRepository()
    case 'mysql': return new MysqlConfigRepository()
  }
}
