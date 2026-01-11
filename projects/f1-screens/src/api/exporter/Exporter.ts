import {RecordOptions, RecordResults} from "../F1Renderer";

export default abstract class Exporter {
    public abstract setup(options: RecordOptions): Promise<void>;
    public abstract frame(index: number, canvas: HTMLCanvasElement): Promise<void>;
    public abstract complete(): Promise<RecordResults>;
}