import { sql } from 'drizzle-orm'
import { pgTable, text, varchar, integer, timestamp, numeric, boolean, jsonb, pgEnum, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  })
);

// User storage table
export const users = pgTable('users', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email').unique().notNull(),
  passwordHash: text('password_hash'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  verificationToken: varchar('verification_token'),
  verificationTokenExpires: timestamp('verification_token_expires'),
  resetToken: varchar('reset_token'),
  resetTokenExpires: timestamp('reset_token_expires'),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  profileImageUrl: varchar('profile_image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type UpsertUser = typeof users.$inferInsert
export type User = typeof users.$inferSelect

// LLM test results table (used by FastAPI backend)
export const results = pgTable('results', {
  id: integer('id').primaryKey().default(sql`nextval('results_id_seq'::regclass)`),
  ts: timestamp('ts', { withTimezone: true }).defaultNow(),
  provider: varchar('provider').notNull(),
  model: varchar('model').notNull(),
  latencyS: numeric('latency_s'),
  tps: numeric('tps'),
  costUsd: numeric('cost_usd'),
  inTokens: integer('in_tokens'),
  outTokens: integer('out_tokens'),
  error: text('error'),
})

// Alert types enum
export const alertTypeEnum = pgEnum('alert_type', [
  'latency',
  'tps_drop',
  'cost_mtok',
  'error',
  'digest',
])

// Window enum
export const windowEnum = pgEnum('window', ['7d', '24h'])

// Cadence enum
export const cadenceEnum = pgEnum('cadence', [
  '5m',
  '15m',
  '1h',
  '4h',
  '12h',
  '24h',
])

// Alerts table
export const alerts = pgTable('alerts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: alertTypeEnum('type').notNull(),
  model: text('model'),
  threshold: numeric('threshold'),
  window: windowEnum('window'),
  cadence: cadenceEnum('cadence').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// User settings table
export const userSettings = pgTable('user_settings', {
  userId: varchar('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  currency: text('currency').default('GBP').notNull(),
  quietHours: jsonb('quiet_hours'),
})

// Email events table
export const emailEvents = pgTable('email_events', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  alertId: integer('alert_id').references(() => alerts.id, { onDelete: 'set null' }),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  status: text('status').notNull(),
  payload: jsonb('payload'),
})

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  alerts: many(alerts),
  settings: one(userSettings),
  emailEvents: many(emailEvents),
}))

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  emailEvents: many(emailEvents),
}))

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}))

export const emailEventsRelations = relations(emailEvents, ({ one }) => ({
  user: one(users, {
    fields: [emailEvents.userId],
    references: [users.id],
  }),
  alert: one(alerts, {
    fields: [emailEvents.alertId],
    references: [alerts.id],
  }),
}))
