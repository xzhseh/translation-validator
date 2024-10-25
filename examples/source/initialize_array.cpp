/// memory layout is considered when checking semantic equivalence,
/// e.g., the array initialization in this cpp function uses both
/// non-local and local (memory) blocks.
void initialize_array() {
    int arr[10] = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };
}
