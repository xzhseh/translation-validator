/// the source cpp module is ub, and the function attrs are different
/// so the verifier fails to compare the two even after switching the order.
pub fn div_by_zero(a: i32, b: i32) -> i32 {
    a / (b - b)
}
