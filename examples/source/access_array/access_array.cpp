int access_array(unsigned int index) {
    int arr[10] {};

    // to preserve the memory layout as rust's
    arr[0] = 0;
    arr[1] = 1;
    arr[2] = 2;
    arr[3] = 3;
    arr[4] = 4;
    arr[5] = 5;
    arr[6] = 6;
    arr[7] = 7;
    arr[8] = 8;
    arr[9] = 9;

    // a subtle unsigned integer overflow "feature" in cpp,
    // i.e., implicitly wraps around.
    // e.g., when considering the input `index` as 0xfffffffc (4294967292, -4),
    // this function is more *defined* than the rust (panic) version.
    return arr[10 + index];
}
