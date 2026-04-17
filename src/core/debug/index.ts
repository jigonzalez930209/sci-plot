/**
 * Sci Plot - Debug Overlay Module
 * 
 * Provides a visual debug overlay showing performance metrics,
 * rendering info, and chart state for development and debugging.
 * 
 * @module debug
 */

// ============================================
// Types
// ============================================

export interface DebugStats {
  /** Current frames per second */
  fps: number;
  /** Average frame time in ms */
  frameTime: number;
  /** Total number of points being rendered */
  pointCount: number;
  /** Number of visible series */
  seriesCount: number;
  /** Current view bounds */
  viewBounds: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  /** WebGL/WebGPU renderer info */
  rendererInfo: {
    type: 'webgl' | 'webgpu' | 'unknown';
    vendor?: string;
    renderer?: string;
  };
  /** Memory usage estimate (bytes) */
  memoryEstimate: number;
  /** Number of draw calls per frame */
  drawCalls: number;
  /** Whether GPU downsampling is active */
  downsamplingActive: boolean;
  /** Device pixel ratio */
  devicePixelRatio: number;
  /** Canvas dimensions */
  canvasSize: { width: number; height: number };
  /** Plot area dimensions */
  plotArea: { x: number; y: number; width: number; height: number };
}

export interface DebugOverlayOptions {
  /** Show FPS counter (default: true) */
  showFps?: boolean;
  /** Show point count (default: true) */
  showPointCount?: boolean;
  /** Show view bounds (default: true) */
  showBounds?: boolean;
  /** Show renderer info (default: true) */
  showRendererInfo?: boolean;
  /** Show memory estimate (default: true) */
  showMemory?: boolean;
  /** Show draw calls (default: true) */
  showDrawCalls?: boolean;
  /** Position: 'top-left', 'top-right', 'bottom-left', 'bottom-right' */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Background opacity (0-1, default: 0.8) */
  opacity?: number;
  /** Font size in pixels (default: 11) */
  fontSize?: number;
  /** Update interval in ms (default: 250) */
  updateInterval?: number;
  /** Custom CSS class name */
  className?: string;
}

// ============================================
// Debug Overlay Implementation
// ============================================

export class DebugOverlay {
  private container: HTMLElement;
  private element: HTMLDivElement | null = null;
  private options: Required<DebugOverlayOptions>;
  private visible: boolean = false;
  private updateIntervalId: number | null = null;
  private statsProvider: (() => Partial<DebugStats>) | null = null;
  private lastStats: Partial<DebugStats> = {};

  // FPS calculation
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;
  private frameTimes: number[] = [];

  constructor(container: HTMLElement, options?: DebugOverlayOptions) {
    this.container = container;
    this.options = {
      showFps: true,
      showPointCount: true,
      showBounds: true,
      showRendererInfo: true,
      showMemory: true,
      showDrawCalls: true,
      position: 'top-left',
      opacity: 0.8,
      fontSize: 11,
      updateInterval: 250,
      className: 'sci-plot-debug-overlay',
      ...options,
    };
  }

  /**
   * Set the stats provider function
   */
  setStatsProvider(provider: () => Partial<DebugStats>): void {
    this.statsProvider = provider;
  }

  /**
   * Record a frame for FPS calculation
   */
  recordFrame(frameTime?: number): void {
    const now = performance.now();
    this.frameCount++;

    if (frameTime !== undefined) {
      this.frameTimes.push(frameTime);
      if (this.frameTimes.length > 60) {
        this.frameTimes.shift();
      }
    }

    // Update FPS every second
    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  /**
   * Show the debug overlay
   */
  show(): void {
    if (this.visible) return;
    
    this.visible = true;
    this.createElement();
    this.startUpdates();
  }

  /**
   * Hide the debug overlay
   */
  hide(): void {
    if (!this.visible) return;
    
    this.visible = false;
    this.stopUpdates();
    this.destroyElement();
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Check if visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Update the display with new stats
   */
  update(stats?: Partial<DebugStats>): void {
    if (!this.visible || !this.element) return;

    // Merge with provider stats
    const providerStats = this.statsProvider?.() || {};
    this.lastStats = {
      ...this.lastStats,
      ...providerStats,
      ...stats,
      fps: this.currentFps,
      frameTime: this.getAverageFrameTime(),
    };

    this.renderStats();
  }

  /**
   * Get current stats
   */
  getStats(): Partial<DebugStats> {
    return {
      ...this.lastStats,
      fps: this.currentFps,
      frameTime: this.getAverageFrameTime(),
    };
  }

  /**
   * Destroy the overlay
   */
  destroy(): void {
    this.hide();
    this.statsProvider = null;
  }

  // ============================================
  // Private Methods
  // ============================================

  private createElement(): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = this.options.className;
    
    // Apply styles
    Object.assign(this.element.style, {
      position: 'absolute',
      zIndex: '9999',
      fontFamily: 'monospace',
      fontSize: `${this.options.fontSize}px`,
      lineHeight: '1.4',
      padding: '8px 12px',
      backgroundColor: `rgba(0, 0, 0, ${this.options.opacity})`,
      color: '#00ff00',
      borderRadius: '4px',
      pointerEvents: 'none',
      userSelect: 'none',
      whiteSpace: 'pre',
      ...this.getPositionStyles(),
    });

    this.container.style.position = 'relative';
    this.container.appendChild(this.element);
  }

  private destroyElement(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }

  private getPositionStyles(): Partial<CSSStyleDeclaration> {
    switch (this.options.position) {
      case 'top-right':
        return { top: '8px', right: '8px' };
      case 'bottom-left':
        return { bottom: '8px', left: '8px' };
      case 'bottom-right':
        return { bottom: '8px', right: '8px' };
      case 'top-left':
      default:
        return { top: '8px', left: '8px' };
    }
  }

  private startUpdates(): void {
    if (this.updateIntervalId !== null) return;
    
    this.updateIntervalId = window.setInterval(() => {
      this.update();
    }, this.options.updateInterval);
  }

  private stopUpdates(): void {
    if (this.updateIntervalId !== null) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }

  private getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }

  private renderStats(): void {
    if (!this.element) return;

    const lines: string[] = [];
    const stats = this.lastStats;

    // FPS
    if (this.options.showFps && stats.fps !== undefined) {
      const fpsColor = stats.fps >= 55 ? '#00ff00' : stats.fps >= 30 ? '#ffff00' : '#ff4444';
      lines.push(`<span style="color:${fpsColor}">FPS: ${stats.fps}</span>`);
      if (stats.frameTime) {
        lines.push(`Frame: ${stats.frameTime.toFixed(2)}ms`);
      }
    }

    // Point count
    if (this.options.showPointCount && stats.pointCount !== undefined) {
      lines.push(`Points: ${this.formatNumber(stats.pointCount)}`);
    }

    // Series count
    if (stats.seriesCount !== undefined) {
      lines.push(`Series: ${stats.seriesCount}`);
    }

    // Draw calls
    if (this.options.showDrawCalls && stats.drawCalls !== undefined) {
      lines.push(`Draw calls: ${stats.drawCalls}`);
    }

    // Memory
    if (this.options.showMemory && stats.memoryEstimate !== undefined) {
      lines.push(`Memory: ${this.formatBytes(stats.memoryEstimate)}`);
    }

    // Bounds
    if (this.options.showBounds && stats.viewBounds) {
      const b = stats.viewBounds;
      lines.push(`X: [${this.formatValue(b.xMin)}, ${this.formatValue(b.xMax)}]`);
      lines.push(`Y: [${this.formatValue(b.yMin)}, ${this.formatValue(b.yMax)}]`);
    }

    // Renderer info
    if (this.options.showRendererInfo && stats.rendererInfo) {
      const info = stats.rendererInfo;
      lines.push(`Renderer: ${info.type.toUpperCase()}`);
      if (info.renderer) {
        // Truncate long renderer names
        const shortRenderer = info.renderer.length > 30 
          ? info.renderer.substring(0, 27) + '...'
          : info.renderer;
        lines.push(`GPU: ${shortRenderer}`);
      }
    }

    // Canvas size
    if (stats.canvasSize) {
      lines.push(`Canvas: ${stats.canvasSize.width}×${stats.canvasSize.height}`);
    }

    // Downsampling
    if (stats.downsamplingActive !== undefined) {
      lines.push(`Downsampling: ${stats.downsamplingActive ? 'ON' : 'OFF'}`);
    }

    // DPR
    if (stats.devicePixelRatio !== undefined) {
      lines.push(`DPR: ${stats.devicePixelRatio}`);
    }

    this.element.innerHTML = lines.join('\n');
  }

  private formatNumber(n: number): string {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  private formatBytes(bytes: number): string {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
    if (bytes >= 1e3) return (bytes / 1e3).toFixed(2) + ' KB';
    return bytes + ' B';
  }

  private formatValue(v: number): string {
    if (!isFinite(v)) return v.toString();
    if (Math.abs(v) >= 1e6 || (Math.abs(v) < 0.001 && v !== 0)) {
      return v.toExponential(2);
    }
    return v.toFixed(3);
  }
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Create a debug overlay for a chart container
 */
export function createDebugOverlay(
  container: HTMLElement,
  options?: DebugOverlayOptions
): DebugOverlay {
  return new DebugOverlay(container, options);
}

/**
 * Quick enable debug mode (attaches to first chart container found)
 */
export function enableDebugMode(options?: DebugOverlayOptions): DebugOverlay | null {
  const container = document.querySelector('.sci-plot-container') as HTMLElement;
  if (!container) {
    console.warn('[SciPlot] No chart container found for debug overlay');
    return null;
  }
  
  const overlay = new DebugOverlay(container, options);
  overlay.show();
  return overlay;
}
