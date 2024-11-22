### why fix `binary_search_rs.ll`?
the parameters for the two versions of binary search are different,

- rust ir use `ptr %arr.0` and `ptr %arr.1` to represent the `arr: &[i32]`.
- cpp ir use `ptr %0` and `ptr %1` to represent the `const int32_t *arr` and `int64_t size`.

this difference will lead to the timeout from alive2.

### how to fix `binary_search_rs.ll`?

to resolve this issue, we need to **manually** change the parameters of the `binary_search` function in the `binary_search_rs.ll` file, i.e.,

```diff
-define i32 @_ZN13binary_search13binary_search17h1175dc97a1471bf0E(ptr align 4 %arr.0, i64 %arr.1, ptr align 4 %target) unnamed_addr #0 {
+define i32 @_ZN13binary_search13binary_search17h1175dc97a1471bf0E(ptr noundef %0, i64 noundef %1, ptr noundef %2) unnamed_addr #0 {
```

all the parameters inside the ir function should also be updated accordingly.

note that you may need to manually replace this `binary_search_rs_fixed.ll` based on your generated `binary_search_rs.ll` if you are using a different platform.
