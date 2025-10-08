import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/server/storage'
import { hashPassword, isValidPassword, isTokenExpired } from '@/lib/auth'
import { db } from '@/server/db'
import { users } from '@/shared/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with letters and numbers' },
        { status: 400 }
      )
    }

    // Find user by reset token
    const [user] = await db.select().from(users).where(eq(users.resetToken, token))

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token expired
    if (isTokenExpired(user.resetTokenExpires)) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update password and clear reset token
    await storage.updateUserPassword(user.id, passwordHash)

    return NextResponse.json({
      message: 'Password reset successful. You can now log in with your new password.',
    })

  } catch (error) {
    console.error('Password reset confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
