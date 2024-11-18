### why fix `add_cpp.ll`?
the main reason is that, clang will generate the `noundef` attribute (and adding the `nsw` flag) in a **purely syntactic** way that strictly follows the cpp language specification - which says signed integer overflow is undefined behavior.

note that the generated ir sometimes is even different from the final compiled machine code, where the compiler often ignores this `nsw` and `noundef` attribute during the subsequent passes and use the normal `add` instruction that wraps around signed integer overflow instead.

this means the return value, of course, could be potentially undefined due to the overflow behavior inside the `add` function, but clang still insists on adding the `noundef` attribute to the return value.

thus, `alive2` will keep claiming the two `add` functions are semantically equivalent.

### how to fix `add_cpp.ll`?
to resolve this issue, we need to **manually** remove the `noundef` attribute from the return value and create a new `add_cpp_fixed.ll` file, i.e.,

```diff
-define noundef i32 @_Z3addii(i32 noundef %0, i32 noundef %1) #0 {
+define i32 @_Z3addii(i32 noundef %0, i32 noundef %1) #0 {
```

optionally, you could choose to remove the `nsw` flag, i.e.,

```diff
-  %7 = add nsw i32 %5, %6
+  %7 = add i32 %5, %6
```

note that you may need to manually replace this `add_cpp_fixed.ll` based on your generated `add_cpp.ll` if you are using a different platform.
