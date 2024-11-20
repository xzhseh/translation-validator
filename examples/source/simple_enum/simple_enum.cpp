enum Color {
    Red,
    Green,
    Blue,
};

Color create_color(int x) {
    return static_cast<Color>(x);
}
