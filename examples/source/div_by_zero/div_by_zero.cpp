/// ub will be detected by alive2, this is also considered semantically
/// different from the rust version.
int div_by_zero(int a, int b) {
    return a / (b - b);
}
