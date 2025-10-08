import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Get session ID and delete it from database
    const sessionCookie = cookieStore.get('session_id')
    if (sessionCookie) {
      await deleteSession(sessionCookie.value)
    }
    
    // Delete the session cookie
    cookieStore.delete('session_id')

    return NextResponse.json({
      message: 'Logged out successfully',
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to log out' },
      { status: 500 }
    )
  }
}
