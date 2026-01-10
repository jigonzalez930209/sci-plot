/**
 * ChartLegend - In-chart draggable legend component
 */

import { ChartTheme } from "../theme";
import { Series } from "./Series";

export interface ChartLegendCallbacks {
  onMove: (x: number, y: number) => void;
  onResize?: (width: number) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

export class ChartLegend {
  private container: HTMLDivElement;
  private visualContainer: HTMLDivElement;
  private header: HTMLDivElement;
  private content: HTMLDivElement;
  private theme: ChartTheme;
  private series: Series[] = [];
  private callbacks: ChartLegendCallbacks;

  private isDragging = false;
  private isResizing = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  constructor(
    parent: HTMLElement,
    theme: ChartTheme,
    options: { x?: number; y?: number; width?: number },
    callbacks: ChartLegendCallbacks
  ) {
    this.theme = theme;
    this.callbacks = callbacks;

    const width = options.width ?? 120;

    this.container = document.createElement("div");
    this.container.className = "scichart-legend";

    // Default position (top-right, below controls toolbar)
    // Controls toolbar height is ~32px (24px buttons + 4px padding*2 + borders) + 8px top margin = ~40px
    // Add extra margin to ensure no overlap
    const x = options.x ?? parent.clientWidth - 150;
    const y = options.y ?? 55;

    this.container.style.cssText = `
      position: absolute;
      left: ${x - 4}px;
      top: ${y - 4}px;
      z-index: 90;
      pointer-events: auto;
      padding: 4px;
      user-select: none;
    `;

    this.visualContainer = document.createElement("div");
    this.visualContainer.style.cssText = `
      width: ${width}px;
      border-radius: ${theme.legend.borderRadius}px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: box-shadow 0.2s ease;
      position: relative;
    `;
    this.container.appendChild(this.visualContainer);

    this.updateStyle();

    // Draggable header
    this.header = document.createElement("div");
    this.header.style.cssText = `
      height: 8px;
      cursor: move;
      background: rgba(255,255,255,0.05);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    `;

    this.content = document.createElement("div");
    this.content.style.padding = `${theme.legend.padding}px`;

    this.visualContainer.appendChild(this.header);
    this.visualContainer.appendChild(this.content);
    
    // Resize handle
    const resizeHandle = document.createElement("div");
    resizeHandle.style.cssText = `
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 8px;
      cursor: ew-resize;
      background: transparent;
      z-index: 10;
    `;
    this.visualContainer.appendChild(resizeHandle);

    parent.appendChild(this.container);

    this.initDragging(resizeHandle);
  }

  private updateStyle(): void {
    const isDark =
      this.theme.name.toLowerCase().includes("dark") ||
      this.theme.name.toLowerCase().includes("midnight") ||
      this.theme.name.toLowerCase().includes("electro");

    const glassBg = this.theme.legend.backgroundColor;
    const glassBorder = `1px solid ${this.theme.legend.borderColor}`;

    this.visualContainer.style.background = glassBg;
    this.visualContainer.style.backdropFilter = "blur(2px) saturate(180%)";
    (this.visualContainer.style as any).webkitBackdropFilter =
      "blur(2px) saturate(180%)";
    this.visualContainer.style.border = glassBorder;
    this.visualContainer.style.boxShadow = isDark
      ? "0 4px 12px rgba(0, 0, 0, 0.6)"
      : "0 4px 12px rgba(0, 0, 0, 0.15)";

    this.container.onmouseenter = () => {
      this.visualContainer.style.backdropFilter = "blur(10px) saturate(180%)";
      (this.visualContainer.style as any).webkitBackdropFilter = "blur(10px) saturate(180%)";
      if (this.callbacks.onHoverStart) this.callbacks.onHoverStart();
    };
    this.container.onmouseleave = () => {
      this.visualContainer.style.backdropFilter = "blur(2px) saturate(180%)";
      (this.visualContainer.style as any).webkitBackdropFilter = "blur(2px) saturate(180%)";
      if (this.callbacks.onHoverEnd) this.callbacks.onHoverEnd();
    };
  }

  private initDragging(resizeHandle: HTMLDivElement): void {
    let rafId: number | null = null;
    let currentX = 0;
    let currentY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const rect = this.container.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
      this.isDragging = true;
      if (this.callbacks.onInteractionStart) this.callbacks.onInteractionStart();

      this.container.style.transition = "none";
      this.container.style.willChange = "left, top";
      this.visualContainer.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
      this.container.style.cursor = "grabbing";

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const onResizeMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      this.isResizing = true;
      this.dragOffsetX = e.clientX; // Store initial mouse X
      this.dragOffsetY = this.visualContainer.clientWidth; // Store initial width
      if (this.callbacks.onInteractionStart) this.callbacks.onInteractionStart();

      this.container.style.transition = "none";
      this.container.style.cursor = "ew-resize";
      document.body.style.cursor = "ew-resize";

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const updatePosition = () => {
      const parentRect = this.container.parentElement?.getBoundingClientRect();
      if (!parentRect) return;

      if (this.isDragging) {
        let newX = currentX - parentRect.left - this.dragOffsetX;
        let newY = currentY - parentRect.top - this.dragOffsetY;

        newX = Math.max(0, Math.min(newX, parentRect.width - this.container.clientWidth));
        newY = Math.max(0, Math.min(newY, parentRect.height - this.container.clientHeight));

        this.container.style.left = `${newX}px`;
        this.container.style.top = `${newY}px`;
      } else if (this.isResizing) {
        const deltaX = currentX - this.dragOffsetX;
        const newWidth = Math.max(80, Math.min(600, this.dragOffsetY + deltaX));
        this.visualContainer.style.width = `${newWidth}px`;
        if (this.callbacks.onResize) this.callbacks.onResize(newWidth);
      }
      rafId = null;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging && !this.isResizing) return;
      currentX = e.clientX;
      currentY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(updatePosition);
      }
    };

    const onMouseUp = () => {
      if (this.isDragging || this.isResizing) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;

        if (this.isDragging) {
          const rect = this.container.getBoundingClientRect();
          const parentRect = this.container.parentElement?.getBoundingClientRect();
          if (parentRect) {
            this.callbacks.onMove(rect.left - parentRect.left, rect.top - parentRect.top);
          }
        }

        this.isDragging = false;
        this.isResizing = false;
        if (this.callbacks.onInteractionEnd) this.callbacks.onInteractionEnd();
        this.container.style.willChange = "auto";
        this.container.style.transition = "box-shadow 0.2s ease";
        this.visualContainer.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        this.container.style.cursor = "auto";
        document.body.style.cursor = "auto";
      }
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    this.header.addEventListener("mousedown", onMouseDown);
    resizeHandle.addEventListener("mousedown", onResizeMouseDown);

    // Block events from reaching the chart while over the legend
    // but ALLOW propagation when dragging/resizing so the document listeners work
    this.container.addEventListener("wheel", (e) => e.stopPropagation());
    this.container.addEventListener("click", (e) => e.stopPropagation());
    this.container.addEventListener("dblclick", (e) => e.stopPropagation());
    
    const stopIfNoDrag = (e: Event) => {
      if (!this.isDragging && !this.isResizing) {
        e.stopPropagation();
      }
    };

    this.container.addEventListener("mousemove", stopIfNoDrag);
    this.container.addEventListener("pointermove", stopIfNoDrag);
    this.container.addEventListener("pointerdown", stopIfNoDrag);
  }

  public update(series: Series[]): void {
    this.series = series;
    this.render();
  }

  private render(): void {
    this.content.innerHTML = "";
    const legend = this.theme.legend;
    const dpr = window.devicePixelRatio || 1;

    this.series.forEach((s) => {
      const item = document.createElement("div");
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: ${legend.itemGap}px;
        font-family: ${legend.fontFamily};
        font-size: ${legend.fontSize}px;
        color: ${legend.textColor};
        width: 100%;
        overflow: hidden;
      `;

      // Use a canvas for the swatch to support symbols
      const swatch = document.createElement("canvas");
      const size = legend.swatchSize;
      swatch.width = size * dpr;
      swatch.height = size * dpr;
      swatch.style.width = `${size}px`;
      swatch.style.height = `${size}px`;

      const ctx = swatch.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        const style = s.getStyle();
        const color = style.color || "#ff0055";
        const type = s.getType();
        const symbol = style.symbol || 'circle';
        
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        const centerX = size / 2;
        const centerY = size / 2;

        const typeStr = String(type).toLowerCase();
        const isScatter = typeStr === 'scatter' || typeStr === '1' || (typeStr === 'line' && !!style.symbol);
        const isLineScatter = typeStr.includes('scatter') || typeStr === '2';
        const isArea = typeStr === 'area' || typeStr === 'band';

        if (isScatter) {
          this.drawSymbol(ctx, symbol, centerX, centerY, size * 0.8);
        } else if (isLineScatter) {
          ctx.beginPath();
          ctx.moveTo(0, centerY);
          ctx.lineTo(size, centerY);
          ctx.stroke();
          this.drawSymbol(ctx, symbol, centerX, centerY, size * 0.6);
        } else if (isArea) {
          ctx.globalAlpha = 0.6;
          ctx.fillRect(0, size * 0.2, size, size * 0.6);
          ctx.globalAlpha = 1.0;
          ctx.strokeRect(0, size * 0.2, size, size * 0.6);
        } else if (typeStr === 'candlestick') {
          const bullColor = (style as any).bullishColor || '#26a69a';
          ctx.fillStyle = bullColor;
          ctx.fillRect(size * 0.3, size * 0.2, size * 0.4, size * 0.6);
          ctx.beginPath();
          ctx.moveTo(size * 0.5, 0);
          ctx.lineTo(size * 0.5, size);
          ctx.strokeStyle = bullColor;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, centerY);
          ctx.lineTo(size, centerY);
          ctx.stroke();
        }
      }

      const label = document.createElement("span");
      label.textContent = s.getName();
      label.title = s.getName(); // Tooltip on hover
      label.style.cssText = `
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      `;

      item.appendChild(swatch);
      item.appendChild(label);
      this.content.appendChild(item);
    });
  }

  /**
   * Internal symbol drawing logic (shared with canvas export)
   */
  private drawSymbol(
    ctx: CanvasRenderingContext2D,
    symbol: string,
    x: number,
    y: number,
    size: number
  ): void {
    const r = size / 2;
    ctx.beginPath();

    switch (symbol) {
      case 'circle':
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.rect(x - r, y - r, size, size);
        ctx.fill();
        break;
      case 'diamond':
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r, y);
        ctx.closePath();
        ctx.fill();
        break;
      case 'triangle':
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y + r);
        ctx.lineTo(x - r, y + r);
        ctx.closePath();
        ctx.fill();
        break;
      case 'triangleDown':
        ctx.moveTo(x, y + r);
        ctx.lineTo(x + r, y - r);
        ctx.lineTo(x - r, y - r);
        ctx.closePath();
        ctx.fill();
        break;
      case 'cross':
        ctx.moveTo(x - r, y);
        ctx.lineTo(x + r, y);
        ctx.moveTo(x, y - r);
        ctx.lineTo(x, y + r);
        ctx.stroke();
        break;
      case 'x':
        const d = r * 0.707;
        ctx.moveTo(x - d, y - d);
        ctx.lineTo(x + d, y + d);
        ctx.moveTo(x + d, y - d);
        ctx.lineTo(x - d, y + d);
        ctx.stroke();
        break;
      case 'star':
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(
            x + r * Math.cos(((18 + i * 72) / 180) * Math.PI),
            y - r * Math.sin(((18 + i * 72) / 180) * Math.PI)
          );
          ctx.lineTo(
            x + (r / 2) * Math.cos(((54 + i * 72) / 180) * Math.PI),
            y - (r / 2) * Math.sin(((54 + i * 72) / 180) * Math.PI)
          );
        }
        ctx.closePath();
        ctx.fill();
        break;
    }
  }

  public draw(ctx: CanvasRenderingContext2D, dpr: number): void {
    if (this.series.length === 0) return;

    const legend = this.theme.legend;
    const padding = legend.padding * dpr;
    const itemGap = legend.itemGap * dpr;
    const swatchSize = legend.swatchSize * dpr;
    const headerHeight = 8 * dpr;

    const x = this.container.offsetLeft * dpr;
    const y = this.container.offsetTop * dpr;
    const width = this.container.clientWidth * dpr;
    const height = this.container.clientHeight * dpr;

    ctx.save();

    // 1. Draw background
    const isDark =
      this.theme.name.toLowerCase().includes("dark") ||
      this.theme.name.toLowerCase().includes("midnight");
    ctx.fillStyle = isDark
      ? legend.backgroundColor
      : "rgba(255, 255, 255, 0.85)";
    ctx.strokeStyle = legend.borderColor;
    ctx.lineWidth = 1 * dpr;

    const r = legend.borderRadius * dpr;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Draw Items
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `${legend.fontSize * dpr}px ${legend.fontFamily}`;

    this.series.forEach((s, i) => {
      const itemY =
        y +
        headerHeight +
        padding +
        i * (swatchSize + itemGap) +
        swatchSize / 2;
      
      const centerX = x + padding + swatchSize / 2;
      const centerY = itemY;
      const style = s.getStyle();
      const type = s.getType();
      const symbol = style.symbol || 'circle';

      ctx.fillStyle = style.color || "#ff0055";
      ctx.strokeStyle = style.color || "#ff0055";
      ctx.lineWidth = 2 * dpr;

      const typeStr = String(type).toLowerCase();
      const isScatter = typeStr === 'scatter' || typeStr === '1' || (typeStr === 'line' && !!style.symbol);
      const isLineScatter = typeStr.includes('scatter') || typeStr === '2';

      if (isScatter) {
        this.drawSymbol(ctx, symbol, centerX, centerY, swatchSize * 0.9);
      } else if (isLineScatter) {
        ctx.beginPath();
        ctx.moveTo(x + padding, centerY);
        ctx.lineTo(x + padding + swatchSize, centerY);
        ctx.stroke();
        this.drawSymbol(ctx, symbol, centerX, centerY, swatchSize * 0.6);
      } else {
        ctx.beginPath();
        ctx.moveTo(x + padding, centerY);
        ctx.lineTo(x + padding + swatchSize, centerY);
        ctx.stroke();
      }

      ctx.fillStyle = legend.textColor;
      ctx.fillText(s.getName(), x + padding + swatchSize + 8 * dpr, itemY);
    });

    ctx.restore();
  }

  public updateTheme(theme: ChartTheme): void {
    this.theme = theme;
    this.updateStyle();
    this.render();
  }

  public setWidth(width: number): void {
    this.visualContainer.style.width = `${width}px`;
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? "block" : "none";
  }

  public destroy(): void {
    this.container.remove();
  }
}
