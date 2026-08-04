import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './lib/database/sql/schema.ts',
  out: './drizzle/sqlite',
  dbCredentials: { url: process.env.SQLITE_PATH || './data/friendlink.db' },
})
