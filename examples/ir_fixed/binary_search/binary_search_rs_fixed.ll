; ModuleID = 'binary_search.2d5705ac376a077-cgu.0'
source_filename = "binary_search.2d5705ac376a077-cgu.0"
target datalayout = "e-m:o-i64:64-i128:128-n32:64-S128"
target triple = "arm64-apple-macosx11.0.0"

@alloc_3b41ec96b5bd4997ed034ea93c898c8a = private unnamed_addr constant <{ [46 x i8] }> <{ [46 x i8] c"examples/source/binary_search/binary_search.rs" }>, align 1
@alloc_0b18091e8d0de89edd260b0d77befd5c = private unnamed_addr constant <{ ptr, [16 x i8] }> <{ ptr @alloc_3b41ec96b5bd4997ed034ea93c898c8a, [16 x i8] c".\00\00\00\00\00\00\00\06\00\00\00%\00\00\00" }>, align 8
@alloc_c06125145e7b8a6d3f560437376cdfb7 = private unnamed_addr constant <{ ptr, [16 x i8] }> <{ ptr @alloc_3b41ec96b5bd4997ed034ea93c898c8a, [16 x i8] c".\00\00\00\00\00\00\00\09\00\00\00\0C\00\00\00" }>, align 8
@alloc_573bd4c95745d9786d4a93826f977356 = private unnamed_addr constant <{ ptr, [16 x i8] }> <{ ptr @alloc_3b41ec96b5bd4997ed034ea93c898c8a, [16 x i8] c".\00\00\00\00\00\00\00\0D\00\00\00\0C\00\00\00" }>, align 8

; binary_search::binary_search
; Function Attrs: uwtable
define i32 @_ZN13binary_search13binary_search17h1175dc97a1471bf0E(ptr noundef %0, i64 noundef %1, ptr noundef %2) unnamed_addr #0 {
start:
  %right = alloca [4 x i8], align 4
  %left = alloca [4 x i8], align 4
  %_0 = alloca [4 x i8], align 4
  store i32 0, ptr %left, align 4
  %_0.i6 = sub i64 %1, 1
  %3 = trunc i64 %_0.i6 to i32
  store i32 %3, ptr %right, align 4
  br label %bb2

bb2:                                              ; preds = %bb2.backedge, %start
  %_8 = load i32, ptr %left, align 4
  %_9 = load i32, ptr %right, align 4
  %_7 = icmp sle i32 %_8, %_9
  br i1 %_7, label %bb3, label %bb17

bb17:                                             ; preds = %bb14, %bb2
  store i32 -1, ptr %_0, align 4
  br label %bb18

bb3:                                              ; preds = %bb2
  %_11 = load i32, ptr %left, align 4
  %_14 = load i32, ptr %right, align 4
  %_15 = load i32, ptr %left, align 4
  %_0.i5 = sub i32 %_14, %_15
  %_18 = icmp eq i32 %_0.i5, -2147483648
  %_19 = and i1 false, %_18
  br i1 %_19, label %panic, label %bb6

bb6:                                              ; preds = %bb3
  %_12 = sdiv i32 %_0.i5, 2
  %_0.i3 = add i32 %_11, %_12
  %mid_idx = sext i32 %_0.i3 to i64
  %_24 = icmp ult i64 %mid_idx, %1
  br i1 %_24, label %bb8, label %panic1

panic:                                            ; preds = %bb3
  call void @_ZN4core9panicking11panic_const24panic_const_div_overflow17ha4598169b8464c80E(ptr align 8 @alloc_0b18091e8d0de89edd260b0d77befd5c) #2
  unreachable

bb8:                                              ; preds = %bb6
  %4 = getelementptr inbounds [0 x i32], ptr %0, i64 0, i64 %mid_idx
  %_22 = load i32, ptr %4, align 4
  %_25 = load i32, ptr %2, align 4
  %_21 = icmp eq i32 %_22, %_25
  br i1 %_21, label %bb9, label %bb10

panic1:                                           ; preds = %bb6
  %mid_idx.lcssa = phi i64 [ %mid_idx, %bb6 ]
  call void @_ZN4core9panicking18panic_bounds_check17h9d3bb8821ff7ad09E(i64 %mid_idx.lcssa, i64 %1, ptr align 8 @alloc_c06125145e7b8a6d3f560437376cdfb7) #2
  unreachable

bb10:                                             ; preds = %bb8
  %_29 = icmp ult i64 %mid_idx, %1
  br i1 %_29, label %bb11, label %panic2

bb9:                                              ; preds = %bb8
  %_0.i3.lcssa9 = phi i32 [ %_0.i3, %bb8 ]
  store i32 %_0.i3.lcssa9, ptr %_0, align 4
  br label %bb18

bb11:                                             ; preds = %bb10
  %5 = getelementptr inbounds [0 x i32], ptr %0, i64 0, i64 %mid_idx
  %_27 = load i32, ptr %5, align 4
  %_30 = load i32, ptr %2, align 4
  %_26 = icmp slt i32 %_27, %_30
  br i1 %_26, label %bb12, label %bb14

panic2:                                           ; preds = %bb10
  %mid_idx.lcssa8 = phi i64 [ %mid_idx, %bb10 ]
  call void @_ZN4core9panicking18panic_bounds_check17h9d3bb8821ff7ad09E(i64 %mid_idx.lcssa8, i64 %1, ptr align 8 @alloc_573bd4c95745d9786d4a93826f977356) #2
  unreachable

bb14:                                             ; preds = %bb11
  %6 = icmp eq i32 %_0.i3, 0
  br i1 %6, label %bb17, label %bb15

bb12:                                             ; preds = %bb11
  %_0.i = add i32 %_0.i3, 1
  store i32 %_0.i, ptr %left, align 4
  br label %bb2.backedge

bb15:                                             ; preds = %bb14
  %_0.i4 = sub i32 %_0.i3, 1
  store i32 %_0.i4, ptr %right, align 4
  br label %bb2.backedge

bb2.backedge:                                     ; preds = %bb15, %bb12
  br label %bb2

bb18:                                             ; preds = %bb9, %bb17
  %7 = load i32, ptr %_0, align 4
  ret i32 %7
}

; core::panicking::panic_const::panic_const_div_overflow
; Function Attrs: cold noinline noreturn uwtable
declare void @_ZN4core9panicking11panic_const24panic_const_div_overflow17ha4598169b8464c80E(ptr align 8) unnamed_addr #1

; core::panicking::panic_bounds_check
; Function Attrs: cold noinline noreturn uwtable
declare void @_ZN4core9panicking18panic_bounds_check17h9d3bb8821ff7ad09E(i64, i64, ptr align 8) unnamed_addr #1

attributes #0 = { uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }
attributes #1 = { cold noinline noreturn uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }
attributes #2 = { noreturn }

!llvm.module.flags = !{!0}
!llvm.ident = !{!1}

!0 = !{i32 8, !"PIC Level", i32 2}
!1 = !{!"rustc version 1.81.0 (eeb90cda1 2024-09-04)"}
