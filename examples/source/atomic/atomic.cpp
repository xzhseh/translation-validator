//! unfortunately, Alive2 does NOT support atomic operations and
//! the corresponding LLVM IR instructions.

#include <atomic>

// int fetch_add(std::atomic<int>& counter, int value) {
//     return counter.fetch_add(value, std::memory_order_relaxed);
// }

// int load(std::atomic<int>& counter) {
//     return counter.load(std::memory_order_relaxed);
// }

// void store(std::atomic<int>& counter, int value) {
//     counter.store(value, std::memory_order_relaxed);
// }

// use volatile to prevent optimization
// int fetch_add(volatile int* counter, int value) {
//     int old = *counter;
//     *counter = old + value;
//     return old;
// }

// int load(volatile int* counter) {
//     return *counter;
// }

// void store(volatile int* counter, int value) {
//     *counter = value;
// }

int fetch_add(int* counter, int value) {
    int old = *counter;
    *counter = old + value;
    return old;
}

int load(const int* counter) {
    return *counter;
}

void store(int* counter, int value) {
    *counter = value;
}
