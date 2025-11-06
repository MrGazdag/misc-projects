import Track from "./Track";
import {SerializedTrack} from "./SerializedData";
import Car from "./Car";
import Leaderboard from "./Leaderboard";
import {RenderContext} from "../../../../common/CanvasRenderer";

export default class Game {
    private static readonly carSpeed = 0.002;
    private static readonly carDistance = 0.3;
    private track: Track;
    private sizeMultiplier: number;
    cars: Car[];
    leaderboard: Leaderboard;
    constructor(track: SerializedTrack) {
        this.track = new Track(track);
        this.sizeMultiplier = 0.01;
        this.cars = [];
        const totalCars = 10;
        for (let i = 0; i < totalCars; i++) {
            this.cars.push(new Car(this.track, this.track.start, `hsl(${360/totalCars*i}, 100%, 50%)`, i, i * Game.carDistance));
        }
        this.leaderboard = new Leaderboard(this);
        console.log("Loaded track: " + track.name, this);
    }

    setSizeMultiplier(multiplier: number) {
        this.sizeMultiplier = multiplier;
    }
    getSizeMultiplier() {
        return this.sizeMultiplier;
    }
    render(context: RenderContext) {
        let ctx = context.ctx;
        let canvas = ctx.canvas;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.resetTransform();
        ctx.beginPath();
        ctx.translate(canvas.width / 2, canvas.height / 2);

        let minX =  Infinity, minY =  Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const p of this.track.points) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }

        const totalWidth  = Math.max(1e-6, maxX - minX);
        const totalHeight = Math.max(1e-6, maxY - minY);
        // Handle empty/degenerate cases
        if (!isFinite(minX) || !isFinite(minY)) {
            // nothing to draw
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(1,-1);
        } else {
            const cx = (minX + maxX) / 2;
            const cy = (minY + maxY) / 2;

            // Padding: 0.8 means leave 10% margins on each side
            const padding = 0.8;
            const scale = padding * Math.min(canvas.width / totalWidth, canvas.height / totalHeight);

            ctx.setTransform(scale, 0, 0, scale, canvas.width / 2, canvas.height / 2);
            ctx.scale(1,-1);
            ctx.translate(-cx, -cy);
        }

        let transform = ctx.getTransform();
        ctx.resetTransform();

        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        for (let point of this.track.points) {
            let p1 = transform.transformPoint({
                x: point.x,
                y: point.y
            })
            for (let next of point.next) {
                let p2 = transform.transformPoint({
                    x: next.x,
                    y: next.y
                })
                ctx.beginPath();
                this.canvas_arrow(ctx, 30, p1.x, p1.y, p2.x, p2.y);
                ctx.stroke();
            }
        }

        for (let point of this.track.points) {
            let p = transform.transformPoint({
                x: point.x,
                y: point.y
            })

            ctx.fillStyle = 'gray';
            if (this.track.start == point) {
                ctx.fillRect(p.x-10, p.y-10, 20, 20);
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI, false);
                ctx.fill();
            }
            ctx.font = "20px Arial";
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'gray';
            ctx.fillStyle = 'white';
            this.centerText(ctx, point.index+"", p.x, p.y+20);
            //this.centerText(ctx, (this.track.percentages.get(point)!*100).toFixed(2)+"%", p.x, p.y+20);
        }

        for (let car of this.cars) {
            let p = transform.transformPoint({
                x: car.posX,
                y: car.posY
            });

            car.update(Game.carSpeed * (Math.max(totalWidth, totalHeight)));

            ctx.strokeStyle = "black";
            ctx.fillStyle = car.getStyle();
            ctx.beginPath();
            ctx.font = "40px Arial";
            //ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI, false);
            ctx.fill();
            this.centerText(ctx, car.index+"", p.x, p.y);
        }

        // Draw movement graphs
        ctx.lineWidth = 3;
        ctx.strokeStyle = "100";
        const graphWidth = 300;
        const graphHeight = 800;

        let innerGraphWidth = this.track.longestLength;
        let innerGraphHeight = 1;

        const padding = 50;
        let graphMatrix = this.makeCanvasRectTransform(ctx, canvas.width-padding-graphWidth, padding+graphHeight, canvas.width-padding, padding, innerGraphWidth, innerGraphHeight);
        let origin = graphMatrix.transformPoint({x: 0, y: 0});
        let topRight = graphMatrix.transformPoint({x: innerGraphWidth, y: innerGraphHeight});
        ctx.beginPath();
        this.canvas_arrow(ctx, 10, origin.x, origin.y, topRight.x, origin.y); // X axis
        this.canvas_arrow(ctx, 10, origin.x, origin.y, origin.x, topRight.y); // Y axis
        ctx.strokeStyle = "black";
        ctx.stroke();

        for (let car of this.cars) {
            ctx.strokeStyle = car.getStyle();
            ctx.beginPath();

            let startIndex = (car.distanceLastIndex+1)%car.distancePercentageStats.length;
            if (car.distanceLastIndex < 0) {
                continue;
            } else if (startIndex > car.distanceLastIndex) {
                let firstPoint = car.distancePercentageStats[startIndex];
                let prevPoint: {x: number, y: number} = graphMatrix.transformPoint({x: firstPoint[0], y: firstPoint[1]});

                for (let i = startIndex+1; i < car.distancePercentageStats.length; i++){
                    let nextPoint = car.distancePercentageStats[i];

                    let p = graphMatrix.transformPoint({x: nextPoint[0], y: nextPoint[1]});
                    ctx.moveTo(prevPoint.x, prevPoint.y);
                    ctx.lineTo(p.x, p.y);
                    prevPoint = p;
                }

                firstPoint = car.distancePercentageStats[0];
                prevPoint = graphMatrix.transformPoint({x: firstPoint[0], y: firstPoint[1]});
                for (let i = 1; i < startIndex; i++){
                    let nextPoint = car.distancePercentageStats[i];

                    let p = graphMatrix.transformPoint({x: nextPoint[0], y: nextPoint[1]});
                    ctx.moveTo(prevPoint.x, prevPoint.y);
                    ctx.lineTo(p.x, p.y);
                    prevPoint = p;
                }
            } else {
                let firstPoint = car.distancePercentageStats[0];
                let prevPoint: {x: number, y: number} = graphMatrix.transformPoint({x: firstPoint[0], y: firstPoint[1]});
                for (let i = 1; i < car.distancePercentageStats.length; i++){
                    let nextPoint = car.distancePercentageStats[i];

                    let p = graphMatrix.transformPoint({x: nextPoint[0], y: nextPoint[1]});
                    ctx.moveTo(prevPoint.x, prevPoint.y);
                    ctx.lineTo(p.x, p.y);
                    prevPoint = p;
                }
            }

            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.resetTransform();

        ctx.fillStyle = "black";
        this.leaderboard.update();
        for (let i = 0; i < this.leaderboard.scoring.length; i++) {
            let entry = this.leaderboard.scoring[i];
            let leaderboardText = (i+1) + ". Car " + entry.car.index + " - " + (entry.gapToAheadSec !== null ? entry.gapToAheadSec.toFixed(3) : "---");
            let measure = ctx.measureText(leaderboardText);
            ctx.strokeStyle = "black";
            ctx.fillStyle = entry.car.getStyle();
            ctx.strokeText(leaderboardText, 10, (measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent + 10) * (entry.position+1));
            ctx.fillText(leaderboardText, 10, (measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent + 10) * (entry.position+1));
        }

    }
    private centerText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
        let metrics = ctx.measureText(text);
        let textWidth = metrics.width;
        let textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        let textX = x - textWidth / 2;
        let textY = y + textHeight / 2;
        ctx.strokeText(text, textX, textY);
        ctx.fillText(text, textX, textY);
    }
    private canvas_arrow(ctx: CanvasRenderingContext2D, headLength: number, fromx: number, fromy: number, tox: number, toy: number) {
        let dx = tox - fromx;
        let dy = toy - fromy;
        let angle = Math.atan2(dy, dx);
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.lineTo(tox - headLength * Math.cos(angle - Math.PI / 6), toy - headLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headLength * Math.cos(angle + Math.PI / 6), toy - headLength * Math.sin(angle + Math.PI / 6));
    }
    private makeCanvasRectTransform(
        ctx: CanvasRenderingContext2D,
        p1X: number,
        p1Y: number,
        p2X: number,
        p2Y: number,
        width: number,
        height: number
    ): DOMMatrix {
        if (width === 0 || height === 0) {
            throw new Error("width and height must be non-zero");
        }

        // Normalize the two points into rect corners in canvas space
        const minX = Math.min(p1X, p2X);
        const maxX = Math.max(p1X, p2X);
        const minY = Math.min(p1Y, p2Y);
        const maxY = Math.max(p1Y, p2Y);

        // In canvas, y grows downward:
        // bottom-left is (minX, maxY); top-right is (maxX, minY)
        const blx = minX;
        const bly = maxY;
        const trX = maxX;
        const trY = minY;

        const sx = (trX - blx) / width;
        const sy = (trY - bly) / height; // typically negative (flip), which is fine

        const saved = ctx.getTransform();

        // Reset, apply T * S, read the composed transform, then restore
        ctx.resetTransform();
        ctx.translate(blx, bly);
        ctx.scale(sx, sy);
        let result = ctx.getTransform();
        ctx.setTransform(saved);
        return result;
    }

    getTrack() {
        return this.track;
    }
}