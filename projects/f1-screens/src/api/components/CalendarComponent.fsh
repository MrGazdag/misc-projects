#version 300 es
precision mediump float;

in vec2 CornerPos;
in vec2 boxSize;
out vec4 fragColor;
uniform vec4 iRaceIndex;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 position;

uniform sampler2D nextUpTx;
uniform sampler2D raceNumberTx;
uniform sampler2D nameTx;
uniform sampler2D flagTx;
uniform sampler2D shortDateTx;
uniform sampler2D longDateTx;
uniform sampler2D shortTimeTx;
uniform sampler2D longTimeTx;
uniform sampler2D timeZoneTx;

#include "./utils/utils.glsl"

vec4 bg(vec2 pos, float selection) {
    return vec4(mix(
        vec3(100., 100., 100.),
        vec3(169.,  62., 255.),
        cubicInOut(timed(selection, 0.5, 1.5))
    )/255., 0.15);
}

vec4 drawRaceNumber(vec2 pos) {
    float padding = 5.;
    vec2 size = vec2(CALENDAR_ENTRY_HEIGHT);
    vec2 center = vec2(padding + size.x/2., boxSize.y - size.y/2.);

    vec2 preferredSize = vec2(textureSize(raceNumberTx, 0));

    vec2 posInInner = fitOuterRectPosIntoInnerRect(pos-center, size, preferredSize);

    return rectImage(raceNumberTx, posInInner, vec2(0), preferredSize);
}
vec4 drawFlag(vec2 pos, bool selected) {
    float gap = 5.;
    vec2 size = vec2(CALENDAR_ENTRY_HEIGHT);
    vec2 center = vec2(gap + size.x/2., size/2.);
    if (!selected) center.x += size.x + gap * 2.;
    else {
        vec2 nameSize = vec2(textureSize(nameTx, 0)) * 0.4;
        vec2 totalSize = nameSize + size;
        center.x = boxSize.x * (1./6.) - totalSize.x/2. + size.x/2.;
    }

    vec2 preferredSize = vec2(textureSize(flagTx, 0));

    vec2 posInInner = fitOuterRectPosIntoInnerRect(pos-center, size, preferredSize);

    return rectImage(flagTx, posInInner, vec2(0), preferredSize);
}
vec4 drawName(vec2 pos, bool selected) {
    float gap = 5.;
    vec2 size = vec2(textureSize(nameTx, 0)) * 0.4;
    vec2 center = vec2(gap + CALENDAR_ENTRY_HEIGHT + gap*2. + size.x/2., CALENDAR_ENTRY_HEIGHT * 0.5);
    if (!selected) center.x += CALENDAR_ENTRY_HEIGHT + gap * 2.;
    else {
        vec2 flagSize = vec2(CALENDAR_ENTRY_HEIGHT);
        vec2 totalSize = flagSize + gap*2. + size;
        center.x = boxSize.x * (1./6.) - totalSize.x/2. + flagSize.x + gap*2. + size.x/2.;
    }
    return rectImage(nameTx, pos, center, size);
}

vec4 drawNextUp(vec2 pos) {
    float padding = 5.;
    vec2 size = vec2(textureSize(nextUpTx, 0)) * 0.4;
    vec2 center = vec2(padding + CALENDAR_ENTRY_HEIGHT + size.x/2., boxSize.y - CALENDAR_ENTRY_HEIGHT/2.);
    return rectImage(nextUpTx, pos, center, size) * 0.8;
}


vec4 drawTimeZone(vec2 pos, bool selected) {
    float gap = 5.;
    vec2 size = vec2(multilineTextureSize(timeZoneTx, 0)) * 0.4;
    vec2 center = vec2(boxSize.x - gap - size.x/2., CALENDAR_ENTRY_HEIGHT * 0.5);

    if (selected) {
        vec2 timeSize = vec2(multilineTextureSize(shortTimeTx, 0)) * 0.4;
        vec2 totalSize = size + timeSize;
        center.x = boxSize.x * (5./6.) - totalSize.x/2. + timeSize.x + size.x/2.;
    }

    //size = boxSize;
    //center = boxSize/2.;
    //if (true) return rectImage(nextUpTx, pos, center, size) * 0.8;
    //return vec4(vec2(multilineTextureSize(timeZoneTx, 0)), 0., 1.);

    vec4 result;
    rectImageMultiline(result, timeZoneTx, pos, center, size, iTime, 0.5, 2.);
    return result;
}
vec4 drawShortTime(vec2 pos) {
    float gap = 5.;
    vec2 size = vec2(multilineTextureSize(shortTimeTx, 0)) * 0.4;

    vec2 zoneSize = vec2(multilineTextureSize(timeZoneTx, 0)) * 0.4;
    vec2 center = vec2(boxSize.x - gap - zoneSize.x - gap - size.x/2., CALENDAR_ENTRY_HEIGHT * 0.5);

    //size = boxSize;
    //center = boxSize/2.;
    //if (true) return rectImage(nextUpTx, pos, center, size) * 0.8;
    //return vec4(vec2(multilineTextureSize(timeZoneTx, 0)), 0., 1.);

    vec4 result;
    rectImageMultiline(result, shortTimeTx, pos, center, size, iTime, 0.5, 2.);
    return result;
}
vec4 drawLongTime(vec2 pos) {
    float gap = 5.;
    vec2 size = vec2(multilineTextureSize(longTimeTx, 0)) * 0.4;
    vec2 center = vec2(boxSize.x * (5./6.), CALENDAR_ENTRY_HEIGHT * 0.5);

    //size = boxSize;
    //center = boxSize/2.;
    //if (true) return rectImage(nextUpTx, pos, center, size) * 0.8;
    //return vec4(vec2(multilineTextureSize(timeZoneTx, 0)), 0., 1.);

    vec4 result;
    rectImageMultiline(result, longTimeTx, pos, center, size, iTime, 0.5, 2.);
    return result;
}
vec4 drawShortDate(vec2 pos) {
    float gap = 5.;
    float bigGap = 20.;
    vec2 size = vec2(multilineTextureSize(shortDateTx, 0)) * 0.4;

    vec2 zoneSize = vec2(multilineTextureSize(timeZoneTx, 0)) * 0.4;
    vec2 timeSize = vec2(multilineTextureSize(shortTimeTx, 0)) * 0.4;
    vec2 center = vec2(boxSize.x - gap - zoneSize.x - gap - timeSize.x - bigGap - size.x/2., CALENDAR_ENTRY_HEIGHT * 0.5);

    //size = boxSize;
    //center = boxSize/2.;
    //if (true) return rectImage(nextUpTx, pos, center, size) * 0.8;
    //return vec4(vec2(multilineTextureSize(timeZoneTx, 0)), 0., 1.);

    vec4 result;
    rectImageMultiline(result, shortDateTx, pos, center, size, iTime, 0.5, 2.);
    return result;
}

vec4 drawLongDate(vec2 pos) {
    float gap = 5.;
    vec2 size = vec2(multilineTextureSize(longDateTx, 0)) * 0.4;

    vec2 center = vec2(boxSize.x * (5./6.), boxSize.y - CALENDAR_ENTRY_HEIGHT * 0.5);

    //size = boxSize;
    //center = boxSize/2.;
    //if (true) return rectImage(nextUpTx, pos, center, size) * 0.8;
    //return vec4(vec2(multilineTextureSize(timeZoneTx, 0)), 0., 1.);

    vec4 result;
    rectImageMultiline(result, longDateTx, pos, center, size, iTime, 0.5, 2.);
    return result;
}

void main()
{
    float modeTime = modeTime(5);

    float fadeInStartMin = 1.0;
    float fadeInStartMax = 1.7;
    float fadeInStartDuration = 0.4;
    float fadeInStart = fadeInStartMin + ((fadeInStartMax-fadeInStartMin-fadeInStartDuration) / position.y) * position.x;
    float fadeInEnd = fadeInStart + fadeInStartDuration;
    float fadeInAlpha = cubicInOut(timed(modeTime, fadeInStart, fadeInEnd));

    float selectTime = fromToInterp(iRaceIndex, int(position));
    float selectAlpha = 1.-cubicInOut(timed(selectTime, 0.0, 0.5))
                         + cubicInOut(timed(selectTime, 1.5, 2.0));

    float beforeTime = fromToInterpLtEq(iRaceIndex, int(position));
    float beforeAlpha = cubicInOut(timed(beforeTime, 0.5, 1.5));

    vec2 pos = CornerPos * boxSize;

    fragColor = bg(CornerPos, selectTime);
    vec4 contentColor = vec4(0.);
    if (selectTime > 1.) {
        /*
        vec4 mlifOut;
        if (CornerPos.x < 0.5) {
            multilineIndexedFetch(mlifOut, timeTx, vec2(CornerPos.x*2.,CornerPos.y), iTime, 0.5, 1.);
        } else {
            multilineIndexedFetch(mlifOut, timeZoneTx, vec2((CornerPos.x-0.5)*2.,CornerPos.y), iTime, 0.5, 1.);
        }
        contentColor = alphaMix(contentColor, mlifOut);
        */
        contentColor = alphaMix(contentColor, drawRaceNumber(pos));
        contentColor = alphaMix(contentColor, drawNextUp(pos));
        contentColor = alphaMix(contentColor, drawFlag(pos, true));
        contentColor = alphaMix(contentColor, drawName(pos, true));
        contentColor = alphaMix(contentColor, drawLongTime(pos));
        contentColor = alphaMix(contentColor, drawLongDate(pos));
    } else {
        /*
        vec4 mlifOut;
        if (CornerPos.x < 0.5) {
            multilineIndexedFetch(mlifOut, timeTx, vec2(CornerPos.x*2.,CornerPos.y), iTime, 0.5, 1.);
        } else {
            multilineIndexedFetch(mlifOut, timeZoneTx, vec2((CornerPos.x-0.5)*2.,CornerPos.y), iTime, 0.5, 1.);
        }
        contentColor = alphaMix(contentColor, mlifOut);
        */
        contentColor = alphaMix(contentColor, drawRaceNumber(pos));
        contentColor = alphaMix(contentColor, drawFlag(pos, false));
        contentColor = alphaMix(contentColor, drawName(pos, false));
        contentColor = alphaMix(contentColor, drawTimeZone(pos, false));
        contentColor = alphaMix(contentColor, drawShortTime(pos));
        contentColor = alphaMix(contentColor, drawShortDate(pos));
    }
    contentColor.a *= (0.5 + 0.5 * beforeAlpha) * selectAlpha;
    fragColor = alphaMix(fragColor, contentColor);
    fragColor.a *= fadeInAlpha;
    return;
}