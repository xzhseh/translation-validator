//! translated by claude-3.5-sonnet at Nov 21, 2024

use std::ops::Add;

// generic add function
pub fn add_generic<T: Add<Output = T>>(a: T, b: T) -> T {
    a + b
}

// explicit instantiation for int (equivalent to template int add_generic<int>)
pub extern "C" fn add_generic_int(a: i32, b: i32) -> i32 {
    add_generic(a, b)
}

// explicit instantiation for float
pub extern "C" fn add_generic_float(a: f32, b: f32) -> f32 {
    add_generic(a, b)
}
