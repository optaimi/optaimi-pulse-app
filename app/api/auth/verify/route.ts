import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/server/storage'
import { isTokenExpired } from '@/lib/auth'
import { db } from '@/server/db'
import { users } from '@/shared/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/signin?error=invalid_token', request.url))
    }

    // Find user by verification token
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token))

    if (!user) {
      return NextResponse.redirect(new URL('/signin?error=invalid_token', request.url))
    }

    // Check if token expired
    if (isTokenExpired(user.verificationTokenExpires)) {
      return NextResponse.redirect(new URL('/signin?error=token_expired', request.url))
    }

    // Verify user
    await storage.updateUserVerification(user.id, true)

    // Redirect to login with success message
    return NextResponse.redirect(new URL('/signin?verified=true', request.url))

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/signin?error=verification_failed', request.url))
  }
}
