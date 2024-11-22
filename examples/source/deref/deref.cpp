/// qq: is this a false positive (i.e., they are not semantically equivalent while alive2 claims they are)?
///     1. from llvm ir's perspective?
///        - does alive2 have the visibility of (____) ?
///     2. from cpp/rust's perspective?
///        - do we have the visibility of (____) ?
int deref(const int *ptr) {
    // ptr could be null here, which will trigger a segfault if ptr is null.
    return *ptr;
}
