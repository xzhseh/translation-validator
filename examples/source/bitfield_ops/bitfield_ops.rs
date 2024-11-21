pub fn extract_bits(value: u32, start: u32, length: u32) -> u32 {
    (value >> start) & ((1u32 << length) - 1)
}
