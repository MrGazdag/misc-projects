#version 300 es
precision mediump float;

in vec2 CornerPos;
out vec4 fragColor;

uniform vec2 iResolution;
uniform float iTime;

uniform float corner;
uniform vec4 mode;
uniform sampler2D textureFrom;
uniform sampler2D textureTo;
uniform float textureDelta;
uniform float textureDuration;

#include "lygia/animation/easing/cubic.glsl"
#include "./utils/utils.glsl"
#include "./utils/animation.glsl"
#include "./utils/constants.glsl"

float fadeInModeTime() {
    bool fromZero = roughly(mode[0], 0.);
    bool toZero = roughly(mode[1], 0.);

    if (!fromZero && !toZero) return mode.w;
    if (fromZero && toZero) return 0.;

    if (fromZero) return mode.z;
    else return mode.w-mode.z;
}

vec4 image(vec2 fragCoord) {
    float modeTime = fadeInModeTime();
    float hideAlpha = cubicInOut(timed(modeTime, 1., 2.));

    float textureAlpha = (1. - cubicIn(timed(textureDelta, 0., 1.)))
                       + cubicOut(timed(textureDelta, 1., 2.));

    float alpha = min(hideAlpha, textureAlpha);

    vec4 texel;
    vec2 size;
    if ((textureDelta/textureDuration) < 0.5) {
        texel = texture(textureFrom, fragCoord);
        size = vec2(textureSize(textureFrom, 0));
    } else {
        texel = texture(textureTo, fragCoord);
        size = vec2(textureSize(textureTo, 0));
    }

    vec2 uv = CornerPos;

    bool left = bool(round(corner) < 2.);
    if (left) uv.x = (uv.x * size.x + (1.-uv.y) * size.y) / size.x;
    else uv.x = (uv.x * size.x - (1.-uv.y) * size.y) / size.x;

    alpha *= ((size.x+size.y) / size.x);
    float mask = 0.;
    if (left) mask = uv.x > alpha ? 0. : 1.;
    else mask = uv.x < 1.-alpha ? 0. : 1.;

    return texel * vec4(vec3(HEADER_COLOR)/255., mask);
}
void main()
{
    vec2 fragCoord = CornerPos;
    fragColor = image(fragCoord);
}