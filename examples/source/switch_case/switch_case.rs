pub extern "C" fn classify_char(c: i8) -> i32 {
    match c as u8 as char {
        ' ' | '\t' | '\n' => 0,
        '0'..='9' => 1,
        'a'..='z' | 'A'..='Z' => 2,
        _ => 3
    }
}
