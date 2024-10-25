pub fn str_len(s: &[u8]) -> usize {
    let mut count = 0;
    while count < s.len() && s[count] != 0 {
        count += 1;
    }
    count
}
