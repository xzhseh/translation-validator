import { NextResponse } from 'next/server';
import { ValidationResult } from '@/types/validator';

const VALIDATOR_URL = process.env.VALIDATOR_URL || 'http://localhost:3001';

export async function POST(request: Request) {
  try {
    const { cppIR, rustIR, functionName } = await request.json();
 
    const response = await fetch(`${VALIDATOR_URL}/api/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cppIR, rustIR, functionName }),
    });

    if (!response.ok) {
      throw new Error('Validation failed');
    }

    const result: ValidationResult = await response.json();
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
