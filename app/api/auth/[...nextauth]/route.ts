import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { compare } from '@node-rs/bcrypt'
import { db } from '../../../../server/db'
import { users } from '../../../../shared/schema'
import { eq } from 'drizzle-orm'
import { DrizzleAdapter } from '../../../../server/auth-adapter'
import { sendMagicLinkEmail } from '../../../../server/email'

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))

        if (!user || !user.passwordHash) {
          return null
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
        }
      },
    }),
    EmailProvider({
      server: '',
      from: 'pulse@optaimi.com',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await sendMagicLinkEmail({ to: email, url })
      },
    }),
  ],
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
