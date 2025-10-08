import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('connect.sid')
  
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  try {
    const res = await fetch('http://localhost:3001/api/auth/user', {
      headers: {
        cookie: `connect.sid=${sessionCookie.value}`,
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
