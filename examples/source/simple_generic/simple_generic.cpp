template <typename T>
T add_generic(T a, T b) {
    return a + b;
}

template int add_generic<int>(int a, int b);
template float add_generic<float>(float a, float b);
