#version 300 es
precision mediump float;

in vec2 CornerPos;
out vec4 fragColor;

uniform vec2 iResolution;
uniform float iTime;

uniform float corner;
uniform sampler2D textureFrom;
uniform sampler2D textureTo;
uniform float textureDelta;
uniform float textureDuration;

#include "./utils/utils.glsl"

vec4 image(vec2 fragCoord) {
    float modeTime = modeTimeNZ();
    float hideAlpha = cubicInOut(timed(modeTime, 1.5, 2.5));

    float animProgress = textureDelta/textureDuration;

    float textureAlpha = (1. - cubicIn(timed(animProgress, 0., 0.5)))
                       + cubicOut(timed(animProgress, 0.5, 1.));

    float alpha = min(hideAlpha, textureAlpha);

    vec4 texel;
    vec2 size;
    if (animProgress < 0.5) {
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