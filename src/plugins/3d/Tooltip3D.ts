/**
 * 3D Tooltip for displaying information on hover.
 * Creates a DOM element that follows the mouse and shows data.
 */

export interface Tooltip3DOptions {
  /** CSS class for the tooltip container */
  className?: string;
  /** Offset from cursor in pixels */
  offsetX?: number;
  offsetY?: number;
  /** Custom formatter function */
  formatter?: (data: Tooltip3DData) => string;
  /** Show position coordinates */
  showPosition?: boolean;
  /** Show value/scale */
  showScale?: boolean;
  /** Show index */
  showIndex?: boolean;
  /** Decimal places for numbers */
  decimals?: number;
}

export interface Tooltip3DData {
  index: number;
  position: [number, number, number];
  color?: [number, number, number];
  scale?: number;
  customData?: Record<string, any>;
}

export class Tooltip3D {
  private container: HTMLElement;
  private element: HTMLElement;
  private options: Required<Omit<Tooltip3DOptions, 'formatter'>> & { formatter?: (data: Tooltip3DData) => string };
  private visible = false;
  
  constructor(container: HTMLElement, options: Tooltip3DOptions = {}) {
    this.container = container;
    this.options = {
      className: options.className ?? 'tooltip-3d',
      offsetX: options.offsetX ?? 15,
      offsetY: options.offsetY ?? 15,
      showPosition: options.showPosition ?? true,
      showScale: options.showScale ?? false,
      showIndex: options.showIndex ?? true,
      decimals: options.decimals ?? 2,
      formatter: options.formatter,
    };
    
    // Create tooltip element
    this.element = document.createElement('div');
    this.element.className = this.options.className;
    this.element.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 1000;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      border-radius: 6px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.15s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    document.body.appendChild(this.element);
  }
  
  /**
   * Show tooltip with data at screen position.
   */
  show(data: Tooltip3DData, screenX: number, screenY: number): void {
    const content = this.options.formatter
      ? this.options.formatter(data)
      : this.defaultFormat(data);
    
    this.element.innerHTML = content;
    this.visible = true;
    
    // Position relative to container
    const containerRect = this.container.getBoundingClientRect();
    const x = containerRect.left + screenX + this.options.offsetX;
    const y = containerRect.top + screenY + this.options.offsetY;
    
    // Keep within viewport
    const elementRect = this.element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let finalX = x;
    let finalY = y;
    
    if (x + elementRect.width > viewportWidth - 10) {
      finalX = x - elementRect.width - this.options.offsetX * 2;
    }
    if (y + elementRect.height > viewportHeight - 10) {
      finalY = y - elementRect.height - this.options.offsetY * 2;
    }
    
    this.element.style.left = `${finalX}px`;
    this.element.style.top = `${finalY}px`;
    this.element.style.opacity = '1';
  }
  
  /**
   * Hide the tooltip.
   */
  hide(): void {
    this.visible = false;
    this.element.style.opacity = '0';
  }
  
  /**
   * Check if tooltip is visible.
   */
  isVisible(): boolean {
    return this.visible;
  }
  
  /**
   * Default formatting for tooltip content.
   */
  private defaultFormat(data: Tooltip3DData): string {
    const lines: string[] = [];
    const d = this.options.decimals;
    
    if (this.options.showIndex) {
      lines.push(`<strong>Point ${data.index}</strong>`);
    }
    
    if (this.options.showPosition) {
      lines.push(`X: ${data.position[0].toFixed(d)}`);
      lines.push(`Y: ${data.position[1].toFixed(d)}`);
      lines.push(`Z: ${data.position[2].toFixed(d)}`);
    }
    
    if (this.options.showScale && data.scale !== undefined) {
      lines.push(`Size: ${data.scale.toFixed(d)}`);
    }
    
    // Color indicator
    if (data.color) {
      const r = Math.round(data.color[0] * 255);
      const g = Math.round(data.color[1] * 255);
      const b = Math.round(data.color[2] * 255);
      lines.push(`<span style="display:inline-block;width:12px;height:12px;background:rgb(${r},${g},${b});border-radius:2px;vertical-align:middle;margin-right:4px"></span>RGB(${r}, ${g}, ${b})`);
    }
    
    // Custom data
    if (data.customData) {
      for (const [key, value] of Object.entries(data.customData)) {
        lines.push(`${key}: ${value}`);
      }
    }
    
    return lines.join('<br>');
  }
  
  /**
   * Update tooltip position (for mouse move without data change).
   */
  updatePosition(screenX: number, screenY: number): void {
    if (!this.visible) return;
    
    const containerRect = this.container.getBoundingClientRect();
    const x = containerRect.left + screenX + this.options.offsetX;
    const y = containerRect.top + screenY + this.options.offsetY;
    
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }
  
  /**
   * Destroy the tooltip.
   */
  destroy(): void {
    this.element.remove();
  }
}

/**
 * Create a hover handler for bubble charts.
 * Returns a function to attach to mouse move events.
 */
export function createHoverHandler(
  renderer: any, // Bubble3DRenderer
  tooltip: Tooltip3D,
  options: {
    debounceMs?: number;
    onHover?: (hit: { index: number; data: any } | null) => void;
  } = {}
): (event: MouseEvent) => void {
  let lastHitIndex = -1;
  let debounceTimer: number | null = null;
  const debounceMs = options.debounceMs ?? 16; // ~60fps
  
  return (event: MouseEvent) => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = window.setTimeout(() => {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const hit = renderer.pickAtScreen(x, y);
      
      if (hit) {
        if (hit.index !== lastHitIndex) {
          lastHitIndex = hit.index;
          
          const bubbleData = renderer.getBubbleData(hit.index);
          if (bubbleData) {
            tooltip.show({
              index: hit.index,
              position: bubbleData.position,
              color: bubbleData.color,
              scale: bubbleData.scale,
            }, x, y);
            
            options.onHover?.({
              index: hit.index,
              data: bubbleData,
            });
          }
        } else {
          tooltip.updatePosition(x, y);
        }
      } else {
        if (lastHitIndex !== -1) {
          tooltip.hide();
          lastHitIndex = -1;
          options.onHover?.(null);
        }
      }
      
      debounceTimer = null;
    }, debounceMs);
  };
}
