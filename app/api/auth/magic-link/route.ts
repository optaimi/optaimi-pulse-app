import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/server/storage'
import { isValidEmail, generateToken, getMagicLinkExpiration } from '@/lib/auth'
import { sendMagicLinkEmail } from '@/lib/email'

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
        message: 'If an account with this email exists, a magic link has been sent.',
      })
    }

    // Generate magic link token
    const magicToken = generateToken()
    const expires = getMagicLinkExpiration()

    // Store token as verification token (reuse field for magic link)
    await storage.setVerificationToken(user.id, magicToken, expires)

    // Send magic link email
    try {
      await sendMagicLinkEmail(user.email!, magicToken)
    } catch (emailError) {
      console.error('Failed to send magic link email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send magic link' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'If an account with this email exists, a magic link has been sent.',
    })

  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    )
  }
}
