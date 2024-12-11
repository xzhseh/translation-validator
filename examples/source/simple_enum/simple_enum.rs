#[repr(i32)]            // use same representation as C++ enum
#[derive(Clone, Copy)]  // make it work like C++ value type
pub enum Color {
    Red = 0,
    Green = 1,
    Blue = 2,
}

pub fn create_color(x: i32) -> Color {
    // directly transmute the integer to enum, matching C++'s behavior
    unsafe { std::mem::transmute(x) }
}
