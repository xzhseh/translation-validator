#include <cstring>

size_t str_len(const char* s, size_t len) {
    size_t count = 0;
    while (count < len && s[count] != '\0') {
        count++;
    }
    return count;
}
