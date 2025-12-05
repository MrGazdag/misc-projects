import {GLProgram, GLRenderer, GLTexture} from "@mrgazdag/gl-lite";
import podiumVsh from "./PodiumComponent.vsh";
import podiumFsh from "./PodiumComponent.fsh";
import AbstractComponent from "./AbstractComponent";
import {ComponentContext} from "../F1Renderer";
import TextRenderer from "../TextRenderer";
export default class PodiumComponent extends AbstractComponent {
    private textureCacheMap = new Map<string,GLTexture>();
    private program!: GLProgram<InterpolatedImageProps>;

    private currentRace: number = -1;
    private userData!: UserData[];

    shouldRender(context: ComponentContext): boolean {
        return context.mode.checkValue(e=>e==1);
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
        let result = TextRenderer.render(renderer, undefined, font, value);
        this.textureCacheMap.set(key, result);
        return result!;
    }


    init(renderer: GLRenderer, context: ComponentContext): void {
        // Create a shader program
        this.program = this.createRect<InterpolatedImageProps>(renderer, context, {
            vert: podiumVsh,
            frag: podiumFsh,
            uniforms: {
                iTime: props => props.time,
                iResolution: props => props.screen,
                mode: props=>props.mode,
                raceIndex: props => props.raceIndex,

                position: props => props.position,

                nameTex: props => props.name,
                imageTex: props => props.image,
                flagTex: props => props.flag,
                teamTex: props => props.team,
                positionTex: props => props.positionTex
            },
        });

        this.updateRace(renderer, context);
    }
    private updateRace(renderer: GLRenderer, context: ComponentContext) {
        let race = context.raceIndex.getDelta() > 1
            ? context.raceIndex.getCurrentValue()
            : context.raceIndex.getLastValue();

        if (race == this.currentRace) return;

        this.userData = [];
        let raceResults = context.gameData.getRaceResults(race);
        let drivers = raceResults.getAllDriverData();
        for (let i = 0; i < 3; i++) {
            let result = drivers[i];
            let driver = result.driver;
            let team = result.team;
            this.userData.push({
                id: driver.getId(),
                name: this.getTextTexture(renderer, "podium_name_" + driver.getId(), driver.getName(), true),
                teamImage: this.getImageTexture(renderer, "team_" + team.getId(), team.getIcon()),
                image: this.getImageTexture(renderer, "driver_" + driver.getId(), driver.getIcon()),
                flagImage: this.getImageTexture(renderer, "flag_" + driver.getCountry(), driver.getFlagIcon()),
                positionTex: this.getTextTexture(renderer, "podium_position_" + i, Positions[i], true),
            });
        }
    }
    render(renderer: GLRenderer, context: ComponentContext): void {
        this.updateRace(renderer, context);
        for (let i = 0; i < this.userData.length; i++){
            let userData = this.userData[i];
            this.program.draw({
                time: context.time.delta,
                screen: context.screen,
                mode: context.mode.asVec4(),
                raceIndex: context.raceIndex.asVec4(),

                position: i,
                name: userData.name,
                image: userData.image,
                flag: userData.flagImage,
                team: userData.teamImage,
                positionTex: userData.positionTex,
            });
        }
    }

    dispose() {
        this.program.dispose();

        this.textureCacheMap.forEach(e=>e.dispose());
        this.textureCacheMap.clear();
    }
}
const Positions = [
    "1st",
    "2nd",
    "3rd",
]
interface InterpolatedImageProps {
    time: number;
    screen: [number, number];
    mode: [number, number, number, number];
    raceIndex: [number, number, number, number]

    position: number,

    name: GLTexture,
    image: GLTexture,
    team: GLTexture,
    flag: GLTexture,
    positionTex: GLTexture,
}
interface UserData {
    id: string,
    name: GLTexture,
    image: GLTexture,
    teamImage: GLTexture,
    flagImage: GLTexture,
    positionTex: GLTexture,
}