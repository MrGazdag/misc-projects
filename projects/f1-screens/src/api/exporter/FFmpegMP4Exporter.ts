import { RecordResults } from "../F1Renderer";
import Exporter from "./Exporter";
import JSZip from "jszip";
import {FFmpeg} from "@ffmpeg/ffmpeg";
import {toBlobURL} from "@ffmpeg/util";
import PNGExporter from "./PNGExporter";

export default class FFmpegMP4Exporter extends PNGExporter {
    private ffmpeg!: FFmpeg;

    public async setup(): Promise<void> {
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd'
        this.ffmpeg = new FFmpeg();
        this.ffmpeg.on('log', ({ message }) => {
            console.log(message);
        });
        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    }
    public async pngFrame(index: number, blob: Blob): Promise<void> {
        await this.ffmpeg.writeFile(`${index}.png`, new Uint8Array(await blob.arrayBuffer()));
    }
    public async complete(): Promise<RecordResults> {
        let ffmpegOptions = [
            "-framerate 60",
            "-i %d.png",
            "-vf crop=floor(iw/2)*2:floor(ih/2)*2",
            "-c:v libx264",
            "-pix_fmt yuv420p",
            "-profile:v baseline",
            "-movflags +faststart",
            "-r 60",
            "video.mp4"
        ].join(" ").split(/\s/g);
        await this.ffmpeg.exec(ffmpegOptions);

        const data = await this.ffmpeg.readFile('video.mp4', "binary") as Uint8Array<ArrayBuffer>;
        let url = URL.createObjectURL(new Blob([data], {type: "video/mp4"}));
        console.log("encoding done: ", url);

        return {
            type: "video",
            name: "video.mp4",
            url: url
        };
    }

}