### why fix `bitfield_ops_cpp.ll`?
the reason is pretty much the same as the `add_cpp.ll` file, this time clang will add the `noundef` attribute to the return value in a purely syntactic way that strictly follows the cpp language specification.

in cpp's specification, shifting both signed integer and unsigned integer by more than (or equal to) 32-bit is considered undefined behavior.

thus, `alive2` will keep claiming the two `extract_bits` functions are semantically equivalent.

### how to fix `bitfield_ops_cpp.ll`?
to resolve this issue, we need to **manually** remove the `noundef` attribute from the return value and create a new `bitfield_ops_cpp_fixed.ll` file, i.e.,

```diff
-define noundef i32 @_Z12extract_bitsjjj(i32 noundef %0, i32 noundef %1, i32 noundef %2) #0 {
+define i32 @_Z12extract_bitsjjj(i32 noundef %0, i32 noundef %1, i32 noundef %2) #0 {
```

note that you may need to manually replace this `bitfield_ops_cpp_fixed.ll` based on your generated `bitfield_ops_cpp.ll` if you are using a different platform.
