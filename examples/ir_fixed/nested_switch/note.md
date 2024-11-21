### why fix `nested_switch_rs.ll`?
the reason is that rust's llvm ir includes additional panic handling and unwinding machinery that's not present in the cpp version. this includes:

1. landing pad for panic handling
2. unwinding blocks
3. additional attributes like `noundef` on function returns

### how to fix `nested_switch_rs.ll`?
to resolve this issue, we need to completely remove the `terminate` block and its associated landing pad code, i.e.,

```diff
-bb14:                                             ; preds = %bb1, %bb18, %bb11, %bb17, %bb6, %bb8, %bb16, %bb15, %bb3
-  %5 = load i32, ptr %_0, align 4
-  ret i32 %5

-terminate:                                        ; No predecessors!
-  %6 = landingpad { ptr, i32 }
-          filter [0 x ptr] zeroinitializer
-  %7 = extractvalue { ptr, i32 } %6, 0
-  %8 = extractvalue { ptr, i32 } %6, 1
-; call core::panicking::panic_cannot_unwind
-  call void @_ZN4core9panicking19panic_cannot_unwind17hedc43d82620205bfE() #3
-  unreachable
-
-bb15:                                             ; preds = %bb4
-  store i32 %_0.i3, ptr %_0, align 4
-  br label %bb14
+bb14:                                             ; preds = %bb1, %bb18, %bb11, %bb17, %bb6, %bb8, %bb16, %bb15, %bb3
+  %5 = load i32, ptr %_0, align 4
+  ret i32 %5
+
+bb15:                                             ; preds = %bb4
+  store i32 %_0.i3, ptr %_0, align 4
+  br label %bb14
```

note that you may need to manually replace this `nested_switch_rs_fixed.ll` based on your generated `nested_switch_rs.ll` if you are using a different platform.

### why these changes work?
1. the terminate block is unreachable in our implementation since we use wrapping operations
2. these modifications make the rust ir more similar to the cpp ir, allowing better comparison by alive2
