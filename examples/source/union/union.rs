union IntFloat {
    i: i32,
    f: f32,
}

pub fn int_bits_to_float(bits: i32) -> f32 {
    unsafe {
        let u = IntFloat { i: bits };
        u.f
    }
}
