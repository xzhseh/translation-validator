int process_tokens(char type, int value) {
    switch (type) {
        case 'n':  // number
            switch (value) {
                case 0: return -1;
                case 1:
                case 2: return value * 10;
                default:
                    if (value > 100) return 100;
            }
            // fallthrough for numbers
        case 'c':  // character
            if (value < 32) return 0;
            // fallthrough intentional
        case 's':  // special
            return value + 50;
        default:
            return -99;
    }
}
