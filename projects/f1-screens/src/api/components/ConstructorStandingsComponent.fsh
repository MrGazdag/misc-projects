#version 300 es
precision mediump float;

in vec2 CornerPos;
in vec2 boxSize;
out vec4 fragColor;
uniform vec4 iRaceIndex;

uniform vec2 iResolution;
uniform float iTime;
uniform vec4 position;

uniform sampler2D nameTex;
uniform sampler2D imageTex;
uniform sampler2D flagTex;
uniform sampler2D teamTex;
uniform sampler2D positionTex;

#include "./utils/utils.glsl"

float fadeInModeTime() {
    return modeTime(1);
}

vec4 bg(vec2 pos) {
    return vec4(vec3(100,100.,100.)/255., 0.15);
}
vec4 drawImage(float heightOffset, float height, vec2 pos) {
    vec2 center = vec2(boxSize.x/2., boxSize.y-heightOffset);
    vec2 size = vec2(height, height);
    return rectImage(imageTex, pos, center, size);
}
vec4 drawName(float heightOffset, vec2 size, vec2 pos) {
    vec2 center = vec2(boxSize.x/2., boxSize.y-heightOffset);
    return rectImage(nameTex, pos, center, size);
}
vec4 drawFlag(float heightOffset, float height, vec2 pos) {
    vec2 center = vec2(boxSize.x/2.+PODIUM_BADGE_GAP/2.+height/2., boxSize.y-heightOffset);

    vec2 preferredSize = vec2(textureSize(flagTex, 0));
    vec2 size = vec2(height);

    vec2 posInInner = fitOuterRectPosIntoInnerRect(pos-center, size, preferredSize);

    return rectImage(flagTex, posInInner, vec2(0), preferredSize);
}
vec4 drawTeam(float heightOffset, float height, vec2 pos) {
    vec2 center = vec2(boxSize.x/2.-PODIUM_BADGE_GAP/2.-height/2., boxSize.y-heightOffset);

    vec2 preferredSize = vec2(textureSize(teamTex, 0));
    vec2 size = vec2(height);

    vec2 posInInner = fitOuterRectPosIntoInnerRect(pos-center, size, preferredSize);

    return rectImage(teamTex, posInInner, vec2(0), preferredSize);
}
vec4 drawPosition(float heightOffset, vec2 size, vec2 pos) {
    vec2 center = vec2(boxSize.x/2., boxSize.y-heightOffset);

    ivec3 color = ivec3(255);
    switch (int(round(position))) {
        case 0: color = ivec3(216, 183,   0); break;
        case 1: color = ivec3(175, 175, 175); break;
        case 2: color = ivec3(182, 146, 120); break;
    }

    return rectImage(positionTex, pos, center, size) * vec4(vec3(color)/255.,1.);
}
void main()
{
    if (1 == 1) {
        fragColor = vec4(1,0,0,1);
        return;
    }
    float modeTime = fadeInModeTime();
    float fadeInAlpha = cubicInOut(timed(modeTime, 1., 2.));
    float barAlpha = (1. - cubicInOut(timed(iRaceIndex.z, 0., 1.)))
                   + cubicInOut(timed(iRaceIndex.z, 1., 2.));
    float alpha = min(fadeInAlpha, barAlpha);

    vec2 pos = CornerPos * boxSize;

    fragColor = bg(pos);

    float offset = PODIUM_PADDING.y;
    vec2 size = vec2(0., PODIUM_IMAGE_HEIGHT);
    fragColor = alphaMix(fragColor, drawImage(offset+size.y/2., size.y, pos));

    offset += size.y + PODIUM_IMAGE_NAME_GAP;
    size = vec2(textureSize(nameTex, 0));
    fragColor = alphaMix(fragColor, drawName(offset+size.y/2., size, pos));

    offset += size.y + PODIUM_NAME_BADGE_GAP;
    size = vec2(0., PODIUM_BADGE_HEIGHT);
    fragColor = alphaMix(fragColor, drawTeam(offset+size.y/2., size.y, pos));
    fragColor = alphaMix(fragColor, drawFlag(offset+size.y/2., size.y, pos));

    offset += size.y + PODIUM_BADGE_POSITION_GAP;
    size = vec2(textureSize(positionTex, 0));
    fragColor = alphaMix(fragColor, drawPosition(offset+size.y/2., size, pos));

    fragColor.a *= alpha;
}