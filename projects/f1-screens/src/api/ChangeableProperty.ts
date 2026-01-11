import Utils from "../../../../common/Utils";

export default class ChangeableProperty<T> {
    private parent?: ChangeableProperty<any>;
    private last: T;
    private current: T;
    private changeTime: number;
    private changeDuration: number;

    private children: ChildEntry<T,any>[];

    constructor(value: T, changeDuration: number) {
        this.last = value;
        this.current = value;

        this.changeTime = changeDuration;
        this.changeDuration = changeDuration;

        this.children = [];
    }

    getLastValue() {
        return this.last;
    }

    getCurrentValue() {
        return this.current;
    }

    getChangeTime() {
        return this.changeTime;
    }

    getChangeDuration() {
        return this.changeDuration;
    }

    getActiveValue() {
        let a = this.getDelta() / this.getChangeDuration();
        if (a > 0.5) return this.current;
        return this.last;
    }

    getDelta() {
        return Utils.clamp(ChangeableProperty.now - this.changeTime, 0, this.changeDuration);
    }

    isChanging() {
        return ChangeableProperty.now - this.changeTime < this.changeDuration;
    }

    asVec4(): [T, T, number, number] {
        return [this.getLastValue(), this.getCurrentValue(), this.getDelta(), this.getChangeDuration()];
    }

    checkValue(filter: (value: T)=>boolean) {
        if (this.isChanging()) {
            return filter(this.current) || filter(this.last);
        }
        return filter(this.current);
    }

    setValue(target: T) {
        if (this.isChanging()) {
            /*
            if (this.last == target) {
                let sinceStart = (ChangeableProperty.now - this.changeTime);
                let deltaFlipped = this.changeDuration-sinceStart;
                this.last = this.current;
                this.changeTime = ChangeableProperty.now - deltaFlipped;
                this.current = target;
                //[this.oldComponents, this.newComponents] = [this.newComponents, this.oldComponents!];
                //console.log(`Quick mode switch from ${mode.last} to ${mode.current} (sinceStart: ${sinceStart} delta: ${deltaFlipped})`);
            }
            */
            return;
        }
        if (target == this.current) return;

        this.last = this.current;
        this.current = target;
        this.changeTime = ChangeableProperty.now;

        for (let child of this.children) {
            let converted = child.convert(this.current);
            if (converted == child.property.current) continue;
            console.log("diff", child.property.current, this.last, "->", this.current, converted);

            child.property.last = child.property.current;
            child.property.current = converted;

            child.property.changeTime = this.changeTime;
            child.property.changeDuration = this.changeDuration;
        }
    }

    overwrite(target: T) {
        this.last = this.current;
        this.current = target;
        this.changeTime = ChangeableProperty.now - this.changeDuration;
    }

    createDerived<R>(func: (value: T, prev?: R)=>R): ChangeableProperty<R> {
        let currentConverted = func(this.current);
        let prop = new ChangeableProperty(currentConverted, this.changeDuration);
        this.children.push({
            property: prop,
            convert: func
        });
        prop.parent = this;
        prop.last = func(this.last);
        prop.current = currentConverted;
        prop.changeTime = this.changeTime;
        prop.changeDuration = this.changeDuration;
        return prop;
    }

    dispose() {
        for (let child of this.children) {
            child.property.dispose();
        }
        if (this.parent) {
            this.parent.children = this.parent.children.filter(e=>e.property != this);
        }
    }

    private static now = 0;
    public static setNow(value: number) {
        ChangeableProperty.now = value;
    }

}
interface ChildEntry<T,R> {
    property: ChangeableProperty<any>,
    convert: (value: T, last?: R)=>R
}