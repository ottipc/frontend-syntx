import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30; // 30 Sekunden Timeout

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s Timeout
    
    const response = await fetch('https://dev.syntx-systems.com:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - API took too long to respond' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: `Internal error: ${error.message}` },
      { status: 500 }
    );
  }
}
