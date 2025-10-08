import { NextResponse, NextRequest } from 'next/server';

export async function GET() {
  try {
    const replitDomain = process.env.REPLIT_DEV_DOMAIN;
    const backendUrl = replitDomain 
      ? `https://${replitDomain}:8000`
      : 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/api/run-test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test results' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const replitDomain = process.env.REPLIT_DEV_DOMAIN;
    const backendUrl = replitDomain 
      ? `https://${replitDomain}:8000`
      : 'http://localhost:8000';
    
    // Get the request body
    const body = await request.json();
    
    const response = await fetch(`${backendUrl}/api/run-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test results' },
      { status: 500 }
    );
  }
}
