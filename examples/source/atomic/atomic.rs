// use std::sync::atomic::{AtomicI32, Ordering};

// pub fn fetch_add(counter: &AtomicI32, value: i32) -> i32 {
//     counter.fetch_add(value, Ordering::Relaxed)
// }

// pub fn load(counter: &AtomicI32) -> i32 {
//     counter.load(Ordering::Relaxed)
// }

// pub fn store(counter: &AtomicI32, value: i32) {
//     counter.store(value, Ordering::Relaxed)
// }

// pub fn fetch_add(counter: &mut i32, value: i32) -> i32 {
//     let old = unsafe { std::ptr::read_volatile(counter) };
//     unsafe { std::ptr::write_volatile(counter, old + value) };
//     old
// }

// pub fn load(counter: &i32) -> i32 {
//     unsafe { std::ptr::read_volatile(counter) }
// }

// pub fn store(counter: &mut i32, value: i32) {
//     unsafe { std::ptr::write_volatile(counter, value) }
// }

pub fn fetch_add(counter: &mut i32, value: i32) -> i32 {
    let old = *counter;
    *counter = old.wrapping_add(value);
    old
}

pub fn load(counter: &i32) -> i32 {
    *counter
}

pub fn store(counter: &mut i32, value: i32) {
    *counter = value;
}
