int null_deref() {
    const int *ptr = nullptr;
    return *ptr;
}
