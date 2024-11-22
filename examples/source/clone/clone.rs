#[repr(C)]
#[derive(Clone)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

pub fn clone_point_and_read_x(x: i32, y: i32) -> i32 {
    let p = Point { x, y };
    let p_clone = p.clone();
    p_clone.x
}
