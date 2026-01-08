/**
 * Chart Initialization Queue
 * 
 * Internal system that manages sequential initialization of multiple charts.
 * This is automatically integrated into createChart - no external usage needed.
 */

interface QueueItem {
    id: string;
    execute: () => void;
}

class ChartInitQueueInternal {
    private queue: QueueItem[] = [];
    private isProcessing = false;
    private completedCount = 0;
    private currentChartId: string | null = null;
    private idCounter = 0;

    // Delay between chart initializations (ms)
    private readonly INIT_DELAY = 30;

    /**
     * Generate a unique chart ID
     */
    generateId(): string {
        return `chart_${++this.idCounter}_${Date.now().toString(36)}`;
    }

    /**
     * Add a chart initialization to the queue
     * Returns a promise that resolves when this specific chart can initialize
     */
    enqueue(): Promise<string> {
        const id = this.generateId();

        return new Promise((resolve) => {
            this.queue.push({
                id,
                execute: () => resolve(id),
            });

            // Start processing if not already
            if (!this.isProcessing) {
                this.processNext();
            }
        });
    }

    /**
     * Mark a chart as fully initialized
     * This allows the next chart in queue to proceed
     */
    markComplete(id: string): void {
        if (this.currentChartId === id) {
            this.completedCount++;
            this.currentChartId = null;

            // Small delay before processing next chart
            setTimeout(() => this.processNext(), this.INIT_DELAY);
        }
    }

    /**
     * Process the next chart in queue
     */
    private processNext(): void {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            this.currentChartId = null;
            return;
        }

        this.isProcessing = true;
        const item = this.queue.shift()!;
        this.currentChartId = item.id;

        // Execute the initialization callback
        item.execute();
    }

    /**
     * Get current queue status
     */
    getStatus(): { pending: number; completed: number; currentId: string | null; isProcessing: boolean } {
        return {
            pending: this.queue.length,
            completed: this.completedCount,
            currentId: this.currentChartId,
            isProcessing: this.isProcessing,
        };
    }

    /**
     * Clear the queue (useful for page navigation)
     */
    clear(): void {
        this.queue = [];
        this.isProcessing = false;
        this.currentChartId = null;
    }

    /**
     * Reset the queue completely
     */
    reset(): void {
        this.clear();
        this.completedCount = 0;
        this.idCounter = 0;
    }
}

// Singleton instance - internal use only
const globalQueue = new ChartInitQueueInternal();

/**
 * Internal: Wait for turn in initialization queue
 * Returns the assigned chart ID
 */
export function waitForInitTurn(): Promise<string> {
    return globalQueue.enqueue();
}

/**
 * Internal: Mark chart initialization as complete
 */
export function markInitComplete(id: string): void {
    globalQueue.markComplete(id);
}

/**
 * Get queue status (for debugging)
 */
export function getInitQueueStatus() {
    return globalQueue.getStatus();
}

/**
 * Reset the queue (call on page navigation if needed)
 */
export function resetInitQueue(): void {
    globalQueue.reset();
}

// Legacy exports for backwards compatibility
export class ChartInitQueue {
    private static instance = globalQueue;

    static getStatus() {
        return this.instance.getStatus();
    }

    static reset() {
        this.instance.reset();
    }
}

export function getChartInitQueue() {
    return {
        getStatus: () => globalQueue.getStatus(),
        reset: () => globalQueue.reset(),
    };
}

// Legacy compatibility - now does nothing as queue is automatic
export async function queueChartInit(_id: string, fn: () => Promise<void>): Promise<void> {
    await fn();
}

export function waitForAnimations(durationMs: number = 200): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, durationMs));
}

export function resetChartQueue(): void {
    globalQueue.reset();
}
