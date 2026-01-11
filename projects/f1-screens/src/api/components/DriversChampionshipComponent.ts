import {GLProgram, GLRenderer, GLTexture} from "@mrgazdag/gl-lite";
import constructorVsh from "./DriversChampionshipComponent.vsh";
import constructorFsh from "./DriversChampionshipComponent.fsh";
import AbstractComponent from "./AbstractComponent";
import {ComponentContext} from "../F1Renderer";
import TextureUtils from "../TextRenderer";
import ChangeableProperty from "../ChangeableProperty";
import TeamData from "../data/TeamData";
import DriverData from "../data/DriverData";

export default class DriversChampionshipComponent extends AbstractComponent {
    private textureCacheMap = new Map<string,GLTexture>();
    private program!: GLProgram<InterpolatedImageProps>;

    private currentRace: number = -1;
    private driverData!: DriverEntry[];

    shouldRender(context: ComponentContext): boolean {
        return context.mode.checkValue(e=>e==4);
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
        this.program = this.createRect<InterpolatedImageProps>(renderer, context, {
            vert: constructorVsh,
            frag: constructorFsh,
            uniforms: {
                iTime: props => props.time,
                iResolution: props => props.screen,
                iMode: props=>props.mode,
                iRaceIndex: props => props.raceIndex,

                position: props => props.data.positionValue.asVec4(),
                entryCount: props => props.entryCount,

                positionTx: props => props.data.positionTx,
                iconTx: props => props.data.iconTx,
                flagTx: props => props.data.flagTx,
                nameTx: props => props.data.nameTx,
                pointsTxOld: props => props.data.pointsTxOld,
                pointsTxNew: props => props.data.pointsTxNew,
                pointsDiffTxOld: props => props.data.pointsDiffTxOld,
                pointsDiffTxNew: props => props.data.pointsDiffTxNew,
                pointsValue: props => props.data.pointsValue.asVec4(),
            },
        });

        this.driverData = [];
        for (let driver of context.gameData.getAllDrivers()) {
            this.driverData.push({
                driver: driver,
                positionValue: context.raceIndex.createDerived((raceIndex,prev)=>{
                    return context.gameData.getPlacementPointDrivers(raceIndex).findIndex(t => t.owner == driver);
                }),
                positionTx: null!,
                nameTx: null!,
                iconTx: null!,
                flagTx: null!,
                pointsTxOld: null!,
                pointsTxNew: null!,
                pointsDiffTxOld: null!,
                pointsDiffTxNew: null!,

                pointsValue: context.raceIndex.createDerived((raceIndex,prev)=>{
                    return context.gameData.getPlacementPointDrivers(raceIndex).find(t => t.owner == driver)!.points;
                }),
            });
        }

        this.currentRace = -2;
        this.updateRace(renderer, context);
    }
    private getDiffedPos(context: ComponentContext, driver: DriverData, raceIndex: number) {
        if (raceIndex == 0) return 0;

        let lastPoints = context.gameData.getPlacementPointDrivers(raceIndex-1);
        let points = context.gameData.getPlacementPointDrivers(raceIndex);

        let lastPos = lastPoints.findIndex(t => t.owner == driver);
        let pos = points.findIndex(t => t.owner == driver);

        return lastPos - pos;
    }
    private updateRace(renderer: GLRenderer, context: ComponentContext) {
        let race = context.raceIndex.getActiveValue();

        let lastPoints = context.gameData.getPlacementPointDrivers(context.raceIndex.getLastValue());
        let points = context.gameData.getPlacementPointDrivers(context.raceIndex.getCurrentValue());
        // Always update this eagerly
        for (let driver of this.driverData) {
            let lastPos = lastPoints.findIndex(t => t.owner == driver.driver);
            let lastPointData = lastPoints[lastPos];
            let lastPointDiff = this.getDiffedPos(context, driver.driver, context.raceIndex.getLastValue());

            let pos = points.findIndex(t => t.owner == driver.driver);
            let pointData = points[pos];
            let pointDiff = this.getDiffedPos(context, driver.driver, context.raceIndex.getCurrentValue());

            driver.pointsTxOld = this.getTextTexture(renderer, "points_" + lastPointData.points, lastPointData.points+"", true);
            driver.pointsTxNew = this.getTextTexture(renderer, "points_" + pointData.points, pointData.points+"", true);
            driver.pointsDiffTxOld = this.getTextTextureDiff(renderer, "diff_" + lastPointDiff, "", lastPointDiff, false);
            driver.pointsDiffTxNew = this.getTextTextureDiff(renderer, "diff_" + pointDiff, "", pointDiff, false);
        }

        if (race == this.currentRace) return;
        this.currentRace = race;

        // Only update the rest when it actually changed
        for (let driver of this.driverData) {
            let pos = points.findIndex(t => t.owner == driver.driver);

            driver.positionTx = this.getTextTexture(renderer, "pos_" + pos, (pos+1)+"", false);
            driver.iconTx = this.getImageTexture(renderer, "team_icon_" + driver.driver.getId(), driver.driver.getIcon());
            driver.flagTx = this.getImageTexture(renderer, "flag_" + driver.driver.getCountry(), driver.driver.getFlagIcon());
            driver.nameTx = this.getTextTexture(renderer, "driver_name_" + driver.driver.getId(), driver.driver.getName(), true);
        }
    }
    render(renderer: GLRenderer, context: ComponentContext): void {
        this.updateRace(renderer, context);
        for (let i = 0; i < this.driverData.length; i++){
            let raceData = this.driverData[i];
            this.program.draw({
                time: context.time.delta,
                screen: context.screen,
                mode: context.mode.asVec4(),
                raceIndex: context.raceIndex.asVec4(),

                entryCount: this.driverData.length,
                data: raceData
            });
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
interface InterpolatedImageProps {
    time: number;
    screen: [number, number];
    mode: [number, number, number, number];
    raceIndex: [number, number, number, number]

    entryCount: number;
    data: DriverEntry
}
interface DriverEntry {
    driver: DriverData,
    positionValue: ChangeableProperty<number>,
    positionTx: GLTexture,
    iconTx: GLTexture,
    flagTx: GLTexture,
    nameTx: GLTexture,
    pointsTxOld: GLTexture,
    pointsTxNew: GLTexture,
    pointsDiffTxOld: GLTexture,
    pointsDiffTxNew: GLTexture,
    pointsValue: ChangeableProperty<number>;
}