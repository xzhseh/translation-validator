; ModuleID = 'simple_ret.555d7ac78bacc642-cgu.0'
source_filename = "simple_ret.555d7ac78bacc642-cgu.0"
target datalayout = "e-m:o-i64:64-i128:128-n32:64-S128"
target triple = "arm64-apple-macosx11.0.0"

; simple_ret::ret
; Function Attrs: uwtable
define i32 @_ZN10simple_ret3ret17he935617c8a39ff88E() unnamed_addr #0 {
start:
  ret i32 20021030
}

attributes #0 = { uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }

!llvm.module.flags = !{!0}
!llvm.ident = !{!1}

!0 = !{i32 8, !"PIC Level", i32 2}
!1 = !{!"rustc version 1.81.0 (eeb90cda1 2024-09-04)"}
