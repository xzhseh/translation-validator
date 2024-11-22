pub fn binary_search(arr: &[i32], target: &i32) -> i32 {
    let mut left: i32 = 0;
    let mut right: i32 = arr.len().wrapping_sub(1) as i32;

    while left <= right {
        let mid = left.wrapping_add((right.wrapping_sub(left)) / 2);
        let mid_idx = mid as usize;

        if arr[mid_idx] == *target {
            return mid;
        }

        if arr[mid_idx] < *target {
            left = mid.wrapping_add(1);
        } else {
            if mid == 0 {
                break;
            }
            right = mid.wrapping_sub(1);
        }
    }

    -1
}
