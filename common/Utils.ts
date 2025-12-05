export default class Utils {
    public static getCaretCharacterOffsetWithin(element: HTMLElement) {
        let caretOffset = 0;
        let doc = element.ownerDocument;
        let win = doc.defaultView!;
        let sel = win.getSelection()!;
        if (sel.rangeCount > 0) {
            let range = win.getSelection()!.getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
        return caretOffset;
    }

    /**
     * Performs a binary search on the specified ordered array for the specified element.
     * The element being searched is a property of an element in the array.
     * If the object is found within the array, the index of the element is returned.
     *
     * Let x be the position at which the element should be placed in the array.
     * If the object is not found within the array, this method will return -(x + 1).
     * @param array the ordered array to search
     * @param element the element to search for
     * @param compareFunction the function to use for comparing elements
     * @param convertFunction the function to use to convert an array element to the searched type
     * @returns the index of the element, or the insertion index
     */
    public static binarySearch2<T,K>(array: Array<T>, element: K, convertFunction: (element: T)=>K, compareFunction: (a: K, b: K) => number): number {
        let m = 0;
        let n = array.length - 1;
        while (m <= n) {
            let k = (n + m) >> 1;
            let cmp = compareFunction(element, convertFunction(array[k]));
            if (cmp > 0) {
                m = k + 1;
            } else if(cmp < 0) {
                n = k - 1;
            } else {
                return k;
            }
        }
        return -m - 1;
    }

    public static interpolate(from: number, to: number, percentage: number) {
        return from + (to - from) * percentage;
    }

    public static loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject)=>{
            let img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = ()=>{
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    static clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max);
    }
}