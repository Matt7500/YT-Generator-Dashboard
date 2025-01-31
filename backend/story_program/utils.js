class FixedSizeQueue {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.items = [];
    }

    push(item) {
        if (this.items.length >= this.maxSize) {
            this.items.shift(); // Remove the oldest item
        }
        this.items.push(item);
    }

    join(separator) {
        return this.items.join(separator);
    }

    get length() {
        return this.items.length;
    }

    clear() {
        this.items = [];
    }
}

module.exports = {
    FixedSizeQueue
}; 