import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/server/storage'
import { hashPassword, isValidEmail, isValidPassword, generateToken, getTokenExpiration } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName } = body

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with letters and numbers' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email.toLowerCase())
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate verification token
    const verificationToken = generateToken()
    const verificationTokenExpires = getTokenExpiration()

    // Create user
    const user = await storage.createUser({
      email: email.toLowerCase(),
      passwordHash,
      emailVerified: false,
      verificationToken,
      verificationTokenExpires,
      firstName: firstName || null,
      lastName: lastName || null,
    })

    // Send verification email
    try {
      await sendVerificationEmail(user.email!, verificationToken)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail signup if email fails - user can request new verification email
    }

    return NextResponse.json({
      message: 'Account created successfully. Please check your email to verify your account.',
      userId: user.id,
    }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
