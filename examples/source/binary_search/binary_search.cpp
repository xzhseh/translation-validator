#include <cstdint>

/// what if `arr === nullptr` or `target === nullptr`?
/// does alive2 know this?
int32_t binary_search(const int32_t *arr, int64_t size, const int32_t *target) {
    int32_t left = 0;
    int32_t right = size - 1;

    while (left <= right) {
        int32_t mid = left + ((right - left) / 2);
        
        if (arr[mid] == *target) {
            return mid;
        }
        
        if (arr[mid] < *target) {
            left = mid + 1;
        } else {
            if (mid == 0) {
                break;
            }
            right = mid - 1;
        }
    }
    
    return -1;
}
