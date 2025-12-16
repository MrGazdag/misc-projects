uniform vec4 iMode;

float fromToInterp(vec4 data, int target) {
    bool fromOne = inteq(data.x, target);
    bool toOne = inteq(data.y, target);

    if (fromOne && toOne) return data.w;
    if (!fromOne && !toOne) return 0.;

    if (toOne) return data.z;
    else return data.w-data.z;
}
float fromToInterpLtEq(vec4 data, int target) {
    bool fromOne = intlteq(data.x, target);
    bool toOne = intlteq(data.y, target);

    if (fromOne && toOne) return data.w;
    if (!fromOne && !toOne) return 0.;

    if (toOne) return data.z;
    else return data.w-data.z;
}
float modeTime(int target) {
    return fromToInterp(iMode, target);
}

float modeTimeNZ() {
    return iMode.w - modeTime(0);
}