import { NextResponse } from 'next/server';

const VALIDATOR_URL = process.env.VALIDATOR_URL || 'http://localhost:3001';

export async function POST(request: Request) {
  try {
    const { cppCode, rustCode } = await request.json();
    
    const response = await fetch(`${VALIDATOR_URL}/api/generate-ir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cppCode, rustCode }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate IR');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate IR' },
      { status: 500 }
    );
  }
}
