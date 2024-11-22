pub fn null_deref() -> i32 {
    unsafe {
        let ptr: *const i32 = std::ptr::null();
        *ptr
    }
}
