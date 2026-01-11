import { RecordResults } from "../F1Renderer";
import Exporter from "./Exporter";
import JSZip from "jszip";
import PNGExporter from "./PNGExporter";

export default class ZipExporter extends PNGExporter {
    private zip!: JSZip;

    public async setup(): Promise<void> {
        this.zip = new JSZip();
    }
    public async pngFrame(index: number, blob: Blob): Promise<void> {
        this.zip.file(`${index}.png`, blob);
    }
    public async complete(): Promise<RecordResults> {
        // Generate zip (Blob) and download
        const zipBlob = await this.zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
        });

        let url = URL.createObjectURL(zipBlob);
        /*
        const a = document.createElement("a");
        a.href = url;
        a.download = `capture.zip`;
        a.click();
        */

        return {
            type: "download",
            name: "capture.zip",
            url: url
        };
    }

}