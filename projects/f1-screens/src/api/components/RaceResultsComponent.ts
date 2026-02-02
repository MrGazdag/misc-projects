import {GLProgram, GLRenderer, GLTexture, GLUniforms} from "@mrgazdag/gl-lite";
import raceResultsVsh from "./RaceResultsComponent.vsh";
import raceResultsFsh1 from "./RaceResultsComponent1.fsh";
import raceResultsFsh2 from "./RaceResultsComponent2.fsh";
import raceResultsHeaderVsh from "./RaceResultsHeader.vsh";
import raceResultsHeaderFsh from "./RaceResultsHeader.fsh";
import AbstractComponent from "./AbstractComponent";
import {ComponentContext} from "../F1Renderer";
import TextureUtils from "../TextRenderer";
import ChangeableProperty from "../ChangeableProperty";
import DriverData from "../data/DriverData";

export default class RaceResultsComponent extends AbstractComponent {
    private textureCacheMap = new Map<string,GLTexture>();
    private program!: GLProgram<InterpolatedImageProps<DriverEntry>>;
    private program2!: GLProgram<InterpolatedImageProps<DriverEntry>>;
    private programHeader!: GLProgram<InterpolatedImageProps<HeaderEntry>>;

    private currentRace: number = -1;
    private driverData!: DriverEntry[];

    shouldRender(context: ComponentContext): boolean {
        return context.mode.checkValue(e=>e==2);
    }

    private getImageTexture(renderer: GLRenderer, key: string, value: HTMLImageElement) {
        if (this.textureCacheMap.has(key)) {
            return this.textureCacheMap.get(key)!;
        }
        let result = renderer.texture({
            data: value,

            width: value.width,
            height: value.height,
            format: "rgba",
            flipY: true,
        });
        this.textureCacheMap.set(key, result);
        return result!;
    }
    private getTextTexture(renderer: GLRenderer, key: string, value: string, bold: boolean) {
        if (this.textureCacheMap.has(key)) {
            return this.textureCacheMap.get(key)!;
        }
        const font = {family: "Formula1",size:"60px",weight: bold ? "bold" : "normal"};
        let result = TextureUtils.updateOrNew(renderer, undefined, TextureUtils.renderText(font, value));
        this.textureCacheMap.set(key, result);
        return result!;
    }
    private getNumberTexture(renderer: GLRenderer, number: number | string | null, length: number, bold: boolean) {
        let key = bold + "_" + length + "_num_" + number;
        if (this.textureCacheMap.has(key)) {
            return this.textureCacheMap.get(key)!;
        }
        const font = {family: "Formula1",size:"60px",weight: bold ? "bold" : "normal"};
        let result = TextureUtils.updateOrNew(renderer, undefined, TextureUtils.renderText(font, number == null ? "—".repeat(length) : number+""));
        this.textureCacheMap.set(key, result);
        return result!;
    }
    private getTextTextureDiff(renderer: GLRenderer, key: string, value: string, diff: number, bold: boolean) {
        if (this.textureCacheMap.has(key)) {
            return this.textureCacheMap.get(key)!;
        }
        const font = {family: "Formula1",size:"60px",weight: bold ? "bold" : "normal"};
        let result = TextureUtils.updateOrNew(renderer, undefined, TextureUtils.renderTextWithDiff(font, value, diff));
        this.textureCacheMap.set(key, result);
        return result!;
    }

    init(renderer: GLRenderer, context: ComponentContext): void {
        // Create a shader program
        let uniforms: GLUniforms<InterpolatedImageProps<DriverEntry>> = {
            iTime: props => props.time,
            iResolution: props => props.screen,
            iMode: props=>props.mode,
            iRaceIndex: props => props.raceIndex,

            position: props => props.data.positionValue.asVec4(),
            entryCount: props => props.entryCount,

            colonTx: props => props.colon,
            dashesTx: props => props.dashes,
            dotTx: props => props.dot,
            plusTx: props => props.plus,

            positionTx: props => props.data.positionTx,
            iconTx: props => props.data.iconTx,
            flagTx: props => props.data.flagTx,
            nameTx: props => props.data.nameTx,
            pointsTx: props => props.data.pointsTx,

            startPosTx: props => props.data.startPosTx,
            startPosDiffTx: props => props.data.startPosDiffTx,

            bestLapMinsTx: props => props.data.bestLapMinsTx,
            bestLapSecsTx: props => props.data.bestLapSecsTx,
            bestLapMillisTx: props => props.data.bestLapMillisTx,
            isBestLapOverall: props => props.data.isBestLapOverall ? 1 : 0,

            leaderDiffMinsTx: props => props.data.leaderDiffMinsTx,
            leaderDiffSecsTx: props => props.data.leaderDiffSecsTx,
            leaderDiffMillisTx: props => props.data.leaderDiffMillisTx,
            specialTx: props => props.data.specialTx,
            hasSpecial: props => props.data.hasSpecial ? 1 : 0,

            pitStopsTx: props => props.data.pitStopsTx,
            penaltiesTx: props => props.data.penaltiesTx,
        };
        this.program = this.createRect(renderer, context, {
            vert: raceResultsVsh,
            frag: raceResultsFsh1,
            uniforms: uniforms,
        });
        this.program2 = this.createRect(renderer, context, {
            vert: raceResultsVsh,
            frag: raceResultsFsh2,
            uniforms: uniforms,
        });
        this.programHeader = this.createRect<InterpolatedImageProps<HeaderEntry>>(renderer, context, {
            vert: raceResultsHeaderVsh,
            frag: raceResultsHeaderFsh,
            uniforms: {
                iTime: props => props.time,
                iResolution: props => props.screen,
                iMode: props=>props.mode,
                iRaceIndex: props => props.raceIndex,

                entryCount: props => props.entryCount,

                pointsTx: props => props.data.pointsTx,
                startPosTx: props => props.data.startPosTx,

                bestLapTx: props => props.data.bestLapTx,
                leaderDiffTx: props => props.data.timeTx,

                pitStopsTx: props => props.data.pitStopsTx,
                penaltiesTx: props => props.data.penaltiesTx,
            },
        });

        this.driverData = [];
        for (let driver of context.gameData.getAllDrivers()) {
            let data: DriverEntry = {
                driver: driver,
                visible: false,
                positionValue: context.raceIndex.createDerived((raceIndex,prev)=>{
                    let race = context.gameData.getRaceData(raceIndex);
                    if (!race) return -1;
                    let driverData = race.getDriverData(driver);
                    if (!driverData) return -1;
                    return driverData.finishingPosition-1;
                }),
                positionTx: null!,
                iconTx: null!,
                flagTx: null!,
                nameTx: null!,

                pointsTx: null!,
                startPosTx: null!,
                startPosDiffTx: null!,

                bestLapMinsTx: null!,
                bestLapSecsTx: null!,
                bestLapMillisTx: null!,
                isBestLapOverall: false,

                leaderDiffMinsTx: null!,
                leaderDiffSecsTx: null!,
                leaderDiffMillisTx: null!,
                specialTx: null!,
                hasSpecial: false,

                pitStopsTx: null!,
                penaltiesTx: null!,
            };
            this.driverData.push(data);
        }

        this.currentRace = -2;
        this.updateRace(renderer, context);
    }
    private splitTimeSeconds(seconds: number | null): [string|null,string|null,string|null] {
        if (seconds == null) return [null,null,null];

        let mins = Math.floor(seconds/60);
        let secs = Math.floor(seconds%60);
        let millis = Math.floor(seconds*1000)%1000;
        return [
            (mins + "").padStart(2,"0"),
            (secs + "").padStart(2,"0"),
            (millis+"").padStart(3,"0")
        ];
    }
    private updateRace(renderer: GLRenderer, context: ComponentContext) {
        let race = context.raceIndex.getActiveValue();

        if (race == this.currentRace) return;
        this.currentRace = race;

        let raceData = context.gameData.getRaceData(this.currentRace);
        if (raceData == null) {
            for (let driver of this.driverData) {
                driver.visible = false;
            }
            return;
        }

        // Only update the rest when it actually changed
        for (let driver of this.driverData) {
            let driverData = raceData.getDriverData(driver.driver);
            if (!driverData) {
                driver.visible = false;
                continue;
            }
            driver.visible = true;

            let startPos = driverData.startingPosition;
            let endPos = driverData.finishingPosition;
            let posDiff = startPos == null ? 0 : startPos-endPos;

            driver.positionTx = this.getTextTexture(renderer, "pos_" + endPos, (endPos)+"", false);
            driver.iconTx = this.getImageTexture(renderer, "team_icon_" + driverData.team.getId(), driverData.team.getIcon());
            driver.flagTx = this.getImageTexture(renderer, "flag_" + driverData.driver.getCountry(), driverData.driver.getFlagIcon());
            driver.nameTx = this.getTextTexture(renderer, "name_" + driverData.driver.getId(), driverData.driver.getName(), true);

            driver.pointsTx = this.getNumberTexture(renderer, driverData.points, 2,true);
            driver.startPosTx = this.getNumberTexture(renderer, startPos, 1, true);
            driver.startPosDiffTx = this.getTextTextureDiff(renderer, "start_pos_diff_" + posDiff, "", posDiff, false);

            let bestLap = driverData.bestLapTime;
            let [bestLapMins, bestLapSecs, bestLapMillis] = this.splitTimeSeconds(bestLap);

            driver.bestLapMinsTx =   this.getNumberTexture(renderer, bestLapMins,   2, false);
            driver.bestLapSecsTx =   this.getNumberTexture(renderer, bestLapSecs,   2, false);
            driver.bestLapMillisTx = this.getNumberTexture(renderer, bestLapMillis, 3, false);
            driver.isBestLapOverall = driverData.isBestLapTimeOverall;

            let leaderDiff: number | null = null;
            let special: string | null = null;
            switch (driverData.timeType) {
                case "finish":
                case "from_leader":
                    leaderDiff = driverData.time;
                    break;
                case "lapped":
                    special = "+" + driverData.time + " lap" + (driverData.time == 1 ? "" : "s");
                    break;
                case "none":
                    break;
                case "did_not_finish":
                case "did_not_finish_no_points":
                    special = "DNF";
                    break;
                case "did_not_start":
                    special = "DNS";
                    break;
                case "disqualified":
                    special = "DSQ";
                    break;
            }

            let [leaderDiffMins, leaderDiffSecs, leaderDiffMillis] = this.splitTimeSeconds(leaderDiff);
            driver.leaderDiffMinsTx =   this.getNumberTexture(renderer, leaderDiffMins,   2, false);
            driver.leaderDiffSecsTx =   this.getNumberTexture(renderer, leaderDiffSecs,   2, false);
            driver.leaderDiffMillisTx = this.getNumberTexture(renderer, leaderDiffMillis, 3, false);
            driver.specialTx = this.getTextTexture(renderer, "special_" + special, special ?? "", true);
            driver.hasSpecial = special != null;

            driver.pitStopsTx = this.getNumberTexture(renderer, driverData.numberOfPitStops, 1,true);
            driver.penaltiesTx = this.getTextTexture(renderer, "penalty_" + driverData.penaltyTime, driverData.penaltyTime == null ? "" : "+" + driverData.penaltyTime+"s", false);

        }
    }
    render(renderer: GLRenderer, context: ComponentContext): void {
        this.updateRace(renderer, context);
        this.programHeader.draw({
            time: context.time.delta,
            screen: context.screen,
            mode: context.mode.asVec4(),
            raceIndex: context.raceIndex.asVec4(),

            colon: this.getTextTexture(renderer, "colon", ":", false),
            dashes: this.getTextTexture(renderer, "dashes", "--", false),
            dot: this.getTextTexture(renderer, "dot", ".", false),
            plus: this.getTextTexture(renderer, "plus", "+", false),

            entryCount: this.driverData.length,
            data: {
                pointsTx: this.getTextTexture(renderer, "header_points", "Points", false),
                startPosTx: this.getTextTexture(renderer, "header_pos", "Pos", false),
                bestLapTx: this.getTextTexture(renderer, "header_best_lap", "Best Lap", false),
                timeTx: this.getTextTexture(renderer, "header_time", "Time", false),
                pitStopsTx: this.getTextTexture(renderer, "header_pit_stops", "Stops", false),
                penaltiesTx: this.getTextTexture(renderer, "header_penalties", "Penalty", false)
            }
        });
        for (let i = 0; i < this.driverData.length; i++){
            let raceData = this.driverData[i];
            if (!raceData.visible) continue;

            let uniforms = {
                time: context.time.delta,
                screen: context.screen,
                mode: context.mode.asVec4(),
                raceIndex: context.raceIndex.asVec4(),

                colon: this.getTextTexture(renderer, "colon", ":", false),
                dashes: this.getTextTexture(renderer, "dashes", "--", false),
                dot: this.getTextTexture(renderer, "dot", ".", false),
                plus: this.getTextTexture(renderer, "plus", "+", false),

                entryCount: this.driverData.length,
                data: raceData
            }
            this.program.draw(uniforms);
            this.program2.draw(uniforms);
        }
    }

    dispose() {
        this.program.dispose();
        for (let texture of this.textureCacheMap.values()) {
            texture.dispose();
        }
        this.textureCacheMap.clear();
    }
}
interface InterpolatedImageProps<T> {
    time: number;
    screen: [number, number];
    mode: [number, number, number, number];
    raceIndex: [number, number, number, number]

    entryCount: number;
    colon: GLTexture;
    dashes: GLTexture;
    dot: GLTexture;
    plus: GLTexture;
    data: T
}
interface DriverEntry {
    driver: DriverData,
    visible: boolean,

    positionValue: ChangeableProperty<number>,
    positionTx: GLTexture,
    iconTx: GLTexture,
    flagTx: GLTexture,
    nameTx: GLTexture,
    pointsTx: GLTexture,

    startPosTx: GLTexture,
    startPosDiffTx: GLTexture,

    bestLapMinsTx: GLTexture,
    bestLapSecsTx: GLTexture,
    bestLapMillisTx: GLTexture,
    isBestLapOverall: boolean,

    leaderDiffMinsTx: GLTexture,
    leaderDiffSecsTx: GLTexture,
    leaderDiffMillisTx: GLTexture,
    specialTx: GLTexture,
    hasSpecial: boolean,

    penaltiesTx: GLTexture,
    pitStopsTx: GLTexture,
}
interface HeaderEntry {
    pointsTx: GLTexture,
    startPosTx: GLTexture,

    bestLapTx: GLTexture,
    timeTx: GLTexture,

    pitStopsTx: GLTexture,
    penaltiesTx: GLTexture,
}