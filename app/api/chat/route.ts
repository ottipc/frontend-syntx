import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch('http://49.13.3.21:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'API request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
