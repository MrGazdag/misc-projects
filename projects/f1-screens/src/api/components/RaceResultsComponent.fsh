in vec2 CornerPos;
in vec2 boxSize;
out vec4 fragColor;
uniform vec4 iRaceIndex;

uniform vec2 iResolution;
uniform float iTime;
uniform vec4 position;
uniform float entryCount;

uniform sampler2D dotTx;
uniform sampler2D colonTx;
uniform sampler2D dashesTx;
uniform sampler2D plusTx;

uniform sampler2D positionTx;
uniform sampler2D iconTx;
uniform sampler2D flagTx;
uniform sampler2D nameTx;
uniform sampler2D pointsTx;
uniform sampler2D startPosTx;
uniform sampler2D startPosDiffTx;
uniform sampler2D bestLapMinsTx;
uniform sampler2D bestLapSecsTx;
uniform sampler2D bestLapMillisTx;
uniform float isBestLapOverall;

uniform sampler2D leaderDiffMinsTx;
uniform sampler2D leaderDiffSecsTx;
uniform sampler2D leaderDiffMillisTx;
uniform sampler2D specialTx;
uniform float hasSpecial;

uniform sampler2D pitStopsTx;
uniform sampler2D penaltiesTx;

#include "./utils/utils.glsl"

float fadeInModeTime() {
    return modeTime(2);
}

vec4 bg(vec2 size, vec2 pos, float anim) {
    if (pos.x > anim*size.x) return vec4(0.);

    vec2 c = pos/size.y;
    if (c.x-c.y < -0.75) return vec4(0.);
    if (inteq(position.y, 0)) return vec4(vec3(ivec3(212, 174,  87))/255., 0.15);
    if (inteq(position.y, 1)) return vec4(vec3(ivec3(204, 204, 204))/255., 0.15);
    if (inteq(position.y, 2)) return vec4(vec3(ivec3(163, 104,  51))/255., 0.15);
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
vec2 mulSize(ivec2 txSize) {
    vec2 vecSize = vec2(txSize);
    float mul = boxSize.y*0.8;
    return vec2(vecSize.x/vecSize.y * mul, mul);
}
vec4 drawPoints(vec2 pos) {
    vec2 txSize = vec2(textureSize(pointsTx, 0));
    float slotWidth = RESULTS_POINTS_WIDTH;
    float mul = boxSize.y*0.8;
    vec2 size = vec2(txSize.x/txSize.y * mul, mul);
    vec2 center = vec2(boxSize.x - RESULTS_ENTRY_PADDING - RESULTS_PENALTY_WIDTH - RESULTS_GAP - RESULTS_PIT_STOPS_WIDTH - RESULTS_GAP - RESULTS_TIME_WIDTH - RESULTS_GAP - RESULTS_TIME_WIDTH - RESULTS_GAP - RESULTS_STARTING_POSITION_DIFF_WIDTH - RESULTS_STARTING_POSITION_WIDTH - RESULTS_GAP - slotWidth/2., boxSize.y/2.);

    return rectImage(pointsTx, pos, center, size);
}
vec4 drawStartPos(vec2 pos) {
    vec2 txSize = vec2(textureSize(startPosTx, 0));
    float slotWidth = RESULTS_STARTING_POSITION_WIDTH;
    float mul = boxSize.y*0.8;
    vec2 size = vec2(txSize.x/txSize.y * mul, mul);
    vec2 center = vec2(boxSize.x - RESULTS_ENTRY_PADDING - RESULTS_PENALTY_WIDTH - RESULTS_GAP - RESULTS_PIT_STOPS_WIDTH - RESULTS_GAP - RESULTS_TIME_WIDTH - RESULTS_GAP - RESULTS_TIME_WIDTH - RESULTS_GAP - RESULTS_STARTING_POSITION_DIFF_WIDTH - size.x/2., boxSize.y/2.);

    return rectImage(startPosTx, pos, center, size);
}
vec4 drawStartPosDiff(vec2 pos) {
    vec2 txSize = vec2(textureSize(startPosDiffTx, 0));
    float slotWidth = RESULTS_STARTING_POSITION_DIFF_WIDTH;
    float mul = boxSize.y*0.8;
    vec2 size = vec2(txSize.x/txSize.y * mul, mul);
    vec2 center = vec2(boxSize.x - RESULTS_ENTRY_PADDING - RESULTS_PENALTY_WIDTH - RESULTS_GAP - RESULTS_PIT_STOPS_WIDTH - RESULTS_GAP - RESULTS_TIME_WIDTH - RESULTS_GAP - RESULTS_TIME_WIDTH - RESULTS_GAP - slotWidth + size.x/2., boxSize.y/2.);

    return rectImage(startPosDiffTx, pos, center, size);
}
vec4 drawTimestamp(vec2 pos, bool leader) {
    float slotWidth = RESULTS_TIME_WIDTH;
    vec2 left = vec2(boxSize.x - RESULTS_ENTRY_PADDING - RESULTS_PENALTY_WIDTH - RESULTS_GAP - RESULTS_PIT_STOPS_WIDTH - RESULTS_GAP - slotWidth, boxSize.y/2.);
    vec4 color = vec4(0.);
    if (leader) {
        if (inteq(hasSpecial, 1)) {
            color = alphaMix(color, rectImage(specialTx, pos, left+vec2(RESULTS_TIME_WIDTH/2.,0.), mulSize(textureSize(specialTx, 0))));
        } else {
            if (!inteq(position.y, 0)) {
                color = alphaMix(color, rectImage(plusTx,   pos, left+vec2(RESULTS_TIME_WIDTH_PLUS/2.,0.), mulSize(textureSize(plusTx, 0))));
            }
            color = alphaMix(color, rectImage(leaderDiffMinsTx,   pos, left+vec2(RESULTS_TIME_WIDTH_PLUS+RESULTS_TIME_WIDTH_MINS/2.,0.), mulSize(textureSize(leaderDiffMinsTx, 0))));
            color = alphaMix(color, rectImage(colonTx,            pos, left+vec2(RESULTS_TIME_WIDTH_PLUS+RESULTS_TIME_WIDTH_MINS+RESULTS_TIME_WIDTH_SEP/2.,0.), mulSize(textureSize(colonTx, 0))));
            color = alphaMix(color, rectImage(leaderDiffSecsTx,   pos, left+vec2(RESULTS_TIME_WIDTH_PLUS+RESULTS_TIME_WIDTH_MINS+RESULTS_TIME_WIDTH_SEP+RESULTS_TIME_WIDTH_SECS/2.,0.), mulSize(textureSize(leaderDiffSecsTx, 0))));
            color = alphaMix(color, rectImage(dotTx,              pos, left+vec2(RESULTS_TIME_WIDTH_PLUS+RESULTS_TIME_WIDTH_MINS+RESULTS_TIME_WIDTH_SEP+RESULTS_TIME_WIDTH_SECS+RESULTS_TIME_WIDTH_SEP/2.,0.), mulSize(textureSize(dotTx, 0))));
            color = alphaMix(color, rectImage(leaderDiffMillisTx, pos, left+vec2(RESULTS_TIME_WIDTH_PLUS+RESULTS_TIME_WIDTH_MINS+RESULTS_TIME_WIDTH_SEP+RESULTS_TIME_WIDTH_SECS+RESULTS_TIME_WIDTH_SEP+mulSize(textureSize(leaderDiffMillisTx, 0)).x/2.,0.), mulSize(textureSize(leaderDiffMillisTx, 0))));
        }
    } else {
        left -= vec2(RESULTS_TIME_WIDTH + RESULTS_GAP,0.);
        color = alphaMix(color, rectImage(bestLapMinsTx,   pos, left+vec2(RESULTS_TIME_WIDTH_MINS/2.,0.), mulSize(textureSize(bestLapMinsTx, 0))));
        color = alphaMix(color, rectImage(colonTx,            pos, left+vec2(RESULTS_TIME_WIDTH_MINS+RESULTS_TIME_WIDTH_SEP/2.,0.), mulSize(textureSize(colonTx, 0))));
        color = alphaMix(color, rectImage(bestLapSecsTx,   pos, left+vec2(RESULTS_TIME_WIDTH_MINS+RESULTS_TIME_WIDTH_SEP+RESULTS_TIME_WIDTH_SECS/2.,0.), mulSize(textureSize(bestLapSecsTx, 0))));
        color = alphaMix(color, rectImage(dotTx,              pos, left+vec2(RESULTS_TIME_WIDTH_MINS+RESULTS_TIME_WIDTH_SEP+RESULTS_TIME_WIDTH_SECS+RESULTS_TIME_WIDTH_SEP/2.,0.), mulSize(textureSize(dotTx, 0))));
        color = alphaMix(color, rectImage(bestLapMillisTx, pos, left+vec2(RESULTS_TIME_WIDTH_MINS+RESULTS_TIME_WIDTH_SEP+RESULTS_TIME_WIDTH_SECS+RESULTS_TIME_WIDTH_SEP+mulSize(textureSize(bestLapMillisTx, 0)).x/2.,0.), mulSize(textureSize(bestLapMillisTx, 0))));
        if (inteq(isBestLapOverall, 1)) {
            color *= vec4(vec3(RESULTS_BEST_LAP_COLOR)/255., 1.);
        }
    }
    return color;
}
vec4 drawPitStops(vec2 pos) {
    vec2 txSize = vec2(textureSize(pitStopsTx, 0));
    float slotWidth = RESULTS_PIT_STOPS_WIDTH;
    float mul = boxSize.y*0.8;
    vec2 size = vec2(txSize.x/txSize.y * mul, mul);
    vec2 center = vec2(boxSize.x - RESULTS_ENTRY_PADDING - RESULTS_PENALTY_WIDTH - RESULTS_GAP - slotWidth/2., boxSize.y/2.);

    return rectImage(pitStopsTx, pos, center, size);
}
vec4 drawPenalties(vec2 pos) {
    vec2 txSize = vec2(textureSize(penaltiesTx, 0));
    float slotWidth = RESULTS_PENALTY_WIDTH;
    float mul = boxSize.y*0.8;
    vec2 size = vec2(txSize.x/txSize.y * mul, mul);
    vec2 center = vec2(boxSize.x - RESULTS_ENTRY_PADDING - size.x/2., boxSize.y/2.);

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
    modeTime -= ((fadeInStartRange) / entryCount) * (fromToInterpEqIsBackwards(iMode, 2) ? entryCount-1.-position.y : position.y);
    modeTime = max(modeTime, 0.);

    vec2 pos = CornerPos * boxSize;

    fragColor = vec4(0.);
    #ifdef RACE_RESULTS_PART_1
    fragColor = bg(boxSize, pos, cubicOut(timed(modeTime, 1.8, 2.5)));
    fragColor = alphaMix(fragColor, positionBox(vec2(boxSize.y), pos, cubicOut(timed(modeTime, 1.5, 1.8))));
    #endif

    vec4 contentColor = vec4(0.);
    #ifdef RACE_RESULTS_PART_1
    contentColor = alphaMix(contentColor, animateChange(drawPosition(pos),position));
    contentColor = alphaMix(contentColor, drawImage(pos));
    contentColor = alphaMix(contentColor, drawFlag(pos));
    contentColor = alphaMix(contentColor, drawName(pos));
    contentColor = alphaMix(contentColor, drawPoints(pos));
    contentColor = alphaMix(contentColor, drawStartPos(pos));
    contentColor = alphaMix(contentColor, drawStartPosDiff(pos));
    #else
    contentColor = alphaMix(contentColor, drawTimestamp(pos, false));
    contentColor = alphaMix(contentColor, drawTimestamp(pos, true));
    contentColor = alphaMix(contentColor, drawPitStops(pos));
    contentColor = alphaMix(contentColor, drawPenalties(pos));
    #endif
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