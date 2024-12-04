/// function pointer example, the verification will timeout.
/// note: function pointer is one of the unsupported features of alive2.
int process(int (*callback)(int), int x) {
    return callback(x);
}
