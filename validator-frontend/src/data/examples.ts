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
  },
  binary_search: {
    cpp: `#include <cstdint>

int32_t binary_search(const int32_t *arr, int64_t size, const int32_t *target) {
    int32_t left = 0;
    int32_t right = size - 1;

    while (left <= right) {
        int32_t mid = left + ((right - left) / 2);
        
        if (arr[mid] == *target) {
            return mid;
        }
        
        if (arr[mid] < *target) {
            left = mid + 1;
        } else {
            if (mid == 0) {
                break;
            }
            right = mid - 1;
        }
    }
    
    return -1;
}`,
    rust: `pub fn binary_search(arr: &[i32], target: &i32) -> i32 {
    let mut left: i32 = 0;
    let mut right: i32 = arr.len().wrapping_sub(1) as i32;

    while left <= right {
        let mid = left.wrapping_add((right.wrapping_sub(left)) / 2);
        let mid_idx = mid as usize;

        if arr[mid_idx] == *target {
            return mid;
        }

        if arr[mid_idx] < *target {
            left = mid.wrapping_add(1);
        } else {
            if mid == 0 {
                break;
            }
            right = mid.wrapping_sub(1);
        }
    }

    -1
}`
  },
  access_array: {
    cpp: `int access_array(unsigned int index) {
    int arr[10] {};

    // to preserve the memory layout as rust's
    arr[0] = 0;
    arr[1] = 1;
    arr[2] = 2;
    arr[3] = 3;
    arr[4] = 4;
    arr[5] = 5;
    arr[6] = 6;
    arr[7] = 7;
    arr[8] = 8;
    arr[9] = 9;

    // a subtle unsigned integer overflow "feature" in cpp,
    // i.e., implicitly wraps around.
    // e.g., when considering the input \`index\` as 0xfffffffc (4294967292, -4),
    // this function is more *defined* than the rust (panic) version.
    return arr[10 + index];
}`,
    rust: `pub fn access_array(index: u32) -> i32 {
    let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    arr[10 + index as usize]
}`
  },
  deref: {
    cpp: `int deref(const int *ptr) {
    // ptr could be null here, which will trigger a segfault if ptr is null.
    return *ptr;
}`,
    rust: `pub fn deref(ptr: &i32) -> i32 {
    // \`ptr\` is guaranteed non-null by type system,
    // so that this is always safe, reference is guaranteed valid.
    *ptr
}`
  },
  simple_generic: {
    cpp: `template <typename T>
T add_generic(T a, T b) {
    return a + b;
}

template int add_generic<int>(int a, int b);
template float add_generic<float>(float a, float b);`,
    rust: `use std::ops::Add;

// generic add function
pub fn add_generic<T: Add<Output = T>>(a: T, b: T) -> T {
    a + b
}

// explicit instantiation for int (equivalent to template int add_generic<int>)
pub extern "C" fn add_generic_int(a: i32, b: i32) -> i32 {
    add_generic(a, b)
}

// float version is commented out in C++, but would be:
pub extern "C" fn add_generic_float(a: f32, b: f32) -> f32 {
    add_generic(a, b)
}`
  }
};
