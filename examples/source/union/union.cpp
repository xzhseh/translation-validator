union IntFloat {
    int i;
    float f;
};

float int_bits_to_float(int bits) {
    IntFloat u;
    u.i = bits;
    return u.f;
}
