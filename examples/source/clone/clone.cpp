struct Point {
    int x;
    int y;
};

int clone_point_and_read_x(int x, int y) {
    Point p = { x, y };
    Point p_clone = p;
    return p_clone.x;
}
