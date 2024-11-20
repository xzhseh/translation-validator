pub fn process(callback: fn(i32) -> i32, x: i32) -> i32 {
    callback(x)
}
