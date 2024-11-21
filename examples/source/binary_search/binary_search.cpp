#include <cstdint>

template<typename T>
int64_t binary_search(const T *arr, int64_t size, const T *target) {
    if (size == 0) {
        return -1;
    }

    int64_t left = 0;
    int64_t right = size - 1;

    while (left <= right) {
        int64_t mid = left + ((right - left) / 2);
        
        if (arr[mid] == *target) {
            return mid;
        }
        
        if (arr[mid] < *target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}

void use() {
    int arr[] = {1, 2, 3, 4, 5};
    int target = 3;
    int _ = binary_search(arr, 5, &target);
}
