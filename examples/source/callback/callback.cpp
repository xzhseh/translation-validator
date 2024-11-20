int process(int (*callback)(int), int x) {
    return callback(x);
}
