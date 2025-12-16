bool inteq(float a, float b) {
    return int(a) == int(b);
}
bool inteq(float a, int b) {
    return int(a) == b;
}

bool intlt(float a, float b) {
    return int(a) < int(b);
}
bool intlt(float a, int b) {
    return int(a) < b;
}

bool intlteq(float a, float b) {
    return int(a) <= int(b);
}
bool intlteq(float a, int b) {
    return int(a) <= b;
}

bool intgteq(float a, float b) {
    return int(a) >= int(b);
}
bool intgteq(float a, int b) {
    return int(a) >= b;
}