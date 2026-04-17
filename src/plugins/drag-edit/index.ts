/**
 * @fileoverview Drag & Drop editing plugin for interactive point manipulation
 * @module plugins/drag-edit
 */

import type {
  PluginDragEditConfig,
  DragEditAPI,
  DraggedPoint,
  DragEditEvent,
  DragConstraint,
} from './types';
import type {
  ChartPlugin,
  PluginContext,
  PluginManifest,
} from '../types';

const manifest: PluginManifest = {
  name: 'velo-plot-drag-edit',
  version: '1.0.0',
  description: 'Interactive drag & drop editing of data points',
  provides: ['drag-edit', 'point-editing'],
  tags: ['interaction', 'editing', 'ux'],
};

const DEFAULT_CONFIG: Required<PluginDragEditConfig> = {
  enabled: true,
  constraint: 'both',
  snapToGrid: false,
  snapIntervalX: 1,
  snapIntervalY: 1,
  dragThreshold: 5,
  hitRadius: 10,
  editableSeries: [],
  validator: () => ({ valid: true }),
  onDragStart: () => {},
  onDrag: () => {},
  onDragEnd: () => {},
  highlightColor: '#ffff00',
  showPreview: true,
  previewStyle: {
    color: '#ffffff',
    width: 2,
    dash: [5, 5],
    opacity: 0.5,
  },
};

export function PluginDragEdit(
  userConfig: Partial<PluginDragEditConfig> = {}
): ChartPlugin<PluginDragEditConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;
  
  // Drag state
  let isDragging = false;
  let draggedPoint: DraggedPoint | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let hasMoved = false;

  /**
   * Find nearest point to mouse position
   */
  function findNearestPoint(mouseX: number, mouseY: number): DraggedPoint | null {
    if (!ctx) return null;

    // Use built-in pick functionality
    const picked = ctx.coords.pickPoint(mouseX, mouseY, config.hitRadius);
    
    if (!picked) return null;

    // Check if series is editable
    if (config.editableSeries.length > 0 && !config.editableSeries.includes(picked.seriesId)) {
      return null;
    }

    return {
      seriesId: picked.seriesId,
      index: picked.index,
      originalX: picked.x,
      originalY: picked.y,
      currentX: picked.x,
      currentY: picked.y,
    };
  }

  /**
   * Convert pixel coordinates to data coordinates
   */
  function pixelToData(pixelX: number, pixelY: number): { x: number; y: number } {
    if (!ctx) return { x: 0, y: 0 };

    return {
      x: ctx.coords.pixelToDataX(pixelX),
      y: ctx.coords.pixelToDataY(pixelY),
    };
  }

  /**
   * Snap value to grid
   */
  function snapToGrid(value: number, interval: number): number {
    return Math.round(value / interval) * interval;
  }

  /**
   * Apply drag constraints
   */
  function applyConstraints(
    newX: number,
    newY: number,
    constraint: DragConstraint
  ): { x: number; y: number } {
    if (!draggedPoint) return { x: newX, y: newY };

    switch (constraint) {
      case 'x':
        return { x: newX, y: draggedPoint.originalY };
      case 'y':
        return { x: draggedPoint.originalX, y: newY };
      case 'none':
        return { x: draggedPoint.originalX, y: draggedPoint.originalY };
      default:
        return { x: newX, y: newY };
    }
  }

  /**
   * Validate and apply snapping
   */
  function validateAndSnap(x: number, y: number): { x: number; y: number; valid: boolean } {
    let finalX = x;
    let finalY = y;

    // Apply snapping
    if (config.snapToGrid) {
      finalX = snapToGrid(x, config.snapIntervalX);
      finalY = snapToGrid(y, config.snapIntervalY);
    }

    // Run custom validation
    if (draggedPoint && config.validator) {
      const tempPoint: DraggedPoint = { ...draggedPoint, currentX: finalX, currentY: finalY };
      const validation = config.validator(tempPoint);

      if (typeof validation === 'boolean') {
        return { x: finalX, y: finalY, valid: validation };
      }

      if (!validation.valid) {
        return { x: finalX, y: finalY, valid: false };
      }

      // Apply snap suggestions from validator
      if (validation.snapX !== undefined) finalX = validation.snapX;
      if (validation.snapY !== undefined) finalY = validation.snapY;
    }

    return { x: finalX, y: finalY, valid: true };
  }

  /**
   * Update point data
   */
  function updatePointData(seriesId: string, index: number, newX: number, newY: number): void {
    if (!ctx) return;

    const series = (ctx.chart as any).getSeries?.(seriesId);
    if (!series) return;

    const data = series.getData();
    if (!data || !data.x || !data.y) return;

    // Update the data arrays
    data.x[index] = newX;
    data.y[index] = newY;

    // Invalidate buffers to trigger GPU upload
    series.invalidateBuffers?.();

    // Trigger chart re-render
    ctx.requestRender();
  }

  /**
   * Create drag event
   */
  function createDragEvent(): DragEditEvent | null {
    if (!draggedPoint) return null;

    return {
      seriesId: draggedPoint.seriesId,
      index: draggedPoint.index,
      oldX: draggedPoint.originalX,
      oldY: draggedPoint.originalY,
      newX: draggedPoint.currentX,
      newY: draggedPoint.currentY,
      deltaX: draggedPoint.currentX - draggedPoint.originalX,
      deltaY: draggedPoint.currentY - draggedPoint.originalY,
    };
  }

  /**
   * Draw preview overlay
   */
  function drawPreview(pCtx: PluginContext): void {
    if (!isDragging || !draggedPoint || !config.showPreview) return;

    const { render, coords } = pCtx;
    const { ctx2d } = render;
    if (!ctx2d) return;

    ctx2d.save();

    // Convert data coordinates to pixel coordinates
    const origPixelX = coords.dataToPixelX(draggedPoint.originalX);
    const origPixelY = coords.dataToPixelY(draggedPoint.originalY);
    
    const currPixelX = coords.dataToPixelX(draggedPoint.currentX);
    const currPixelY = coords.dataToPixelY(draggedPoint.currentY);

    // Draw preview line from original to current position
    ctx2d.strokeStyle = config.previewStyle.color || '#ffffff';
    ctx2d.lineWidth = config.previewStyle.width || 2;
    ctx2d.globalAlpha = config.previewStyle.opacity || 0.5;
    ctx2d.setLineDash(config.previewStyle.dash || [5, 5]);

    ctx2d.beginPath();
    ctx2d.moveTo(origPixelX, origPixelY);
    ctx2d.lineTo(currPixelX, currPixelY);
    ctx2d.stroke();

    // Draw highlight circle at current position
    ctx2d.globalAlpha = 1;
    ctx2d.fillStyle = config.highlightColor;
    ctx2d.setLineDash([]);
    ctx2d.beginPath();
    ctx2d.arc(currPixelX, currPixelY, 6, 0, Math.PI * 2);
    ctx2d.fill();

    // Draw outline
    ctx2d.strokeStyle = '#000000';
    ctx2d.lineWidth = 1;
    ctx2d.stroke();

    ctx2d.restore();
  }

  // API implementation
  const api: DragEditAPI & Record<string, unknown> = {
    enable() {
      config.enabled = true;
    },
    disable() {
      config.enabled = false;
      if (isDragging) {
        draggedPoint = null;
        isDragging = false;
        hasMoved = false;
        ctx?.requestRender();
      }
    },
    isEnabled() {
      return config.enabled;
    },
    setEditableSeries(seriesIds: string[]) {
      config.editableSeries = seriesIds;
    },
    getDraggedPoint() {
      return draggedPoint;
    },
    cancelDrag() {
      if (isDragging && draggedPoint) {
        draggedPoint = null;
        isDragging = false;
        hasMoved = false;
        ctx?.requestRender();
      }
    },
    updateConfig(newConfig: Partial<PluginDragEditConfig>) {
      Object.assign(config, newConfig);
    },
  };

  return {
    manifest,

    onInit(pluginCtx: PluginContext) {
      ctx = pluginCtx;

      // Attach to chart API
      (ctx.chart as any).dragEdit = api;
    },

    onDestroy(_pluginCtx: PluginContext) {
      // Remove from chart API
      delete (_pluginCtx.chart as any).dragEdit;

      ctx = null;
    },

    onInteraction(_pluginCtx: PluginContext, event: import('../types').InteractionEvent) {
      if (!config.enabled) return;

      if (event.type === 'mousedown') {
        const point = findNearestPoint(event.pixelX, event.pixelY);
        if (point) {
          draggedPoint = point;
          dragStartX = event.pixelX;
          dragStartY = event.pixelY;
          hasMoved = false;
          isDragging = false;
          // Prevent default to stop panning when clicking on a point
          event.preventDefault();
        }
      } else if (event.type === 'mousemove') {
        if (!draggedPoint) return;

        // Check if we've moved beyond threshold
        if (!isDragging) {
          const dx = event.pixelX - dragStartX;
          const dy = event.pixelY - dragStartY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > config.dragThreshold) {
            isDragging = true;
            hasMoved = true;

            // Fire drag start event
            const dragEvent = createDragEvent();
            if (dragEvent) config.onDragStart(dragEvent);
          } else {
            return;
          }
        }

        // Prevent default during dragging
        if (isDragging) {
          event.preventDefault();
        }

        // Convert to data coordinates
        let { x, y } = pixelToData(event.pixelX, event.pixelY);

        // Apply constraints
        ({ x, y } = applyConstraints(x, y, config.constraint));

        // Validate and snap
        const { x: finalX, y: finalY, valid } = validateAndSnap(x, y);

        if (valid) {
          draggedPoint.currentX = finalX;
          draggedPoint.currentY = finalY;

          // Fire drag event (for callbacks)
          const dragEvent = createDragEvent();
          if (dragEvent) config.onDrag(dragEvent);

          // Request render to show preview line
          ctx?.requestRender();
        }
      } else if (event.type === 'mouseup') {
        if (!draggedPoint) return;

        if (isDragging && hasMoved) {
          // Apply the changes
          updatePointData(
            draggedPoint.seriesId,
            draggedPoint.index,
            draggedPoint.currentX,
            draggedPoint.currentY
          );

          // Fire drag end event
          const dragEvent = createDragEvent();
          if (dragEvent) config.onDragEnd(dragEvent);

          // Prevent default on mouseup to avoid triggering click events
          event.preventDefault();
        }

        // Reset state
        draggedPoint = null;
        isDragging = false;
        hasMoved = false;
        ctx?.requestRender();
      }
    },

    onRenderOverlay(pluginCtx: PluginContext) {
      drawPreview(pluginCtx);
    },

    api,
  };
}

export default PluginDragEdit;

// Type exports
export type {
  PluginDragEditConfig,
  DragEditAPI,
  DraggedPoint,
  DragEditEvent,
  DragConstraint,
} from './types';
