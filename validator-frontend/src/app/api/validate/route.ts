import { NextResponse } from 'next/server';
import { ValidationResult } from '@/types/validator';

export async function POST(request: Request) {
  try {
    const { cppIR, rustIR, functionName } = await request.json();
    
    // Use a stable mock result instead of random selection
    const mockResult: ValidationResult = {
      success: false,
      verifier_output: `Transformation doesn't verify!

ERROR: Source is more defined than target

Example:
i32 noundef %#0 = #x00000001 (1)
i32 noundef %#1 = #xffffffff (4294967295, -1)

Source:
ptr %#3 = pointer(local, block_id=0, offset=0) / Address=#x13c
ptr %#4 = pointer(local, block_id=1, offset=0) / Address=#x100
i32 %#5 = #x00000001 (1)
i32 %#6 = #xffffffff (4294967295, -1)
i32 %#7 = #x00000000 (0)

SOURCE MEMORY STATE
=================
NON-LOCAL BLOCKS:
Block 0 >     size: 0 align: 1     alloc type: 0   alive: false   address: 0
Block 1 >     size: 15    align: 64    alloc type: 0   alive: true    address: 192
Block 2 >     size: 24    align: 64    alloc type: 0   alive: true    address: 8    const
Block 3 >     size: 34    align: 64    alloc type: 0   alive: true    address: 135   const

LOCAL BLOCKS:
Block 4 >     size: 4 align: 4     alloc type: 1   alive: true    address: 316
Block 5 >     size: 4 align: 4     alloc type: 1   alive: true    address: 256

Target:
>> Jump to %start
{i32, i1, i24} %#0 = { #x00000000 (0), #x1 (1), poison }
i32 %_3.0 = #x00000000 (0)
i1 %_3.1 = #x1 (1)
  >> Jump to %panic
Function @_ZN4core9panicking11panic_const17ha18a8362f7e3e89cE triggered UB`,
      num_errors: 1
    };

    return NextResponse.json(mockResult);
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
