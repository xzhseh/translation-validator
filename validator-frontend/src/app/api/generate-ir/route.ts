import { NextResponse } from 'next/server';

// note: relay server runs on localhost:3001 by default
const RELAY_URL = process.env.RELAY_URL || 'http://localhost:3001';

export async function POST(request: Request) {
  try {
    const { cppCode, rustCode } = await request.json();
    
    const response = await fetch(`${RELAY_URL}/api/generate-ir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cppCode, rustCode }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate IR' },
      { status: 500 }
    );
  }
}
