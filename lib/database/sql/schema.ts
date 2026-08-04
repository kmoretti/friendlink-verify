import { bigint, index, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core'
import { integer, index as sqliteIndex, sqliteTable, text as sqliteText } from 'drizzle-orm/sqlite-core'

export const sqliteSubmissions = sqliteTable('submissions', {
  id: sqliteText('id').primaryKey(),
  name: sqliteText('name').notNull(),
  url: sqliteText('url').notNull(),
  description: sqliteText('description').notNull().default(''),
  avatar: sqliteText('avatar').notNull().default(''),
  friendslink: sqliteText('friendslink').notNull().default(''),
  siteshot: sqliteText('siteshot').notNull().default(''),
  topimg: sqliteText('topimg').notNull().default(''),
  feeds: sqliteText('feeds').notNull().default(''),
  email: sqliteText('email').notNull().default(''),
  type: sqliteText('type').notNull().default('apply'),
  originalUrl: sqliteText('original_url').notNull().default(''),
  status: sqliteText('status').notNull().default('pending'),
  processingToken: sqliteText('processing_token'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  statusCreated: sqliteIndex('submissions_status_created_idx').on(table.status, table.createdAt),
  nameIndex: sqliteIndex('submissions_name_idx').on(table.name),
}))

export const sqliteConfigs = sqliteTable('configs', {
  key: sqliteText('key').primaryKey(),
  value: sqliteText('value').notNull(),
})

export const mysqlSubmissions = mysqlTable('submissions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  description: text('description').notNull().default(''),
  avatar: text('avatar').notNull().default(''),
  friendslink: text('friendslink').notNull().default(''),
  siteshot: text('siteshot').notNull().default(''),
  topimg: text('topimg').notNull().default(''),
  feeds: text('feeds').notNull().default(''),
  email: text('email').notNull().default(''),
  type: varchar('type', { length: 16 }).notNull().default('apply'),
  originalUrl: text('original_url').notNull().default(''),
  status: varchar('status', { length: 16 }).notNull().default('pending'),
  processingToken: varchar('processing_token', { length: 64 }),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
}, (table) => ({
  statusCreated: index('submissions_status_created_idx').on(table.status, table.createdAt),
}))

export const mysqlConfigs = mysqlTable('configs', {
  key: varchar('key', { length: 191 }).primaryKey(),
  value: text('value').notNull(),
})
