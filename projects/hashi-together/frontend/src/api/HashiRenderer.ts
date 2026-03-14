import HashiMap from "../../../common/HashiMap";
import {RenderContext} from "../../../../../common/components/CanvasRenderer";
import HashiUtils from "../../../common/HashiUtils";
import Utils from "../../../../../common/Utils";
import HashiCellState from "../../../common/HashiCellState";

export default class HashiRenderer {
    private map: HashiMap;
    private settings: HashiRendererSettings;

    constructor(map: HashiMap) {
        this.map = map;
        this.settings = {
            showCoords: true
        };
    }
    private calculateCoordsText(chars: string, number: number) {
        let len = chars.length;
        let result = "";
        if (number == 0) return chars[0];
        while (true) {
            let mod = number % len;
            result = chars[mod] + result;
            if (number < len) break;
            number = (number - mod) / len;
            // don't start from 1 when dividing, avoids "a, b, c, ba"
            number -= 1;
        }
        return result;
    }

    render(r: RenderContext<CanvasRenderingContext2D>) {
        let ctx = r.ctx;

        let w = ctx.canvas.width;
        let h = ctx.canvas.height;

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);

        let mapSize = this.map.getMapSize();

        let cW = w / (mapSize + 1 + (this.settings.showCoords ? 2 : 0));
        let cH = h / (mapSize + 1 + (this.settings.showCoords ? 2 : 0));

        const marginX = cW / 2;
        const marginY = cH / 2;

        // Grid
        ctx.beginPath();
        for (let i = 0; i < mapSize; i++) {
            // Horizontal
            ctx.moveTo(marginX+cW,   marginY+cH + (0.5+i)*cH);
            ctx.lineTo(w-marginX-cW, marginY+cH + (0.5+i)*cH);

            // Vertical
            ctx.moveTo(marginX+cW + (0.5+i)*cW, marginY+cH);
            ctx.lineTo(marginX+cW + (0.5+i)*cW, h-marginY-cH);
        }
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#0003';
        ctx.stroke();


        ctx.fillStyle = "#0003";
        if (this.settings.showCoords) {
            ctx.font = cW*0.6 + "px Arial";
            // Coordinates
            for (let x = 0; x < mapSize; x++) {
                let str = this.calculateCoordsText("abcdefghijklmnopqrstuvwxyz", x);
                // Top
                Utils.centerFillText(ctx, marginX+(1.5 + x)*cW, marginY + 0.5*cH, str);
                // Bottom
                Utils.centerFillText(ctx, marginX+(1.5 + x)*cW, h-marginY-0.5*cH, str);
            }
            for (let y = 0; y < mapSize; y++) {
                let str = y+"";
                // Left
                Utils.centerFillText(ctx, marginX + 0.5*cH, marginY+(1.5 + y)*cH, str);
                // Right
                Utils.centerFillText(ctx, w-marginX-0.5*cH, marginY+(1.5 + y)*cH, str);
            }
        }

        // Cells
        for (let i = 0; i < this.map.getCells().length; i++){
            let [x,y] = HashiUtils.indexToCoords(i, mapSize);
            let centerX = marginX + (x+0.5+(this.settings.showCoords ? 1 : 0)) * cW;
            let centerY = marginY + (y+0.5+(this.settings.showCoords ? 1 : 0)) * cH;
            let state = this.map.getCells()[i];

            const gridWidth = cW * 0.1;
            const gridHeight = cH * 0.1;

            if (HashiUtils.isCell(state)) {
                let wasCrossedOut = HashiUtils.isCrossedCell(state);
                if (wasCrossedOut) {
                    state = HashiUtils.toggleCrossedCell(state);
                }
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, cW/2, cH/2, 0, 0, 2 * Math.PI, false)
                ctx.fillStyle = "#fff";
                ctx.fill();
                ctx.lineWidth = 5;
                ctx.strokeStyle = '#000';
                ctx.stroke();

                ctx.fillStyle = "#000";
                ctx.font = cW*0.75 + "px Arial";
                Utils.centerFillText(ctx, centerX, centerY, state+"");
                if (wasCrossedOut) {
                    ctx.beginPath();
                    ctx.moveTo(centerX-cW*0.5, centerY+cH*0.5);
                    ctx.lineTo(centerX+cW*0.5, centerY-cH*0.5);

                    ctx.lineWidth = 5;
                    ctx.strokeStyle = '#000';
                    ctx.stroke();
                }
            } else if (HashiUtils.isBridge(state)) {
                ctx.fillStyle = "#000f";
                if (state == HashiCellState.BRIDGE_HORIZONTAL) {
                    ctx.fillRect(centerX - cW/2, centerY - gridHeight/2, cW, gridHeight);
                } else if (state == HashiCellState.BRIDGE_HORIZONTAL_DOUBLE) {
                    ctx.fillRect(centerX - cW/2, centerY - gridHeight*1.5, cW, gridHeight);
                    ctx.fillRect(centerX - cW/2, centerY + gridHeight*0.5, cW, gridHeight);
                }
                if (state == HashiCellState.BRIDGE_VERTICAL) {
                    ctx.fillRect(centerX - gridWidth/2, centerY - cH/2, gridWidth, cH);
                } else if (state == HashiCellState.BRIDGE_VERTICAL_DOUBLE) {
                    ctx.fillRect(centerX - gridWidth*1.5, centerY - cH/2, gridWidth, cH);
                    ctx.fillRect(centerX + gridWidth*0.5, centerY - cH/2, gridWidth, cH);
                }
            }
        }
    }
    click(canvas: HTMLCanvasElement, x: number, y: number, right: boolean) {
        let w = canvas.width;
        let h = canvas.height;

        let mapSize = this.map.getMapSize();

        let cW = w / (mapSize + 1 + (this.settings.showCoords ? 2 : 0));
        let cH = h / (mapSize + 1 + (this.settings.showCoords ? 2 : 0));

        x /= cW;
        y /= cH;

        x -= 0.5 + (this.settings.showCoords ? 1 : 0);
        y -= 0.5 + (this.settings.showCoords ? 1 : 0);

        this.map.click(x, y, right);
    }
}
export interface HashiRendererSettings {
    showCoords: boolean
}