/// nested function call is not supported by alive2,
/// so that the recursive call to `factorial` will be trivially
/// marked as undefined behavior (UB) and rejected by alive2.
pub fn factorial(n: i32) -> i32 {
    if n <= 1 { 1 } else { n.wrapping_mul(factorial(n - 1)) }
}
