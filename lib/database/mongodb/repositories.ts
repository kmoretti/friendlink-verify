import mongoose from 'mongoose'
import dbConnect from '@/lib/db'
import Submission, { type ISubmission } from '@/lib/models/submission'
import Config from '@/lib/models/config'
import type {
  ConfigRepository,
  CreateSubmissionInput,
  SubmissionListOptions,
  SubmissionListResult,
  SubmissionRecord,
  SubmissionRepository,
  SubmissionStatus,
} from '../types'

function toRecord(doc: ISubmission | null): SubmissionRecord | null {
  if (!doc) return null
  return {
    _id: String(doc._id),
    name: doc.name,
    url: doc.url,
    description: doc.description || '',
    avatar: doc.avatar || '',
    friendslink: doc.friendslink || '',
    siteshot: doc.siteshot || '',
    topimg: doc.topimg || '',
    feeds: doc.feeds || '',
    email: doc.email || '',
    type: doc.type,
    originalUrl: doc.originalUrl || '',
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

function isObjectId(value: string): boolean {
  return mongoose.isValidObjectId(value)
}

function idFilter(id: string) {
  return isObjectId(id) ? { _id: id } : null
}

function fieldsFromInput(input: CreateSubmissionInput | SubmissionRecord) {
  return {
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
  }
}

export class MongoSubmissionRepository implements SubmissionRepository {
  private async connect() { await dbConnect() }

  async findById(id: string) {
    const filter = idFilter(id)
    if (!filter) return null
    await this.connect()
    return toRecord(await Submission.findOne(filter))
  }

  async list(options: SubmissionListOptions): Promise<SubmissionListResult> {
    await this.connect()
    const filter: Record<string, unknown> = {}
    if (options.search) {
      filter.name = { $regex: options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    }
    if (options.status) filter.status = options.status
    const [documents, total] = await Promise.all([
      Submission.find(filter).sort({ createdAt: -1 }).skip((options.page - 1) * options.limit).limit(options.limit).lean(),
      Submission.countDocuments(filter),
    ])
    return { submissions: documents.map((doc) => toRecord(doc as unknown as ISubmission)!), total }
  }

  async listAll() {
    await this.connect()
    const documents = await Submission.find().sort({ createdAt: 1 }).lean()
    return documents.map((doc) => toRecord(doc as unknown as ISubmission)!)
  }

  async create(input: CreateSubmissionInput) {
    await this.connect()
    return toRecord(await Submission.create(fieldsFromInput(input)))!
  }

  async updateStatus(id: string, status: SubmissionStatus) {
    const filter = idFilter(id)
    if (!filter) return null
    await this.connect()
    return toRecord(await Submission.findOneAndUpdate(filter, { status }, { new: true }))
  }

  async claimPending(id: string, token: string) {
    const filter = idFilter(id)
    if (!filter) return null
    await this.connect()
    const staleBefore = new Date(Date.now() - 10 * 60 * 1000)
    const claimed = await Submission.findOneAndUpdate(
      { ...filter, status: 'pending', $or: [{ processingToken: null }, { updatedAt: { $lt: staleBefore } }] },
      { processingToken: token, updatedAt: new Date() },
      { new: true }
    )
    return toRecord(claimed)
  }

  async completeClaim(id: string, token: string, status: SubmissionStatus) {
    const filter = idFilter(id)
    if (!filter) return null
    await this.connect()
    return toRecord(await Submission.findOneAndUpdate(
      { ...filter, processingToken: token },
      { status, $unset: { processingToken: 1 }, updatedAt: new Date() },
      { new: true }
    ))
  }

  async releaseClaim(id: string, token: string) {
    const filter = idFilter(id)
    if (!filter) return
    await this.connect()
    await Submission.updateOne({ ...filter, processingToken: token }, { $unset: { processingToken: 1 } })
  }

  async deleteById(id: string) {
    const filter = idFilter(id)
    if (!filter) return false
    await this.connect()
    return Boolean(await Submission.findOneAndDelete(filter))
  }

  async deleteExpired(status: SubmissionStatus, cutoff: Date) {
    await this.connect()
    const result = await Submission.deleteMany({ status, createdAt: { $lt: cutoff } })
    return result.deletedCount
  }

  async upsert(record: SubmissionRecord) {
    await this.connect()
    const filter = idFilter(record._id)
    if (!filter) throw new Error(`MongoDB 迁移需要有效 ObjectId：${record._id}`)
    await Submission.findOneAndUpdate(filter, fieldsFromInput(record), { upsert: true, new: true, setDefaultsOnInsert: true })
  }

  async ping() {
    await this.connect()
    await mongoose.connection.db?.command({ ping: 1 })
  }
}

export class MongoConfigRepository implements ConfigRepository {
  private async connect() { await dbConnect() }

  async get(key: string) {
    await this.connect()
    const doc = await Config.findOne({ key })
    return doc?.value ?? null
  }

  async set(key: string, value: string) {
    await this.connect()
    await Config.findOneAndUpdate({ key }, { value }, { upsert: true, new: true })
  }

  async listAll() {
    await this.connect()
    const documents = await Config.find().sort({ key: 1 }).lean()
    return documents.map((doc) => ({ key: doc.key, value: doc.value }))
  }

  async ping() {
    await this.connect()
    await mongoose.connection.db?.command({ ping: 1 })
  }
}
