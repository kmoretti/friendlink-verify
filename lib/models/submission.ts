import mongoose, { Schema, Document } from 'mongoose'

export interface ISubmission extends Document {
  name: string
  url: string
  description: string
  avatar: string
  friendslink: string
  siteshot: string
  topimg: string
  feeds: string
  email: string
  type: 'apply' | 'update'
  originalUrl: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String, default: '' },
    avatar: { type: String, default: '' },
    friendslink: { type: String, default: '' },
    siteshot: { type: String, default: '' },
    topimg: { type: String, default: '' },
    feeds: { type: String, default: '' },
    email: { type: String, default: '' },
    type: {
      type: String,
      enum: ['apply', 'update'],
      default: 'apply',
    },
    originalUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

export default mongoose.models.Submission ||
  mongoose.model<ISubmission>('Submission', SubmissionSchema)
