#include <cstddef>

int sum_array(const int* arr, size_t len) {
    int sum = 0;
    for (size_t i = 0; i < len; i++) {
        sum += arr[i];
    }
    return sum;
}
