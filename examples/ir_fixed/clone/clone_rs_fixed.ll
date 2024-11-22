; ModuleID = 'clone.7795c36c0a26504f-cgu.0'
source_filename = "clone.7795c36c0a26504f-cgu.0"
target datalayout = "e-m:o-i64:64-i128:128-n32:64-S128"
target triple = "arm64-apple-macosx11.0.0"

; clone::clone_point_and_read_x
; Function Attrs: uwtable
define i32 @_ZN5clone22clone_point_and_read_x17h4be8383f9e6189adE(i32 noundef %0, i32 noundef %1) unnamed_addr #0 {
start:
  ; allocate point and store x,y
  %p = alloca [8 x i8], align 4
  store i32 %0, ptr %p, align 4
  %2 = getelementptr inbounds i8, ptr %p, i64 4
  store i32 %1, ptr %2, align 4

  ; inline clone trait logic here:
  %_2 = load i32, ptr %p, align 4         ; load x
  %_5 = getelementptr inbounds i8, ptr %p, i64 4
  %_4 = load i32, ptr %_5, align 4        ; load y
  %3 = insertvalue { i32, i32 } poison, i32 %_2, 0
  %4 = insertvalue { i32, i32 } %3, i32 %_4, 1

  ; extract x and return
  %p_clone.0 = extractvalue { i32, i32 } %4, 0
  ret i32 %p_clone.0
}

attributes #0 = { uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }
attributes #1 = { inlinehint uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }

!llvm.module.flags = !{!0}
!llvm.ident = !{!1}

!0 = !{i32 8, !"PIC Level", i32 2}
!1 = !{!"rustc version 1.81.0 (eeb90cda1 2024-09-04)"}
