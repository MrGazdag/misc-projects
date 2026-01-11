import { RecordOptions, RecordResults } from "../F1Renderer";
import Exporter from "./Exporter";
import {ArrayBufferTarget, Muxer} from "mp4-muxer";

export default class WebCodecsMP4Exporter extends Exporter {
    private options!: RecordOptions;
    private muxer!: Muxer<ArrayBufferTarget>;
    private encoder!: VideoEncoder;
    private async pickSupportedConfig(options: RecordOptions) {
        // Choose a codec string. This is H.264 Baseline profile (often broadly supported).
        // You can try "avc1.4D401F" (Main) too, but Baseline is safest.
        //const codec = "avc1.42E01E";
        const codecs = [
            "avc",
            "hevc",
            "vp9",
            "av1",
            "avc1.42E01E",
            "avc1.4D401F",
            "avc1.64001F",
            "vp09.00.10.08",
            "av01.0.04M.08",
        ];

        let codecIndex = 0;
        let encoderConfig: VideoEncoderConfig;
        let support: VideoEncoderSupport;
        do {
            if (codecIndex >= codecs.length) {
                throw new Error("No supported codec found. Please check browser support: https://caniuse.com/mdn-api_mediastreamtrackgenerator_createencodedvideotrack");
            }
            let codec = codecs[codecIndex++];
            encoderConfig = {
                codec: codec,
                width: options.width,
                height: options.height,
                bitrate: 5_000_000,
                framerate: options.fps,
                // Often helps performance / keeps buffering low:
                latencyMode: "realtime",
                // "prefer-hardware" is supported in some browsers; safe to omit if TS complains.
                //hardwareAcceleration: "prefer-hardware",

            };

            support = await VideoEncoder.isConfigSupported(encoderConfig);
            console.log("codec", codec, "supported:", support.supported, "support", support.config);
        } while(!support.supported);
        return encoderConfig;
    }
    public async setup(options: RecordOptions): Promise<void> {
        this.options = options;

        let encoderConfig = await this.pickSupportedConfig(options);
        let codec = encoderConfig.codec;
        console.log(`Using codec ${codec} ${options.width}x${options.height} for encoding`)
        // mp4-muxer target in memory
        const target = new ArrayBufferTarget();
        this.muxer = new Muxer({
            target,
            video: {
                codec: "vp9",      // must match encoder codec string
                width: options.width,
                height: options.height,
                // mp4-muxer wants "timescale"; it will accept samples with durations.
                // We'll use microseconds timestamps and let muxer handle durations via addVideoChunk.
            },
            // fastStart is the MP4 equivalent of "moov at beginning" (what +faststart does).
            fastStart: "in-memory",
        });
        this.encoder = new VideoEncoder({
            output: (chunk, meta) => {
                // meta.decoderConfig is important; muxer needs it at least once
                // mp4-muxer handles this when you pass meta along
                this.muxer.addVideoChunk(chunk, meta);
            },
            error: (e) => {
                throw e;
            },
        });

        this.encoder.configure(encoderConfig);
    }
    public async frame(index: number, canvas: HTMLCanvasElement): Promise<void> {
        // Create a frame from the canvas. Timestamp is in microseconds.
        const frame = new VideoFrame(canvas, { timestamp: index * (1_000_000 / this.options.fps) });

        // Keyframe every ~2 seconds (helps seeking + robustness)
        const keyFrame = index % (this.options.fps * 2) === 0;

        this.encoder.encode(frame, {keyFrame: keyFrame});
        frame.close();
    }
    public async complete(): Promise<RecordResults> {
        await this.encoder.flush();
        this.encoder.close();

        this.muxer.finalize();

        let blob = new Blob([this.muxer.target.buffer], {type: "video/mp4"});
        let url = URL.createObjectURL(blob);
        return {
            type: "video",
            name: "video.mp4",
            url: url
        };
    }

}
type Codecs = "avc" | "hevc" | "vp9" | "av1";