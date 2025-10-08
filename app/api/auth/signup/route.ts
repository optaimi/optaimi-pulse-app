import { NextResponse } from 'next/server'
import { hash } from '@node-rs/bcrypt'
import { db } from '../../../../server/db'
import { users } from '../../../../shared/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 10)

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
      })
      .returning()

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
