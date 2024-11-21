unsigned int extract_bits(unsigned int value, unsigned int start, unsigned int length) {
    return (value >> start) & ((1u << length) - 1);
}
