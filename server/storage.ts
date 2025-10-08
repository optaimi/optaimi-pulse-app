import { db } from './db'
import { alerts, userSettings, emailEvents, users, type User, type UpsertUser } from '../shared/schema'
import { eq, and, desc } from 'drizzle-orm'
import { cookies } from 'next/headers'

// User operations (REQUIRED for Replit Auth)
export async function getUser(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id))
  return user
}

export async function getUserFromRequest(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('connect.sid')
    
    if (!sessionCookie) {
      return null
    }

    // Proxy to Express auth server to get current user
    const res = await fetch('http://localhost:3001/api/auth/user', {
      headers: {
        cookie: `connect.sid=${sessionCookie.value}`,
      },
    })

    if (!res.ok) {
      return null
    }

    const userData = await res.json()
    return userData
  } catch (error) {
    console.error('Error fetching user from request:', error)
    return null
  }
}

export async function upsertUser(userData: UpsertUser): Promise<User> {
  const [user] = await db
    .insert(users)
    .values(userData)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    })
    .returning()
  return user
}

// Alert CRUD operations
export async function createAlert(data: {
  userId: string
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

export async function getAlertsByUserId(userId: string) {
  return await db.query.alerts.findMany({
    where: eq(alerts.userId, userId),
    orderBy: [desc(alerts.createdAt)],
  })
}

export async function getAlertById(alertId: number, userId: string) {
  return await db.query.alerts.findFirst({
    where: and(eq(alerts.id, alertId), eq(alerts.userId, userId)),
  })
}

export async function updateAlert(
  alertId: number,
  userId: string,
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

export async function deleteAlert(alertId: number, userId: string) {
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
export async function getUserSettings(userId: string) {
  return await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  })
}

export async function createUserSettings(data: {
  userId: string
  currency?: string
  quietHours?: any
}) {
  const [settings] = await db.insert(userSettings).values(data).returning()
  return settings
}

export async function updateUserSettings(
  userId: string,
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
  userId: string
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
  userId: string
  alertId?: number | null
  status: string
  payload?: any
}) {
  const [event] = await db.insert(emailEvents).values(data).returning()
  return event
}

export async function getEmailEventsByUserId(userId: string, limit = 50) {
  return await db.query.emailEvents.findMany({
    where: eq(emailEvents.userId, userId),
    orderBy: [desc(emailEvents.sentAt)],
    limit,
  })
}

// Export storage object for Replit Auth integration
export const storage = {
  getUser,
  upsertUser,
  createAlert,
  getAlertsByUserId,
  getAlertById,
  updateAlert,
  deleteAlert,
  getAllActiveAlerts,
  getUserSettings,
  createUserSettings,
  updateUserSettings,
  upsertUserSettings,
  createEmailEvent,
  getEmailEventsByUserId,
}
