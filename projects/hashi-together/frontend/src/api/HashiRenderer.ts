import HashiMap from "../../../common/HashiMap";
import {RenderContext} from "../../../../../common/components/CanvasRenderer";
import HashiUtils from "../../../common/HashiUtils";
import Utils from "../../../../../common/Utils";
import HashiCellState from "../../../common/HashiCellState";

export default class HashiRenderer {
    private map: HashiMap;

    constructor(map: HashiMap) {
        this.map = map;
    }

    render(r: RenderContext<CanvasRenderingContext2D>) {
        let ctx = r.ctx;

        let w = ctx.canvas.width;
        let h = ctx.canvas.height;

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);

        let mapSize = this.map.getMapSize();

        let cW = w / (mapSize+1);
        let cH = h / (mapSize+1);

        const marginX = cW / 2;
        const marginY = cH / 2;

        for (let i = 0; i < this.map.getCells().length; i++){
            let [x,y] = HashiUtils.indexToCoords(i, mapSize);
            let centerX = marginX + (x+0.5) * cW;
            let centerY = marginY + (y+0.5) * cW;
            let state = this.map.getCells()[i];

            ctx.fillStyle = "#0003";
            const gridWidth = cW * 0.1;
            const gridHeight = cW * 0.1;
            ctx.fillRect(centerX - cW/2, centerY - gridHeight/2, cW, gridHeight);
            ctx.fillRect(centerX - gridWidth/2, centerY - cH/2, gridWidth, cH);

            if (HashiUtils.isCell(state)) {
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
                // TODO crossed out?
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
}