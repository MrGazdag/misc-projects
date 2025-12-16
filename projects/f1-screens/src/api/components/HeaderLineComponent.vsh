#version 300 es
precision mediump float;

in vec2 CornerPosition;
uniform vec2 iResolution;
uniform float iTime;

out vec2 CornerPos;

#include "./utils/utils.glsl"

void main() {
    vec2 zeroToOne = CornerPosition/2. + 0.5;
    CornerPos = zeroToOne;

    float modeTime = modeTimeNZ();
    float barAlpha = cubicInOut(timed(modeTime, 1., 2.));

    vec2 centerPos = vec2(0.,1. - (GLOBAL_MARGIN.y + HEADER_HEIGHT + HEADER_LINE_MARGIN) / iResolution.y * 2.);

    float width = (iResolution.x - (GLOBAL_MARGIN.x * 2.)) * barAlpha;
    vec2 size = vec2(width, HEADER_LINE_THICKNESS) / iResolution; // -1 -> 1

    vec2 vertexPos = CornerPosition * size;
    //vertexPos = rotate(vertexPos*iResolution, iTime*6.28/2.)/iResolution;

    gl_Position = vec4(centerPos+vertexPos, 0., 1.);
}