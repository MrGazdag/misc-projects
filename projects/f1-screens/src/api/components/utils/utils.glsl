#include "lygia/generative/random.glsl"
#include "lygia/generative/cnoise.glsl"
#include "lygia/animation/easing/cubic.glsl"
#include "lygia/animation/easing/sine.glsl"
#include "lygia/math/saturate.glsl"

#include "./intmath.glsl"
#include "./vecmath2d.glsl"
#include "./constants.glsl"
#include "./animation.glsl"
#include "./rects.glsl"
#include "./mode.glsl"
vec4 image(vec2 fragCoord, sampler2D s, vec4 srcPos, vec4 destPos, float opacity) {
    vec2 screenPos = fragCoord / iResolution.xy;

    vec2 size = vec2(textureSize(s, 0));

    vec2 coord = (screenPos-destPos.xy) / destPos.zw;
    if (coord.x < 0. || 1. < coord.x
    || coord.y < 0. || 1. < coord.y) return vec4(0.);

    vec4 color = texture(s, srcPos.xy + srcPos.zw*coord);
    color.a *= opacity;
    return color;
}
vec4 image(vec2 fragCoord, sampler2D s, vec4 srcPos, vec4 destPos) {
    return image(fragCoord, s, srcPos, destPos, 1.);
}

float clampDiv(float x, float min, float max) {
    if (x <= min) return 0.0;
    if (x >= max) return 1.0;
    return (x-min)/(max-min);
}
vec4 alphaMix(vec4 bottom, vec4 top) {
    bottom = clamp(bottom, 0., 1.);
    top = clamp(top, 0., 1.);
    float outA = top.a + bottom.a * (1.0 - top.a);

    // Prevent divide-by-zero
    if (outA < 1e-6) return vec4(0.0);

    vec3 outRGB = (top.rgb * top.a + bottom.rgb * bottom.a * (1.0 - top.a)) / outA;

    return vec4(outRGB, outA);
}
bool roughly(float a, float b) {
    return abs(a-b) < 0.0001;
}
#define sampleNearest(s, uv) texture(s, (floor(uv * vec2(textureSize(s, 0))) + 0.5) / vec2(textureSize(s, 0)))

/*
vec4 multilineIndexedFetchImpl(sampler2D tx, vec2 p, float time, float anim, float sustain) {
    vec2 size = vec2(textureSize(tx, 0));
    float txCount = floor(sampleNearest(tx, vec2(0., 1.)).r*255.);
    float distinctCount = floor(sampleNearest(tx, vec2(0., 1.-2./size.y)).r*255.);

    // Get current time
    float modulo = mod(time/(anim+sustain), txCount);
    float currentMagicIndex = floor(modulo);
    float prevMagicIndex = mod(currentMagicIndex+txCount-1., txCount);

    // Get target and prev texture
    vec4 prevMagic = sampleNearest(tx, vec2(0., round(size.y - 3. - prevMagicIndex))/size);
    vec4 currentMagic = sampleNearest(tx, vec2(0., round(size.y - 3. - currentMagicIndex))/size);
    float currentTxIndex = distinctCount - 1. - floor(currentMagic.r*255.);
    float prevTxIndex = distinctCount - 1. - floor(prevMagic.r*255.);

    // Position
    float xOffset = 2./size.x;
    float xMul = (size.x-1.)/size.x;
    float oneHeight = 1./distinctCount;
    vec2 pos = vec2(xOffset+p.x*xMul, 0.);

    if (inteq(currentTxIndex, prevTxIndex)) {
        pos.y = (currentTxIndex + p.y) * oneHeight;
    } else {
        float y = p.y + cubicInOut(clamp(fract(modulo)/anim, 0., 1.));
        if (y > 1.) {
            pos.y = (currentTxIndex + (y-1.))*oneHeight;
        } else {
            pos.y = (prevTxIndex + y)*oneHeight;
        }
    }

    return texture(tx,pos);
}
*/

// Statement-style macro version of multilineIndexedFetchImpl
// Requires: sampleNearest(tx, uv), inteq(a,b), cubicInOut(x)
// Usage: vec4 col; multilineIndexedFetch(col, tx, p, time, anim, sustain);

#define multilineIndexedFetch(outColor, tx, p, time, anim, sustain)                                    \
    vec2  _m_size = vec2(textureSize((tx), 0));                                                        \
    float _m_txCount = floor(sampleNearest((tx), vec2(0.0, 1.0)).r * 255.0);                           \
    float _m_distinct = floor(sampleNearest((tx), vec2(0.0, 1.0 - 2.0/_m_size.y)).r * 255.0);          \
                                                                                                       \
    float _m_modulo = mod((time) / ((anim) + (sustain)), _m_txCount);                                  \
    float _m_curMagic = floor(_m_modulo);                                                              \
    float _m_prevMagic = mod(_m_curMagic + _m_txCount - 1.0, _m_txCount);                              \
                                                                                                       \
    vec4  _m_prevPx = sampleNearest((tx), vec2(0.0, round(_m_size.y - 3.0 - _m_prevMagic)) / _m_size); \
    vec4  _m_curPx  = sampleNearest((tx), vec2(0.0, round(_m_size.y - 3.0 - _m_curMagic)) / _m_size);  \
    float _m_curIdx = _m_distinct - 1.0 - floor(_m_curPx.r  * 255.0);                                  \
    float _m_prevIdx= _m_distinct - 1.0 - floor(_m_prevPx.r * 255.0);                                  \
                                                                                                       \
    float _m_xOff = 2.0 / _m_size.x;                                                                   \
    float _m_xMul = (_m_size.x - 1.0) / _m_size.x;                                                     \
    float _m_oneH = 1.0 / _m_distinct;                                                                 \
    vec2  _m_pos  = vec2(_m_xOff + (p).x * _m_xMul, 0.0);                                              \
                                                                                                       \
    if (inteq(_m_curIdx, _m_prevIdx)) {                                                                \
        _m_pos.y = (_m_curIdx + (p).y) * _m_oneH;                                                      \
    } else {                                                                                           \
        float _m_y = (p).y + cubicInOut(clamp(fract(_m_modulo) / (anim), 0.0, 1.0));                   \
        if (_m_y > 1.0) {                                                                              \
            _m_pos.y = (_m_curIdx + (_m_y - 1.0)) * _m_oneH;                                           \
        } else {                                                                                       \
            _m_pos.y = (_m_prevIdx + _m_y) * _m_oneH;                                                  \
        }                                                                                              \
    }                                                                                                  \
                                                                                                       \
    (outColor) = texture((tx), _m_pos);