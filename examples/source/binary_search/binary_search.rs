/// a safer translation - rust's type system ensures that the pointer/reference will never be null.
/// the result for this is that, the "counterexample" provided by alive2 is **false positive**.
/// since alive2 has no visibility into the type system's guarantees, it cannot see that
/// the pointer cannot be null, which is not reflected in the rust ir level.
pub fn binary_search<T: Ord>(arr: &[T], target: &T) -> i64 {
    let mut left: i64 = 0;
    let mut right: i64 = (arr.len() as i64) - 1;

    while left <= right {
        let mid: i64 = left + ((right - left) / 2);
        
        // safe conversion since mid is always within array bounds
        let mid_idx = mid as usize;
        
        match arr[mid_idx].cmp(target) {
            std::cmp::Ordering::Equal => return mid,
            std::cmp::Ordering::Less => left = mid + 1,
            std::cmp::Ordering::Greater => {
                if mid == 0 {
                    break;
                }
                right = mid - 1;
            }
        }
    }

    -1
}

pub fn r#use() {
    let arr = vec![1, 2, 3, 4, 5];
    let target = 3;
    let _ = binary_search(&arr, &target);
}

// could these compile?
// let arr: &[i32] = std::ptr::null(); // ERROR: can't convert raw pointer
// let arr: &[i32] = &[]; // OK but length would be 0, not null ptr
// let target: &i32 = std::ptr::null(); // ERROR: can't convert raw pointer

// what about using `unsafe`?
// unsafe {
//     let arr: &[i32] = std::mem::transmute(std::ptr::null::<i32>());
//     let target: &i32 = std::mem::transmute(std::ptr::null::<i32>());
//     binary_search(arr, target); 
// }