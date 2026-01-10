/**
 * Animation Engine
 * 
 * Provides smooth, performant animations for chart transitions
 * including zoom, pan, data updates, and custom animations.
 */

// ============================================
// Easing Functions
// ============================================

export type EasingFunction = (t: number) => number;

export const easings = {
  /** Linear easing - constant speed */
  linear: (t: number): number => t,

  /** Ease in - starts slow, accelerates */
  easeIn: (t: number): number => t * t,

  /** Ease out - starts fast, decelerates */
  easeOut: (t: number): number => 1 - (1 - t) * (1 - t),

  /** Ease in-out - slow start and end */
  easeInOut: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  /** Cubic ease out - smoother deceleration */
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),

  /** Cubic ease in-out */
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  /** Spring-like bounce at the end */
  spring: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  /** Elastic overshoot */
  elastic: (t: number): number => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : t < 0.5
          ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
          : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  /** Bounce effect */
  bounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
} as const;

export type EasingName = keyof typeof easings;

// ============================================
// Animation Types
// ============================================

export interface AnimationOptions {
  /** Duration in milliseconds */
  duration: number;
  /** Easing function name or custom function */
  easing?: EasingName | EasingFunction;
  /** Callback on each frame with progress 0-1 */
  onUpdate: (progress: number) => void;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Callback if animation is cancelled */
  onCancel?: () => void;
}

export interface AnimationHandle {
  /** Unique animation ID */
  id: string;
  /** Cancel the animation */
  cancel: () => void;
  /** Promise that resolves when animation completes */
  promise: Promise<void>;
  /** Whether animation is currently running */
  isRunning: () => boolean;
}

export interface BoundsAnimation {
  /** Target X range [min, max] */
  xRange?: [number, number];
  /** Target Y range [min, max] */
  yRange?: [number, number];
  /** Duration in ms (default: 300) */
  duration?: number;
  /** Easing function (default: 'easeOutCubic') */
  easing?: EasingName | EasingFunction;
}

// ============================================
// Animation Engine
// ============================================

export class AnimationEngine {
  private animations: Map<string, {
    startTime: number;
    duration: number;
    easingFn: EasingFunction;
    onUpdate: (progress: number) => void;
    onComplete?: () => void;
    onCancel?: () => void;
    resolve: () => void;
    reject: (reason?: any) => void;
  }> = new Map();

  private frameId: number | null = null;
  private idCounter = 0;
  private isDestroyed = false;

  /**
   * Start a new animation
   */
  animate(options: AnimationOptions): AnimationHandle {
    const id = `anim_${++this.idCounter}`;

    const easingFn = typeof options.easing === 'function'
      ? options.easing
      : easings[options.easing || 'easeOutCubic'];

    let resolve: () => void;
    let reject: (reason?: any) => void;

    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    this.animations.set(id, {
      startTime: performance.now(),
      duration: options.duration,
      easingFn,
      onUpdate: options.onUpdate,
      onComplete: options.onComplete,
      onCancel: options.onCancel,
      resolve: resolve!,
      reject: reject!,
    });

    this.ensureLoop();

    return {
      id,
      cancel: () => this.cancel(id),
      promise,
      isRunning: () => this.animations.has(id),
    };
  }

  /**
   * Animate numeric value interpolation
   */
  interpolate(
    from: number,
    to: number,
    options: Omit<AnimationOptions, 'onUpdate'> & {
      onUpdate: (value: number) => void;
    }
  ): AnimationHandle {
    return this.animate({
      ...options,
      onUpdate: (progress) => {
        const value = from + (to - from) * progress;
        options.onUpdate(value);
      },
    });
  }

  /**
   * Animate bounds transition
   */
  animateBounds(
    current: { xMin: number; xMax: number; yMin: number; yMax: number },
    target: BoundsAnimation,
    onUpdate: (bounds: { xMin: number; xMax: number; yMin: number; yMax: number }) => void,
    onComplete?: () => void
  ): AnimationHandle {
    const startBounds = { ...current };
    const targetBounds = {
      xMin: target.xRange ? target.xRange[0] : current.xMin,
      xMax: target.xRange ? target.xRange[1] : current.xMax,
      yMin: target.yRange ? target.yRange[0] : current.yMin,
      yMax: target.yRange ? target.yRange[1] : current.yMax,
    };

    return this.animate({
      duration: target.duration ?? 150, // Was 300
      easing: target.easing ?? 'easeOutCubic',
      onUpdate: (progress) => {
        onUpdate({
          xMin: startBounds.xMin + (targetBounds.xMin - startBounds.xMin) * progress,
          xMax: startBounds.xMax + (targetBounds.xMax - startBounds.xMax) * progress,
          yMin: startBounds.yMin + (targetBounds.yMin - startBounds.yMin) * progress,
          yMax: startBounds.yMax + (targetBounds.yMax - startBounds.yMax) * progress,
        });
      },
      onComplete,
    });
  }

  /**
   * Cancel a specific animation
   */
  cancel(id: string): void {
    const anim = this.animations.get(id);
    if (anim) {
      anim.onCancel?.();
      anim.reject(new Error('Animation cancelled'));
      this.animations.delete(id);
    }
  }

  /**
   * Cancel all running animations
   */
  cancelAll(): void {
    this.animations.forEach((anim) => {
      anim.onCancel?.();
      anim.reject(new Error('Animation cancelled'));
    });
    this.animations.clear();
  }

  /**
   * Check if any animations are running
   */
  isAnimating(): boolean {
    return this.animations.size > 0;
  }

  /**
   * Returns a promise that resolves when all current animations are complete
   */
  async waitForIdle(): Promise<void> {
    if (!this.isAnimating()) return;

    // Wait for all current animations to complete
    const promises = Array.from(this.animations.values()).map(a =>
      // Create a promise from the existing resolve/reject but don't fail if one is cancelled
      new Promise<void>(resolve => {
        const originalResolve = a.resolve;
        a.resolve = () => { originalResolve(); resolve(); };
        const originalReject = a.reject;
        a.reject = (err) => { originalReject(err); resolve(); };
      })
    );

    await Promise.all(promises);

    // Recursive check in case new animations started while waiting
    if (this.isAnimating()) {
      await this.waitForIdle();
    }
  }

  /**
   * Get number of active animations
   */
  getActiveCount(): number {
    return this.animations.size;
  }

  /**
   * Destroy the animation engine
   */
  destroy(): void {
    this.isDestroyed = true;
    this.cancelAll();
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  private ensureLoop(): void {
    if (this.frameId !== null || this.isDestroyed) return;
    this.frameId = requestAnimationFrame(() => this.tick());
  }

  private tick(): void {
    if (this.isDestroyed) return;

    const now = performance.now();
    const completed: string[] = [];

    this.animations.forEach((anim, id) => {
      const elapsed = now - anim.startTime;
      const rawProgress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = anim.easingFn(rawProgress);

      anim.onUpdate(easedProgress);

      if (rawProgress >= 1) {
        completed.push(id);
      }
    });

    // Complete finished animations
    completed.forEach((id) => {
      const anim = this.animations.get(id);
      if (anim) {
        anim.onComplete?.();
        anim.resolve();
        this.animations.delete(id);
      }
    });

    // Continue loop if animations remain
    if (this.animations.size > 0) {
      this.frameId = requestAnimationFrame(() => this.tick());
    } else {
      this.frameId = null;
    }
  }
}

// ============================================
// Animation Configuration
// ============================================

export interface ChartAnimationConfig {
  /** Enable all animations */
  enabled: boolean;
  /** Zoom animation settings */
  zoom: {
    enabled: boolean;
    duration: number;
    easing: EasingName;
  };
  /** Pan animation settings */
  pan: {
    enabled: boolean;
    duration: number;
    easing: EasingName;
  };
  /** Data update animation settings */
  dataUpdate: {
    enabled: boolean;
    duration: number;
    easing: EasingName;
  };
  /** Series entry animation */
  seriesEntry: {
    enabled: boolean;
    duration: number;
    easing: EasingName;
  };
  /** Auto-scale animation */
  autoScale: {
    enabled: boolean;
    duration: number;
    easing: EasingName;
  };
}

export const DEFAULT_ANIMATION_CONFIG: ChartAnimationConfig = {
  enabled: true,
  zoom: {
    enabled: false, // Disabled for more responsive feel
    duration: 100,
    easing: 'easeOutCubic',
  },
  pan: {
    enabled: false, // Usually immediate for responsiveness
    duration: 50,   // Was 100
    easing: 'easeOut',
  },
  dataUpdate: {
    enabled: true,
    duration: 75,   // Was 150
    easing: 'easeOut',
  },
  seriesEntry: {
    enabled: true,
    duration: 200,  // Was 400
    easing: 'easeOutCubic',
  },
  autoScale: {
    enabled: true,
    duration: 150,  // Was 300
    easing: 'easeOutCubic',
  },
};

/**
 * Merge user config with defaults
 */
export function mergeAnimationConfig(
  config?: Partial<ChartAnimationConfig>
): ChartAnimationConfig {
  if (!config) return { ...DEFAULT_ANIMATION_CONFIG };

  return {
    enabled: config.enabled ?? DEFAULT_ANIMATION_CONFIG.enabled,
    zoom: { ...DEFAULT_ANIMATION_CONFIG.zoom, ...config.zoom },
    pan: { ...DEFAULT_ANIMATION_CONFIG.pan, ...config.pan },
    dataUpdate: { ...DEFAULT_ANIMATION_CONFIG.dataUpdate, ...config.dataUpdate },
    seriesEntry: { ...DEFAULT_ANIMATION_CONFIG.seriesEntry, ...config.seriesEntry },
    autoScale: { ...DEFAULT_ANIMATION_CONFIG.autoScale, ...config.autoScale },
  };
}

// Singleton instance for shared use
let sharedEngine: AnimationEngine | null = null;

export function getSharedAnimationEngine(): AnimationEngine {
  if (!sharedEngine) {
    sharedEngine = new AnimationEngine();
  }
  return sharedEngine;
}
