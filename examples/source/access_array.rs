pub fn access_array(index: i32) -> i32 {
    let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    if index < 0 || index >= 10 {
        return -1;
    }

    arr[index as usize]
}
