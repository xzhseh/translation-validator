import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { cppCode, rustCode } = await request.json();
    
    // More realistic LLVM IR mock examples
    const mockIR = {
      cppIR: `; ModuleID = 'example.cpp'
source_filename = "example.cpp"
target datalayout = "e-m:e-p270:32:32-p271:32:32-p272:64:64-i64:64-f80:128-n8:16:32:64-S128"

; Function Attrs: mustprogress noinline nounwind optnone uwtable
define dso_local i32 @_Z3addii(i32 noundef %0, i32 noundef %1) #0 {
entry:
  %2 = alloca i32, align 4
  %3 = alloca i32, align 4
  store i32 %0, ptr %2, align 4
  store i32 %1, ptr %3, align 4
  %4 = load i32, ptr %2, align 4
  %5 = load i32, ptr %3, align 4
  %add = add nsw i32 %4, %5
  ret i32 %add
}

attributes #0 = { mustprogress noinline nounwind optnone uwtable }`,
      rustIR: `; ModuleID = 'add.7rcbfp3g-cgu.0'
source_filename = "add.7rcbfp3g-cgu.0"
target datalayout = "e-m:e-p270:32:32-p271:32:32-p272:64:64-i64:64-f80:128-n8:16:32:64-S128"

; Function Attrs: nonlazybind uwtable
define i32 @_ZN3add17h12345678901234567E(i32 %0, i32 %1) unnamed_addr #0 {
start:
  %2 = add i32 %0, %1
  ret i32 %2
}

attributes #0 = { nonlazybind uwtable }`
    };

    return NextResponse.json(mockIR);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate IR' },
      { status: 500 }
    );
  }
}
