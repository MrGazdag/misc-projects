#version 300 es
precision mediump float;

in vec2 CornerPosition;
uniform vec2 iResolution;
uniform float iTime;
uniform vec4 raceIndex;

uniform float position;

out vec2 CornerPos;
out vec2 boxSize;

#include "./utils/utils.glsl"

float fadeInModeTime() {
    return modeTime(1);
}

void main() {
    vec2 zeroToOne = CornerPosition/2. + 0.5;
    CornerPos = zeroToOne;

    float modeTime = fadeInModeTime();
    float fadeInAlpha = cubicInOut(timed(modeTime, 1., 2.));
    float barAlpha = (1. - cubicInOut(timed(raceIndex.z, 0., 1.)))
                     + cubicInOut(timed(raceIndex.z, 1., 2.));
    float alpha = min(fadeInAlpha, barAlpha);

    vec2 centerAreaSize = vec2(
        iResolution.x-GLOBAL_MARGIN.x*2.,
        iResolution.y-GLOBAL_MARGIN.y-HEADER_HEIGHT-HEADER_LINE_MARGIN*2.-HEADER_LINE_THICKNESS-GLOBAL_MARGIN.y
    )/iResolution; // 0 -> 1

    vec2 centerAreaCenterPos = vec2(
        0.5,
        1. - ((GLOBAL_MARGIN.y + HEADER_HEIGHT + HEADER_LINE_MARGIN * 2.) / iResolution.y) - centerAreaSize.y /2.
    );

    float gap = PODIUM_COLUMN_GAP/iResolution.x; // 0 -> 1

    float cardWidth = (centerAreaSize.x-(gap*2.)) / 3.; // 0 -> 1
    float remapped = position;
    switch (int(round(position))) {
        case 0: remapped =  0.; break;
        case 1: remapped = -1.; break;
        case 2: remapped =  1.; break;
    }

    float xOffset = remapped * (gap + cardWidth);

    vec2 centerPos = centerAreaCenterPos + vec2(xOffset, 0.) - vec2(0., PODIUM_ANIMATION_OFFSET/iResolution.y)*(1.-alpha);

    float width = cardWidth;
    float height = centerAreaSize.y;
    vec2 size = vec2(width, height); // 0 -> 1


    boxSize = size * iResolution;

    vec2 vertexPos = CornerPosition * size/2.; // -1 -> 1
    //vertexPos = rotate(vertexPos*iResolution, iTime*6.28/2.)/iResolution;

    vec2 finalPos = centerPos+vertexPos;

    gl_Position = vec4(finalPos*2.-1., 0., 1.);
}