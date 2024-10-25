int access_array(int index) {
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

    if (index < 0 || index >= 10) {
        return -1;
    }

    return arr[index];
}
