import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model');
    const range = searchParams.get('range') || '24h';

    const replitDomain = process.env.REPLIT_DEV_DOMAIN;
    const backendUrl = replitDomain 
      ? `https://${replitDomain}:8000`
      : 'http://localhost:8000';
    
    const queryParams = new URLSearchParams();
    if (model) queryParams.set('model', model);
    queryParams.set('range', range);

    const response = await fetch(`${backendUrl}/api/history?${queryParams}`, {
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
    console.error('Error proxying history to backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
