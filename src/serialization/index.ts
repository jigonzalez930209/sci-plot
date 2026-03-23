/**
 * Chart Serialization and State Persistence
 * 
 * Provides:
 * - Export/import complete chart state
 * - URL hash sharing
 * - State compression
 * - Version migration
 */

import type { Bounds, SeriesType, SeriesStyle } from "../types";
import type { Annotation } from "../core/annotations";

// ============================================
// Serialization Types
// ============================================

/** Version of the serialization format */
export const SERIALIZATION_VERSION = 1;

/** Serialized axis configuration */
export interface SerializedAxis {
  id: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  label?: string;
  scale?: 'linear' | 'log';
  min?: number;
  max?: number;
  auto?: boolean;
  invertAxis?: boolean;
}

/** Serialized series data */
export interface SerializedSeries {
  id: string;
  name?: string;
  type: SeriesType;
  yAxisId?: string;
  style?: SeriesStyle;
  visible?: boolean;
  /** Data is stored as base64 encoded Float32Array for compactness */
  data: {
    x: string; // base64
    y: string; // base64
    y2?: string;
  };
}

/** Complete serialized chart state */
export interface ChartState {
  /** Serialization format version */
  version: number;
  /** Timestamp when state was saved */
  timestamp: number;
  /** Current view bounds */
  viewBounds: Bounds;
  /** X-axis configuration */
  xAxis: SerializedAxis;
  /** Y-axes configurations */
  yAxes: SerializedAxis[];
  /** Primary Y axis ID */
  primaryYAxisId: string;
  /** Series data and configuration */
  series: SerializedSeries[];
  /** Annotations */
  annotations: Annotation[];
  /** Active theme name (if applicable) */
  themeName?: string;
  options?: {
    showLegend?: boolean;
    showControls?: boolean;
    showStatistics?: boolean;
    autoScroll?: boolean;
  };
  /** Plugin-specific data */
  plugins?: Record<string, any>;
}

/** Options for serialization */
export interface SerializeOptions {
  /** Include series data (default: true) */
  includeData?: boolean;
  /** Include annotations (default: true) */
  includeAnnotations?: boolean;
  /** Compress output (default: false) */
  compress?: boolean;
}

/** Options for deserialization */
export interface DeserializeOptions {
  /** Merge with existing state instead of replacing (default: false) */
  merge?: boolean;
  /** Skip data loading (default: false) */
  skipData?: boolean;
  /** Skip annotations (default: false) */
  skipAnnotations?: boolean;
}

// ============================================
// Encoding Utilities
// ============================================

/**
 * Encode Float32Array to base64 string
 */
export function encodeFloat32Array(arr: Float32Array | Float64Array): string {
  // Convert Float64Array to Float32Array for size efficiency
  const float32 = arr instanceof Float32Array 
    ? arr 
    : new Float32Array(arr);
  
  const bytes = new Uint8Array(float32.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decode base64 string to Float32Array
 */
export function decodeFloat32Array(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Float32Array(bytes.buffer);
}

/**
 * Compress string using simple LZ-based compression
 */
export function compressString(str: string): string {
  // Simple compression using built-in TextEncoder for now
  // In production, could use pako or similar
  try {
    const encoder = new TextEncoder();
    encoder.encode(str);
    
    // Simple RLE-like compression for repeated patterns
    let compressed = '';
    for (let i = 0; i < str.length; i++) {
      let count = 1;
      while (i + count < str.length && str[i] === str[i + count] && count < 255) {
        count++;
      }
      if (count > 3) {
        compressed += '\x00' + String.fromCharCode(count) + str[i];
        i += count - 1;
      } else {
        compressed += str[i];
      }
    }
    
    return btoa(compressed);
  } catch (e) {
    // Fallback to just base64
    return btoa(str);
  }
}

/**
 * Decompress string
 */
export function decompressString(compressed: string): string {
  try {
    const decoded = atob(compressed);
    
    // Decompress RLE
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      if (decoded[i] === '\x00' && i + 2 < decoded.length) {
        const count = decoded.charCodeAt(i + 1);
        const char = decoded[i + 2];
        result += char.repeat(count);
        i += 2;
      } else {
        result += decoded[i];
      }
    }
    
    return result;
  } catch (e) {
    // Fallback to just base64 decode
    return atob(compressed);
  }
}

// ============================================
// URL Hash Utilities
// ============================================

/**
 * Convert chart state to URL-safe hash
 */
export function stateToUrlHash(state: ChartState, compress: boolean = true): string {
  const json = JSON.stringify(state);
  if (compress) {
    return compressString(json);
  }
  return btoa(json);
}

/**
 * Parse chart state from URL hash
 */
export function urlHashToState(hash: string, compressed: boolean = true): ChartState | null {
  try {
    const json = compressed ? decompressString(hash) : atob(hash);
    const state = JSON.parse(json) as ChartState;
    
    // Validate version
    if (typeof state.version !== 'number') {
      console.warn('[SciChartEngine] Invalid state: missing version');
      return null;
    }
    
    // Migration could happen here for future versions
    if (state.version > SERIALIZATION_VERSION) {
      console.warn('[SciChartEngine] State version is newer than supported');
    }
    
    return state;
  } catch (e) {
    console.error('[SciChartEngine] Failed to parse URL hash:', e);
    return null;
  }
}

// ============================================
// State Validation
// ============================================

/**
 * Validate a chart state object
 */
export function validateChartState(state: unknown): state is ChartState {
  if (!state || typeof state !== 'object') return false;
  
  const s = state as any;
  
  // Check required fields
  if (typeof s.version !== 'number') return false;
  if (!s.viewBounds || typeof s.viewBounds !== 'object') return false;
  if (!Array.isArray(s.series)) return false;
  
  return true;
}

// ============================================
// State Diff Utilities (for Undo/Redo)
// ============================================

/** State snapshot for undo/redo */
export interface StateSnapshot {
  timestamp: number;
  viewBounds: Bounds;
  label?: string;
}

/**
 * Simple state history manager for undo/redo
 */
export class StateHistory {
  private history: StateSnapshot[] = [];
  private currentIndex: number = -1;
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  /**
   * Push a new state to history
   */
  push(snapshot: StateSnapshot): void {
    // Remove any future states if we're not at the end
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(snapshot);

    // Trim if exceeding max size
    if (this.history.length > this.maxSize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  /**
   * Undo to previous state
   */
  undo(): StateSnapshot | null {
    if (this.currentIndex <= 0) return null;
    this.currentIndex--;
    return this.history[this.currentIndex];
  }

  /**
   * Redo to next state
   */
  redo(): StateSnapshot | null {
    if (this.currentIndex >= this.history.length - 1) return null;
    this.currentIndex++;
    return this.history[this.currentIndex];
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current state
   */
  current(): StateSnapshot | null {
    if (this.currentIndex < 0) return null;
    return this.history[this.currentIndex];
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history length
   */
  get length(): number {
    return this.history.length;
  }
}
