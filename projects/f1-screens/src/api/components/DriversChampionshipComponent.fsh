#version 300 es
precision mediump float;

in vec2 CornerPos;
in vec2 boxSize;
out vec4 fragColor;
uniform vec4 iRaceIndex;

uniform vec2 iResolution;
uniform float iTime;
uniform vec4 position;
uniform float entryCount;

uniform sampler2D positionTx;
uniform sampler2D iconTx;
uniform sampler2D flagTx;
uniform sampler2D nameTx;
uniform sampler2D pointsTxOld;
uniform sampler2D pointsTxNew;
uniform sampler2D pointsDiffTxOld;
uniform sampler2D pointsDiffTxNew;
uniform vec4 pointsValue;

#include "./utils/utils.glsl"

float fadeInModeTime() {
    return modeTime(4);
}

vec4 bg(vec2 size, vec2 pos, float anim) {
    if (pos.x > anim*size.x) return vec4(0.);

    vec2 c = pos/size.y;
    if (c.x-c.y < -0.75) return vec4(0.);
    return vec4(vec3(100,100.,100.)/255., 0.15);
}
vec4 positionBox(vec2 size, vec2 pos, float anim) {
    vec2 c = pos/size.y;
    if (pos.x > size.x) return vec4(0.);
    if (abs(c.x-c.y) >= anim*0.75) return vec4(0.);
    return vec4(vec3(200., 200., 200.)/255.,1.);
}
vec4 drawPosition(vec2 pos) {
    vec2 txSize = vec2(textureSize(positionTx, 0));
    vec2 center = vec2(boxSize.y/2.);
    float mul = boxSize.y*0.6;
    vec2 size = vec2(txSize.x/txSize.y * mul, mul);
    return rectImage(positionTx, pos, center, size) * vec4(0.,0.,0.,1.);
}
vec4 drawImage(vec2 pos) {
    vec2 center = vec2(boxSize.y + CONSTRUCTOR_ENTRY_PADDING + boxSize.y*0.7/2., boxSize.y/2.);

    vec2 preferredSize = vec2(textureSize(iconTx, 0));
    vec2 size = vec2(boxSize.y*0.7);

    vec2 posInInner = fitOuterRectPosIntoInnerRect(pos-center, size, preferredSize);

    return rectImage(iconTx, posInInner, vec2(0), preferredSize);
}
vec4 drawFlag(vec2 pos) {
    vec2 center = vec2(boxSize.y + CONSTRUCTOR_ENTRY_PADDING + boxSize.y*0.7 + CONSTRUCTOR_ENTRY_PADDING + boxSize.y*0.7/2., boxSize.y/2.);

    vec2 preferredSize = vec2(textureSize(flagTx, 0));
    vec2 size = vec2(boxSize.y*0.7);

    vec2 posInInner = fitOuterRectPosIntoInnerRect(pos-center, size, preferredSize);

    return rectImage(flagTx, posInInner, vec2(0), preferredSize);
}
vec4 drawName(vec2 pos) {
    vec2 txSize = vec2(textureSize(nameTx, 0));
    float mul = boxSize.y*0.8;
    vec2 size = vec2(txSize.x/txSize.y * mul, mul);
    vec2 center = vec2(boxSize.y + CONSTRUCTOR_ENTRY_PADDING + boxSize.y*0.7 + CONSTRUCTOR_ENTRY_PADDING + boxSize.y*0.7 + CONSTRUCTOR_ENTRY_PADDING + size.x/2., boxSize.y/2.);
    if (false) {
        return alphaMix(inRect(pos, center, size) ? vec4(1,0,0,1) : vec4(0), rectImage(nameTx, pos, center, size));
    }
    return rectImage(nameTx, pos, center, size);
}
vec4 drawPoints(vec2 pos, bool newTx, bool diffTx) {
    vec2 txSize = vec2(diffTx
        ? (newTx
            ? textureSize(pointsDiffTxNew, 0)
            : textureSize(pointsDiffTxOld, 0))
        : (newTx
            ? textureSize(pointsTxNew, 0)
            : textureSize(pointsTxOld, 0))
    );
    float mul = boxSize.y*0.8;
    vec2 size = vec2(txSize.x/txSize.y * mul, mul);
    vec2 center = vec2(boxSize.x - CONSTRUCTOR_ENTRY_POINTS + (diffTx ? 1. : -1.) * size.x/2., boxSize.y/2.);

    if (diffTx) {
        if (newTx) return rectImage(pointsDiffTxNew, pos, center, size);
        else       return rectImage(pointsDiffTxOld, pos, center, size);
    } else {
        if (newTx) return rectImage(    pointsTxNew, pos, center, size);
        else       return rectImage(    pointsTxOld, pos, center, size);
    }
}
vec4 animateChange(vec4 color, vec4 data) {
    if (abs(data.z-data.w) < 0.001) return color;
    float barAlpha = (1. - cubicInOut(timed(iRaceIndex.z/iRaceIndex.w, 0.25, 0.5)))
    + cubicInOut(timed(iRaceIndex.z/iRaceIndex.w, 0.5, 0.75));

    color.a *= barAlpha;
    return color;
}
vec4 crossfadeChange(vec4 colorA, vec4 colorB, vec4 data) {
    //if (abs(data.z-data.w) < 0.001) return colorB;
    float barAlpha = cubicInOut(timed(iRaceIndex.z/iRaceIndex.w, 0.25, 0.75));
    return mix(colorA, colorB, barAlpha);
}
void main() {
    float modeTime = fadeInModeTime();
    float barAlpha = (1. - cubicInOut(timed(iRaceIndex.z, 0., 1.)))
    + cubicInOut(timed(iRaceIndex.z, 1., 2.));
    float alpha = min(1., barAlpha);

    float fadeInStartRange = 0.3;
    modeTime -= ((fadeInStartRange) / entryCount) * (fromToInterpEqIsBackwards(iMode, 4) ? entryCount-1.-position.y : position.y);
    modeTime = max(modeTime, 0.);

    vec2 pos = CornerPos * boxSize;

    fragColor = bg(boxSize, pos, cubicOut(timed(modeTime, 1.8, 2.5)));
    fragColor = alphaMix(fragColor, positionBox(vec2(boxSize.y), pos, cubicOut(timed(modeTime, 1.5, 1.8))));

    vec4 contentColor = vec4(0.);
    contentColor = alphaMix(contentColor, animateChange(drawPosition(pos),position));
    contentColor = alphaMix(contentColor, drawImage(pos));
    contentColor = alphaMix(contentColor, drawFlag(pos));
    contentColor = alphaMix(contentColor, crossfadeChange(drawPoints(pos, false, false),drawPoints(pos, true, false),pointsValue));
    contentColor = alphaMix(contentColor, crossfadeChange(drawPoints(pos, false,  true),drawPoints(pos, true,  true),pointsValue));
    contentColor = alphaMix(contentColor, drawName(pos));
    contentColor.a *= cubicOut(timed(modeTime, 2.5, 2.7));
    fragColor = alphaMix(fragColor, contentColor);

/*
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
    */
}