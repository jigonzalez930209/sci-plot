/**
 * ResponsiveManager - Automatic responsive design for charts
 * 
 * Provides:
 * - Automatic font scaling based on container size
 * - Tick density adjustment
 * - Point/line size scaling
 * - Touch-optimized hit areas
 * - Breakpoint-based configuration
 */

import type { ChartTheme } from "../../theme";

// ============================================
// Responsive Types
// ============================================

/** Breakpoint configuration */
export interface ResponsiveBreakpoint {
  /** Maximum width for this breakpoint (undefined = unlimited) */
  maxWidth?: number;
  /** Minimum width for this breakpoint (undefined = 0) */
  minWidth?: number;
  /** Font size multiplier (default: 1) */
  fontScale?: number;
  /** Number of X-axis ticks */
  xTickCount?: number;
  /** Number of Y-axis ticks */
  yTickCount?: number;
  /** Point size multiplier */
  pointScale?: number;
  /** Line width multiplier */
  lineScale?: number;
  /** Hit radius multiplier for touch targets */
  hitRadiusScale?: number;
  /** Whether to show legend */
  showLegend?: boolean;
  /** Legend position override */
  legendPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/** Preset breakpoints */
export interface ResponsiveBreakpoints {
  mobile?: ResponsiveBreakpoint;
  tablet?: ResponsiveBreakpoint;
  desktop?: ResponsiveBreakpoint;
}

/** Full responsive configuration */
export interface ResponsiveConfig {
  /** Enable responsive behavior (default: true) */
  enabled?: boolean;
  /** Custom breakpoints (overrides presets) */
  breakpoints?: ResponsiveBreakpoints;
  /** Optimize for touch interactions (default: auto-detect) */
  touchOptimized?: boolean | 'auto';
  /** Respect user's reduced motion preference (default: true) */
  reducedMotion?: boolean | 'auto';
  /** Debounce time for resize events in ms (default: 100) */
  resizeDebounce?: number;
}

/** Current responsive state */
export interface ResponsiveState {
  /** Current container width */
  width: number;
  /** Current container height */
  height: number;
  /** Active breakpoint name */
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  /** Whether touch is optimized */
  touchOptimized: boolean;
  /** Whether reduced motion is enabled */
  reducedMotion: boolean;
  /** Computed scale factors */
  scales: {
    font: number;
    point: number;
    line: number;
    hitRadius: number;
  };
  /** Computed tick counts */
  ticks: {
    x: number;
    y: number;
  };
}

/** Context for responsive operations */
export interface ResponsiveContext {
  container: HTMLDivElement;
  onStateChange: (state: ResponsiveState) => void;
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_BREAKPOINTS: Required<ResponsiveBreakpoints> = {
  mobile: {
    maxWidth: 480,
    fontScale: 0.8,
    xTickCount: 5,
    yTickCount: 4,
    pointScale: 1.2, // Larger for touch
    lineScale: 1.2,
    hitRadiusScale: 1.5,
    showLegend: false,
  },
  tablet: {
    minWidth: 481,
    maxWidth: 768,
    fontScale: 0.9,
    xTickCount: 7,
    yTickCount: 5,
    pointScale: 1.1,
    lineScale: 1.1,
    hitRadiusScale: 1.3,
    showLegend: true,
    legendPosition: 'top-right',
  },
  desktop: {
    minWidth: 769,
    fontScale: 1.0,
    xTickCount: 10,
    yTickCount: 6,
    pointScale: 1.0,
    lineScale: 1.0,
    hitRadiusScale: 1.0,
    showLegend: true,
    legendPosition: 'top-right',
  },
};

const DEFAULT_CONFIG: Required<ResponsiveConfig> = {
  enabled: true,
  breakpoints: DEFAULT_BREAKPOINTS,
  touchOptimized: 'auto',
  reducedMotion: 'auto',
  resizeDebounce: 100,
};

// ============================================
// ResponsiveManager Implementation
// ============================================

export class ResponsiveManager {
  private ctx: ResponsiveContext;
  private config: Required<ResponsiveConfig>;
  private state: ResponsiveState;
  private resizeObserver: ResizeObserver | null = null;
  private debounceTimer: number | null = null;
  private destroyed = false;

  constructor(ctx: ResponsiveContext, config?: ResponsiveConfig) {
    this.ctx = ctx;
    this.config = this.mergeConfig(config);
    this.state = this.computeState();
    
    if (this.config.enabled) {
      this.setupResizeObserver();
    }
  }

  // ============================================
  // Configuration
  // ============================================

  private mergeConfig(config?: ResponsiveConfig): Required<ResponsiveConfig> {
    if (!config) return { ...DEFAULT_CONFIG };

    return {
      enabled: config.enabled ?? DEFAULT_CONFIG.enabled,
      breakpoints: {
        mobile: { ...DEFAULT_BREAKPOINTS.mobile, ...config.breakpoints?.mobile },
        tablet: { ...DEFAULT_BREAKPOINTS.tablet, ...config.breakpoints?.tablet },
        desktop: { ...DEFAULT_BREAKPOINTS.desktop, ...config.breakpoints?.desktop },
      },
      touchOptimized: config.touchOptimized ?? DEFAULT_CONFIG.touchOptimized,
      reducedMotion: config.reducedMotion ?? DEFAULT_CONFIG.reducedMotion,
      resizeDebounce: config.resizeDebounce ?? DEFAULT_CONFIG.resizeDebounce,
    };
  }

  configure(config: Partial<ResponsiveConfig>): void {
    this.config = this.mergeConfig({ ...this.config, ...config });
    this.update();
  }

  getConfig(): ResponsiveConfig {
    return { ...this.config };
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (enabled && !this.resizeObserver) {
      this.setupResizeObserver();
    } else if (!enabled && this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  // ============================================
  // State Management
  // ============================================

  getState(): ResponsiveState {
    return { ...this.state };
  }

  /**
   * Manually trigger a state update
   */
  update(): void {
    const newState = this.computeState();
    
    if (this.hasStateChanged(newState)) {
      this.state = newState;
      this.ctx.onStateChange(this.state);
    }
  }

  private computeState(): ResponsiveState {
    const rect = this.ctx.container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;
    
    const breakpoint = this.getActiveBreakpoint(width);
    const bp = this.config.breakpoints[breakpoint] || DEFAULT_BREAKPOINTS.desktop;
    
    const touchOptimized = this.detectTouchOptimization();
    const reducedMotion = this.detectReducedMotion();
    
    // Apply touch multiplier if needed
    const touchMultiplier = touchOptimized ? 1.2 : 1.0;

    return {
      width,
      height,
      breakpoint,
      touchOptimized,
      reducedMotion,
      scales: {
        font: bp.fontScale ?? 1.0,
        point: (bp.pointScale ?? 1.0) * touchMultiplier,
        line: (bp.lineScale ?? 1.0),
        hitRadius: (bp.hitRadiusScale ?? 1.0) * touchMultiplier,
      },
      ticks: {
        x: bp.xTickCount ?? 8,
        y: bp.yTickCount ?? 6,
      },
    };
  }

  private getActiveBreakpoint(width: number): 'mobile' | 'tablet' | 'desktop' {
    const { mobile, tablet, desktop } = this.config.breakpoints;
    
    if (mobile?.maxWidth && width <= mobile.maxWidth) {
      return 'mobile';
    }
    
    if (tablet?.minWidth && tablet?.maxWidth && width >= tablet.minWidth && width <= tablet.maxWidth) {
      return 'tablet';
    }
    
    if (desktop?.minWidth && width >= desktop.minWidth) {
      return 'desktop';
    }
    
    // Fallback based on width thresholds
    if (width <= 480) return 'mobile';
    if (width <= 768) return 'tablet';
    return 'desktop';
  }

  private detectTouchOptimization(): boolean {
    if (this.config.touchOptimized === true) return true;
    if (this.config.touchOptimized === false) return false;
    
    // Auto-detect
    if (typeof window === 'undefined') return false;
    
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  private detectReducedMotion(): boolean {
    if (this.config.reducedMotion === true) return true;
    if (this.config.reducedMotion === false) return false;
    
    // Auto-detect from system preference
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private hasStateChanged(newState: ResponsiveState): boolean {
    return (
      this.state.width !== newState.width ||
      this.state.height !== newState.height ||
      this.state.breakpoint !== newState.breakpoint ||
      this.state.touchOptimized !== newState.touchOptimized ||
      this.state.reducedMotion !== newState.reducedMotion
    );
  }

  // ============================================
  // Resize Handling
  // ============================================

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      // Fallback for older browsers
      window.addEventListener('resize', this.handleResize);
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });

    this.resizeObserver.observe(this.ctx.container);
  }

  private handleResize = (): void => {
    if (this.destroyed) return;
    
    // Debounce resize events
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.update();
      this.debounceTimer = null;
    }, this.config.resizeDebounce);
  };

  // ============================================
  // Theme Scaling
  // ============================================

  /**
   * Apply responsive scaling to a theme
   */
  scaleTheme(theme: ChartTheme): ChartTheme {
    const { font, line } = this.state.scales;
    
    return {
      ...theme,
      xAxis: {
        ...theme.xAxis,
        labelSize: Math.round(theme.xAxis.labelSize * font),
        titleSize: Math.round(theme.xAxis.titleSize * font),
        lineWidth: theme.xAxis.lineWidth * line,
      },
      yAxis: {
        ...theme.yAxis,
        labelSize: Math.round(theme.yAxis.labelSize * font),
        titleSize: Math.round(theme.yAxis.titleSize * font),
        lineWidth: theme.yAxis.lineWidth * line,
      },
      legend: {
        ...theme.legend,
        fontSize: Math.round(theme.legend.fontSize * font),
        swatchSize: Math.round(theme.legend.swatchSize * font),
      },
      cursor: {
        ...theme.cursor,
        tooltipSize: Math.round(theme.cursor.tooltipSize * font),
      },
    };
  }

  /**
   * Get scaled point size
   */
  getScaledPointSize(baseSize: number): number {
    return baseSize * this.state.scales.point;
  }

  /**
   * Get scaled line width
   */
  getScaledLineWidth(baseWidth: number): number {
    return baseWidth * this.state.scales.line;
  }

  /**
   * Get scaled hit radius
   */
  getScaledHitRadius(baseRadius: number): number {
    return baseRadius * this.state.scales.hitRadius;
  }

  /**
   * Get recommended tick counts
   */
  getTickCounts(): { x: number; y: number } {
    return { ...this.state.ticks };
  }

  /**
   * Check if legend should be shown at current breakpoint
   */
  shouldShowLegend(): boolean {
    const bp = this.config.breakpoints[this.state.breakpoint];
    return bp?.showLegend ?? true;
  }

  /**
   * Get legend position for current breakpoint
   */
  getLegendPosition(): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' {
    const bp = this.config.breakpoints[this.state.breakpoint];
    return bp?.legendPosition ?? 'top-right';
  }

  // ============================================
  // Cleanup
  // ============================================

  destroy(): void {
    this.destroyed = true;
    
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    } else {
      window.removeEventListener('resize', this.handleResize);
    }
  }
}
