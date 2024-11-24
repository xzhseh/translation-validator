export const examples = {
  simple_struct: {
    cpp: `struct Point {
    int x;
    int y;
};

Point create_point(int x, int y) {
    return Point { x, y };
}`,
    rust: `#[repr(C)]
#[derive(Clone, Copy)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

pub fn create_point(x: i32, y: i32) -> Point {
    Point { x, y }
}`
  },
  simple_enum: {
    cpp: `enum Color {
    Red,
    Green,
    Blue,
};

Color create_color(int x) {
    return static_cast<Color>(x);
}`,
    rust: `#[repr(i32)]
#[derive(Clone, Copy)]
pub enum Color {
    Red = 0,
    Green = 1,
    Blue = 2,
}

pub fn create_color(x: i32) -> Color {
    unsafe { std::mem::transmute(x) }
}`
  },
  switch_case: {
    cpp: `int classify_char(char c) {
    switch (c) {
        case ' ':
        case '\\t':
        case '\\n': return 0;  // whitespace
        case '0' ... '9': return 1;  // digit
        case 'a' ... 'z':
        case 'A' ... 'Z': return 2;  // letter
        default: return 3;  // other
    }
}`,
    rust: `pub extern "C" fn classify_char(c: i8) -> i32 {
    match c as u8 as char {
        ' ' | '\\t' | '\\n' => 0,
        '0'..='9' => 1,
        'a'..='z' | 'A'..='Z' => 2,
        _ => 3
    }
}`
  },
  add_u32: {
    cpp: `/// note that in cpp, the addition of two unsigned integers (or unsigned integer arithmetic)
/// is always well-defined with potential wrapping behavior.
unsigned int add(unsigned int a, unsigned int b) {
    return a + b;
}`,
    rust: `pub fn add(a: u32, b: u32) -> u32 {
    a + b
}`
  }
}; 