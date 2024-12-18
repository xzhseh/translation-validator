//! validation result: the two programs do not type check when evaluated by alive2 at llvm ir level,
//! but are they semantically equivalent at the function level?

#[repr(C)]
#[derive(Clone, Copy)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

pub fn create_point(x: i32, y: i32) -> Point {
    Point { x, y }
}
