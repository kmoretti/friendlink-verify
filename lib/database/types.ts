export type DatabaseProvider = 'mongodb' | 'sqlite' | 'mysql'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected'
export type SubmissionType = 'apply' | 'update'

export interface SubmissionRecord {
  _id: string
  name: string
  url: string
  description: string
  avatar: string
  friendslink: string
  siteshot: string
  topimg: string
  feeds: string
  email: string
  type: SubmissionType
  originalUrl: string
  status: SubmissionStatus
  createdAt: Date
  updatedAt: Date
}

export type CreateSubmissionInput = Omit<SubmissionRecord, '_id' | 'createdAt' | 'updatedAt'>

export interface SubmissionListOptions {
  page: number
  limit: number
  search?: string
  status?: SubmissionStatus
}

export interface SubmissionListResult {
  submissions: SubmissionRecord[]
  total: number
}

export interface SubmissionRepository {
  findById(id: string): Promise<SubmissionRecord | null>
  list(options: SubmissionListOptions): Promise<SubmissionListResult>
  listAll(): Promise<SubmissionRecord[]>
  create(input: CreateSubmissionInput): Promise<SubmissionRecord>
  updateStatus(id: string, status: SubmissionStatus): Promise<SubmissionRecord | null>
  claimPending(id: string, token: string): Promise<SubmissionRecord | null>
  completeClaim(id: string, token: string, status: SubmissionStatus): Promise<SubmissionRecord | null>
  releaseClaim(id: string, token: string): Promise<void>
  deleteById(id: string): Promise<boolean>
  deleteExpired(status: SubmissionStatus, cutoff: Date): Promise<number>
  upsert(record: SubmissionRecord): Promise<void>
  ping(): Promise<void>
}

export interface ConfigRepository {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  listAll(): Promise<Array<{ key: string; value: string }>>
  ping(): Promise<void>
}
