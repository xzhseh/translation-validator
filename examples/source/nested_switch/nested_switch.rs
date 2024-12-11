/// the extern "C" and `i8` are the same as in `switch_case.rs`.
/// note that we need to use `wrapping_mul` and `wrapping_add`
/// to make alive2 happy.
#[inline(never)]
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
}
