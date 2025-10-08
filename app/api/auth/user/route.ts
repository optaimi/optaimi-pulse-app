import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { storage } from '@/server/storage'

export async function GET() {
  try {
    // Get user ID from cookie
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('user_id')
    
    if (!userIdCookie) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await storage.getUser(userIdCookie.value)
    
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
