import type { Adapter } from 'next-auth/adapters'
import { db } from './db'
import { users, sessions, verificationTokens } from '../shared/schema'
import { eq, and } from 'drizzle-orm'

export function DrizzleAdapter(): Adapter {
  return {
    async createUser(data: { email: string; emailVerified: Date | null }) {
      const [user] = await db.insert(users).values({
        email: data.email,
        emailVerified: data.emailVerified,
        passwordHash: null,
      }).returning()
      return {
        id: user.id.toString(),
        email: user.email,
        emailVerified: user.emailVerified,
      }
    },

    async getUser(id) {
      const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)))
      if (!user) return null
      return {
        id: user.id.toString(),
        email: user.email,
        emailVerified: user.emailVerified,
      }
    },

    async getUserByEmail(email) {
      const [user] = await db.select().from(users).where(eq(users.email, email))
      if (!user) return null
      return {
        id: user.id.toString(),
        email: user.email,
        emailVerified: user.emailVerified,
      }
    },

    async getUserByAccount() {
      return null
    },

    async updateUser(data) {
      const updateData: any = {}
      if (data.email !== undefined) updateData.email = data.email
      if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified
      
      const [user] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, parseInt(data.id)))
        .returning()
      return {
        id: user.id.toString(),
        email: user.email,
        emailVerified: user.emailVerified,
      }
    },

    async deleteUser(userId) {
      await db.delete(users).where(eq(users.id, parseInt(userId)))
    },

    async linkAccount() {
      return null
    },

    async unlinkAccount() {
      return undefined
    },

    async createSession(data) {
      const [session] = await db.insert(sessions).values({
        sessionToken: data.sessionToken,
        userId: parseInt(data.userId),
        expires: data.expires,
      }).returning()
      return {
        sessionToken: session.sessionToken,
        userId: session.userId.toString(),
        expires: session.expires,
      }
    },

    async getSessionAndUser(sessionToken) {
      const result = await db.select({
        session: sessions,
        user: users,
      })
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .where(eq(sessions.sessionToken, sessionToken))

      if (!result[0]) return null

      return {
        session: {
          sessionToken: result[0].session.sessionToken,
          userId: result[0].session.userId.toString(),
          expires: result[0].session.expires,
        },
        user: {
          id: result[0].user.id.toString(),
          email: result[0].user.email,
          emailVerified: result[0].user.emailVerified,
        },
      }
    },

    async updateSession(data) {
      const [session] = await db.update(sessions)
        .set({ expires: data.expires })
        .where(eq(sessions.sessionToken, data.sessionToken))
        .returning()
      
      if (!session) return null
      
      return {
        sessionToken: session.sessionToken,
        userId: session.userId.toString(),
        expires: session.expires,
      }
    },

    async deleteSession(sessionToken) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken))
    },

    async createVerificationToken(data) {
      const [token] = await db.insert(verificationTokens).values({
        identifier: data.identifier,
        token: data.token,
        expires: data.expires,
      }).returning()
      return {
        identifier: token.identifier,
        token: token.token,
        expires: token.expires,
      }
    },

    async useVerificationToken(data) {
      const [token] = await db.select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, data.identifier),
            eq(verificationTokens.token, data.token)
          )
        )

      if (!token) return null

      await db.delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, data.identifier),
            eq(verificationTokens.token, data.token)
          )
        )

      return {
        identifier: token.identifier,
        token: token.token,
        expires: token.expires,
      }
    },
  }
}
