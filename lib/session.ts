import { randomBytes } from 'crypto'
import { db } from '@/server/db'
import { sessions } from '@/shared/schema'
import { eq, lt } from 'drizzle-orm'

export interface SessionData {
  userId: string
  email: string
  createdAt: number
}

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function createSession(userId: string, email: string): Promise<string> {
  // Generate secure random session ID
  const sessionId = randomBytes(32).toString('hex')
  
  const sessionData: SessionData = {
    userId,
    email,
    createdAt: Date.now(),
  }
  
  const expiresAt = new Date(Date.now() + SESSION_DURATION)
  
  // Store session in database
  await db.insert(sessions).values({
    sid: sessionId,
    sess: sessionData,
    expire: expiresAt,
  })
  
  return sessionId
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  if (!sessionId) return null
  
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.sid, sessionId))
    .limit(1)
  
  if (!session) return null
  
  // Check if session is expired
  if (session.expire < new Date()) {
    // Clean up expired session
    await db.delete(sessions).where(eq(sessions.sid, sessionId))
    return null
  }
  
  return session.sess as SessionData
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (!sessionId) return
  
  await db.delete(sessions).where(eq(sessions.sid, sessionId))
}

export async function cleanExpiredSessions(): Promise<void> {
  // Clean up all expired sessions
  await db.delete(sessions).where(lt(sessions.expire, new Date()))
}
