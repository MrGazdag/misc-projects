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
    public static countBridge(state: HashiCellState | undefined): number {
        switch (state) {
            case HashiCellState.BRIDGE_VERTICAL:
            case HashiCellState.BRIDGE_HORIZONTAL:
                return 1;
            case HashiCellState.BRIDGE_VERTICAL_DOUBLE:
            case HashiCellState.BRIDGE_HORIZONTAL_DOUBLE:
                return 2;
            default:
                return 0;
        }
    }
    public static getDesiredBridgeCount(state: HashiCellState) {
        if (this.isCrossedCell(state)) return this.toggleCrossedCell(state);
        return state;
    }
    public static isVertical(state: HashiCellState) {
        return state == HashiCellState.BRIDGE_VERTICAL || state == HashiCellState.BRIDGE_VERTICAL_DOUBLE;
    }

    public static isHorizontal(state: HashiCellState) {
        return state == HashiCellState.BRIDGE_HORIZONTAL || state == HashiCellState.BRIDGE_HORIZONTAL_DOUBLE;
    }

    public static indexToCoords(index: number, mapSize: number): [number,number] {
        return [index % mapSize, Math.floor(index / mapSize)];
    }
    public static coordsToIndex(x: number, y: number, mapSize: number): number {
        return y * mapSize + x;
    }
}