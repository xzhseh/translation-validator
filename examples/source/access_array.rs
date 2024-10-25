pub fn access_array(index: i32) -> i32 {
    let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    arr[index as usize]
}

#[allow(dead_code)]
fn main() {
    let _ret = access_array(10);
}
