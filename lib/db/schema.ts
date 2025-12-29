import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  googleAccessToken: text('google_access_token'),
  googleRefreshToken: text('google_refresh_token'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const businesses = sqliteTable('businesses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  website: text('website'),
  address: text('address'),
  phone: text('phone'),
  city: text('city'),
  neighborhoods: text('neighborhoods'),
  services: text('services'),
  industry: text('industry'),
  gbpAccountId: text('gbp_account_id'),
  gbpLocationId: text('gbp_location_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const scheduledPosts = sqliteTable('scheduled_posts', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id),
  userId: text('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  postType: text('post_type').notNull(), // 'gbp_post', 'review_response'
  status: text('status').notNull().default('pending'), // 'pending', 'posted', 'failed'
  scheduledFor: integer('scheduled_for', { mode: 'timestamp' }).notNull(),
  postedAt: integer('posted_at', { mode: 'timestamp' }),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const generatedContent = sqliteTable('generated_content', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id),
  userId: text('user_id').notNull().references(() => users.id),
  toolId: text('tool_id').notNull(),
  prompt: text('prompt').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})
