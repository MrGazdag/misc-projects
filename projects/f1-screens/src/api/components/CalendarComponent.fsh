#version 300 es
precision mediump float;

in vec2 CornerPos;
in vec2 boxSize;
out vec4 fragColor;
uniform vec4 raceIndex;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 position;

uniform sampler2D raceNumberTx;
uniform sampler2D nameTx;
uniform sampler2D flagTx;
uniform sampler2D shortDateTx;
uniform sampler2D fullDateTx;
uniform sampler2D timeTx;
uniform sampler2D timeZoneTx;

#include "./utils/utils.glsl"

vec4 bg(vec2 pos) {
    return vec4(vec3(100,100.,100.)/255., 0.15);
}

void main()
{
    float modeTime = modeTime(5);
    float fadeInAlpha = cubicInOut(timed(modeTime, 1.5, 2.0));
    float barAlpha = (1. - cubicInOut(timed(raceIndex.z, 0., 1.)))
    + cubicInOut(timed(raceIndex.z, 1., 2.));
    float alpha = min(fadeInAlpha, barAlpha);

    vec2 pos = CornerPos * boxSize;

    fragColor = bg(CornerPos);
    vec4 mlifOut;
    if (CornerPos.x < 0.5) {
        multilineIndexedFetch(mlifOut, timeTx, vec2(CornerPos.x*2.,CornerPos.y), iTime, 0.5, 1.);
    } else {
        multilineIndexedFetch(mlifOut, timeZoneTx, vec2((CornerPos.x-0.5)*2.,CornerPos.y), iTime, 0.5, 1.);
    }
    fragColor = alphaMix(fragColor, mlifOut);
    return;
}