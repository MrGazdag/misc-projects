import {GLProgram, GLRenderer, GLTexture} from "@mrgazdag/gl-lite";
import headerVsh from "./HeaderComponent.vsh";
import headerFsh from "./HeaderComponent.fsh";
import AbstractComponent from "./AbstractComponent";
import {ComponentContext} from "../F1Renderer";
import ChangeableProperty from "../ChangeableProperty";
import TextureUtils from "../TextRenderer";
export default class HeaderComponent extends AbstractComponent {
    private textureCacheMap = new Map<string,GLTexture>();
    private pageTitleComponent!: ChangeableProperty<GLTexture>;
    private mapNameComponent!: ChangeableProperty<GLTexture>;
    private roundCounterComponent!: ChangeableProperty<GLTexture>;
    private program!: GLProgram<InterpolatedImageProps>;

    shouldRender(context: ComponentContext): boolean {
        return context.mode.checkValue(e=>e>0);
    }

    private getTexture(renderer: GLRenderer, key: string, value: string, bold: boolean) {
        if (this.textureCacheMap.has(key)) {
            return this.textureCacheMap.get(key)!;
        }
        const font = {family: "Formula1",size:"60px",weight: bold ? "bold" : "normal"};
        let result = TextureUtils.updateOrNew(renderer, undefined, TextureUtils.renderText(font, value));
        this.textureCacheMap.set(key, result);
        return result!;
    }

    init(renderer: GLRenderer, context: ComponentContext): void {
        this.pageTitleComponent = context.mode.createDerived(mode => {
            let key = ModeNames[mode] ?? "nothing";
            let value = TextureMap[key];
            return this.getTexture(renderer, key, value, true);
        });
        this.mapNameComponent = context.raceIndex.createDerived(raceIndex => {
            let key;
            let value;

            if (raceIndex == -1) {
                key = "map_overview";
                value = "Overview";
            } else {
                key = "map_" + raceIndex;
                value = context.gameData.getRaceData(raceIndex).getMap();
            }
            return this.getTexture(renderer, key, value, false);
        });
        this.roundCounterComponent = context.raceIndex.createDerived(raceIndex => {
            let key;
            let value;

            if (raceIndex == -1) {
                key = "round_overview";
                value = "";
            } else {
                let raceCount = context.gameData.getPlannedRaceCount();
                key = "round_" + raceIndex + "_of_" + raceCount;
                value = "Round " + (raceIndex + 1) + " of " + raceCount;
            }
            return this.getTexture(renderer, key, value, false);
        });
        // Create a shader program
        this.program = this.createRect<InterpolatedImageProps>(renderer, context, {
            vert: headerVsh,
            frag: headerFsh,
            uniforms: {
                iTime: props => props.time,
                iResolution: props => props.screen,
                iMode: props=>props.mode,

                corner: props=>props.corner,

                textureFrom: props=>props.textureFrom ?? props.texture!,
                textureTo: props=>props.textureTo ?? props.texture!,
                textureDelta: props=>props.textureDelta,
                textureDuration: props=>props.textureDuration,
            },
        });
    }
    render(renderer: GLRenderer, context: ComponentContext): void {
        // Top left: Championship Name
        let gd = context.gameData;
        let titleTexture = this.getTexture(renderer, "title", gd.getName(), true);
        this.program.draw({
            time: context.time.delta,
            screen: context.screen,
            mode: context.mode.asVec4(),

            corner: 0,
            texture: titleTexture,
            textureDelta: 2,
            textureDuration: 2,
        });

        // Bottom left: Page title
        this.program.draw({
            time: context.time.delta,
            screen: context.screen,
            mode: context.mode.asVec4(),

            corner: 1,
            textureFrom: this.pageTitleComponent.getLastValue(),
            textureTo: this.pageTitleComponent.getCurrentValue(),
            textureDelta: this.pageTitleComponent.getDelta(),
            textureDuration: this.pageTitleComponent.getChangeDuration(),
        });

        // Bottom right: Map Name
        this.program.draw({
            time: context.time.delta,
            screen: context.screen,
            mode: context.mode.asVec4(),

            corner: 2,
            textureFrom: this.mapNameComponent.getLastValue(),
            textureTo: this.mapNameComponent.getCurrentValue(),
            textureDelta: this.mapNameComponent.getDelta(),
            textureDuration: this.mapNameComponent.getChangeDuration(),
        });

        // Top right: Round Count
        this.program.draw({
            time: context.time.delta,
            screen: context.screen,
            mode: context.mode.asVec4(),

            corner: 3,
            textureFrom: this.roundCounterComponent.getLastValue(),
            textureTo: this.roundCounterComponent.getCurrentValue(),
            textureDelta: this.roundCounterComponent.getDelta(),
            textureDuration: this.roundCounterComponent.getChangeDuration(),
        });
    }

    dispose() {
        this.program.dispose();
        this.pageTitleComponent?.dispose();
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

    corner: number;

    textureFrom?: GLTexture;
    textureTo?: GLTexture;
    texture?: GLTexture;
    textureDelta: number;
    textureDuration: number;
}
const ModeNames = [
    "nothing",
    "race_podium",
    "race_results",
    "constructors_standing",
    "drivers_championship",
    "calendar"
] satisfies Record<number, keyof typeof TextureMap>;
const TextureMap = {
    "nothing": "Nothing",
    "race_podium": "Race Podium",
    "race_results": "Race Results",
    "constructors_standing": "Constructor Standings",
    "drivers_championship": "Drivers Championship",
    "calendar": "Calendar",
} satisfies Record<string, string>;