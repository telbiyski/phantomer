function Queue(worker) {
    this.worker = worker;
    this._queue = [];
    this.running = false;
}

Queue.prototype.push = function (obj) {
    this._queue.push(obj);
    this.process();
};

Queue.prototype.process = function () {
    if (this.running || this._queue.length === 0) return;
    this.running = true;
    this.worker(this._queue.shift(), () => {
        this.running = false;
        this.process();
    });
};

module.exports = Queue;
