import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Get cookies from Next.js
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.toString()
    
    // Proxy to Express auth server
    const res = await fetch('http://localhost:3001/api/auth/user', {
      headers: {
        cookie: cookieHeader,
      },
      credentials: 'include',
    })

    if (!res.ok) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = await res.json()
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 })
  }
}
