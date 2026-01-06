import {GLProgram, GLRenderer, GLTexture} from "@mrgazdag/gl-lite";
import constructorVsh from "./ConstructorStandingsComponent.vsh";
import constructorFsh from "./ConstructorStandingsComponent.fsh";
import AbstractComponent from "./AbstractComponent";
import {ComponentContext} from "../F1Renderer";
import TextureUtils from "../TextRenderer";
import ChangeableProperty from "../ChangeableProperty";
import TeamData from "../data/TeamData";

export default class ConstructorStandingsComponent extends AbstractComponent {
    private textureCacheMap = new Map<string,GLTexture>();
    private program!: GLProgram<InterpolatedImageProps>;

    private currentRace: number = -1;
    private teamData!: TeamEntry[];

    shouldRender(context: ComponentContext): boolean {
        return context.mode.checkValue(e=>e==3);
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
                positionTx: props => props.data.positionTx,
                iconTx: props => props.data.iconTx,
                nameTx: props => props.data.nameTx,

                pointsTx: props => props.data.pointsTx,
            },
        });

        this.teamData = [];
        for (let team of context.gameData.getAllTeams()) {
            this.teamData.push({
                team: team,
                positionValue: context.raceIndex.createDerived(raceIndex=>{
                    return context.gameData.getPlacementPointTeams(raceIndex).findIndex(t=>t.owner == team);
                }),
                positionTx: null!,
                nameTx: null!,
                iconTx: null!,
                pointsTx: null!,
            });
        }

        this.currentRace = -2;
        this.updateRace(renderer, context);
    }
    private updateRace(renderer: GLRenderer, context: ComponentContext) {
        let race = context.raceIndex.getDelta() > 1
            ? Math.max(context.raceIndex.getCurrentValue(), 0)
            : Math.max(context.raceIndex.getLastValue(), 0);

        if (race == this.currentRace) return;
        this.currentRace = race;

        let points = context.gameData.getPlacementPointTeams(race);
        for (let team of this.teamData) {
            let pos = team.positionValue.getCurrentValue();
            let pointData = points[pos];
            team.positionTx = this.getTextTexture(renderer, "pos_" + pos, (pos+1)+"", false);
            team.iconTx = this.getImageTexture(renderer, "team_icon_" + team.team.getId(), team.team.getIcon());
            team.nameTx = this.getTextTexture(renderer, "team_name_" + team.team.getId(), team.team.getName(), false);
            team.pointsTx = this.getTextTexture(renderer, "points_" + pointData.points, pointData.points+"", false);
        }
    }
    render(renderer: GLRenderer, context: ComponentContext): void {
        this.updateRace(renderer, context);
        for (let i = 0; i < this.teamData.length; i++){
            let raceData = this.teamData[i];
            this.program.draw({
                time: context.time.delta,
                screen: context.screen,
                mode: context.mode.asVec4(),
                raceIndex: context.raceIndex.asVec4(),

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

    data: TeamEntry
}
interface TeamEntry {
    team: TeamData,
    positionValue: ChangeableProperty<number>,
    positionTx: GLTexture,
    iconTx: GLTexture,
    nameTx: GLTexture,

    pointsTx: GLTexture,
}