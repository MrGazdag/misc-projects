#version 300 es
precision mediump float;

in vec2 CornerPosition;
uniform vec2 iResolution;
uniform float iTime;
uniform vec4 raceIndex;

uniform vec4 position;

out vec2 CornerPos;
out vec2 boxSize;

#include "./utils/utils.glsl"

float fadeInModeTime() {
    return modeTime(4);
}

void main() {
    vec2 zeroToOne = CornerPosition/2. + 0.5;
    CornerPos = zeroToOne;

    float modeTime = modeTime(4);

    vec2 centerAreaTopCenterPos = vec2(
    0.5,
    1. - ((GLOBAL_MARGIN.y + HEADER_HEIGHT + HEADER_LINE_MARGIN * 2.0) / iResolution.y)
    );

    float gap = 20.;

    float actualPosition = mix(position.x, position.y, cubicInOut(timed(position.z/position.w, 0.25, 0.75)));

    // Final calc
    float yOffset = -gap/iResolution.y + (actualPosition+0.5) * ((CALENDAR_ENTRY_HEIGHT+gap)/iResolution.y);

    vec2 centerPos = centerAreaTopCenterPos - vec2(0., yOffset);

    vec2 size = vec2(iResolution.x-GLOBAL_MARGIN.x*2., CALENDAR_ENTRY_HEIGHT)/iResolution;
    boxSize = size * iResolution;

    vec2 vertexPos = CornerPosition * size/2.; // -1 -> 1
    //vertexPos = rotate(vertexPos*iResolution, iTime*6.28/2.)/iResolution;

    vec2 finalPos = centerPos+vertexPos;
    gl_Position = vec4(finalPos*2.-1., 0., 1.);
}