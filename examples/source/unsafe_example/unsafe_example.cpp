#include <cstddef>

__attribute__((noinline))
int* get_value_at(int* ptr, size_t index) {
    return ptr + index;
}
