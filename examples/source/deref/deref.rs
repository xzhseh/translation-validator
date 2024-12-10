/// a "safer" translation of the original `deref.cpp` - is this semantically equivalent?
pub fn deref(ptr: &i32) -> i32 {
    // `ptr` is guaranteed non-null by type system,
    // so that this is always safe, reference is guaranteed valid.
    *ptr
}
