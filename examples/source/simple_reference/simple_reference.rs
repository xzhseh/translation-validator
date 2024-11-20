/// the reference needs to be explicit mutable,
/// note that the parameters in the generated ir functions are just pointers (e.g., ptr align 4 %a)
/// since other guarantees are enforced by rust's type system at compile time -
/// which is much simpler than those "explicit attribute requirements" in cpp's ir.
/// see `simple_reference_cpp/rs.ll` for more details.
pub fn swap(a: &mut i32, b: &mut i32) {
    let temp = *a;
    *a = *b;
    *b = temp;
}
