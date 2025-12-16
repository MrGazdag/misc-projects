uniform vec4 iMode;

float modeTime(int target) {
    bool fromOne = inteq(iMode.x, target);
    bool toOne = inteq(iMode.y, target);

    if (fromOne && toOne) return iMode.w;
    if (!fromOne && !toOne) return 0.;

    if (toOne) return iMode.z;
    else return iMode.w-iMode.z;
}

float modeTimeNZ() {
    return iMode.w - modeTime(0);
}