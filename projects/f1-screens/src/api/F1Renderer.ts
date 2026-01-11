import {GLBuffer, GLRenderer} from "@mrgazdag/gl-lite";
import AbstractComponent from "./components/AbstractComponent";
import GameData from "./data/GameData";
import BackgroundComponent from "./components/BackgroundComponent";
import ChangeableProperty from "./ChangeableProperty";
import HeaderComponent from "./components/HeaderComponent";
import {RenderContext} from "../../../../common/components/CanvasRenderer";
import HeaderLineComponent from "./components/HeaderLineComponent";
import PodiumComponent from "./components/PodiumComponent";
import CalendarComponent from "./components/CalendarComponent";
import JSZip from "jszip";
import ConstructorStandingsComponent from "./components/ConstructorStandingsComponent";
import DriversChampionshipComponent from "./components/DriversChampionshipComponent";
import {FFmpeg} from "@ffmpeg/ffmpeg";
import {toBlobURL} from "@ffmpeg/util";
import FFmpegMP4Exporter from "./exporter/FFmpegMP4Exporter";
import WebCodecsMP4Exporter from "./exporter/WebCodecsMP4Exporter";

export default class F1Renderer {
    private static timeMultiplier = 1;
    private static renderSizeMultiplier = 1;
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

    private rawGameData: string;
    private gameData: GameData;

    private recording: boolean;
    private recordResult: RecordResults | undefined;

    private allComponents: AbstractComponent[];
    constructor(rawGameData: string) {
        this.rawGameData = rawGameData;
        let json = JSON.parse(rawGameData);
        this.gameData = new GameData(json);

        this.startTime = (Date.now()/1000) * F1Renderer.timeMultiplier;
        this.initData = undefined;

        this.mode = new ChangeableProperty(5, 3);
        this.raceIndex = new ChangeableProperty(-1, 2);

        this.recording = false;
        this.recordResult = undefined;

        this.allComponents = [
            new BackgroundComponent(),
            new HeaderComponent(),
            new HeaderLineComponent(),

            new PodiumComponent(),
            new ConstructorStandingsComponent(),
            new DriversChampionshipComponent(),
            new CalendarComponent(),
        ];
    }

    reset() {
        this.startTime = (Date.now()/1000) * F1Renderer.timeMultiplier;
    }

    async setRawData(raw: string) {
        this.rawGameData = raw;
        let json = JSON.parse(raw);
        let newGameData = new GameData(json);
        await newGameData.init();

        for (let allComponent of this.allComponents) {
            allComponent.performDispose();
        }

        this.gameData = newGameData;
    }

    getRawGameData() {
        return this.rawGameData;
    }

    async record(context: RenderContext<WebGL2RenderingContext>, options: RecordOptions) {
        for (let allComponent of this.allComponents) {
            allComponent.performDispose();
        }

        this.recording = true;
        try {
            let exporter = new WebCodecsMP4Exporter();
            await exporter.setup(options);

            let start = 0;
            ChangeableProperty.setNow(0);
            this.startTime = start;
            this.mode.overwrite(this.mode.getCurrentValue());
            this.raceIndex.overwrite(this.raceIndex.getCurrentValue());
            let totalFrames = options.seconds * options.fps;
            let frameTime = 1/options.fps;

            for (let i = 0; i < totalFrames; i++) {
                let time = start + i * frameTime;
                context.ctx.canvas.width = options.width;
                context.ctx.canvas.height = options.height;
                console.log("rendering frame", i, "/", totalFrames, "   ", time, "/", options.seconds);
                this.render(context, time);
                let canvas = context.ctx.canvas as HTMLCanvasElement;
                await exporter.frame(i, canvas);
            }

            this.recordResult = await exporter.complete();
        } finally {
            this.recording = false;
            this.reset();
        }
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
    isRecording() {
        return this.recording;
    }
    render(ctx: RenderContext<WebGL2RenderingContext>, time?: number) {
        if (!this.initData) this.init(ctx.ctx);
        let renderer = this.initData!.renderer;

        let canvas = ctx.ctx.canvas as HTMLCanvasElement;

        let now;
        if (time == undefined) now = (Date.now()/1000) * F1Renderer.timeMultiplier;
        else now = time;
        ChangeableProperty.setNow(now);

        let pointer: [number,number] = [-1000, -1000];
        if (ctx.pointers.size > 0) {
            let e = [...ctx.pointers.values()][0];
            pointer = [e.clientX, canvas.clientHeight-e.clientY];
        }

        let context: ComponentContext = {
            mode: this.mode,
            raceIndex: this.raceIndex,

            renderer: this,
            gameData: this.gameData,

            screen: [canvas.clientWidth, canvas.clientHeight],
            pointer: pointer,

            time: {
                now: now,
                start: this.startTime,
                delta: now - this.startTime,
            }
        }

        // Render
        renderer.resize(canvas.clientWidth * F1Renderer.renderSizeMultiplier, canvas.clientHeight * F1Renderer.renderSizeMultiplier);
        renderer.clear([0, 0, 0, 0]);
        for (let component of this.allComponents) {
            component.performRender(renderer, context);
        }
    }

    getRaceIndex() {
        return this.raceIndex;
    }

    getRecordResult() {
        return this.recordResult;
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
export interface RecordOptions {
    width: number,
    height: number,
    fps: number,
    seconds: number
}
export interface RecordResults {
    type: "download" | "video"
    url: string,
    name: string,
}