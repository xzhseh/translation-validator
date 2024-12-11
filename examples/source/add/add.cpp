/// according to the cpp language specification, overflow of the addition
/// operation of two signed integers is considered undefined behavior (UB).
/// that's why `clang++` will add the `noundef` attribute to the return value
/// and use `add nsw` instead of normal `add` instruction - in a purely syntactic
/// way that strictly follows the cpp language specification.
/// see `examples/ir_fixed/add/` for more details.
int add(int a, int b) {
    return a + b;
}
