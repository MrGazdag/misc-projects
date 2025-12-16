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

/*
vec4 multilineTextureSizeImpl(sampler2D tx, int lod) {
    vec2 size = vec2(textureSize(tx, lod));
    float distinctCount = floor(sampleNearest(tx, vec2(0., 1.-2./size.y)).r*255.);
    return 1./distinctCount;
}
*/

// Statement-style macro version of multilineTextureSizeImpl
// Requires: sampleNearest(tx, uv)
// Usage: multilineTextureSize(tx, lod);

#define multilineTextureSize(tx, lod) (vec2(textureSize(tx, lod)) / vec2(1., floor(sampleNearest(tx, vec2(0., 1.-2./vec2(textureSize(tx, lod)).y)).r*255.)))

#define rectImage(tx, pos, center, size) (inRect(pos, center, size) ? texture(tx, rectPos(pos, center, size)) : vec4(0))
#define rectImageMultiline(outColor, tx, pos, center, size, time, anim, sustain)              \
    if (inRect(pos, center, size)) {                                                          \
        multilineIndexedFetch(outColor, tx, rectPos(pos, center, size), time, anim, sustain); \
    } else {                                                                                  \
        (outColor) = vec4(0);                                                                 \
    }