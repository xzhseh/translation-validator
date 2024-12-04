/// it is worth noting that this translation follows the simplest
/// function pointer style in rust, in order to type check
/// with the cpp llvm ir when verifying by alive2.
pub fn process(callback: fn(i32) -> i32, x: i32) -> i32 {
    callback(x)
}
