import mongoose, { Schema, Document } from 'mongoose'

export interface IConfig extends Document {
  key: string
  value: string
}

const ConfigSchema = new Schema<IConfig>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
})

export default mongoose.models.Config ||
  mongoose.model<IConfig>('Config', ConfigSchema)
