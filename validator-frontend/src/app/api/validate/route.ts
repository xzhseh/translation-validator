import { NextResponse } from 'next/server';

// note: relay server runs on localhost:3001 by default
const RELAY_URL = process.env.RELAY_URL || 'http://localhost:3001';

export async function POST(request: Request) {
  try {
    const { cppIR, rustIR, cppFunctionName, rustFunctionName } = await request.json();
    
    const response = await fetch(`${RELAY_URL}/api/validate`, {
      method: 'POST',
      headers: {
        // relay server expects json!
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cppIR, rustIR, cppFunctionName, rustFunctionName }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
        return NextResponse.json({ error: data.error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        verifier_output: error instanceof Error ? error.message : 'An unknown error occurred',
        num_errors: 1
      },
      { status: 500 }
    );
  }
}
