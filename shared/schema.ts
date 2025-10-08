import { sql } from 'drizzle-orm'
import { pgTable, text, varchar, integer, timestamp, numeric, boolean, jsonb, pgEnum, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Replit Auth - Session storage table (MANDATORY)
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

// Replit Auth - User storage table (MANDATORY)
export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  email: varchar('email').unique(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  profileImageUrl: varchar('profile_image_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type UpsertUser = typeof users.$inferInsert
export type User = typeof users.$inferSelect

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
