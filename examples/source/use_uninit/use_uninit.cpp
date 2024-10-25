int use_uninit() {
    int arr[2];
    arr[1] = 1030;
    return arr[0];
}
