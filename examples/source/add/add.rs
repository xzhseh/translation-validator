/// though rust panics when overflow happens, Alive2 assumes the **scope**
/// of input parameters will not result in such overflow according to the
/// cpp language specification.
/// see `examples/source/add/add.cpp` for more details.
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
