bool inUnitRect(vec2 pos) {
    return 0. <= pos.x && pos.x <= 1.
    && 0. <= pos.y && pos.y <= 1.;
}
bool inRect(vec2 pos, vec2 center, vec2 size) {
    return center.x-size.x/2. <= pos.x && pos.x <= center.x+size.x/2.
    && center.y-size.y/2. <= pos.y && pos.y <= center.y+size.y/2.;
}
vec2 rectPos(vec2 pos, vec2 center, vec2 size) {
    return (pos-(center-size/2.))/size;
}
// rect: vec4(center.x, center.y, size.x, size.y)
// Returns a new rect with the *same aspect ratio* as inner,
// scaled to fit entirely inside outer, centered on outer.
vec2 fitOuterRectPosIntoInnerRect(vec2 pos, vec2 outer, vec2 inner) {
    // How much we can scale inner in each axis
    vec2 scale = outer / inner;  // outer.size / inner.size

    // Uniform scale so we don't change aspect ratio
    float s = min(scale.x, scale.y);

    return pos/s;
}
#define rectImage(tx, pos, center, size) (inRect(pos, center, size) ? texture(tx, rectPos(pos, center, size)) : vec4(0))