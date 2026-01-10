/**
 * SciChart Engine - Testing Utilities
 * 
 * Provides utilities for testing chart applications:
 * - Mock data generators
 * - Chart test harness
 * - Snapshot helpers
 * - Performance benchmarks
 * 
 * @module testing
 */

// ============================================
// Types
// ============================================

export interface MockChartOptions {
  /** Canvas width (default: 800) */
  width?: number;
  /** Canvas height (default: 600) */
  height?: number;
  /** Device pixel ratio (default: 1) */
  devicePixelRatio?: number;
  /** Theme (default: 'dark') */
  theme?: string;
  /** Enable WebGL mock (default: true) */
  mockWebGL?: boolean;
}

export interface WaveformOptions {
  /** Number of points (default: 1000) */
  pointCount?: number;
  /** Amplitude (default: 1) */
  amplitude?: number;
  /** Frequency in Hz (default: 1) */
  frequency?: number;
  /** Phase offset in radians (default: 0) */
  phase?: number;
  /** Noise level (0-1, default: 0) */
  noise?: number;
  /** X start value (default: 0) */
  xStart?: number;
  /** X end value (default: 10) */
  xEnd?: number;
  /** DC offset (default: 0) */
  offset?: number;
}

export interface RandomDataOptions {
  /** Number of points (default: 1000) */
  pointCount?: number;
  /** X range [min, max] (default: [0, 100]) */
  xRange?: [number, number];
  /** Y range [min, max] (default: [-1, 1]) */
  yRange?: [number, number];
  /** Sort by X value (default: true) */
  sorted?: boolean;
  /** Seed for reproducible random (optional) */
  seed?: number;
}

export interface BenchmarkResult {
  /** Average frames per second */
  avgFps: number;
  /** Minimum FPS recorded */
  minFps: number;
  /** Maximum FPS recorded */
  maxFps: number;
  /** Average frame time in ms */
  avgFrameTime: number;
  /** Total frames rendered */
  frameCount: number;
  /** Test duration in ms */
  duration: number;
  /** Points per frame */
  pointsRendered: number;
  /** Points per second throughput */
  throughput: number;
}

export interface BenchmarkOptions {
  /** Duration of benchmark in ms (default: 5000) */
  duration?: number;
  /** Warmup duration in ms (default: 1000) */
  warmup?: number;
  /** Target FPS for assertions (default: 55) */
  targetFps?: number;
  /** Enable console output (default: false) */
  verbose?: boolean;
}

export interface SnapshotOptions {
  /** Output format: 'json' | 'png' | 'canvas' (default: 'json') */
  format?: 'json' | 'png' | 'canvas';
  /** Include data in snapshot (default: false for performance) */
  includeData?: boolean;
  /** Include styles in snapshot (default: true) */
  includeStyles?: boolean;
}

export interface ChartSnapshot {
  /** Snapshot timestamp */
  timestamp: number;
  /** Chart configuration */
  config: Record<string, unknown>;
  /** Series metadata (without data by default) */
  series: {
    id: string;
    type: string;
    pointCount: number;
    style?: Record<string, unknown>;
  }[];
  /** View bounds */
  bounds: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  /** Canvas data URL (if format is 'png') */
  image?: string;
}

// ============================================
// Seeded Random Number Generator
// ============================================

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Mulberry32 PRNG
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

// ============================================
// Data Generators
// ============================================

/**
 * Generate a sine wave
 */
export function generateSineWave(options?: WaveformOptions): {
  x: Float32Array;
  y: Float32Array;
} {
  const opts: Required<WaveformOptions> = {
    pointCount: 1000,
    amplitude: 1,
    frequency: 1,
    phase: 0,
    noise: 0,
    xStart: 0,
    xEnd: 10,
    offset: 0,
    ...options,
  };

  const x = new Float32Array(opts.pointCount);
  const y = new Float32Array(opts.pointCount);
  const dx = (opts.xEnd - opts.xStart) / (opts.pointCount - 1);

  for (let i = 0; i < opts.pointCount; i++) {
    x[i] = opts.xStart + i * dx;
    const baseValue =
      opts.amplitude * Math.sin(2 * Math.PI * opts.frequency * x[i] + opts.phase);
    const noiseValue = opts.noise > 0 ? (Math.random() - 0.5) * 2 * opts.noise : 0;
    y[i] = baseValue + noiseValue + opts.offset;
  }

  return { x, y };
}

/**
 * Generate a square wave
 */
export function generateSquareWave(options?: WaveformOptions): {
  x: Float32Array;
  y: Float32Array;
} {
  const opts: Required<WaveformOptions> = {
    pointCount: 1000,
    amplitude: 1,
    frequency: 1,
    phase: 0,
    noise: 0,
    xStart: 0,
    xEnd: 10,
    offset: 0,
    ...options,
  };

  const x = new Float32Array(opts.pointCount);
  const y = new Float32Array(opts.pointCount);
  const dx = (opts.xEnd - opts.xStart) / (opts.pointCount - 1);

  for (let i = 0; i < opts.pointCount; i++) {
    x[i] = opts.xStart + i * dx;
    const t = x[i] * opts.frequency + opts.phase / (2 * Math.PI);
    const baseValue = Math.sign(Math.sin(2 * Math.PI * t)) * opts.amplitude;
    const noiseValue = opts.noise > 0 ? (Math.random() - 0.5) * 2 * opts.noise : 0;
    y[i] = baseValue + noiseValue + opts.offset;
  }

  return { x, y };
}

/**
 * Generate a sawtooth wave
 */
export function generateSawtoothWave(options?: WaveformOptions): {
  x: Float32Array;
  y: Float32Array;
} {
  const opts: Required<WaveformOptions> = {
    pointCount: 1000,
    amplitude: 1,
    frequency: 1,
    phase: 0,
    noise: 0,
    xStart: 0,
    xEnd: 10,
    offset: 0,
    ...options,
  };

  const x = new Float32Array(opts.pointCount);
  const y = new Float32Array(opts.pointCount);
  const dx = (opts.xEnd - opts.xStart) / (opts.pointCount - 1);

  for (let i = 0; i < opts.pointCount; i++) {
    x[i] = opts.xStart + i * dx;
    const t = x[i] * opts.frequency + opts.phase / (2 * Math.PI);
    const baseValue = opts.amplitude * 2 * (t - Math.floor(t + 0.5));
    const noiseValue = opts.noise > 0 ? (Math.random() - 0.5) * 2 * opts.noise : 0;
    y[i] = baseValue + noiseValue + opts.offset;
  }

  return { x, y };
}

/**
 * Generate a triangle wave
 */
export function generateTriangleWave(options?: WaveformOptions): {
  x: Float32Array;
  y: Float32Array;
} {
  const opts: Required<WaveformOptions> = {
    pointCount: 1000,
    amplitude: 1,
    frequency: 1,
    phase: 0,
    noise: 0,
    xStart: 0,
    xEnd: 10,
    offset: 0,
    ...options,
  };

  const x = new Float32Array(opts.pointCount);
  const y = new Float32Array(opts.pointCount);
  const dx = (opts.xEnd - opts.xStart) / (opts.pointCount - 1);

  for (let i = 0; i < opts.pointCount; i++) {
    x[i] = opts.xStart + i * dx;
    const t = x[i] * opts.frequency + opts.phase / (2 * Math.PI);
    const baseValue = opts.amplitude * 2 * Math.abs(2 * (t - Math.floor(t + 0.5))) - opts.amplitude;
    const noiseValue = opts.noise > 0 ? (Math.random() - 0.5) * 2 * opts.noise : 0;
    y[i] = baseValue + noiseValue + opts.offset;
  }

  return { x, y };
}

/**
 * Generate random data points
 */
export function generateRandomData(options?: RandomDataOptions): {
  x: Float32Array;
  y: Float32Array;
} {
  const opts: Required<RandomDataOptions> = {
    pointCount: 1000,
    xRange: [0, 100],
    yRange: [-1, 1],
    sorted: true,
    seed: Date.now(),
    ...options,
  };

  const rng = new SeededRandom(opts.seed);
  const x = new Float32Array(opts.pointCount);
  const y = new Float32Array(opts.pointCount);

  for (let i = 0; i < opts.pointCount; i++) {
    x[i] = rng.nextRange(opts.xRange[0], opts.xRange[1]);
    y[i] = rng.nextRange(opts.yRange[0], opts.yRange[1]);
  }

  // Sort by X if requested
  if (opts.sorted) {
    const indices = Array.from({ length: opts.pointCount }, (_, i) => i);
    indices.sort((a, b) => x[a] - x[b]);
    
    const sortedX = new Float32Array(opts.pointCount);
    const sortedY = new Float32Array(opts.pointCount);
    
    for (let i = 0; i < opts.pointCount; i++) {
      sortedX[i] = x[indices[i]];
      sortedY[i] = y[indices[i]];
    }
    
    return { x: sortedX, y: sortedY };
  }

  return { x, y };
}

/**
 * Generate a cyclic voltammogram (CV) mock data
 */
export function generateCVData(options?: {
  pointCount?: number;
  vMin?: number;
  vMax?: number;
  cycles?: number;
  peakCurrent?: number;
  noise?: number;
}): { x: Float32Array; y: Float32Array } {
  const opts = {
    pointCount: 2000,
    vMin: -0.5,
    vMax: 0.5,
    cycles: 1,
    peakCurrent: 10e-6, // 10 µA
    noise: 0.02,
    ...options,
  };

  const totalPoints = opts.pointCount * opts.cycles;
  const x = new Float32Array(totalPoints);
  const y = new Float32Array(totalPoints);
  
  const pointsPerCycle = opts.pointCount;
  const halfCycle = pointsPerCycle / 2;

  for (let c = 0; c < opts.cycles; c++) {
    for (let i = 0; i < pointsPerCycle; i++) {
      const idx = c * pointsPerCycle + i;
      
      // Potential sweep
      if (i < halfCycle) {
        x[idx] = opts.vMin + (opts.vMax - opts.vMin) * (i / halfCycle);
      } else {
        x[idx] = opts.vMax - (opts.vMax - opts.vMin) * ((i - halfCycle) / halfCycle);
      }
      
      // Current response (simplified Randles-Sevcik)
      const E = x[idx];
      const E0 = 0; // Formal potential
      const scanDirection = i < halfCycle ? 1 : -1;
      
      // Gaussian-like peak
      const peakWidth = 0.1;
      const exponent = -Math.pow(E - E0, 2) / (2 * peakWidth * peakWidth);
      const peakCurrent = opts.peakCurrent * Math.exp(exponent);
      
      // Add capacitive current and noise
      const capacitive = scanDirection * opts.peakCurrent * 0.1;
      const noiseValue = (Math.random() - 0.5) * 2 * opts.noise * opts.peakCurrent;
      
      y[idx] = scanDirection * peakCurrent + capacitive + noiseValue;
    }
  }

  return { x, y };
}

/**
 * Generate electrochemical impedance spectroscopy (EIS) Nyquist data
 */
export function generateNyquistData(options?: {
  pointCount?: number;
  rSolution?: number;
  rCharge?: number;
  frequency?: [number, number];
}): { x: Float32Array; y: Float32Array } {
  const opts = {
    pointCount: 50,
    rSolution: 100,  // Ohms
    rCharge: 1000,   // Ohms
    frequency: [1e5, 0.01] as [number, number],
    ...options,
  };

  const x = new Float32Array(opts.pointCount);
  const y = new Float32Array(opts.pointCount);
  
  // Logarithmic frequency spacing
  const logFMin = Math.log10(opts.frequency[1]);
  const logFMax = Math.log10(opts.frequency[0]);
  
  for (let i = 0; i < opts.pointCount; i++) {
    const logF = logFMax - (logFMax - logFMin) * (i / (opts.pointCount - 1));
    const omega = 2 * Math.PI * Math.pow(10, logF);
    
    // Simple Randles circuit: Rs + (Rct || CPE)
    const tau = opts.rCharge * 1e-5; // Time constant
    const realPart = opts.rSolution + opts.rCharge / (1 + Math.pow(omega * tau, 2));
    const imagPart = omega * tau * opts.rCharge / (1 + Math.pow(omega * tau, 2));
    
    x[i] = realPart;
    y[i] = -imagPart; // Negative for Nyquist convention
  }

  return { x, y };
}

// ============================================
// Performance Benchmarking
// ============================================

/**
 * Benchmark chart rendering performance
 */
export async function benchmarkRender(
  chart: { render: () => void; getAllSeries: () => { getPointCount: () => number }[] },
  options?: BenchmarkOptions
): Promise<BenchmarkResult> {
  const opts: Required<BenchmarkOptions> = {
    duration: 5000,
    warmup: 1000,
    targetFps: 55,
    verbose: false,
    ...options,
  };

  const fpsHistory: number[] = [];
  const frameTimes: number[] = [];
  let frameCount = 0;
  let lastTime = performance.now();

  // Calculate total points
  const totalPoints = chart
    .getAllSeries()
    .reduce((sum, s) => sum + s.getPointCount(), 0);

  return new Promise((resolve) => {
    const endTime = performance.now() + opts.warmup + opts.duration;
    const warmupEndTime = performance.now() + opts.warmup;
    let recording = false;

    function frame() {
      const now = performance.now();

      if (now >= endTime) {
        // Calculate results
        const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
        const minFps = Math.min(...fpsHistory);
        const maxFps = Math.max(...fpsHistory);
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;

        const result: BenchmarkResult = {
          avgFps: Math.round(avgFps * 100) / 100,
          minFps,
          maxFps,
          avgFrameTime: Math.round(avgFrameTime * 100) / 100,
          frameCount,
          duration: opts.duration,
          pointsRendered: totalPoints,
          throughput: Math.round((totalPoints * avgFps) / 1000) * 1000,
        };

        resolve(result);
        return;
      }

      // Start recording after warmup
      if (now >= warmupEndTime && !recording) {
        recording = true;
        lastTime = now;
        frameCount = 0;
      }

      // Render frame
      chart.render();

      if (recording) {
        const frameTime = now - lastTime;
        frameTimes.push(frameTime);
        frameCount++;

        // Calculate instantaneous FPS every 500ms window
        const recentTimes = frameTimes.slice(-30);
        if (recentTimes.length > 0) {
          const avgRecentTime = recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length;
          fpsHistory.push(1000 / avgRecentTime);
        }
      }

      lastTime = now;
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  });
}

// ============================================
// Snapshot Utilities
// ============================================

/**
 * Create a snapshot of chart state for testing
 */
export function createSnapshot(
  chart: {
    getViewBounds: () => { xMin: number; xMax: number; yMin: number; yMax: number };
    getAllSeries: () => { getId: () => string; getType: () => string; getPointCount: () => number; getStyle: () => Record<string, unknown> }[];
    exportImage?: () => string;
  },
  options?: SnapshotOptions
): ChartSnapshot {
  const opts: Required<SnapshotOptions> = {
    format: 'json',
    includeData: false,
    includeStyles: true,
    ...options,
  };

  const series = chart.getAllSeries().map((s) => ({
    id: s.getId(),
    type: s.getType(),
    pointCount: s.getPointCount(),
    ...(opts.includeStyles ? { style: s.getStyle() } : {}),
  }));

  const snapshot: ChartSnapshot = {
    timestamp: Date.now(),
    config: {},
    series,
    bounds: chart.getViewBounds(),
  };

  if (opts.format === 'png' && chart.exportImage) {
    snapshot.image = chart.exportImage();
  }

  return snapshot;
}

/**
 * Compare two snapshots for equality
 */
export function compareSnapshots(
  a: ChartSnapshot,
  b: ChartSnapshot,
  tolerance: number = 1e-6
): {
  equal: boolean;
  differences: string[];
} {
  const differences: string[] = [];

  // Compare series count
  if (a.series.length !== b.series.length) {
    differences.push(`Series count: ${a.series.length} vs ${b.series.length}`);
  }

  // Compare series metadata
  for (let i = 0; i < Math.min(a.series.length, b.series.length); i++) {
    const sa = a.series[i];
    const sb = b.series[i];

    if (sa.id !== sb.id) {
      differences.push(`Series[${i}] id: "${sa.id}" vs "${sb.id}"`);
    }
    if (sa.type !== sb.type) {
      differences.push(`Series[${i}] type: "${sa.type}" vs "${sb.type}"`);
    }
    if (sa.pointCount !== sb.pointCount) {
      differences.push(`Series[${i}] pointCount: ${sa.pointCount} vs ${sb.pointCount}`);
    }
  }

  // Compare bounds with tolerance
  const boundsKeys: (keyof ChartSnapshot['bounds'])[] = ['xMin', 'xMax', 'yMin', 'yMax'];
  for (const key of boundsKeys) {
    if (Math.abs(a.bounds[key] - b.bounds[key]) > tolerance) {
      differences.push(`Bounds.${key}: ${a.bounds[key]} vs ${b.bounds[key]}`);
    }
  }

  return {
    equal: differences.length === 0,
    differences,
  };
}

// ============================================
// Test Assertions
// ============================================

/**
 * Assert that a benchmark meets performance requirements
 */
export function assertPerformance(
  result: BenchmarkResult,
  requirements: {
    minFps?: number;
    maxFrameTime?: number;
    minThroughput?: number;
  }
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  if (requirements.minFps && result.avgFps < requirements.minFps) {
    failures.push(`FPS ${result.avgFps} < required ${requirements.minFps}`);
  }

  if (requirements.maxFrameTime && result.avgFrameTime > requirements.maxFrameTime) {
    failures.push(`Frame time ${result.avgFrameTime}ms > required ${requirements.maxFrameTime}ms`);
  }

  if (requirements.minThroughput && result.throughput < requirements.minThroughput) {
    failures.push(`Throughput ${result.throughput} < required ${requirements.minThroughput}`);
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

/**
 * Wait for a number of animation frames
 */
export function waitForFrames(count: number = 1): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    function tick() {
      remaining--;
      if (remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  });
}

/**
 * Wait for a specified duration
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
