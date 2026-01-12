#version 300 es
precision mediump float;

in vec2 CornerPos;
in vec2 boxSize;
out vec4 fragColor;
uniform vec4 iRaceIndex;

uniform vec2 iResolution;
uniform float iTime;
uniform float entryCount;

uniform sampler2D pointsTx;
uniform sampler2D startPosTx;
uniform sampler2D bestLapTx;
uniform sampler2D leaderDiffTx;
uniform sampler2D pitStopsTx;
uniform sampler2D penaltiesTx;

#include "./utils/utils.glsl"

float fadeInModeTime() {
    return modeTime(2);
}

vec2 mulSize(ivec2 txSize) {
    vec2 vecSize = vec2(txSize);
    float mul = boxSize.y*0.8;
    return vec2(vecSize.x/vecSize.y * mul, mul);
}
vec4 drawPoints(vec2 pos) {
    float slotWidth = RESULTS_POINTS_WIDTH;
    vec2 size = mulSize(textureSize(pointsTx, 0));
    vec2 center = vec2(boxSize.x - RESULTS_ENTRY_PADDING - RESULTS_PENALTY_WIDTH - RESULTS_GAP - RESULTS_PIT_STOPS_WIDTH - RESULTS_GAP - RESULTS_TIME_WIDTH - RESULTS_GAP - RESULTS_TIME_WIDTH - RESULTS_GAP - RESULTS_STARTING_POSITION_DIFF_WIDTH - RESULTS_STARTING_POSITION_WIDTH - RESULTS_GAP - slotWidth/2., boxSize.y/2.);

    return rectImage(pointsTx, pos, center, size);
}
vec4 drawStartPos(vec2 pos) {
    float slotWidth = RESULTS_STARTING_POSITION_WIDTH;
    vec2 size = mulSize(textureSize(startPosTx, 0));
    vec2 center = vec2(boxSize.x - RESULTS_ENTRY_PADDING - RESULTS_PENALTY_WIDTH - RESULTS_GAP - RESULTS_PIT_STOPS_WIDTH - RESULTS_GAP - RESULTS_TIME_WIDTH - RESULTS_GAP - RESULTS_TIME_WIDTH - RESULTS_GAP - RESULTS_STARTING_POSITION_DIFF_WIDTH - size.x/2., boxSize.y/2.);

    return rectImage(startPosTx, pos, center, size);
}
vec4 drawBestLap(vec2 pos) {
    float slotWidth = RESULTS_TIME_WIDTH;
    vec2 size = mulSize(textureSize(bestLapTx, 0));
    vec2 center = vec2(boxSize.x - RESULTS_ENTRY_PADDING - RESULTS_PENALTY_WIDTH - RESULTS_GAP - RESULTS_PIT_STOPS_WIDTH - RESULTS_GAP - RESULTS_TIME_WIDTH - RESULTS_GAP - slotWidth/2., boxSize.y/2.);

    return rectImage(bestLapTx, pos, center, size);
}
vec4 drawLeaderDiff(vec2 pos) {
    float slotWidth = RESULTS_TIME_WIDTH;
    vec2 size = mulSize(textureSize(leaderDiffTx, 0));
    vec2 center = vec2(boxSize.x - RESULTS_ENTRY_PADDING - RESULTS_PENALTY_WIDTH - RESULTS_GAP - RESULTS_PIT_STOPS_WIDTH - RESULTS_GAP - slotWidth/2., boxSize.y/2.);

    return rectImage(leaderDiffTx, pos, center, size);
}
vec4 drawPitStops(vec2 pos) {
    float slotWidth = RESULTS_PIT_STOPS_WIDTH;
    vec2 size = mulSize(textureSize(pitStopsTx, 0));
    vec2 center = vec2(boxSize.x - RESULTS_ENTRY_PADDING - RESULTS_PENALTY_WIDTH - RESULTS_GAP - slotWidth/2., boxSize.y/2.);

    return rectImage(pitStopsTx, pos, center, size);
}
vec4 drawPenalties(vec2 pos) {
    float slotWidth = RESULTS_PENALTY_WIDTH;
    vec2 size = mulSize(textureSize(penaltiesTx, 0));
    vec2 center = vec2(boxSize.x - RESULTS_ENTRY_PADDING - slotWidth/2., boxSize.y/2.);

    return rectImage(penaltiesTx, pos, center, size);
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
    modeTime -= (fadeInStartRange) * (fromToInterpEqIsBackwards(iMode, 2) ? entryCount-1. : 0.);
    modeTime = max(modeTime, 0.);

    vec2 pos = CornerPos * boxSize;

    fragColor = vec4(0.);

    vec4 contentColor = vec4(0.);
    fragColor = alphaMix(fragColor, drawPoints(pos));
    fragColor = alphaMix(fragColor, drawStartPos(pos));
    fragColor = alphaMix(fragColor, drawBestLap(pos));
    fragColor = alphaMix(fragColor, drawLeaderDiff(pos));
    fragColor = alphaMix(fragColor, drawPitStops(pos));
    fragColor = alphaMix(fragColor, drawPenalties(pos));

    fragColor.a *= cubicOut(timed(modeTime, 2.5, 2.7));
    fragColor.a *= 0.5;

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