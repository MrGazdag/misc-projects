import HashiCellState from "./HashiCellState";
import {HashiCellChange} from "./HashiCellChange";
import HashiUtils from "./HashiUtils";
import {RawHashiMap} from "./RawHashiMap";

export default class HashiMap {
    private readonly mapSize: number;
    private readonly cells: HashiCellState[];
    private readonly lastChanges: HashiCellChange[];
    private readonly errors: Set<number>;
    private readonly lastConnected: Set<number>;

    constructor(raw: RawHashiMap) {
        this.mapSize = raw.mapSize;
        this.cells = raw.states;
        this.lastChanges = [];
        this.errors = new Set();
        this.lastConnected = new Set();
        this.validateBoard();
    }
    getCells() {
        return this.cells;
    }
    public isInBounds(x: number, y: number) {
        return 0 <= x && x < this.mapSize
            && 0 <= y && y < this.mapSize;
    }
    public getCellState(x: number, y: number) {
        return this.cells[HashiUtils.coordsToIndex(x,y,this.mapSize)];
    }
    public isCurrent(x: number, y: number) {
        return this.lastConnected.has(HashiUtils.coordsToIndex(x,y,this.mapSize));
    }
    public isError(x: number, y: number) {
        return this.errors.has(HashiUtils.coordsToIndex(x,y,this.mapSize));
    }
    public isConnectedToCrossed(x: number, y: number) {
        let state = this.getCellState(x, y);
        if (!HashiUtils.isBridge(state)) return false;
        if (HashiUtils.isVertical(state)) {
            let top = this.findFirst(x, y, 0, -1, HashiUtils.isCell, s=>s == state);
            if (top != null && HashiUtils.isCrossedCell(this.getCellState(top[0], top[1]))) return true;
            let bottom = this.findFirst(x, y, 0, +1, HashiUtils.isCell, s=>s == state);
            if (bottom != null && HashiUtils.isCrossedCell(this.getCellState(bottom[0], bottom[1]))) return true;
        } else {
            let left = this.findFirst(x, y, -1, 0, HashiUtils.isCell, s=>s == state);
            if (left != null && HashiUtils.isCrossedCell(this.getCellState(left[0], left[1]))) return true;
            let right = this.findFirst(x, y, +1, 0, HashiUtils.isCell, s=>s == state);
            if (right != null && HashiUtils.isCrossedCell(this.getCellState(right[0], right[1]))) return true;
        }
        return false;
    }
    public isLastChange(x: number, y: number) {
        let i = HashiUtils.coordsToIndex(x,y,this.mapSize);
        return this.lastChanges.find(e => e[0] == i) !== undefined;
    }

    public setCellState(x: number, y: number, newState: HashiCellState, changes: HashiCellChange[]) {
        let index = HashiUtils.coordsToIndex(x,y,this.mapSize);
        this.cells[index] = newState;
        changes.push([index, newState]);
    }

    private findFirst(x: number, y: number, xDiff: number, yDiff: number, predicate: (state: HashiCellState) => boolean=state=>HashiUtils.isCell(state), continuePredicate: (state: HashiCellState) => boolean=state=>true): [number,number] | null {
        while (this.isInBounds(x,y)) {
            let state = this.getCellState(x, y);
            if (predicate(state)) return [x,y];
            if (!continuePredicate(state)) return null;

            x += xDiff;
            y += yDiff;
        }
        return null;
    }
    private makeHorizontalBridge(x: number, y: number, double: boolean, changes: HashiCellChange[]) {
        let left = this.findFirst(x, y, -1, 0);
        if (left == null) return false;

        let right = this.findFirst(x, y, 1, 0);
        if (right == null) return false;

        // Clicked between two cells, check if there are intercepting lines
        for (let xN = left[0]+1; xN < right[0]; xN++) {
            let state = this.getCellState(xN, y);
            if (HashiUtils.isBridge(state)) return false;
        }

        for (let xN = left[0]+1; xN < right[0]; xN++) {
            this.setCellState(xN, y, double ? HashiCellState.BRIDGE_HORIZONTAL_DOUBLE : HashiCellState.BRIDGE_HORIZONTAL, changes);
        }
        return true;
    }
    private makeVerticalBridge(x: number, y: number, double: boolean, changes: HashiCellChange[]) {
        let top = this.findFirst(x, y, 0, -1);
        if (top == null) return false;

        let bottom = this.findFirst(x, y, 0, 1);
        if (bottom == null) return false;

        // Clicked between two cells, check if there are intercepting lines
        for (let yN = top[1]+1; yN < bottom[1]; yN++) {
            let state = this.getCellState(x, yN);
            if (HashiUtils.isBridge(state)) return false;
        }

        for (let yN = top[1]+1; yN < bottom[1]; yN++) {
            this.setCellState(x, yN, double ? HashiCellState.BRIDGE_VERTICAL_DOUBLE : HashiCellState.BRIDGE_VERTICAL, changes);
        }
        return true;
    }
    private clickInner(x: number, y: number, rightClicked: boolean, changes: HashiCellChange[]) {
        let cX = Math.floor(x);
        let cY = Math.floor(y);
        if (!this.isInBounds(cX,cY)) return;
        let state = this.getCellState(cX, cY);
        if (HashiUtils.isCell(state)) {
            // Toggle cell crossed out
            this.setCellState(cX, cY, HashiUtils.toggleCrossedCell(state), changes);
            return;
        }

        if (HashiUtils.isBridge(state)) {
            // Make bridge double or make bridge single
            if (state == HashiCellState.BRIDGE_VERTICAL || state == HashiCellState.BRIDGE_VERTICAL_DOUBLE) {
                let top = this.findFirst(cX, cY, 0, -1);
                if (top == null) throw new Error(`Could not find a Cell above bridge at ${cX};${cY}`);
                let bottom = this.findFirst(cX, cY, 0, 1);
                if (bottom == null) throw new Error(`Could not find a Cell bottom bridge at ${cX};${cY}`);

                let targetState = state == HashiCellState.BRIDGE_VERTICAL
                    ? rightClicked ? HashiCellState.EMPTY           : HashiCellState.BRIDGE_VERTICAL_DOUBLE
                    : rightClicked ? HashiCellState.BRIDGE_VERTICAL : HashiCellState.EMPTY;

                for (let i = top[1]+1; i < bottom[1]; i++) {
                    this.setCellState(cX, i, targetState, changes);
                }
            } else {
                let left = this.findFirst(cX, cY, -1, 0);
                if (left == null) throw new Error(`Could not find a Cell left of bridge at ${cX};${cY}`);
                let right = this.findFirst(cX, cY, 1, 0);
                if (right == null) throw new Error(`Could not find a Cell right of bridge at ${cX};${cY}`);

                let targetState = state == HashiCellState.BRIDGE_HORIZONTAL
                    ? rightClicked ? HashiCellState.EMPTY           : HashiCellState.BRIDGE_HORIZONTAL_DOUBLE
                    : rightClicked ? HashiCellState.BRIDGE_HORIZONTAL : HashiCellState.EMPTY;

                for (let i = left[0]+1; i < right[0]; i++) {
                    this.setCellState(i, cY, targetState, changes);
                }

            }
            return;
        }

        // Create new bridge
        let fractX = x - Math.floor(x);
        let fractY = y - Math.floor(y);
        if (Math.abs(fractX - 0.5) >= Math.abs(fractY - 0.5)) {
            let result = this.makeHorizontalBridge(cX, cY, rightClicked, changes);
            if (result) return;
            this.makeVerticalBridge(cX, cY, rightClicked, changes);
        } else {
            let result = this.makeVerticalBridge(cX, cY, rightClicked, changes);
            if (result) return;
            this.makeHorizontalBridge(cX, cY, rightClicked, changes);
        }
    }
    private tryVisit(x: number, y: number, visited: Set<number>, toVisit: number[], filter?: HashiCellState[]) {
        let i = HashiUtils.coordsToIndex(x,y,this.mapSize);
        let state = this.cells[i];

        if (!this.isInBounds(x,y)) return;
        if (visited.has(i)) return;
        if (filter !== undefined && !filter.includes(state)) return;

        toVisit.push(i);
    }
    private findJoined(startX: number, startY: number) {
        let visited = new Set<number>();
        let connected = new Set<number>();
        let toVisit = [HashiUtils.coordsToIndex(startX,startY,this.mapSize)];
        while (toVisit.length > 0) {
            let i = toVisit.shift()!;
            visited.add(i);

            let state = this.cells[i];
            let [x,y] = HashiUtils.indexToCoords(i, this.mapSize);

            if (HashiUtils.isCell(state)) {
                // Try visit neighboring cells
                this.tryVisit(x-1,y, visited, toVisit, [HashiCellState.BRIDGE_HORIZONTAL, HashiCellState.BRIDGE_HORIZONTAL_DOUBLE]);
                this.tryVisit(x+1,y, visited, toVisit, [HashiCellState.BRIDGE_HORIZONTAL, HashiCellState.BRIDGE_HORIZONTAL_DOUBLE]);
                this.tryVisit(x,y-1, visited, toVisit, [HashiCellState.BRIDGE_VERTICAL, HashiCellState.BRIDGE_VERTICAL_DOUBLE]);
                this.tryVisit(x,y+1, visited, toVisit, [HashiCellState.BRIDGE_VERTICAL, HashiCellState.BRIDGE_VERTICAL_DOUBLE]);
            } else if (HashiUtils.isBridge(state)) {
                if (HashiUtils.isVertical(state)) {
                    this.tryVisit(x,y-1, visited, toVisit);
                    this.tryVisit(x,y+1, visited, toVisit);
                } else {
                    this.tryVisit(x-1,y, visited, toVisit);
                    this.tryVisit(x+1,y, visited, toVisit);
                }
            } else continue;

            connected.add(i);
        }

        return connected;
    }

    public click(x: number, y: number, rightClicked: boolean) {
        let changes: HashiCellChange[] = [];
        console.log((rightClicked ? "right" : "left"), "click at",x,y,", changes:", changes);
        this.clickInner(x,y,rightClicked,changes);

        this.lastChanges.length = 0;
        this.lastChanges.push(...changes);

        let current = this.findJoined(Math.floor(x),Math.floor(y));
        this.lastConnected.clear();
        for (let i of current) this.lastConnected.add(i);

        let validate = this.validateBoard();
        if (validate) {
            console.log("yoo complete");
        }
    }
    private validateBoard(): boolean {
        this.errors.clear();
        let result = true;
        for (let i = 0; i < this.cells.length; i++) {
            let [x, y] = HashiUtils.indexToCoords(i, this.mapSize);
            let state = this.cells[i];

            if (HashiUtils.isCell(state)) {
                let desired = HashiUtils.getDesiredBridgeCount(state);

                let actual = 0;
                actual += HashiUtils.countBridge(this.getCellState(x-1, y), [HashiCellState.BRIDGE_HORIZONTAL, HashiCellState.BRIDGE_HORIZONTAL_DOUBLE]);
                actual += HashiUtils.countBridge(this.getCellState(x+1, y), [HashiCellState.BRIDGE_HORIZONTAL, HashiCellState.BRIDGE_HORIZONTAL_DOUBLE]);
                actual += HashiUtils.countBridge(this.getCellState(x, y-1), [HashiCellState.BRIDGE_VERTICAL, HashiCellState.BRIDGE_VERTICAL_DOUBLE]);
                actual += HashiUtils.countBridge(this.getCellState(x, y+1), [HashiCellState.BRIDGE_VERTICAL, HashiCellState.BRIDGE_VERTICAL_DOUBLE]);
                if (actual > desired) {
                    this.errors.add(i);
                    result = false;
                }
                if (actual < desired) {
                    result = false;
                }
            } else if (HashiUtils.isBridge(state)) {
                if (HashiUtils.isVertical(state)) {
                    let top = this.getCellState(x, y-1);
                    if (!HashiUtils.isCell(top) && top != state) {
                        this.errors.add(i);
                        result = false;
                        continue;
                    }

                    let bottom = this.getCellState(x, y+1);
                    if (!HashiUtils.isCell(bottom) && bottom != state) {
                        this.errors.add(i);
                        result = false;
                        continue;
                    }
                } else {
                    let left = this.getCellState(x-1, y);
                    if (!HashiUtils.isCell(left) && left != state) {
                        this.errors.add(i);
                        result = false;
                        continue;
                    }

                    let right = this.getCellState(x+1, y);
                    if (!HashiUtils.isCell(right) && right != state) {
                        this.errors.add(i);
                        result = false;
                        continue;
                    }
                }
            }
        }
        return result;
    }

    getMapSize() {
        return this.mapSize;
    }
    isValid() {
        return false;
    }
}