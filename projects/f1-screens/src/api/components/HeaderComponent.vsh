#version 300 es
precision mediump float;

in vec2 CornerPosition;
uniform vec2 iResolution;
uniform float iTime;

uniform float corner;

uniform sampler2D textureFrom;
uniform sampler2D textureTo;
uniform float textureDelta;
uniform float textureDuration;

out vec2 CornerPos;

#include "./utils/utils.glsl"

void main() {
    vec2 zeroToOne = CornerPosition/2. + 0.5;
    CornerPos = zeroToOne;

    float animProgress = textureDelta/textureDuration;

    vec2 txSize = vec2(animProgress < 0.5 ? textureSize(textureFrom, 0).xy : textureSize(textureTo, 0).xy);
    txSize /= iResolution; // Into 0 -> 1
    txSize /= 2.; // Into -1 -> 1

    vec2 padding = (GLOBAL_MARGIN/iResolution)*2.; // -1 -> 1
    float top = 1. - padding.y;
    float bottom = top - (HEADER_HEIGHT/iResolution.y)*2.;

    vec2 centerPos = vec2(0,0);
    switch (int(round(corner))) {
        // Would divide by 2 to get center pos, then multiply by 2 for -1 -> 1
        case 0: centerPos = vec2(-1. + padding.x + txSize.x,   top    - txSize.y); break;
        case 1: centerPos = vec2(-1. + padding.x + txSize.x,   bottom + txSize.y); break;
        case 2: centerPos = vec2( 1. - padding.x - txSize.x,   bottom + txSize.y); break;
        case 3: centerPos = vec2( 1. - padding.x - txSize.x,   top    - txSize.y); break;
    }

    vec2 vertexPos = CornerPosition * txSize;
    //vertexPos = rotate(vertexPos*iResolution, iTime*6.28/2.)/iResolution;

    gl_Position = vec4(centerPos+vertexPos, 0., 1.);
}