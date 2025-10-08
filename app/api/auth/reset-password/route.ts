import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/server/storage'
import { isValidEmail, generateToken, getTokenExpiration } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Get user by email
    const user = await storage.getUserByEmail(email.toLowerCase())
    
    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json({
        message: 'If an account with this email exists, a password reset link has been sent.',
      })
    }

    // Generate reset token
    const resetToken = generateToken()
    const expires = getTokenExpiration()

    // Store reset token
    await storage.setResetToken(user.id, resetToken, expires)

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email!, resetToken)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'If an account with this email exists, a password reset link has been sent.',
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    )
  }
}
