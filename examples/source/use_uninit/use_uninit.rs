pub fn use_uninit() -> i32 {
    // rust requires all elements in an array to be initialized before use
    let mut arr = [0; 2];
    arr[1] = 1030;
    arr[0]
}
