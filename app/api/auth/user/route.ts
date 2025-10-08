import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { storage } from '@/server/storage'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    // Get session ID from cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session_id')
    
    if (!sessionCookie) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Validate session
    const session = await getSession(sessionCookie.value)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await storage.getUser(session.userId)
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Return user data (exclude sensitive fields)
    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 })
  }
}
