import mongoose from 'mongoose'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var _mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = globalThis._mongooseCache ?? { conn: null, promise: null }

if (!globalThis._mongooseCache) {
  globalThis._mongooseCache = cached
}

async function dbConnect(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable')
  }

  if (cached.conn) {
    if (cached.conn.connection.readyState === 1) return cached.conn
    cached.conn = null
    cached.promise = null
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).catch((error) => {
      cached.promise = null
      throw error
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect
