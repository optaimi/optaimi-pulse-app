import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Proxy to Express auth server
  const authUrl = `http://localhost:3001/api/logout`
  
  const response = await fetch(authUrl, {
    headers: {
      cookie: request.headers.get('cookie') || '',
      host: request.headers.get('host') || '',
      'x-forwarded-proto': request.headers.get('x-forwarded-proto') || 'https',
      'x-forwarded-host': request.headers.get('x-forwarded-host') || request.headers.get('host') || '',
    },
    redirect: 'manual',
  })

  // Create new headers and copy all headers including set-cookie
  const headers = new Headers()
  response.headers.forEach((value, key) => {
    headers.set(key, value)
  })
  
  // Manually copy set-cookie headers
  const cookies = response.headers.getSetCookie?.() || []
  cookies.forEach(cookie => {
    headers.append('set-cookie', cookie)
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
