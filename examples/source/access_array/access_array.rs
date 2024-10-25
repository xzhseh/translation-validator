pub fn access_array(index: u32) -> i32 {
    let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    arr[10 + index as usize]
}
