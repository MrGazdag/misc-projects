#version 300 es
precision mediump float;

in vec2 CornerPos;
in vec2 boxSize;
out vec4 fragColor;
uniform vec4 mode;
uniform vec4 raceIndex;

uniform vec2 iResolution;
uniform float iTime;
uniform float position;

uniform sampler2D nameTex;
uniform sampler2D imageTex;
uniform sampler2D flagTex;
uniform sampler2D teamTex;
uniform sampler2D positionTex;

#include "lygia/animation/easing/cubic.glsl"
#include "./utils/utils.glsl"
#include "./utils/animation.glsl"
#include "./utils/constants.glsl"

float fadeInModeTime() {
    bool fromOne = roughly(mode[0], 1.);
    bool toOne = roughly(mode[1], 1.);

    if (fromOne && toOne) return mode.w;
    if (!fromOne && !toOne) return 0.;

    if (toOne) return mode.z;
    else return mode.w-mode.z;
}

vec4 bg(vec2 pos) {
    return vec4(vec3(100,100.,100.)/255., 0.15);
}
vec4 drawImage(float heightOffset, float height, vec2 pos) {
    vec2 center = vec2(boxSize.x/2., boxSize.y-heightOffset);
    vec2 size = vec2(height, height);
    if (inRect(pos, center, size)) {
        //if (true) return vec4(1,0,0,1);
        return texture(imageTex, rectPos(pos, center, size));
    }
    return vec4(0);
}
vec4 drawName(float heightOffset, vec2 size, vec2 pos) {
    vec2 center = vec2(boxSize.x/2., boxSize.y-heightOffset);
    if (inRect(pos, center, size)) {
        return texture(nameTex, rectPos(pos, center, size));
    }
    return vec4(0);
}
vec4 drawFlag(float heightOffset, float height, vec2 pos) {
    vec2 center = vec2(boxSize.x/2.+PODIUM_BADGE_GAP/2.+height/2., boxSize.y-heightOffset);

    vec2 preferredSize = vec2(textureSize(flagTex, 0));
    vec2 size = vec2(height);

    vec2 posInInner = fitOuterRectPosIntoInnerRect(pos-center, size, preferredSize);

    if (inRect(posInInner, vec2(0), preferredSize)) {
        return texture(flagTex, rectPos(posInInner, vec2(0), preferredSize));
    }
    return vec4(0);
}
vec4 drawTeam(float heightOffset, float height, vec2 pos) {
    vec2 center = vec2(boxSize.x/2.-PODIUM_BADGE_GAP/2.-height/2., boxSize.y-heightOffset);

    vec2 preferredSize = vec2(textureSize(teamTex, 0));
    vec2 size = vec2(height);

    vec2 posInInner = fitOuterRectPosIntoInnerRect(pos-center, size, preferredSize);

    if (inRect(posInInner, vec2(0), preferredSize)) {
        return texture(teamTex, rectPos(posInInner, vec2(0), preferredSize));
    }
    return vec4(0);
}
vec4 drawPosition(float heightOffset, vec2 size, vec2 pos) {
    vec2 center = vec2(boxSize.x/2., boxSize.y-heightOffset);
    if (inRect(pos, center, size)) {
        float alpha = texture(positionTex, rectPos(pos, center, size)).a;
        ivec3 color = ivec3(255);
        switch (int(round(position))) {
            case 0: color = ivec3(216, 183,   0); break;
            case 1: color = ivec3(175, 175, 175); break;
            case 2: color = ivec3(182, 146, 120); break;
        }
        return vec4(vec3(color)/255., alpha);
    }
    return vec4(0);
}
void main()
{

    float modeTime = fadeInModeTime();
    float fadeInAlpha = cubicInOut(timed(modeTime, 1., 2.));
    float barAlpha = (1. - cubicInOut(timed(raceIndex.z, 0., 1.)))
                   + cubicInOut(timed(raceIndex.z, 1., 2.));
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