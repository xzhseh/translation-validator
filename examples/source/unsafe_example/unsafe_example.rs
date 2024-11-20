pub unsafe fn get_value_at(ptr: *mut i32, index: usize) -> *mut i32 {
    ptr.add(index)
}
