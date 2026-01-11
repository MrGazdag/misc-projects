import {GLRenderer, GLTexture, GLTextureParams} from "@mrgazdag/gl-lite";

interface FontData {
    family: string,
    size: string,
    weight?: string
}
export default class TextRenderer {
    private static canvas: HTMLCanvasElement;
    private static ctx: CanvasRenderingContext2D;
    private static init() {
        this.canvas = document.createElement("canvas");
        this.canvas.width = 1;
        this.canvas.height = 1;
        this.ctx = this.canvas.getContext("2d", {
            willReadFrequently: true,
        })!;
    }
    private static combineFont(font: FontData): string {
        return [font.weight, font.size, font.family].filter(e=>e != null).join(" ");
    }
    public static updateOrNew(renderer: GLRenderer, texture: GLTexture | undefined, params: Partial<GLTextureParams>): GLTexture {
        if (texture != null) {
            texture.update(params)
            return texture;
        } else {
            return renderer.texture(params);
        }
    }
    public static renderText(font: FontData, str: string, options?: Partial<Omit<GLTextureParams, "data"|"width"|"height"|"format">>): Partial<GLTextureParams> {
        if (this.canvas == null) this.init();

        const padding = 5;

        let combined = this.combineFont(font);

        this.ctx.font = combined;
        let measured = this.ctx.measureText(str);

        this.canvas.width = measured.width + 2*padding;
        this.canvas.height = measured.fontBoundingBoxAscent + measured.fontBoundingBoxDescent + 2*padding;

        this.ctx.font = combined;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "white";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(str, padding, this.canvas.height/2);

        let data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        return {
            data: data,
            width: this.canvas.width,
            height: this.canvas.height,
            format: "rgba",
            flipY: true,

            ...options
        };
    }
    public static renderTextWithDiff(font: FontData, str: string, diff:number, options?: Partial<Omit<GLTextureParams, "data"|"width"|"height"|"format">>): Partial<GLTextureParams> {
        if (this.canvas == null) this.init();

        diff = Math.round(diff);

        const padding = 5;
        const gap = 20;

        let combined = this.combineFont(font);

        this.ctx.font = combined;
        let textMetrics = this.ctx.measureText(str);
        let textHeight = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;

        const arrowSize = textHeight * 0.5;

        let diffMetrics = this.ctx.measureText(Math.abs(diff)+"");

        this.canvas.width = padding + textMetrics.width + (diff == 0 ? 0 : gap + arrowSize + gap + diffMetrics.width) + padding;
        this.canvas.height = textHeight + 2*padding;

        this.ctx.font = combined;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "white";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(str, padding, this.canvas.height/2);

        if (diff != 0) {
            let color = diff < 0 ? "red" : "green";

            // Arrow
            let arrowStart = padding + textMetrics.width + gap;
            let heightCenter = (this.canvas.height - textMetrics.fontBoundingBoxAscent) / 2 + textMetrics.fontBoundingBoxAscent/2;
            let mul = Math.sign(diff);

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 10;
            this.ctx.beginPath();
            this.ctx.moveTo(arrowStart                  , heightCenter + mul *  0.25 * arrowSize);
            this.ctx.lineTo(arrowStart + arrowSize * 0.5, heightCenter + mul * -0.25 * arrowSize);
            this.ctx.lineTo(arrowStart + arrowSize      , heightCenter + mul *  0.25 * arrowSize);
            this.ctx.stroke();

            // Text
            this.ctx.fillStyle = color;
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(Math.abs(diff)+"", arrowStart + arrowSize + gap, this.canvas.height/2);
        }
        let data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        return {
            data: data,
            width: this.canvas.width,
            height: this.canvas.height,
            format: "rgba",
            flipY: true,

            ...options
        };
    }
    public static renderMultilineIndexed(font: FontData, strings: string[], textAlign: "left"|"center"|"right", options?: Partial<Omit<GLTextureParams, "data"|"width"|"height"|"format">>): Partial<GLTextureParams> {
        if (this.canvas == null) this.init();

        // First column in the texture will only contain magic pixels
        // The magic pixels are:
        // - Row 0: Number of strings
        // - Row 1: Number of distinct strings
        // - Each row after that: which texture to use for the row-2
        // Second column is just used as a spacer (for no bleed)
        // Rest of the textures are stacked vertically
        // Currently center aligned, maybe change in the future?

        const padding = 5;
        let combined = this.combineFont(font);

        this.ctx.font = combined;
        let measurements = strings.map(e=>this.ctx.measureText(e));

        let maxWidth = 0;
        for (let m of measurements) maxWidth = Math.max(maxWidth, m.width + 2*padding);

        let maxHeight = strings.length;
        for (let m of measurements) maxHeight = Math.max(maxHeight, m.fontBoundingBoxAscent + m.fontBoundingBoxDescent + 2*padding);

        let distinctStrings: [string,TextMetrics][] = [];
        let indexMap = new Map<number,number>();
        for (let i = 0; i < strings.length; i++){
            let string = strings[i];
            let m = measurements[i];

            let index = distinctStrings.findIndex(e=>e[0] == string);
            if (index == -1) {
                indexMap.set(i, distinctStrings.length);
                distinctStrings.push([string,m]);
            } else {
                indexMap.set(i, index);
            }
        }


        this.canvas.width = maxWidth + 1;
        this.canvas.height = maxHeight * distinctStrings.length;

        this.ctx.font = combined;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "white";
        this.ctx.textBaseline = "middle";

        // Draw text
        for (let i = 0; i < distinctStrings.length; i++){
            let distinct = distinctStrings[i];
            let string = distinct[0];
            let m = distinct[1];

            let x = 2;
            if (textAlign == "left") x += padding;
            else if (textAlign == "right") x += maxWidth - padding - m.width;
            else x += (maxWidth - m.width)/2;

            this.ctx.fillText(string, x, (i * maxHeight) + padding + maxHeight/2);
        }

        // Magic pixel counter
        this.ctx.fillStyle = `rgb(${strings.length}, 0, 0)`;
        this.ctx.fillRect(0, 0, 1, 1);
        // Magic pixel distinct
        this.ctx.fillStyle = `rgb(${distinctStrings.length}, 0, 0)`;
        this.ctx.fillRect(0, 1, 1, 1);

        // Draw magic pixels
        for (let i = 0; i < strings.length; i++){
            let index = indexMap.get(i)!;
            this.ctx.fillStyle = `rgb(${index}, 0, 0)`;
            this.ctx.fillRect(0, i+2, 1, 1);
        }
        let data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        //this.debugPrint();
        return {
            data: data,
            width: this.canvas.width,
            height: this.canvas.height,
            format: "rgba",
            flipY: true,

            ...options
        };
    }
    private static debugPrint() {
        let c = document.createElement("canvas");
        c.width = this.canvas.width;
        c.height = this.canvas.height;
        let ctx = c.getContext("2d")!;
        ctx.drawImage(this.canvas, 0, 0);
        c.style.border = "1px solid black";
        document.body.appendChild(c);
        document.body.style.background = "gray";
    }
}