; ModuleID = 'add.3c0a4eef026c6f94-cgu.0'
source_filename = "add.3c0a4eef026c6f94-cgu.0"
target datalayout = "e-m:o-i64:64-i128:128-n32:64-S128"
target triple = "arm64-apple-macosx11.0.0"

@alloc_7e9de8e751c80d34e30df1fd9ef365bf = private unnamed_addr constant <{ [6 x i8] }> <{ [6 x i8] c"add.rs" }>, align 1
@alloc_e9b1cab6c93088ac1518c7f5fbce0ef0 = private unnamed_addr constant <{ ptr, [16 x i8] }> <{ ptr @alloc_7e9de8e751c80d34e30df1fd9ef365bf, [16 x i8] c"\06\00\00\00\00\00\00\00\02\00\00\00\05\00\00\00" }>, align 8

; add::add
; Function Attrs: uwtable
define i32 @_ZN3add3add17h2c2c92b229f4cef7E(i32 %a, i32 %b) unnamed_addr #0 {
start:
  %0 = call { i32, i1 } @llvm.sadd.with.overflow.i32(i32 %a, i32 %b)
  %_3.0 = extractvalue { i32, i1 } %0, 0
  %_3.1 = extractvalue { i32, i1 } %0, 1
  br i1 %_3.1, label %panic, label %bb1

bb1:                                              ; preds = %start
  ret i32 %_3.0

panic:                                            ; preds = %start
; call core::panicking::panic_const::panic_const_add_overflow
  call void @_ZN4core9panicking11panic_const24panic_const_add_overflow17ha18a8362f7e3e89cE(ptr align 8 @alloc_e9b1cab6c93088ac1518c7f5fbce0ef0) #3
  unreachable
}

; Function Attrs: nocallback nofree nosync nounwind speculatable willreturn memory(none)
declare { i32, i1 } @llvm.sadd.with.overflow.i32(i32, i32) #1

; core::panicking::panic_const::panic_const_add_overflow
; Function Attrs: cold noinline noreturn uwtable
declare void @_ZN4core9panicking11panic_const24panic_const_add_overflow17ha18a8362f7e3e89cE(ptr align 8) unnamed_addr #2

attributes #0 = { uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }
attributes #1 = { nocallback nofree nosync nounwind speculatable willreturn memory(none) }
attributes #2 = { cold noinline noreturn uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }
attributes #3 = { noreturn }

!llvm.module.flags = !{!0}
!llvm.ident = !{!1}

!0 = !{i32 8, !"PIC Level", i32 2}
!1 = !{!"rustc version 1.81.0 (eeb90cda1 2024-09-04)"}
