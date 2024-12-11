/// for the addition of two unsigned integers, Alive2 correctly identifies
/// the different behaviors between source C++ (implicitly wrapping) and
/// target Rust (panics when overflow happens).
pub fn add(a: u32, b: u32) -> u32 {
    a + b
}
