import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session_id')
  
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // Validate session by calling our auth API
  try {
    const apiUrl = new URL('/api/auth/user', request.url)
    const res = await fetch(apiUrl, {
      headers: {
        cookie: `session_id=${sessionCookie.value}`,
      },
    })

    if (!res.ok) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware auth check failed:', error)
    return NextResponse.redirect(new URL('/signin', request.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/alerts/:path*'],
}
