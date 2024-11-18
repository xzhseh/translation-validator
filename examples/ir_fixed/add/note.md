### why fix `add_cpp.ll`?
the main reason is that, clang will add the `nsw` flag (and the potential `noundef` attribute) in a **purely syntactic** way that strictly follows the cpp language specification - which says signed integer overflow is undefined behavior.

note that the generated ir sometimes is even different from the final compiled machine code, where the compiler often ignores this `nsw` flag (and the potential `noundef` attribute) during the subsequent passes and use the normal `add` instruction that wraps around signed integer overflow instead.

this means the return value, of course, could be potentially undefined due to the overflow behavior inside the `add` function, but clang still insists on adding the `nsw` flag after the `add` instruction.

thus, `alive2` will keep claiming the two `add` functions are semantically equivalent.

### how to fix `add_cpp.ll`?
to resolve this issue, we need to **manually** remove the `nsw` flag after the `add` instruction and create a new `add_cpp_fixed.ll` file, i.e.,

```diff
-  %7 = add nsw i32 %5, %6
+  %7 = add i32 %5, %6
```

optionally, you could choose to remove the `noundef` attribute from the return value, i.e.,
```diff
-define noundef i32 @_Z3addii(i32 noundef %0, i32 noundef %1) #0 {
+define i32 @_Z3addii(i32 noundef %0, i32 noundef %1) #0 {
```

note that you may need to manually replace this `add_cpp_fixed.ll` based on your generated `add_cpp.ll` if you are using a different platform.
