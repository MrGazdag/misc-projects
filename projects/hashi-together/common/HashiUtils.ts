import HashiCellState from "./HashiCellState";

export default class HashiUtils {
    public static isCell(state: HashiCellState) {
        // Low level fuckery
        return state > 0;
    }
    public static isCrossedCell(state: HashiCellState) {
        // Low level fuckery
        return state >= HashiCellState.CELL_1_CROSSED;
    }
    public static toggleCrossedCell(state: HashiCellState) {
        // Low level fuckery
        return this.isCrossedCell(state) ? state - 8 : state + 8;
    }
    public static isBridge(state: HashiCellState) {
        // Low level fuckery
        return state < 0;
    }

    public static indexToCoords(index: number, mapSize: number): [number,number] {
        return [Math.floor(index / mapSize), index % mapSize];
    }
    public static coordsToIndex(x: number, y: number, mapSize: number): number {
        return x * mapSize + y;
    }
}