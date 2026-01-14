/**
 * SciChart Engine - Context Menu Plugin
 * 
 * Provides a customizable right-click context menu for chart interactions.
 * 
 * @module plugins/context-menu
 * 
 * @example
 * ```typescript
 * import { createChart } from 'scichart-engine';
 * import { PluginContextMenu } from 'scichart-engine/plugins/context-menu';
 * 
 * const chart = createChart({ container });
 * chart.use(PluginContextMenu({
 *   items: [
 *     { label: 'Zoom to Fit', icon: '🔍', action: 'zoomToFit' },
 *     { type: 'separator' },
 *     { label: 'Export...', icon: '💾', type: 'submenu', items: [
 *       { label: 'CSV', action: 'exportCSV' },
 *       { label: 'JSON', action: 'exportJSON' },
 *     ]},
 *   ]
 * }));
 * ```
 */

import type { PluginManifest, ChartPlugin, PluginContext } from "../types";
import type {
  PluginContextMenuConfig,
  MenuItem,
  MenuContext,
  MenuState,
  BuiltinAction,
  MenuActionItem
} from "./types";
import { MenuRenderer } from "./renderer";

// Re-export types
export * from "./types";

// ============================================
// Default Menu Items
// ============================================

const DEFAULT_PLOT_ITEMS: MenuItem[] = [
  { 
    label: 'Zoom to Fit', 
    icon: '⊡', 
    action: 'zoomToFit',
    shortcut: 'Home'
  },
  { 
    label: 'Reset View', 
    icon: '↻', 
    action: 'resetView',
    shortcut: 'R'
  },
  { type: 'separator' },
  {
    label: 'Interaction Mode',
    icon: '✋',
    type: 'submenu',
    items: [
      { label: 'Pan', icon: '✋', action: 'panMode' },
      { label: 'Box Zoom', icon: '⬚', action: 'boxZoomMode' },
      { label: 'Select', icon: '➤', action: 'selectMode' },
    ]
  },
  { type: 'separator' },
  {
    label: 'Export',
    icon: '💾',
    type: 'submenu',
    items: [
      { label: 'CSV', icon: '📄', action: 'exportCSV' },
      { label: 'JSON', icon: '📋', action: 'exportJSON' },
      { label: 'Image', icon: '🖼️', action: 'exportImage' },
    ]
  },
  { 
    label: 'Copy to Clipboard', 
    icon: '📋', 
    action: 'copyToClipboard',
    shortcut: 'Ctrl+C'
  },
  { type: 'separator' },
  {
    label: 'Annotations',
    icon: '📝',
    type: 'submenu',
    items: [
      { label: 'Add Horizontal Line', icon: '—', action: 'addHorizontalLine' },
      { label: 'Add Vertical Line', icon: '|', action: 'addVerticalLine' },
      { label: 'Add Text', icon: 'T', action: 'addTextAnnotation' },
      { type: 'separator' },
      { label: 'Clear All', icon: '🗑️', action: 'clearAnnotations' },
    ]
  },
  { type: 'separator' },
  { 
    label: 'Toggle Legend', 
    icon: '☰', 
    action: 'toggleLegend',
    shortcut: 'L'
  },
  { 
    label: 'Toggle Grid', 
    icon: '#', 
    action: 'toggleGrid',
    shortcut: 'G'
  },
  { 
    label: 'Show Statistics', 
    icon: '📊', 
    action: 'showStats',
    shortcut: 'S'
  },
];

// ============================================
// Plugin Definition
// ============================================

const manifestContextMenu: PluginManifest = {
  name: "scichart-context-menu",
  version: "1.0.0",
  description: "Customizable right-click context menu for scichart-engine",
  author: "SciChart Engine Team",
  provides: ["interaction"],
  tags: ["context-menu", "right-click", "menu", "ui"],
};

/**
 * SciChart Engine Context Menu Plugin
 * 
 * Adds a customizable context menu with built-in actions and 
 * extensibility for custom menu items.
 */
export function PluginContextMenu(
  config: PluginContextMenuConfig = {}
): ChartPlugin<PluginContextMenuConfig> {
  
  const {
    enabled = true,
    items = [],
    templates = [],
    useDefaults = true,
    style,
    preventDefault = true,
    showOnRightClick = true,
    showOnLongPress = true,
    longPressDuration = 500,
    beforeShow,
    afterHide,
    zIndex = 10000
  } = config;

  let _ctx: PluginContext | null = null;
  let renderer: MenuRenderer | null = null;
  let state: MenuState = {
    visible: false,
    position: { x: 0, y: 0 },
    items: [],
    submenuPath: [],
    context: null
  };

  // Long press handling
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let longPressStart: { x: number; y: number } | null = null;

  // ============================================
  // Action Handlers
  // ============================================

  function executeAction(action: BuiltinAction, context: MenuContext): void {
    if (!_ctx) return;

    const chart = _ctx.chart as any;

    switch (action) {
      case 'zoomToFit':
        chart.zoomToFit?.();
        break;
        
      case 'zoomIn':
        chart.zoom?.(1.5);
        break;
        
      case 'zoomOut':
        chart.zoom?.(0.67);
        break;
        
      case 'resetView':
        chart.resetView?.();
        break;
        
      case 'panMode':
        chart.setMode?.('pan');
        break;
        
      case 'boxZoomMode':
        chart.setMode?.('boxZoom');
        break;
        
      case 'selectMode':
        chart.setMode?.('select');
        break;
        
      case 'exportCSV':
        executeExport('csv');
        break;
        
      case 'exportJSON':
        executeExport('json');
        break;
        
      case 'exportImage':
        downloadImage();
        break;
        
      case 'copyToClipboard':
        copyToClipboard();
        break;
        
      case 'toggleLegend':
        chart.setShowLegend?.(!chart.getShowLegend?.());
        break;
        
      case 'toggleGrid':
        chart.setShowGrid?.(!chart.getShowGrid?.());
        break;
        
      case 'toggleCrosshair':
        // Toggle crosshair if available
        break;
        
      case 'addHorizontalLine':
        addAnnotation('hline', context);
        break;
        
      case 'addVerticalLine':
        addAnnotation('vline', context);
        break;
        
      case 'addTextAnnotation':
        addAnnotation('text', context);
        break;
        
      case 'clearAnnotations':
        chart.clearAnnotations?.();
        break;
        
      case 'showStats':
        // Show stats panel
        break;
    }
  }

  function executeExport(format: 'csv' | 'json'): void {
    const chart = _ctx?.chart as any;
    const exportPlugin = chart?.plugins?.get('scichart-data-export')?.api;
    
    if (exportPlugin) {
      exportPlugin.download(format);
    } else {
      // Fallback to basic export
      const data = chart.toCSV?.() || chart.toJSON?.();
      if (data) {
        downloadString(data, `chart.${format}`, `text/${format}`);
      }
    }
  }

  function downloadImage(): void {
    const chart = _ctx?.chart as any;
    const dataUrl = chart.toImage?.('png');
    if (dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'chart.png';
      link.click();
    }
  }

  function copyToClipboard(): void {
    const chart = _ctx?.chart as any;
    const data = chart.toCSV?.();
    if (data) {
      navigator.clipboard.writeText(data).catch(console.error);
    }
  }

  function addAnnotation(type: 'hline' | 'vline' | 'text', context: MenuContext): void {
    if (!context.dataPosition) return;
    
    const chart = _ctx?.chart as any;
    const { x, y } = context.dataPosition;

    switch (type) {
      case 'hline':
        chart.addAnnotation?.({
          type: 'horizontalLine',
          y,
          color: '#ff6b6b',
          label: `Y = ${y.toFixed(4)}`
        });
        break;
        
      case 'vline':
        chart.addAnnotation?.({
          type: 'verticalLine',
          x,
          color: '#4ecdc4',
          label: `X = ${x.toFixed(4)}`
        });
        break;
        
      case 'text':
        chart.addAnnotation?.({
          type: 'text',
          x,
          y,
          text: 'Annotation',
          color: '#ffffff'
        });
        break;
    }
  }

  function downloadString(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ============================================
  // Menu Logic
  // ============================================

  function buildMenuContext(event: MouseEvent): MenuContext {
    const chart = _ctx?.chart as any;
    const container = _ctx?.ui.container;
    
    if (!container) {
      return {
        chart,
        event,
        pixelPosition: { x: event.clientX, y: event.clientY },
        dataPosition: null,
        seriesId: null,
        annotationId: null,
        pointIndex: null,
        area: 'outside'
      };
    }

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Determine area
    const plotArea = _ctx?.render.plotArea;
    let area: MenuContext['area'] = 'outside';
    
    if (plotArea) {
      if (x >= plotArea.x && x <= plotArea.x + plotArea.width &&
          y >= plotArea.y && y <= plotArea.y + plotArea.height) {
        area = 'plot';
      } else if (y > plotArea.y + plotArea.height) {
        area = 'xAxis';
      } else if (x < plotArea.x) {
        area = 'yAxis';
      }
    }

    // Convert to data coordinates
    let dataPosition: { x: number; y: number } | null = null;
    if (area === 'plot' && _ctx) {
      dataPosition = {
        x: _ctx.coords.pixelToDataX(x),
        y: _ctx.coords.pixelToDataY(y)
      };
    }

    // Try to detect series/point
    let seriesId: string | null = null;
    let pointIndex: number | null = null;
    
    if (dataPosition && _ctx) {
      const pick = _ctx.coords.pickPoint(x, y, 10);
      if (pick) {
        seriesId = pick.seriesId;
        pointIndex = pick.index;
      }
    }

    return {
      chart,
      event,
      pixelPosition: { x, y },
      dataPosition,
      seriesId,
      annotationId: null,
      pointIndex,
      area
    };
  }

  function getMenuItems(context: MenuContext): MenuItem[] {
    // Try templates first
    for (const template of templates) {
      if (template.condition?.(context)) {
        return [...template.items];
      }
    }

    // Build items based on context
    let menuItems: MenuItem[] = [];

    if (useDefaults) {
      menuItems = [...DEFAULT_PLOT_ITEMS];
    }

    // Add custom items
    if (items.length > 0) {
      if (menuItems.length > 0) {
        menuItems.push({ type: 'separator' });
      }
      menuItems.push(...items);
    }

    // Apply beforeShow hook
    if (beforeShow) {
      const result = beforeShow(context);
      if (result === false) {
        return [];
      }
      menuItems = result;
    }

    return menuItems;
  }

  function showMenu(event: MouseEvent): void {
    if (!enabled || !_ctx) return;

    const context = buildMenuContext(event);
    const menuItems = getMenuItems(context);

    if (menuItems.length === 0) return;

    state = {
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      items: menuItems,
      submenuPath: [],
      context
    };

    renderer?.show(state);
  }

  function hideMenu(): void {
    state = {
      ...state,
      visible: false,
      context: null
    };

    renderer?.hide();
    afterHide?.();
  }

  function handleItemClick(item: MenuItem, context: MenuContext): void {
    hideMenu();

    if (item.type === 'separator' || item.type === 'submenu') {
      return;
    }

    if (item.type === 'checkbox' && item.onChange) {
      item.onChange(!item.checked, context);
      return;
    }

    if (item.type === 'radio' && item.onChange) {
      item.onChange(item.value, context);
      return;
    }

    // Action item
    const actionItem = item as MenuActionItem;
    
    if (actionItem.onClick) {
      actionItem.onClick(context);
    } else if (actionItem.action) {
      executeAction(actionItem.action, context);
    }
  }

  // ============================================
  // Event Handlers
  // ============================================

  function handleContextMenu(e: MouseEvent): void {
    if (!showOnRightClick) return;
    
    if (preventDefault) {
      e.preventDefault();
    }

    showMenu(e);
  }

  function handleTouchStart(e: TouchEvent): void {
    if (!showOnLongPress) return;

    const touch = e.touches[0];
    longPressStart = { x: touch.clientX, y: touch.clientY };

    longPressTimer = setTimeout(() => {
      if (longPressStart) {
        const syntheticEvent = new MouseEvent('contextmenu', {
          clientX: longPressStart.x,
          clientY: longPressStart.y
        });
        showMenu(syntheticEvent);
      }
    }, longPressDuration);
  }

  function handleTouchMove(e: TouchEvent): void {
    if (!longPressStart || !longPressTimer) return;

    const touch = e.touches[0];
    const dx = touch.clientX - longPressStart.x;
    const dy = touch.clientY - longPressStart.y;

    // Cancel if moved too far
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      longPressStart = null;
    }
  }

  function handleTouchEnd(): void {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    longPressStart = null;
  }

  // ============================================
  // Plugin Implementation
  // ============================================

  return {
    manifest: manifestContextMenu,

    onInit(ctx: PluginContext) {
      _ctx = ctx;

      const container = ctx.ui.container;

      renderer = new MenuRenderer(
        container,
        style,
        zIndex,
        handleItemClick
      );

      // Attach event listeners
      container.addEventListener('contextmenu', handleContextMenu);
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
      container.addEventListener('touchend', handleTouchEnd);

      ctx.log.info('ContextMenu plugin initialized');
    },

    onDestroy() {
      const container = _ctx?.ui.container;

      if (container) {
        container.removeEventListener('contextmenu', handleContextMenu);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }

      renderer?.destroy();
      renderer = null;
      _ctx = null;
    },

    api: {
      /**
       * Show the context menu programmatically
       */
      show(x: number, y: number, customItems?: MenuItem[]) {
        const event = new MouseEvent('contextmenu', { clientX: x, clientY: y });
        const context = buildMenuContext(event);
        
        state = {
          visible: true,
          position: { x, y },
          items: customItems || getMenuItems(context),
          submenuPath: [],
          context
        };

        renderer?.show(state);
      },

      /**
       * Hide the context menu
       */
      hide() {
        hideMenu();
      },

      /**
       * Check if menu is visible
       */
      isVisible(): boolean {
        return renderer?.isVisible() ?? false;
      },

      /**
       * Update menu items dynamically
       */
      setItems(newItems: MenuItem[]) {
        // Update for next show
        (config as any).items = newItems;
      },

      /**
       * Enable/disable the menu
       */
      setEnabled(value: boolean) {
        (config as any).enabled = value;
      },

      /**
       * Update styling
       */
      setStyle(newStyle: typeof style) {
        renderer?.updateStyle(newStyle || {});
      },

      /**
       * Get available built-in actions
       */
      getBuiltinActions(): BuiltinAction[] {
        return [
          'zoomToFit', 'zoomIn', 'zoomOut', 'resetView',
          'panMode', 'boxZoomMode', 'selectMode',
          'exportCSV', 'exportJSON', 'exportImage', 'copyToClipboard',
          'toggleLegend', 'toggleGrid', 'toggleCrosshair',
          'addHorizontalLine', 'addVerticalLine', 'addTextAnnotation', 'clearAnnotations',
          'showStats'
        ];
      }
    }
  };
}

export default PluginContextMenu;
