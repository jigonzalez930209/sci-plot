/**
 * SciChart Engine - Loading Indicator Module
 * 
 * Provides visual loading/progress indicators for chart operations.
 * Supports progress bars, spinners, and skeleton placeholders.
 * 
 * @module loading
 */

// ============================================
// Types
// ============================================

export type LoadingIndicatorType = 'spinner' | 'progress' | 'skeleton' | 'pulse';

export interface LoadingIndicatorOptions {
  /** Indicator type (default: 'spinner') */
  type?: LoadingIndicatorType;
  /** Message to display (default: 'Loading...') */
  message?: string;
  /** Show percentage for progress type (default: true) */
  showPercentage?: boolean;
  /** Background overlay opacity (0-1, default: 0.7) */
  overlayOpacity?: number;
  /** Accent color for spinner/progress (default: '#00f2ff') */
  accentColor?: string;
  /** Background color (default: 'rgba(0,0,0,0.7)') */
  backgroundColor?: string;
  /** Text color (default: '#ffffff') */
  textColor?: string;
  /** Size: 'small', 'medium', 'large' (default: 'medium') */
  size?: 'small' | 'medium' | 'large';
  /** Custom CSS class */
  className?: string;
  /** Auto-hide after completion (default: true) */
  autoHide?: boolean;
  /** Hide delay in ms after completion (default: 300) */
  hideDelay?: number;
}

export interface LoadingState {
  /** Whether loading is in progress */
  isLoading: boolean;
  /** Progress value (0-100) */
  progress: number;
  /** Current message */
  message: string;
  /** Start time of loading */
  startTime: number | null;
  /** Estimated time remaining in ms */
  eta: number | null;
}

// ============================================
// Loading Indicator Implementation
// ============================================

export class LoadingIndicator {
  private container: HTMLElement;
  private element: HTMLDivElement | null = null;
  private options: Required<LoadingIndicatorOptions>;
  private state: LoadingState = {
    isLoading: false,
    progress: 0,
    message: '',
    startTime: null,
    eta: null,
  };

  // For ETA calculation
  private progressHistory: { time: number; progress: number }[] = [];

  constructor(container: HTMLElement, options?: LoadingIndicatorOptions) {
    this.container = container;
    this.options = {
      type: 'spinner',
      message: 'Loading...',
      showPercentage: true,
      overlayOpacity: 0.7,
      accentColor: '#00f2ff',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      textColor: '#ffffff',
      size: 'medium',
      className: 'scichart-loading',
      autoHide: true,
      hideDelay: 200,
      ...options,
    };
    this.state.message = this.options.message;
  }

  /**
   * Show the loading indicator
   */
  show(message?: string): void {
    this.state.isLoading = true;
    this.state.progress = 0;
    this.state.startTime = performance.now();
    this.state.eta = null;
    this.progressHistory = [];
    
    if (message) {
      this.state.message = message;
    }

    this.createElement();
    this.render();
  }

  /**
   * Hide the loading indicator
   */
  hide(): void {
    if (!this.state.isLoading) return;
    this.state.isLoading = false;
    
    if (this.element) {
      this.element.style.opacity = '0';
    }

    if (this.options.autoHide) {
      setTimeout(() => {
        this.destroyElement();
      }, this.options.hideDelay);
    } else {
      this.destroyElement();
    }
  }

  /**
   * Update progress (0-100)
   */
  setProgress(progress: number, message?: string): void {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    this.state.progress = clampedProgress;
    
    if (message) {
      this.state.message = message;
    }

    // Track progress for ETA
    this.progressHistory.push({
      time: performance.now(),
      progress: clampedProgress,
    });

    // Keep only recent history
    if (this.progressHistory.length > 10) {
      this.progressHistory.shift();
    }

    // Calculate ETA
    this.calculateEta();
    
    this.render();

    // Auto-complete
    if (clampedProgress >= 100 && this.options.autoHide) {
      this.hide();
    }
  }

  /**
   * Update message only
   */
  setMessage(message: string): void {
    this.state.message = message;
    this.render();
  }

  /**
   * Check if loading is in progress
   */
  isLoading(): boolean {
    return this.state.isLoading;
  }

  /**
   * Get current progress
   */
  getProgress(): number {
    return this.state.progress;
  }

  /**
   * Get current state
   */
  getState(): LoadingState {
    return { ...this.state };
  }

  /**
   * Destroy the indicator
   */
  destroy(): void {
    this.hide();
    this.destroyElement();
  }

  // ============================================
  // Private Methods
  // ============================================

  private createElement(): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = this.options.className;
    
    // Apply overlay styles
    Object.assign(this.element.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: this.options.backgroundColor,
      zIndex: '9998',
      transition: 'opacity 0.2s ease',
    });

    // Create inner content
    this.element.innerHTML = this.getInnerHtml();
    
    // Inject styles
    this.injectStyles();

    this.container.style.position = 'relative';
    this.container.appendChild(this.element);
  }

  private destroyElement(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }

  private render(): void {
    if (!this.element) return;
    this.element.innerHTML = this.getInnerHtml();
  }

  private getInnerHtml(): string {
    const { type, accentColor, textColor, size, showPercentage } = this.options;
    const { progress, message, eta } = this.state;
    
    const sizeMap = { small: 24, medium: 40, large: 56 };
    const spinnerSize = sizeMap[size];
    const fontSize = size === 'small' ? 12 : size === 'large' ? 16 : 14;

    let content = '';

    switch (type) {
      case 'spinner':
        content = `
          <div class="scichart-loading-spinner" style="
            width: ${spinnerSize}px;
            height: ${spinnerSize}px;
            border: 3px solid rgba(255,255,255,0.2);
            border-top-color: ${accentColor};
            border-radius: 50%;
            animation: scichart-spin 0.8s linear infinite;
          "></div>
        `;
        break;

      case 'progress':
        content = `
          <div class="scichart-loading-progress" style="
            width: 200px;
            height: 8px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
            overflow: hidden;
          ">
            <div style="
              width: ${progress}%;
              height: 100%;
              background: ${accentColor};
              transition: width 0.2s ease;
            "></div>
          </div>
          ${showPercentage ? `
            <div style="
              color: ${textColor};
              font-size: ${fontSize}px;
              margin-top: 8px;
              font-family: system-ui, sans-serif;
            ">${Math.round(progress)}%</div>
          ` : ''}
        `;
        break;

      case 'skeleton':
        content = `
          <div class="scichart-loading-skeleton" style="
            width: 80%;
            max-width: 300px;
          ">
            <div class="scichart-skeleton-line" style="height: 20px; margin-bottom: 8px;"></div>
            <div class="scichart-skeleton-line" style="height: 16px; width: 60%; margin-bottom: 8px;"></div>
            <div class="scichart-skeleton-line" style="height: 40px;"></div>
          </div>
        `;
        break;

      case 'pulse':
        content = `
          <div class="scichart-loading-pulse" style="
            width: ${spinnerSize}px;
            height: ${spinnerSize}px;
            background: ${accentColor};
            border-radius: 50%;
            animation: scichart-pulse 1.2s ease-in-out infinite;
          "></div>
        `;
        break;
    }

    // Add message
    if (message) {
      content += `
        <div style="
          color: ${textColor};
          font-size: ${fontSize}px;
          margin-top: 12px;
          font-family: system-ui, sans-serif;
        ">${message}</div>
      `;
    }

    // Add ETA if available
    if (eta !== null && eta > 0 && type === 'progress') {
      content += `
        <div style="
          color: rgba(255,255,255,0.6);
          font-size: ${fontSize - 2}px;
          margin-top: 4px;
          font-family: system-ui, sans-serif;
        ">~${this.formatTime(eta)} remaining</div>
      `;
    }

    return content;
  }

  private injectStyles(): void {
    const styleId = 'scichart-loading-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes scichart-spin {
        to { transform: rotate(360deg); }
      }
      
      @keyframes scichart-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
      }
      
      @keyframes scichart-skeleton-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      .scichart-skeleton-line {
        background: linear-gradient(
          90deg,
          rgba(255,255,255,0.1) 25%,
          rgba(255,255,255,0.2) 50%,
          rgba(255,255,255,0.1) 75%
        );
        background-size: 200% 100%;
        animation: scichart-skeleton-shimmer 1.5s infinite;
        border-radius: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  private calculateEta(): void {
    if (this.progressHistory.length < 2) {
      this.state.eta = null;
      return;
    }

    const first = this.progressHistory[0];
    const last = this.progressHistory[this.progressHistory.length - 1];
    
    const progressDelta = last.progress - first.progress;
    const timeDelta = last.time - first.time;

    if (progressDelta <= 0) {
      this.state.eta = null;
      return;
    }

    const remainingProgress = 100 - last.progress;
    const rate = progressDelta / timeDelta;
    this.state.eta = remainingProgress / rate;
  }

  private formatTime(ms: number): string {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Create a loading indicator for a container
 */
export function createLoadingIndicator(
  container: HTMLElement,
  options?: LoadingIndicatorOptions
): LoadingIndicator {
  return new LoadingIndicator(container, options);
}

/**
 * Show loading with a simple spinner
 */
export function showLoading(
  container: HTMLElement,
  message?: string
): LoadingIndicator {
  const indicator = new LoadingIndicator(container, { message });
  indicator.show();
  return indicator;
}

/**
 * Show progress loading
 */
export function showProgress(
  container: HTMLElement,
  message?: string
): LoadingIndicator {
  const indicator = new LoadingIndicator(container, {
    type: 'progress',
    message,
  });
  indicator.show();
  return indicator;
}
