/**
 * ChartControls - In-chart control buttons (Plotly-style)
 *
 * Provides a floating glassmorphism toolbar for chart controls:
 * - Pan/Zoom mode toggle
 * - Reset Zoom
 * - Display Mode (Line, Scatter, Both)
 * - Smoothing toggle
 */

import { ChartTheme } from "../theme";
import type { InteractionMode } from "./InteractionManager";
import { ToolbarOptions, ToolbarButtons } from "../types";

export interface ChartControlsCallbacks {
  onResetZoom: () => void;
  onSetType: (type: "line" | "scatter" | "line+scatter") => void;
  onToggleSmoothing: () => void;
  onTogglePan: (active: boolean) => void;
  onSetMode: (mode: InteractionMode) => void;
  onExport: () => void;
  onAutoScale: () => void;
  onToggleLegend: (visible: boolean) => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

// ============================================
// SVG Icons (Plotly-inspired)
// ============================================

const ICONS = {
  PAN: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path></svg>`,
  BOX_ZOOM: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2"></rect><circle cx="9" cy="9" r="3"></circle><line x1="21" y1="21" x2="15" y2="15"></line></svg>`,
  SELECT: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="1" stroke-dasharray="4 2"></rect><circle cx="8" cy="10" r="1.5" fill="currentColor"></circle><circle cx="12" cy="14" r="1.5" fill="currentColor"></circle><circle cx="16" cy="9" r="1.5" fill="currentColor"></circle></svg>`,
  DELTA: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="20" y2="4" stroke-dasharray="4 2"></line><circle cx="4" cy="20" r="2" fill="currentColor"></circle><circle cx="20" cy="4" r="2" fill="currentColor"></circle><path d="M8 16h8M16 16v-8" stroke-width="1" opacity="0.5"></path></svg>`,
  RESET: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  LINE: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>`,
  SCATTER: `<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><circle cx="7" cy="14" r="2"></circle><circle cx="11" cy="10" r="2"></circle><circle cx="15" cy="13" r="2"></circle><circle cx="19" cy="8" r="2"></circle><path d="M3 3v18h18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
  BOTH: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path><circle cx="7" cy="14.3" r="1" fill="currentColor"></circle><circle cx="10.8" cy="10.5" r="1" fill="currentColor"></circle><circle cx="13.6" cy="13.2" r="1" fill="currentColor"></circle><circle cx="18.7" cy="8" r="1" fill="currentColor"></circle></svg>`,
  SMOOTH: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c.5 0 .9-.3 1.2-.7l1.6-2.6c.3-.4.7-.7 1.2-.7h2c.5 0 .9.3 1.2.7l1.6 2.6c.3.4.7.7 1.2.7h2c.5 0 .9-.3 1.2-.7l1.6-2.6c.3-.4.7-.7 1.2-.7h2"></path></svg>`,
  AUTOSCALE: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
  EXPORT: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  LEGEND: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h7"></path></svg>`,
  INTEGRATE: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16c3-9 15-9 18 0"></path><line x1="3" y1="16" x2="21" y2="16"></line><path d="M7 16v-4M12 16V9M17 16v-4" stroke-width="1" opacity="0.5"></path></svg>`,
  PIN: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a3 3 0 0 0-6 0v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"></path></svg>`,
  PIN_OFF: `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="2" x2="22" y2="22"></line><line x1="12" y1="17" x2="12" y2="22"></line><path d="M9 10.76V6a3 3 0 0 1 1.43-2.54m2.68.74A3 3 0 0 1 15 6v4.76a2 2 0 0 0 1.11 1.79l1.78.9A2 2 0 0 1 19 15.24V17h-2"></path><path d="M5 17h8"></path></svg>`
};

export class ChartControls {
  private container: HTMLDivElement;
  private toolbar: HTMLDivElement;
  private buttonsWrapper: HTMLDivElement;
  private callbacks: ChartControlsCallbacks;
  private theme: ChartTheme;
  private options: ToolbarOptions;

  private isSmoothing = false;
  private currentMode: InteractionMode = 'pan';
  private isLegendVisible = true;
  private currentType: "line" | "scatter" | "line+scatter" = "line";
  private isPinned = false;
  private isExpanded = false;

  constructor(
    parent: HTMLElement,
    theme: ChartTheme,
    callbacks: ChartControlsCallbacks,
    options?: ToolbarOptions
  ) {
    this.callbacks = callbacks;
    this.theme = theme;
    this.options = options || {};

    this.isPinned = this.options.pinnable === false;
    this.isExpanded = this.isPinned;
    this.callbacks = callbacks;
    this.theme = theme;

    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: absolute;
      top: 2px;
      right: 2px;
      z-index: 100;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    `;

    this.toolbar = document.createElement("div");
    this.toolbar.className = "velo-plot-modebar";
    
    this.buttonsWrapper = document.createElement("div");
    this.buttonsWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 2px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    this.updateToolbarStyle();

    this.createButtons();
    this.toolbar.appendChild(this.buttonsWrapper);
    
    if (this.options.pinnable !== false) {
      this.createPinButton();
    }

    this.container.appendChild(this.toolbar);
    parent.appendChild(this.container);
    
    this.updateVisibility();
  }

  private isDarkTheme(): boolean {
    const name = this.theme.name.toLowerCase();
    return (
      name.includes("dark") ||
      name.includes("midnight") ||
      name.includes("electro")
    );
  }

  private updateToolbarStyle(): void {
    const isDark = this.isDarkTheme();

    const shadow = isDark
      ? "0 4px 12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)"
      : "0 4px 12px rgba(0, 0, 0, 0.15)";
    
    // Stop pointer events from reaching the chart, but ALLOW release events
    const stopPropagation = (e: Event) => e.stopPropagation();
    ["mousedown", "mousemove", "pointerdown", "pointermove", "wheel", "touchstart", "touchmove"].forEach(
      (evt) => this.container.addEventListener(evt, stopPropagation)
    );

    const glassBg = this.theme.toolbar.backgroundColor;
    const glassBorder = `1px solid ${this.theme.toolbar.borderColor}`;
    const borderRadius = `${this.theme.toolbar.borderRadius}px`;

    this.toolbar.style.cssText = `
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 0;
      background: ${glassBg};
      backdrop-filter: blur(2px) saturate(180%);
      -webkit-backdrop-filter: blur(2px) saturate(180%);
      border: ${glassBorder};
      border-radius: ${borderRadius};
      box-shadow: ${shadow};
      transition: all 0.3s cubic-bezier(0.4, 0, 0.4, 1);
    `;

    this.toolbar.onmouseenter = () => {
      this.toolbar.style.backdropFilter = "blur(10px) saturate(180%)";
      (this.toolbar.style as any).webkitBackdropFilter = "blur(10px) saturate(180%)";
      
      this.callbacks.onHoverStart();
      
      if (this.options.pinnable !== false) {
        this.isExpanded = true;
        this.updateVisibility();
      }
    };
    this.toolbar.onmouseleave = () => {
      this.toolbar.style.backdropFilter = "blur(2px) saturate(180%)";
      (this.toolbar.style as any).webkitBackdropFilter = "blur(2px) saturate(180%)";
      
      this.callbacks.onHoverEnd();
      
      if (this.options.pinnable !== false) {
        this.isExpanded = false;
        this.updateVisibility();
      }
    };

  }

  private updateVisibility(): void {
    if (this.options.pinnable === false) return;

    const visible = this.isExpanded || this.isPinned;
    this.buttonsWrapper.style.maxWidth = visible ? "500px" : "0px";
    this.buttonsWrapper.style.opacity = visible ? "1" : "0";
    this.buttonsWrapper.style.pointerEvents = visible ? "auto" : "none";
    this.buttonsWrapper.style.marginRight = visible ? "4px" : "0px";
  }

  private createButtons(): void {
    const b = this.options.buttons || {};
    const show = (id: keyof ToolbarButtons, def = true) => b[id] ?? def;

    // Pan Mode
    if (show('pan')) {
      this.createButton(
        ICONS.PAN,
        "Pan Mode (drag to move)",
        () => {
          this.currentMode = 'pan';
          this.updateButtonStates();
          this.callbacks.onSetMode('pan');
        },
        "pan"
      );
    }

    // Box Zoom Mode
    if (show('boxZoom')) {
      this.createButton(
        ICONS.BOX_ZOOM,
        "Box Zoom (drag to zoom)",
        () => {
          this.currentMode = 'boxZoom';
          this.updateButtonStates();
          this.callbacks.onSetMode('boxZoom');
        },
        "boxZoom"
      );
    }

    // Selection Mode
    if (show('select')) {
      this.createButton(
        ICONS.SELECT,
        "Select Points (drag to select)",
        () => {
          this.currentMode = 'select';
          this.updateButtonStates();
          this.callbacks.onSetMode('select');
        },
        "select"
      );
    }

    // Delta Tool Mode
    if (show('delta')) {
      this.createButton(
        ICONS.DELTA,
        "Delta Tool (measure distances)",
        () => {
          this.currentMode = 'delta';
          this.updateButtonStates();
          this.callbacks.onSetMode('delta');
        },
        "delta"
      );
    }

    // Peak integration Mode
    if (show('peak')) {
      this.createButton(
        ICONS.INTEGRATE,
        "Peak Integration (detect baseline & calculate area)",
        () => {
          this.currentMode = 'peak';
          this.updateButtonStates();
          this.callbacks.onSetMode('peak');
        },
        "peak"
      );
    }

    // Reset Zoom
    if (show('reset', false)) {
      this.createButton(
        ICONS.RESET,
        "Reset Zoom",
        () => this.callbacks.onResetZoom(),
        "reset"
      );
    }

    // Auto Scale
    if (show('autoscale')) {
      this.createButton(
        ICONS.AUTOSCALE,
        "Auto Scale",
        () => this.callbacks.onAutoScale(),
        "autoscale"
      );
    }

    // Type Switcher
    if (show('type')) {
      this.createButton(
        ICONS.LINE,
        "Toggle Line/Scatter/Both",
        () => {
          const types: ("line" | "scatter" | "line+scatter")[] = [
            "line",
            "scatter",
            "line+scatter",
          ];
          const nextIdx = (types.indexOf(this.currentType) + 1) % types.length;
          this.currentType = types[nextIdx];
          this.callbacks.onSetType(this.currentType);
          this.updateButtonStates();
        },
        "type"
      );
    }

    // Smoothing
    if (show('smooth')) {
      this.createButton(
        ICONS.SMOOTH,
        "Automated Smoothing",
        () => {
          this.isSmoothing = !this.isSmoothing;
          this.updateButtonStates();
          this.callbacks.onToggleSmoothing();
        },
        "smooth"
      );
    }

    // Export Image
    if (show('export')) {
      this.createButton(
        ICONS.EXPORT,
        "Export as PNG",
        () => this.callbacks.onExport(),
        "export"
      );
    }

    // Toggle Legend
    if (show('legend')) {
      this.createButton(
        ICONS.LEGEND,
        "Toggle Legend",
        () => {
          this.isLegendVisible = !this.isLegendVisible;
          this.updateButtonStates();
          this.callbacks.onToggleLegend(this.isLegendVisible);
        },
        "legend"
      );
    }
  }

  private createPinButton(): void {
    const btn = this.createButton(
      this.isPinned ? ICONS.PIN : ICONS.PIN_OFF,
      this.isPinned ? "Unpin Toolbar" : "Pin Toolbar",
      () => {
        this.isPinned = !this.isPinned;
        btn.innerHTML = `<span class="velo-plot-control-icon">${this.isPinned ? ICONS.PIN : ICONS.PIN_OFF}</span>`;
        this.enforceSVGVisibility(btn);
        this.updateVisibility();
      },
      "pin",
      this.toolbar
    );
    btn.style.marginLeft = "2px";
  }

  private enforceSVGVisibility(btn: HTMLButtonElement): void {
    // Force SVG visibility and make sure currentColor is applied even under aggressive page CSS
    const icon = btn.querySelector<HTMLElement>(".velo-plot-control-icon");
    if (icon) {
      icon.style.display = "flex";
      icon.style.alignItems = "center";
      icon.style.justifyContent = "center";
      icon.style.width = "100%";
      icon.style.height = "100%";
      icon.style.pointerEvents = "none";
    }

    const svgEl = btn.querySelector<SVGElement>("svg");
    if (svgEl) {
      svgEl.setAttribute("width", "14");
      svgEl.setAttribute("height", "14");
      (svgEl as any).style.display = "block";
      (svgEl as any).style.overflow = "visible";
      (svgEl as any).style.color = "inherit";
      (svgEl as any).style.stroke = "currentColor";
      if (!svgEl.getAttribute("fill")) {
        (svgEl as any).style.fill = "none";
      }
    }
  }

  private createButton(
    svg: string,
    title: string,
    onClick: () => void,
    id: string,
    parent: HTMLElement = this.buttonsWrapper
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.innerHTML = `<span class="velo-plot-control-icon">${svg}</span>`;
    btn.title = title;
    btn.dataset.id = id;

    const isDark = this.isDarkTheme();
    const color = isDark ? "#ffffff" : "#1e293b";

    btn.style.cssText = `
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: ${color};
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0.9;
    `;

    btn.onmouseenter = () => {
      btn.style.opacity = "1";
      btn.style.background = isDark
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(0, 0, 0, 0.1)";
      btn.style.transform = "translateY(-1px)";
      btn.style.boxShadow = isDark
        ? "0 2px 4px rgba(0,0,0,0.4)"
        : "0 2px 4px rgba(0,0,0,0.1)";
    };
    btn.onmouseleave = () => {
      btn.style.transform = "none";
      btn.style.boxShadow = "none";
      this.updateButtonStates();
    };
    btn.onclick = onClick;

    // Force SVG visibility
    this.enforceSVGVisibility(btn);

    parent.appendChild(btn);
    return btn;
  }

  private updateButtonStates(): void {
    const buttons = this.toolbar.querySelectorAll("button");
    const isDark = this.isDarkTheme();

    const panActiveColor = "#38bdf8"; // Brighter blue for pan
    const zoomActiveColor = "#f59e0b"; // Orange for box zoom
    const selectActiveColor = "#a855f7"; // Purple for selection
    const smoothActiveColor = "#fb7185"; // Brighter pink
    const legendActiveColor = "#4ade80"; // Brighter green
    const normalColor = isDark ? "#f1f5f9" : "#334155"; // High contrast

    buttons.forEach((btn: HTMLButtonElement) => {
      const id = btn.dataset.id;
      const isHover = btn.matches(":hover");

      // Mode buttons (pan, boxZoom, select) - only one can be active
      if (id === "pan") {
        const isActive = this.currentMode === 'pan';
        btn.style.color = isActive ? panActiveColor : normalColor;
        btn.style.opacity = isHover || isActive ? "1" : "0.8";
        btn.style.background = isActive
          ? (isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(56, 189, 248, 0.1)")
          : "transparent";
      } else if (id === "boxZoom") {
        const isActive = this.currentMode === 'boxZoom';
        btn.style.color = isActive ? zoomActiveColor : normalColor;
        btn.style.opacity = isHover || isActive ? "1" : "0.8";
        btn.style.background = isActive
          ? (isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.1)")
          : "transparent";
      } else if (id === "select") {
        const isActive = this.currentMode === 'select';
        btn.style.color = isActive ? selectActiveColor : normalColor;
        btn.style.opacity = isHover || isActive ? "1" : "0.8";
        btn.style.background = isActive
          ? (isDark ? "rgba(168, 85, 247, 0.15)" : "rgba(168, 85, 247, 0.1)")
          : "transparent";
      } else if (id === "delta") {
        const isActive = this.currentMode === 'delta';
        const deltaActiveColor = "#ef4444"; // Red for delta
        btn.style.color = isActive ? deltaActiveColor : normalColor;
        btn.style.opacity = isHover || isActive ? "1" : "0.8";
        btn.style.background = isActive
          ? (isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)")
          : "transparent";
      } else if (id === "peak") {
        const isActive = this.currentMode === 'peak';
        const peakActiveColor = "#10b981"; // Green for peak/integrate
        btn.style.color = isActive ? peakActiveColor : normalColor;
        btn.style.opacity = isHover || isActive ? "1" : "0.8";
        btn.style.background = isActive
          ? (isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)")
          : "transparent";
      } else if (id === "smooth") {
        btn.style.color = this.isSmoothing ? smoothActiveColor : normalColor;
        btn.style.opacity = isHover || this.isSmoothing ? "1" : "0.8";
        if (this.isSmoothing) {
          btn.style.background = isDark
            ? "rgba(251, 113, 133, 0.15)"
            : "rgba(251, 113, 133, 0.1)";
        } else if (!isHover) {
          btn.style.background = "transparent";
        }
      } else if (id === "legend") {
        btn.style.color = this.isLegendVisible ? legendActiveColor : normalColor;
        btn.style.opacity = isHover || this.isLegendVisible ? "1" : "0.8";
        if (this.isLegendVisible) {
          btn.style.background = isDark
            ? "rgba(74, 222, 128, 0.15)"
            : "rgba(74, 222, 128, 0.1)";
        } else if (!isHover) {
          btn.style.background = "transparent";
        }
      } else if (id === "type") {
        btn.innerHTML =
          this.currentType === "line"
            ? ICONS.LINE
            : this.currentType === "scatter"
            ? ICONS.SCATTER
            : ICONS.BOTH;
        // Reapply SVG visibility styles after changing innerHTML
        this.enforceSVGVisibility(btn);
        btn.style.color = normalColor;
        btn.style.opacity = isHover ? "1" : "0.8";
        if (!isHover) {
          btn.style.background = "transparent";
        }
      } else if (id === "reset" || id === "autoscale" || id === "export") {
        btn.style.color = normalColor;
        btn.style.opacity = isHover ? "1" : "0.8";
        if (!isHover) {
          btn.style.background = "transparent";
        }
      }
    });
  }

  public updateTheme(theme: ChartTheme): void {
    this.theme = theme;
    this.updateToolbarStyle();
    this.updateButtonStates();
  }

  public destroy(): void {
    this.container.remove();
  }
}
