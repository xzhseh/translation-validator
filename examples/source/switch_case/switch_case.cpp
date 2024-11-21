int classify_char(char c) {
    switch (c) {
        case ' ':
        case '\t':
        case '\n': return 0;  // whitespace
        case '0' ... '9': return 1;  // digit
        case 'a' ... 'z':
        case 'A' ... 'Z': return 2;  // letter
        default: return 3;  // other
    }
}
