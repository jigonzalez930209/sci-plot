/**
 * Sci Plot - Backpressure Management Module
 * 
 * Provides advanced backpressure handling for streaming data:
 * - Configurable buffer limits
 * - Multiple overflow strategies (drop-oldest, pause, sample)
 * - Health monitoring and metrics
 * - Automatic flow control
 * 
 * @module backpressure
 */

import type { DataPoint } from "./types";

// ============================================
// Types
// ============================================

export type OverflowStrategy = 'drop-oldest' | 'drop-newest' | 'pause' | 'sample' | 'block';

export interface BackpressureConfig {
  /** Maximum buffer size before triggering backpressure (default: 10000) */
  maxBuffer: number;
  /** Warning threshold as fraction of maxBuffer (default: 0.7) */
  warningThreshold?: number;
  /** Critical threshold as fraction of maxBuffer (default: 0.9) */
  criticalThreshold?: number;
  /** Overflow handling strategy (default: 'drop-oldest') */
  strategy: OverflowStrategy;
  /** For 'sample' strategy: keep every Nth point (default: 2) */
  sampleRate?: number;
  /** Callback when pressure level changes */
  onPressure?: (stats: PressureStats) => void;
  /** Callback when buffer overflows */
  onOverflow?: (droppedCount: number) => void;
  /** Callback when back to normal */
  onRecovery?: () => void;
}

export interface PressureStats {
  /** Current buffer fill level (0-1) */
  fillLevel: number;
  /** Pressure state */
  state: 'normal' | 'warning' | 'critical' | 'overflow';
  /** Current buffer size */
  bufferSize: number;
  /** Maximum buffer size */
  maxBuffer: number;
  /** Points dropped due to overflow */
  droppedCount: number;
  /** Points sampled/skipped */
  sampledCount: number;
  /** Incoming rate (points per second) */
  incomingRate: number;
  /** Outgoing rate (points per second) */
  outgoingRate: number;
  /** Whether stream is paused due to backpressure */
  isPaused: boolean;
}

export interface BufferHealth {
  /** Overall health score (0-100) */
  score: number;
  /** Health status */
  status: 'healthy' | 'degraded' | 'critical';
  /** Recommendations */
  recommendations: string[];
}

// ============================================
// Circular Buffer Implementation
// ============================================

export class CircularBuffer<T> {
  private buffer: T[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Add item to buffer
   * @returns true if item was added, false if buffer was full
   */
  push(item: T): boolean {
    if (this.count === this.capacity) {
      return false;
    }
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    return true;
  }

  /**
   * Add item, overwriting oldest if full
   * @returns the overwritten item, or undefined
   */
  pushOverwrite(item: T): T | undefined {
    let overwritten: T | undefined;
    if (this.count === this.capacity) {
      overwritten = this.buffer[this.head];
      this.head = (this.head + 1) % this.capacity;
      this.count--;
    }
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    return overwritten;
  }

  /**
   * Remove and return oldest item
   */
  shift(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }
    const item = this.buffer[this.head];
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return item;
  }

  /**
   * Remove and return multiple items
   */
  shiftMany(n: number): T[] {
    const result: T[] = [];
    const toRemove = Math.min(n, this.count);
    for (let i = 0; i < toRemove; i++) {
      result.push(this.buffer[this.head]);
      this.head = (this.head + 1) % this.capacity;
    }
    this.count -= toRemove;
    return result;
  }

  /**
   * Peek at oldest item without removing
   */
  peek(): T | undefined {
    return this.count > 0 ? this.buffer[this.head] : undefined;
  }

  /**
   * Get all items as array
   */
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    for (let i = 0; i < this.count; i++) {
      result.push(this.buffer[current]);
      current = (current + 1) % this.capacity;
    }
    return result;
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  /**
   * Get current size
   */
  size(): number {
    return this.count;
  }

  /**
   * Check if buffer is full
   */
  isFull(): boolean {
    return this.count === this.capacity;
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Get fill level (0-1)
   */
  fillLevel(): number {
    return this.count / this.capacity;
  }

  /**
   * Get capacity
   */
  getCapacity(): number {
    return this.capacity;
  }
}

// ============================================
// Backpressure Manager
// ============================================

export class BackpressureManager {
  private config: Required<BackpressureConfig>;
  private buffers: Map<string, CircularBuffer<DataPoint>> = new Map();
  private stats: Map<string, { dropped: number; sampled: number; lastIncoming: number; lastOutgoing: number }> = new Map();
  private paused: boolean = false;
  private sampleCounter: number = 0;

  // Rate tracking
  private incomingHistory: number[] = [];
  private outgoingHistory: number[] = [];
  private lastRateUpdate: number = 0;
  private currentIncoming: number = 0;
  private currentOutgoing: number = 0;

  constructor(config: BackpressureConfig) {
    this.config = {
      warningThreshold: 0.7,
      criticalThreshold: 0.9,
      sampleRate: 2,
      onPressure: undefined,
      onOverflow: undefined,
      onRecovery: undefined,
      ...config,
    } as Required<BackpressureConfig>;
  }

  /**
   * Add points to the buffer with backpressure handling
   */
  push(seriesId: string, points: DataPoint[]): number {
    if (!this.buffers.has(seriesId)) {
      this.buffers.set(seriesId, new CircularBuffer(this.config.maxBuffer));
      this.stats.set(seriesId, { dropped: 0, sampled: 0, lastIncoming: 0, lastOutgoing: 0 });
    }

    const buffer = this.buffers.get(seriesId)!;
    const stats = this.stats.get(seriesId)!;
    let added = 0;
    let dropped = 0;

    for (const point of points) {
      this.currentIncoming++;
      stats.lastIncoming = Date.now();

      // Handle based on strategy when buffer is under pressure
      if (buffer.fillLevel() >= this.config.criticalThreshold) {
        switch (this.config.strategy) {
          case 'drop-oldest':
            // Overwrite oldest points
            const overwritten = buffer.pushOverwrite(point);
            if (overwritten) {
              dropped++;
              stats.dropped++;
            }
            added++;
            break;

          case 'drop-newest':
            // Skip new points
            dropped++;
            stats.dropped++;
            continue;

          case 'pause':
            // Signal pause (external handling required)
            this.paused = true;
            return added;

          case 'sample':
            // Keep every Nth point
            this.sampleCounter++;
            if (this.sampleCounter >= this.config.sampleRate) {
              this.sampleCounter = 0;
              buffer.pushOverwrite(point);
              added++;
            } else {
              stats.sampled++;
            }
            break;

          case 'block':
            // Block until buffer has space
            if (!buffer.isFull()) {
              buffer.push(point);
              added++;
            }
            break;
        }
      } else {
        // Normal operation
        if (buffer.push(point)) {
          added++;
        } else {
          // Shouldn't happen in normal operation
          buffer.pushOverwrite(point);
          added++;
          dropped++;
          stats.dropped++;
        }
      }
    }

    // Track drops
    if (dropped > 0) {
      this.config.onOverflow?.(dropped);
    }

    // Check and report pressure state
    this.checkPressure(seriesId);
    this.updateRates();

    return added;
  }

  /**
   * Consume points from buffer
   */
  consume(seriesId: string, count?: number): DataPoint[] {
    const buffer = this.buffers.get(seriesId);
    if (!buffer) return [];

    const stats = this.stats.get(seriesId)!;
    const toConsume = count ?? buffer.size();
    const points = buffer.shiftMany(toConsume);

    this.currentOutgoing += points.length;
    stats.lastOutgoing = Date.now();

    // Check for recovery from paused state
    if (this.paused && buffer.fillLevel() < this.config.warningThreshold) {
      this.paused = false;
      this.config.onRecovery?.();
    }

    this.updateRates();
    return points;
  }

  /**
   * Consume all points from buffer
   */
  consumeAll(seriesId: string): DataPoint[] {
    return this.consume(seriesId);
  }

  /**
   * Get current pressure stats for a series
   */
  getPressureStats(seriesId: string): PressureStats {
    const buffer = this.buffers.get(seriesId);
    const stats = this.stats.get(seriesId);

    if (!buffer || !stats) {
      return {
        fillLevel: 0,
        state: 'normal',
        bufferSize: 0,
        maxBuffer: this.config.maxBuffer,
        droppedCount: 0,
        sampledCount: 0,
        incomingRate: 0,
        outgoingRate: 0,
        isPaused: false,
      };
    }

    const fillLevel = buffer.fillLevel();
    let state: PressureStats['state'] = 'normal';
    if (fillLevel >= this.config.criticalThreshold) {
      state = buffer.isFull() ? 'overflow' : 'critical';
    } else if (fillLevel >= this.config.warningThreshold) {
      state = 'warning';
    }

    return {
      fillLevel,
      state,
      bufferSize: buffer.size(),
      maxBuffer: this.config.maxBuffer,
      droppedCount: stats.dropped,
      sampledCount: stats.sampled,
      incomingRate: this.getAverageRate(this.incomingHistory),
      outgoingRate: this.getAverageRate(this.outgoingHistory),
      isPaused: this.paused,
    };
  }

  /**
   * Get aggregate stats for all series
   */
  getGlobalStats(): PressureStats {
    let totalSize = 0;
    let totalDropped = 0;
    let totalSampled = 0;

    for (const [seriesId] of this.buffers) {
      const buffer = this.buffers.get(seriesId)!;
      const stats = this.stats.get(seriesId)!;
      totalSize += buffer.size();
      totalDropped += stats.dropped;
      totalSampled += stats.sampled;
    }

    const maxTotal = this.config.maxBuffer * this.buffers.size;
    const fillLevel = maxTotal > 0 ? totalSize / maxTotal : 0;

    let state: PressureStats['state'] = 'normal';
    if (fillLevel >= this.config.criticalThreshold) {
      state = 'critical';
    } else if (fillLevel >= this.config.warningThreshold) {
      state = 'warning';
    }

    return {
      fillLevel,
      state,
      bufferSize: totalSize,
      maxBuffer: maxTotal,
      droppedCount: totalDropped,
      sampledCount: totalSampled,
      incomingRate: this.getAverageRate(this.incomingHistory),
      outgoingRate: this.getAverageRate(this.outgoingHistory),
      isPaused: this.paused,
    };
  }

  /**
   * Get buffer health assessment
   */
  getHealth(): BufferHealth {
    const stats = this.getGlobalStats();
    const recommendations: string[] = [];
    let score = 100;

    // Deduct for fill level
    if (stats.fillLevel > 0.9) {
      score -= 40;
      recommendations.push('Buffer critically full - reduce data rate or increase buffer size');
    } else if (stats.fillLevel > 0.7) {
      score -= 20;
      recommendations.push('Buffer filling up - consider increasing consumption rate');
    }

    // Deduct for drops
    if (stats.droppedCount > 0) {
      const dropRate = stats.droppedCount / (stats.droppedCount + stats.bufferSize + 1);
      score -= Math.min(30, dropRate * 100);
      recommendations.push(`Data being dropped (${stats.droppedCount} points) - buffer overflow`);
    }

    // Deduct for rate imbalance
    if (stats.incomingRate > stats.outgoingRate * 1.5) {
      score -= 15;
      recommendations.push('Incoming rate exceeds processing rate - consider sampling or throttling');
    }

    // Deduct for pause state
    if (stats.isPaused) {
      score -= 25;
      recommendations.push('Stream paused due to backpressure');
    }

    let status: BufferHealth['status'] = 'healthy';
    if (score < 50) {
      status = 'critical';
    } else if (score < 75) {
      status = 'degraded';
    }

    return {
      score: Math.max(0, score),
      status,
      recommendations,
    };
  }

  /**
   * Check if paused due to backpressure
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Resume if paused
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * Clear all buffers
   */
  clear(seriesId?: string): void {
    if (seriesId) {
      this.buffers.get(seriesId)?.clear();
      const stats = this.stats.get(seriesId);
      if (stats) {
        stats.dropped = 0;
        stats.sampled = 0;
      }
    } else {
      for (const buffer of this.buffers.values()) {
        buffer.clear();
      }
      for (const stats of this.stats.values()) {
        stats.dropped = 0;
        stats.sampled = 0;
      }
    }
    this.paused = false;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BackpressureConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get current configuration
   */
  getConfig(): BackpressureConfig {
    return { ...this.config };
  }

  // ============================================
  // Private Methods
  // ============================================

  private checkPressure(seriesId: string): void {
    const stats = this.getPressureStats(seriesId);
    this.config.onPressure?.(stats);
  }

  private updateRates(): void {
    const now = Date.now();
    const elapsed = now - this.lastRateUpdate;

    // Update every second
    if (elapsed >= 1000) {
      this.incomingHistory.push(this.currentIncoming);
      this.outgoingHistory.push(this.currentOutgoing);

      // Keep last 10 seconds
      if (this.incomingHistory.length > 10) this.incomingHistory.shift();
      if (this.outgoingHistory.length > 10) this.outgoingHistory.shift();

      this.currentIncoming = 0;
      this.currentOutgoing = 0;
      this.lastRateUpdate = now;
    }
  }

  private getAverageRate(history: number[]): number {
    if (history.length === 0) return 0;
    return history.reduce((a, b) => a + b, 0) / history.length;
  }
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Create a backpressure manager with default settings
 */
export function createBackpressureManager(
  maxBuffer: number = 10000,
  strategy: OverflowStrategy = 'drop-oldest'
): BackpressureManager {
  return new BackpressureManager({ maxBuffer, strategy });
}

/**
 * Create a high-performance backpressure manager optimized for real-time
 */
export function createRealtimeBackpressure(
  maxBuffer: number = 50000
): BackpressureManager {
  return new BackpressureManager({
    maxBuffer,
    strategy: 'drop-oldest',
    warningThreshold: 0.8,
    criticalThreshold: 0.95,
  });
}

/**
 * Create a lossless backpressure manager (for when data loss is unacceptable)
 */
export function createLosslessBackpressure(
  maxBuffer: number = 100000
): BackpressureManager {
  return new BackpressureManager({
    maxBuffer,
    strategy: 'pause',
    warningThreshold: 0.6,
    criticalThreshold: 0.8,
  });
}
