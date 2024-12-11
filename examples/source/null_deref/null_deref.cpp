/// the source C++ will always trigger undefined behavior (UB)
int null_deref() {
    const int *ptr = nullptr;
    return *ptr;
}
