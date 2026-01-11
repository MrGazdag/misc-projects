import {RecordResults} from "../F1Renderer";
import Exporter from "./Exporter";

export default abstract class PNGExporter extends Exporter {
    public async frame(index: number, canvas: HTMLCanvasElement): Promise<void> {
        let blob = await new Promise<Blob>((res,rej)=>{
            canvas.toBlob(b=>{
                if (!b) rej(new Error("Failed to create blob"));
                res(b!);
            }, "image/png");
        });
        await this.pngFrame(index, blob);
    }
    public abstract pngFrame(index: number, blob: Blob): Promise<void>;
}