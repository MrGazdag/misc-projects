import WebCodecsMP4Exporter from "./WebCodecsMP4Exporter";
import {RecordResults} from "../F1Renderer";

export default class ImgurExporter extends WebCodecsMP4Exporter {
    async complete(): Promise<RecordResults> {
        let blob = await super.exportAsBlob();
        let data = new FormData();
        data.append("video", blob, "video.mp4")
        data.append("type", "file")
        data.append("name", "video.mp4")
        console.log("Uploading to Imgur...");
        let res = await (await fetch("https://api.imgur.com/3/upload?client_id=d70305e7c3ac5c6", {
            "body": data,
            "method": "POST"
        })).json();
        if (!res.success) throw new Error(res.data.error);

        let id = res.data.id;

        while (true) {
            let status = await (await fetch(`https://api.imgur.com/media/v1/media/${id}/status?client_id=d70305e7c3ac5c6`)).json();
            if (status.state !== "started") break;
            await new Promise(r=>setTimeout(r, 2000));
        }

        let url = res.data.link;

        return {
            type: "video",
            url: url,
            name: "imgur.mp4"
        };
    }
}