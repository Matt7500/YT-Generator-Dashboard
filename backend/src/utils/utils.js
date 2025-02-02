class FixedSizeQueue {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.items = [];
    }

    push(item) {
        this.items.push(item);
        if (this.items.length > this.maxSize) {
            this.items.shift();
        }
    }

    get length() {
        return this.items.length;
    }

    clear() {
        this.items = [];
    }
}

export { FixedSizeQueue }; 