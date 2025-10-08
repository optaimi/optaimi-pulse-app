import { db } from './db'
import { alerts, userSettings, emailEvents, users } from '../shared/schema'
import { eq, and, desc } from 'drizzle-orm'

// Alert CRUD operations
export async function createAlert(data: {
  userId: number
  type: 'latency' | 'tps_drop' | 'cost_mtok' | 'error' | 'digest'
  model?: string
  threshold?: string
  window?: '7d' | '24h'
  cadence: '5m' | '15m' | '1h' | '4h' | '12h' | '24h'
  active?: boolean
}) {
  const [alert] = await db.insert(alerts).values(data).returning()
  return alert
}

export async function getAlertsByUserId(userId: number) {
  return await db.query.alerts.findMany({
    where: eq(alerts.userId, userId),
    orderBy: [desc(alerts.createdAt)],
  })
}

export async function getAlertById(alertId: number, userId: number) {
  return await db.query.alerts.findFirst({
    where: and(eq(alerts.id, alertId), eq(alerts.userId, userId)),
  })
}

export async function updateAlert(
  alertId: number,
  userId: number,
  data: {
    type?: 'latency' | 'tps_drop' | 'cost_mtok' | 'error' | 'digest'
    model?: string | null
    threshold?: string | null
    window?: '7d' | '24h' | null
    cadence?: '5m' | '15m' | '1h' | '4h' | '12h' | '24h'
    active?: boolean
  }
) {
  const [alert] = await db
    .update(alerts)
    .set(data)
    .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)))
    .returning()
  return alert
}

export async function deleteAlert(alertId: number, userId: number) {
  const [alert] = await db
    .delete(alerts)
    .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)))
    .returning()
  return alert
}

export async function getAllActiveAlerts() {
  return await db.query.alerts.findMany({
    where: eq(alerts.active, true),
    with: {
      user: true,
    },
  })
}

// User Settings operations
export async function getUserSettings(userId: number) {
  return await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  })
}

export async function createUserSettings(data: {
  userId: number
  currency?: string
  quietHours?: any
}) {
  const [settings] = await db.insert(userSettings).values(data).returning()
  return settings
}

export async function updateUserSettings(
  userId: number,
  data: {
    currency?: string
    quietHours?: any
  }
) {
  const [settings] = await db
    .update(userSettings)
    .set(data)
    .where(eq(userSettings.userId, userId))
    .returning()
  return settings
}

export async function upsertUserSettings(data: {
  userId: number
  currency?: string
  quietHours?: any
}) {
  const { userId, ...updates } = data
  const existing = await getUserSettings(userId)
  if (existing) {
    return await updateUserSettings(userId, updates)
  } else {
    return await createUserSettings(data)
  }
}

// Email Events operations
export async function createEmailEvent(data: {
  userId: number
  alertId?: number | null
  status: string
  payload?: any
}) {
  const [event] = await db.insert(emailEvents).values(data).returning()
  return event
}

export async function getEmailEventsByUserId(userId: number, limit = 50) {
  return await db.query.emailEvents.findMany({
    where: eq(emailEvents.userId, userId),
    orderBy: [desc(emailEvents.sentAt)],
    limit,
  })
}

export async function getEmailEventsByAlertId(alertId: number, limit = 50) {
  return await db.query.emailEvents.findMany({
    where: eq(emailEvents.alertId, alertId),
    orderBy: [desc(emailEvents.sentAt)],
    limit,
  })
}

// User operations
export async function getUserByEmail(email: string) {
  return await db.query.users.findFirst({
    where: eq(users.email, email),
  })
}

export async function getUserById(userId: number) {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
  })
}
