class DOMWatcherClass {
    private observer: MutationObserver;
    private callbacks: Map<string, (mutations: MutationRecord[]) => void>;
    private pauseCount: number = 0;
    private target: Node;
    private options: MutationObserverInit;

    constructor(target: Node, options: MutationObserverInit) {

        this.target = target;
        this.options = options;

        this.callbacks = new Map();
        this.observer = new MutationObserver((mutations) => {
            this.callbacks.forEach((callback) => callback(mutations));
        });
        this.observer.observe(target, options);
    }

    appendCallback(id: string, callback: (mutations: MutationRecord[]) => void) {
        this.callbacks.set(id, callback);
    }

    removeCallback(id: string) {
        this.callbacks.delete(id);
    }

    pause() {
        this.pauseCount++;
        if (this.pauseCount === 1) {
            this.observer.disconnect();
        }
    }

    resume() {
        this.pauseCount = Math.max(0, this.pauseCount - 1);
        if (this.pauseCount === 0) {
            this.observer.observe(this.target, this.options);
        }
    }

    runSilent<T>(fn: () => T): T {
        this.pause();
        try {
            return fn();
        } finally {
            this.resume();
        }
    }

    disconnect() {
        this.observer.disconnect();
        this.callbacks.clear();
    }
}

export const DOMWatcher = new DOMWatcherClass(document.body, { childList: true, subtree: true });