import { pgTable, text, serial, integer, timestamp, numeric, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Sessions table for NextAuth
export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
})

// Verification tokens table for NextAuth magic-link
export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  pk: { primaryKey: [table.identifier, table.token] }
}))

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
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  currency: text('currency').default('GBP').notNull(),
  quietHours: jsonb('quiet_hours'),
})

// Email events table
export const emailEvents = pgTable('email_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  alertId: integer('alert_id').references(() => alerts.id, { onDelete: 'set null' }),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  status: text('status').notNull(),
  payload: jsonb('payload'),
})

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  alerts: many(alerts),
  settings: one(userSettings),
  emailEvents: many(emailEvents),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const verificationTokensRelations = relations(verificationTokens, ({ one }) => ({}))

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
