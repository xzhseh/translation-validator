import { NextResponse } from 'next/server';
import { ValidationResult } from '@/types/validator';

// note: relay server runs on localhost:3001 by default
const RELAY_URL = process.env.RELAY_URL || 'http://localhost:3001';

export async function POST(request: Request) {
  try {
    const { cppIR, rustIR, functionName } = await request.json();
    
    const response = await fetch(`${RELAY_URL}/api/validate`, {
      method: 'POST',
      headers: {
        // relay server expects json!
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cppIR, rustIR, functionName }),
    });

    if (!response.ok) {
      throw new Error('Validation failed');
    }

    const data = await response.json();
    const success = data.verifier_output.includes('Transformation seems to be correct!');

    const result: ValidationResult = {
      ...data,
      success,
      num_errors: success ? 0 : 1
    };

    return NextResponse.json(result);
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
