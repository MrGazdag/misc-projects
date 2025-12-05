import {GLBuffer, GLRenderer} from "@mrgazdag/gl-lite";
import RawGameData from "./data/RawGameData";
import AbstractComponent from "./components/AbstractComponent";
import GameData from "./data/GameData";
import BackgroundComponent from "./components/BackgroundComponent";
import ChangeableProperty from "./ChangeableProperty";
import HeaderComponent from "./components/HeaderComponent";
import {RenderContext} from "../../../../common/components/CanvasRenderer";
import HeaderLineComponent from "./components/HeaderLineComponent";
import PodiumComponent from "./components/PodiumComponent";

export default class F1Renderer {
    private static timeMultiplier = 1;
    private startTime: number;
    private initData?: {
        renderer: GLRenderer;
        rectBuffers: {
            position: GLBuffer,
            index: GLBuffer,
            count: number,
        }
    }
    private mode: ChangeableProperty<number>;
    private raceIndex: ChangeableProperty<number>;
    private gameData: GameData;

    private allComponents: AbstractComponent[];

    constructor(gameData: RawGameData) {
        this.gameData = new GameData(gameData);
        this.startTime = (Date.now()/1000) * F1Renderer.timeMultiplier;
        this.initData = undefined;

        this.mode = new ChangeableProperty(0, 2);
        this.raceIndex = new ChangeableProperty(0, 2);

        this.allComponents = [
            new BackgroundComponent(),
            new HeaderComponent(),
            new HeaderLineComponent(),
            new PodiumComponent()
        ];
    }

    getRectBuffers() {
        return this.initData!.rectBuffers;
    }

    getGameData() {
        return this.gameData;
    }

    getMode() {
        return this.mode;
    }

    init(ctx: WebGL2RenderingContext) {
        // Create a renderer
        let renderer = new GLRenderer({
            canvas: ctx.canvas as HTMLCanvasElement,
            attributes: {
                depth: false,
                premultipliedAlpha: false
            }
        });

        // positions for a fullscreen quad (or central rect)
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1,
        ]);
        const indices = new Uint16Array([0, 1, 2, 3]);

        const positionBuffer = renderer.buffer({ data: positions });
        const indexBuffer = renderer.buffer({ target: "element", data: indices });


        this.initData = {
            renderer: renderer,
            rectBuffers: {
                position: positionBuffer,
                index: indexBuffer,
                count: indices.length
            }
        };
    }
    render(ctx: RenderContext<WebGL2RenderingContext>) {
        if (!this.initData) this.init(ctx.ctx);
        let renderer = this.initData!.renderer;

        let now = (Date.now()/1000) * F1Renderer.timeMultiplier;
        ChangeableProperty.setNow(now);

        let pointer: [number,number] = [-1000, -1000];
        if (ctx.pointers.size > 0) {
            let e = [...ctx.pointers.values()][0];
            pointer = [e.clientX, ctx.ctx.canvas.height-e.clientY];
        }

        let context: ComponentContext = {
            mode: this.mode,
            raceIndex: this.raceIndex,

            renderer: this,
            gameData: this.gameData,

            screen: [ctx.ctx.canvas.width, ctx.ctx.canvas.height],
            pointer: pointer,

            time: {
                now: now,
                start: this.startTime,
                delta: now - this.startTime,
            }
        }

        // Render
        renderer.resize(ctx.ctx.canvas.width, ctx.ctx.canvas.height);
        renderer.clear([0, 0, 0, 0]);
        for (let component of this.allComponents) {
            component.performRender(renderer, context);
        }
    }

    getRaceIndex() {
        return this.raceIndex;
    }
}
export interface ComponentContext {
    mode: ChangeableProperty<number>,
    raceIndex: ChangeableProperty<number>,

    gameData: GameData,
    renderer: F1Renderer,

    screen: [number,number]
    pointer: [number,number]

    time: {
        start: number,
        now: number,
        delta: number
    }
}