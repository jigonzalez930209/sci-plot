/**
 * @fileoverview Types for drag and drop editing
 * @module plugins/drag-edit/types
 */

/**
 * Drag constraint (which axis can be edited)
 */
export type DragConstraint = 'x' | 'y' | 'both' | 'none';

/**
 * Point being dragged
 */
export interface DraggedPoint {
  /** Series ID */
  seriesId: string;
  /** Point index in the data array */
  index: number;
  /** Original X value */
  originalX: number;
  /** Original Y value */
  originalY: number;
  /** Current X value (during drag) */
  currentX: number;
  /** Current Y value (during drag) */
  currentY: number;
}

/**
 * Drag validation result
 */
export interface DragValidation {
  /** Whether the drag is valid */
  valid: boolean;
  /** Error message if invalid */
  message?: string;
  /** Adjusted X value (if snapping) */
  snapX?: number;
  /** Adjusted Y value (if snapping) */
  snapY?: number;
}

/**
 * Drag edit event
 */
export interface DragEditEvent {
  /** Series ID */
  seriesId: string;
  /** Point index */
  index: number;
  /** Old X value */
  oldX: number;
  /** Old Y value */
  oldY: number;
  /** New X value */
  newX: number;
  /** New Y value */
  newY: number;
  /** Delta X */
  deltaX: number;
  /** Delta Y */
  deltaY: number;
}

/**
 * Plugin configuration
 */
export interface PluginDragEditConfig {
  /** Enable drag editing (default: true) */
  enabled?: boolean;
  
  /** Which axis can be edited (default: 'both') */
  constraint?: DragConstraint;
  
  /** Snap to grid (default: false) */
  snapToGrid?: boolean;
  
  /** Grid snap interval for X (data units) */
  snapIntervalX?: number;
  
  /** Grid snap interval for Y (data units) */
  snapIntervalY?: number;
  
  /** Minimum distance in pixels to start drag (default: 5) */
  dragThreshold?: number;
  
  /** Point detection radius in pixels (default: 10) */
  hitRadius?: number;
  
  /** Series IDs that are editable (empty = all editable) */
  editableSeries?: string[];
  
  /** Validation function called before applying changes */
  validator?: (point: DraggedPoint) => DragValidation | boolean;
  
  /** Callback when a point starts being dragged */
  onDragStart?: (event: DragEditEvent) => void;
  
  /** Callback during drag (called on mouse move) */
  onDrag?: (event: DragEditEvent) => void;
  
  /** Callback when drag is complete */
  onDragEnd?: (event: DragEditEvent) => void;
  
  /** Highlight color for dragged point (default: '#ffff00') */
  highlightColor?: string;
  
  /** Show preview line during drag (default: true) */
  showPreview?: boolean;
  
  /** Preview line style */
  previewStyle?: {
    color?: string;
    width?: number;
    dash?: number[];
    opacity?: number;
  };
}

/**
 * Plugin API
 */
export interface DragEditAPI {
  /** Enable drag editing */
  enable(): void;
  
  /** Disable drag editing */
  disable(): void;
  
  /** Check if drag editing is enabled */
  isEnabled(): boolean;
  
  /** Set editable series */
  setEditableSeries(seriesIds: string[]): void;
  
  /** Get currently dragged point (if any) */
  getDraggedPoint(): DraggedPoint | null;
  
  /** Cancel current drag operation */
  cancelDrag(): void;
  
  /** Update configuration */
  updateConfig(config: Partial<PluginDragEditConfig>): void;
}
