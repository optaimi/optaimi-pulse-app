import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/server/storage'
import { isTokenExpired } from '@/lib/auth'
import { cookies } from 'next/headers'
import { db } from '@/server/db'
import { users } from '@/shared/schema'
import { eq } from 'drizzle-orm'
import { createSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/signin?error=invalid_token', request.url))
    }

    // Find user by verification token (reused for magic link)
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token))

    if (!user) {
      return NextResponse.redirect(new URL('/signin?error=invalid_token', request.url))
    }

    // Check if token expired
    if (isTokenExpired(user.verificationTokenExpires)) {
      return NextResponse.redirect(new URL('/signin?error=token_expired', request.url))
    }

    // Clear the token
    await storage.updateUserVerification(user.id, user.emailVerified)

    // Create secure session
    const sessionId = await createSession(user.id, user.email!)
    
    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    // Redirect to home
    return NextResponse.redirect(new URL('/', request.url))

  } catch (error) {
    console.error('Magic link verification error:', error)
    return NextResponse.redirect(new URL('/signin?error=verification_failed', request.url))
  }
}
