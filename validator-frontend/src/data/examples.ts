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
        case '\\n': return 0;
        case '0' ... '9': return 1;
        case 'a' ... 'z':
        case 'A' ... 'Z': return 2;
        default: return 3;
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
    rust: `/// for the addition of two unsigned integers, Alive2 correctly identifies
/// the different behaviors between source C++ (implicitly wrapping) and
/// target Rust (panics when overflow happens).
pub fn add(a: u32, b: u32) -> u32 {
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
    cpp: `/// qq: is this a false positive (i.e., they are not semantically equivalent while alive2 claims they are)?
///     1. from llvm ir's perspective?
///        - does alive2 have the visibility of (____) ?
///     2. from cpp/rust's perspective?
///        - do we have the visibility of (____) ?
int deref(const int *ptr) {
    // ptr could be (____) here, which will trigger a segfault.
    return *ptr;
}`,
    rust: `/// a "safer" translation - is this semantically equivalent?
/// plus, do we really want the "semantic equivalence" when migrating from cpp to rust?
pub fn deref(ptr: &i32) -> i32 {
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

// explicit instantiation for float
pub extern "C" fn add_generic_float(a: f32, b: f32) -> f32 {
    add_generic(a, b)
}`
  },
  initialize_array: {
    cpp: `/// memory layout is considered when checking semantic equivalence,
/// e.g., the array initialization in this cpp function uses both
/// non-local and local (memory) blocks.
void initialize_array() {
    int arr[10] = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };
}`,
    rust: `/// memory layout is different, i.e., only 40 bytes of
/// local (memory) blocks are used.
pub fn initialize_array() {
    let _arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
}`
  },
  clone: {
    cpp: `struct Point {
    int x;
    int y;
};

int clone_point_and_read_x(int x, int y) {
    Point p = { x, y };
    Point p_clone = p;
    return p_clone.x;
}`,
    rust: `#[repr(C)]
#[derive(Clone)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

pub fn clone_point_and_read_x(x: i32, y: i32) -> i32 {
    let p = Point { x, y };
    let p_clone = p.clone();
    p_clone.x
}`
  },
  bitfield_ops: {
    cpp: `unsigned int extract_bits(unsigned int value, unsigned int start, unsigned int length) {
    return (value >> start) & ((1u << length) - 1);
}`,
    rust: `pub fn extract_bits(value: u32, start: u32, length: u32) -> u32 {
    (value >> start) & ((1u32 << length) - 1)
}`
  },
  div_by_zero: {
    cpp: `/// ub will be detected by alive2, this is also considered semantically
/// different from the rust version.
int div_by_zero(int a, int b) {
    return a / (b - b);
}`,
    rust: `/// the source cpp module is ub, and the function attrs are different
/// so the verifier fails to compare the two even after switching the order.
pub fn div_by_zero(a: i32, b: i32) -> i32 {
    a / (b - b)
}`
  },
  callback: {
    cpp: `/// function pointer example, the verification will timeout.
/// note: function pointer is one of the unsupported features of alive2.
int process(int (*callback)(int), int x) {
    return callback(x);
}`,
    rust: `/// it is worth noting that this translation follows the simplest
/// function pointer style in rust, in order to type check
/// with the cpp llvm ir when verifying by alive2.
pub fn process(callback: fn(i32) -> i32, x: i32) -> i32 {
    callback(x)
}`
  },
  simple_reference: {
    cpp: `void swap(int &a, int &b) {
    int temp = a;
    a = b;
    b = temp;
}`,
    rust: `/// the reference needs to be explicit mutable,
/// note that the parameters in the generated ir functions are just pointers (e.g., ptr align 4 %a)
/// since other guarantees are enforced by rust's type system at compile time -
/// which is much simpler than those "explicit attribute requirements" in cpp's ir.
/// see \`simple_reference_cpp/rs.ll\` for more details.
pub fn swap(a: &mut i32, b: &mut i32) {
    let temp = *a;
    *a = *b;
    *b = temp;
}`
  },
  union: {
    cpp: `union IntFloat {
    int i;
    float f;
};

float int_bits_to_float(int bits) {
    IntFloat u;
    u.i = bits;
    return u.f;
}`,
    rust: `union IntFloat {
    i: i32,
    f: f32,
}

pub fn int_bits_to_float(bits: i32) -> f32 {
    unsafe {
        let u = IntFloat { i: bits };
        u.f
    }
}`
  },
  factorial: {
    cpp: `int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}`,
    rust: `/// nested function call is not supported by alive2,
/// so that the recursive call to \`factorial\` will be trivially
/// marked as undefined behavior (UB) and rejected by alive2.
pub fn factorial(n: i32) -> i32 {
    if n <= 1 {
        return 1;
    }
    n.wrapping_mul(factorial(n - 1))
}`
  },
  nested_switch: {
    cpp: `int process_tokens(char type, int value) {
    switch (type) {
        case 'n':
            switch (value) {
                case 0: return -1;
                case 1:
                case 2: return value * 10;
                default:
                    if (value > 100) return 100;
            }
        case 'c':
            if (value < 32) return 0;
        case 's':
            return value + 50;
        default:
            return -99;
    }
}`,
    rust: `/// the extern "C" and \`i8\` are the same as in \`switch_case.rs\`.
/// note that we need to use \`wrapping_mul\` and \`wrapping_add\`
/// to make alive2 happy.
pub extern "C" fn process_tokens(type_: i8, value: i32) -> i32 {
    match type_ as u8 as char {
        'n' => {
            match value {
                0 => -1,
                1 | 2 => value.wrapping_mul(10),
                v if v > 100 => 100,
                v => {
                    if v < 32 { 0 }
                    else { v.wrapping_add(50) }
                }
            }
        }
        'c' => {
            if value < 32 { 0 }
            else { value.wrapping_add(50) }
        }
        's' => value.wrapping_add(50),
        _ => -99
    }
}`
  },
};
