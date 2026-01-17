/**
 * @fileoverview Worker Pool Manager for Offscreen Rendering
 * @module plugins/offscreen/pool
 */

export interface WorkerTask {
  id: string;
  priority: number;
  timestamp: number;
  resolve: (value: ImageBitmap) => void;
  reject: (error: Error) => void;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Set<number> = new Set();
  private taskQueue: WorkerTask[] = [];
  private activeJobs: Map<string, number> = new Map(); // taskId => workerIndex

  constructor(private size: number) {
    this.initialize();
  }

  private initialize(): void {
    const workerCode = `
      // Simple offscreen worker
      self.onmessage = (e) => {
        const { type, width, height, dpr } = e.data;
        
        if (type === 'render') {
          // Echo back - actual rendering logic would go here
          self.postMessage({ type: 'response', taskId: e.data.taskId });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    for (let i = 0; i < this.size; i++) {
      try {
        const worker = new Worker(workerUrl);
        worker.onmessage = (e) => this.handleWorkerMessage(i, e);
        worker.onerror = (e) => this.handleWorkerError(i, e);
        this.workers.push(worker);
        this.availableWorkers.add(i);
      } catch (error) {
        console.error(`Failed to create worker ${i}:`, error);
      }
    }

    URL.revokeObjectURL(workerUrl);
  }

  private handleWorkerMessage(workerIndex: number, event: MessageEvent): void {
    const { type, taskId, imageData, error } = event.data;

    if (type === 'response') {
      const task = this.findTask(taskId);
      if (task) {
        if (error) {
          task.reject(new Error(error));
        } else if (imageData) {
          task.resolve(imageData);
        }
        this.activeJobs.delete(taskId);
        this.availableWorkers.add(workerIndex);
        this.processQueue();
      }
    }
  }

  private handleWorkerError(workerIndex: number, error: ErrorEvent): void {
    console.error(`Worker ${workerIndex} error:`, error);
    // Find and reject any active task for this worker
    for (const [taskId, wIndex] of this.activeJobs.entries()) {
      if (wIndex === workerIndex) {
        const task = this.findTask(taskId);
        if (task) {
          task.reject(new Error(`Worker error: ${error.message}`));
          this.activeJobs.delete(taskId);
        }
      }
    }
    this.availableWorkers.add(workerIndex);
    this.processQueue();
  }

  private findTask(taskId: string): WorkerTask | undefined {
    return this.taskQueue.find(t => t.id === taskId);
  }

  private processQueue(): void {
    while (this.availableWorkers.size > 0 && this.taskQueue.length > 0) {
      // Sort by priority and timestamp
      this.taskQueue.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.timestamp - b.timestamp;
      });

      const task = this.taskQueue.shift();
      if (!task) break;

      const workerIndex = Array.from(this.availableWorkers)[0];
      this.availableWorkers.delete(workerIndex);
      this.activeJobs.set(task.id, workerIndex);

      // Send task to worker
      this.workers[workerIndex].postMessage({
        type: 'render',
        taskId: task.id,
      });
    }
  }

  public submit(priority: number = 0): Promise<ImageBitmap> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: Math.random().toString(36).substring(7),
        priority,
        timestamp: Date.now(),
        resolve,
        reject,
      };

      this.taskQueue.push(task);
      this.processQueue();
    });
  }

  public getStats() {
    return {
      total: this.workers.length,
      active: this.activeJobs.size,
      idle: this.availableWorkers.size,
      queued: this.taskQueue.length,
    };
  }

  public destroy(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.availableWorkers.clear();
    this.taskQueue = [];
    this.activeJobs.clear();
  }
}
