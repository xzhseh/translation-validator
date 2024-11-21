; ModuleID = 'nested_switch.13d333aa0d5eda0f-cgu.0'
source_filename = "nested_switch.13d333aa0d5eda0f-cgu.0"
target datalayout = "e-m:o-i64:64-i128:128-n32:64-S128"
target triple = "arm64-apple-macosx11.0.0"

; nested_switch::process_tokens
; Function Attrs: noinline nounwind uwtable
define i32 @_ZN13nested_switch14process_tokens17h3ef6243187bc9e08E(i8 signext %type_, i32 %0) unnamed_addr #0 personality ptr @rust_eh_personality {
start:
  %_0 = alloca [4 x i8], align 4
  %value = alloca [4 x i8], align 4
  store i32 %0, ptr %value, align 4
  %_3 = zext i8 %type_ to i32
  switch i32 %_3, label %bb1 [
    i32 110, label %bb2
    i32 99, label %bb10
    i32 115, label %bb13
  ]

bb1:                                              ; preds = %start
  store i32 -99, ptr %_0, align 4
  br label %bb14

bb2:                                              ; preds = %start
  %1 = load i32, ptr %value, align 4
  switch i32 %1, label %bb5 [
    i32 0, label %bb3
    i32 1, label %bb4
    i32 2, label %bb4
  ]

bb10:                                             ; preds = %start
  %2 = load i32, ptr %value, align 4
  %_9 = icmp slt i32 %2, 32
  br i1 %_9, label %bb11, label %bb12

bb13:                                             ; preds = %start
  %3 = load i32, ptr %value, align 4
  %_0.i = add i32 %3, 50
  br label %bb18

bb5:                                              ; preds = %bb2
  %_7 = load i32, ptr %value, align 4
  %_6 = icmp sgt i32 %_7, 100
  br i1 %_6, label %bb6, label %bb7

bb3:                                              ; preds = %bb2
  store i32 -1, ptr %_0, align 4
  br label %bb14

bb4:                                              ; preds = %bb2, %bb2
  %4 = load i32, ptr %value, align 4
  %_0.i3 = mul i32 %4, 10
  br label %bb15

bb14:                                             ; preds = %bb1, %bb18, %bb11, %bb17, %bb6, %bb8, %bb16, %bb15, %bb3
  %5 = load i32, ptr %_0, align 4
  ret i32 %5

bb15:                                             ; preds = %bb4
  store i32 %_0.i3, ptr %_0, align 4
  br label %bb14

bb7:                                              ; preds = %bb5
  %9 = load i32, ptr %value, align 4
  %_8 = icmp slt i32 %9, 32
  br i1 %_8, label %bb8, label %bb9

bb6:                                              ; preds = %bb5
  store i32 100, ptr %_0, align 4
  br label %bb14

bb9:                                              ; preds = %bb7
  %10 = load i32, ptr %value, align 4
  %_0.i2 = add i32 %10, 50
  br label %bb16

bb8:                                              ; preds = %bb7
  store i32 0, ptr %_0, align 4
  br label %bb14

bb16:                                             ; preds = %bb9
  store i32 %_0.i2, ptr %_0, align 4
  br label %bb14

bb12:                                             ; preds = %bb10
  %11 = load i32, ptr %value, align 4
  %_0.i1 = add i32 %11, 50
  br label %bb17

bb11:                                             ; preds = %bb10
  store i32 0, ptr %_0, align 4
  br label %bb14

bb17:                                             ; preds = %bb12
  store i32 %_0.i1, ptr %_0, align 4
  br label %bb14

bb18:                                             ; preds = %bb13
  store i32 %_0.i, ptr %_0, align 4
  br label %bb14
}

; Function Attrs: nounwind uwtable
declare i32 @rust_eh_personality(i32, i32, i64, ptr, ptr) unnamed_addr #1

; core::panicking::panic_cannot_unwind
; Function Attrs: cold noinline noreturn nounwind uwtable
declare void @_ZN4core9panicking19panic_cannot_unwind17hedc43d82620205bfE() unnamed_addr #2

attributes #0 = { noinline nounwind uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }
attributes #1 = { nounwind uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }
attributes #2 = { cold noinline noreturn nounwind uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }
attributes #3 = { cold noreturn nounwind }

!llvm.module.flags = !{!0}
!llvm.ident = !{!1}

!0 = !{i32 8, !"PIC Level", i32 2}
!1 = !{!"rustc version 1.81.0 (eeb90cda1 2024-09-04)"}
