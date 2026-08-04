import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'mysql',
  schema: './lib/database/sql/schema.ts',
  out: './drizzle/mysql',
  dbCredentials: { url: process.env.MYSQL_URL || 'mysql://root:password@localhost:3306/friendlink' },
})
