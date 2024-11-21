/// needs to pass as `i8` to match with the parameter in the
/// cpp ir file, check `switch_case_cpp.ll` for more details.
/// the extern "C" is needed for the parameter attributes (e.g., signext).
pub extern "C" fn classify_char(c: i8) -> i32 {
    match c as u8 as char {
        ' ' | '\t' | '\n' => 0,
        '0'..='9' => 1,
        'a'..='z' | 'A'..='Z' => 2,
        // 'a'..='z' | 'A'..='Z' => (try replacing 2 with any other values and run the validator again),
        _ => 3
    }
}
