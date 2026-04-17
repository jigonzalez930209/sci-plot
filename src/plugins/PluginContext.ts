/**
 * Sci Plot - Plugin Context Implementation
 * 
 * Provides the comprehensive context object that gives plugins
 * access to all chart functionality in a controlled manner.
 * 
 * @module plugins/PluginContext
 */

import type { Chart } from "../core/chart/types";
import type { Bounds, ChartEventMap } from "../types";
import type { ChartTheme } from "../theme";
import type {
    PluginContext,
    RenderContext,
    CoordinateContext,
    DataContext,
    UIContext,
    EventContext,
    PluginStorage,
    PluginLogger,
    OverlayOptions,
    NotificationOptions,
    PickResult,
    ChartPlugin,
} from "./types";

// ============================================
// Plugin Storage Implementation
// ============================================

class PluginStorageImpl implements PluginStorage {
    private data = new Map<string, unknown>();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_pluginName: string) {
        // Plugin name available for future use (e.g., namespaced localStorage)
    }

    get<T>(key: string): T | undefined {
        return this.data.get(key) as T | undefined;
    }

    set<T>(key: string, value: T): void {
        this.data.set(key, value);
    }

    remove(key: string): void {
        this.data.delete(key);
    }

    clear(): void {
        this.data.clear();
    }

    keys(): string[] {
        return Array.from(this.data.keys());
    }

    // Internal: serialize for chart state
    _serialize(): Record<string, unknown> {
        const obj: Record<string, unknown> = {};
        this.data.forEach((v, k) => {
            obj[k] = v;
        });
        return obj;
    }

    // Internal: restore from chart state
    _deserialize(data: Record<string, unknown>): void {
        this.data.clear();
        Object.entries(data).forEach(([k, v]) => {
            this.data.set(k, v);
        });
    }
}

// ============================================
// Plugin Logger Implementation
// ============================================

class PluginLoggerImpl implements PluginLogger {
    private prefix: string;
    private enabled: boolean;

    constructor(pluginName: string, enabled = true) {
        this.prefix = `[SciPlot:${pluginName}]`;
        this.enabled = enabled;
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.enabled) {
            console.debug(this.prefix, message, ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.enabled) {
            console.info(this.prefix, message, ...args);
        }
    }

    warn(message: string, ...args: unknown[]): void {
        console.warn(this.prefix, message, ...args);
    }

    error(message: string, ...args: unknown[]): void {
        console.error(this.prefix, message, ...args);
    }
}

// ============================================
// Event Context Implementation
// ============================================

class EventContextImpl implements EventContext {
    private chart: Chart;
    private subscriptions: Array<() => void> = [];
    private customListeners = new Map<string, Set<(data: unknown) => void>>();

    constructor(chart: Chart) {
        this.chart = chart;
    }

    on<K extends keyof ChartEventMap>(
        event: K,
        handler: (data: ChartEventMap[K]) => void
    ): () => void {
        this.chart.on(event, handler);
        const unsubscribe = () => this.chart.off(event, handler);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }

    once<K extends keyof ChartEventMap>(
        event: K,
        handler: (data: ChartEventMap[K]) => void
    ): () => void {
        const wrapped = (data: ChartEventMap[K]) => {
            handler(data);
            this.chart.off(event, wrapped);
        };
        this.chart.on(event, wrapped);
        return () => this.chart.off(event, wrapped);
    }

    emit(event: string, data?: unknown): void {
        const listeners = this.customListeners.get(event);
        if (listeners) {
            listeners.forEach((handler) => {
                try {
                    handler(data);
                } catch (e) {
                    console.error(`[SciPlot] Error in plugin event handler for "${event}":`, e);
                }
            });
        }
    }

    onPlugin(event: string, handler: (data: unknown) => void): () => void {
        if (!this.customListeners.has(event)) {
            this.customListeners.set(event, new Set());
        }
        this.customListeners.get(event)!.add(handler);
        return () => {
            this.customListeners.get(event)?.delete(handler);
        };
    }

    // Internal: cleanup all subscriptions
    _cleanup(): void {
        this.subscriptions.forEach((unsub) => unsub());
        this.subscriptions = [];
        this.customListeners.clear();
    }
}

// ============================================
// UI Context Implementation
// ============================================

class UIContextImpl implements UIContext {
    private _container: HTMLDivElement;
    private _theme: ChartTheme;
    private overlays = new Map<string, HTMLDivElement>();
    private notifications: HTMLDivElement | null = null;

    constructor(container: HTMLDivElement, theme: ChartTheme) {
        this._container = container;
        this._theme = theme;
    }

    get container(): HTMLDivElement {
        return this._container;
    }

    get theme(): Readonly<ChartTheme> {
        return this._theme;
    }

    updateTheme(theme: ChartTheme): void {
        this._theme = theme;
    }

    createOverlay(id: string, options: OverlayOptions = {}): HTMLDivElement {
        if (this.overlays.has(id)) {
            return this.overlays.get(id)!;
        }

        const overlay = document.createElement("div");
        overlay.id = `sci-plot-plugin-${id}`;
        overlay.className = options.className || "";
        overlay.style.cssText = `
      position: absolute;
      ${options.position?.top !== undefined ? `top: ${options.position.top};` : ""}
      ${options.position?.right !== undefined ? `right: ${options.position.right};` : ""}
      ${options.position?.bottom !== undefined ? `bottom: ${options.position.bottom};` : ""}
      ${options.position?.left !== undefined ? `left: ${options.position.left};` : ""}
      z-index: ${options.zIndex ?? 1000};
      pointer-events: ${options.pointerEvents ? "auto" : "none"};
    `;

        this._container.appendChild(overlay);
        this.overlays.set(id, overlay);
        return overlay;
    }

    removeOverlay(id: string): boolean {
        const overlay = this.overlays.get(id);
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
            this.overlays.delete(id);
            return true;
        }
        return false;
    }

    getOverlay(id: string): HTMLDivElement | undefined {
        return this.overlays.get(id);
    }

    showNotification(message: string, options: NotificationOptions = {}): void {
        const {
            type = "info",
            duration = 3000,
            position = "top-right",
        } = options;

        // Create notifications container if needed
        if (!this.notifications) {
            this.notifications = document.createElement("div");
            this.notifications.className = "sci-plot-notifications";
            this.notifications.style.cssText = `
        position: absolute;
        ${position.includes("top") ? "top: 10px;" : "bottom: 10px;"}
        ${position.includes("right") ? "right: 10px;" : "left: 10px;"}
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
            this._container.appendChild(this.notifications);
        }

        // Create notification element
        const notification = document.createElement("div");
        notification.className = `sci-plot-notification sci-plot-notification-${type}`;

        const colors = {
            info: { bg: "#3b82f6", text: "#fff" },
            success: { bg: "#22c55e", text: "#fff" },
            warning: { bg: "#f59e0b", text: "#000" },
            error: { bg: "#ef4444", text: "#fff" },
        };

        const color = colors[type];
        notification.style.cssText = `
      padding: 10px 16px;
      border-radius: 6px;
      background: ${color.bg};
      color: ${color.text};
      font-family: system-ui, sans-serif;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      pointer-events: auto;
      opacity: 0;
      transform: translateX(20px);
      transition: all 0.3s ease;
    `;
        notification.textContent = message;

        this.notifications.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = "1";
            notification.style.transform = "translateX(0)";
        });

        // Auto-remove
        if (duration > 0) {
            setTimeout(() => {
                notification.style.opacity = "0";
                notification.style.transform = "translateX(20px)";
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    }

    // Internal: cleanup all overlays
    _cleanup(): void {
        this.overlays.forEach((overlay) => overlay.remove());
        this.overlays.clear();
        this.notifications?.remove();
        this.notifications = null;
    }
}

// ============================================
// Context Builder
// ============================================

export interface ContextDependencies {
    chart: Chart;
    container: HTMLDivElement;
    theme: ChartTheme;
    getGL?: () => WebGLRenderingContext | WebGL2RenderingContext | undefined;
    get2DContext?: () => CanvasRenderingContext2D | undefined;
    getPixelRatio: () => number;
    getCanvasSize: () => { width: number; height: number };
    getPlotArea: () => { x: number; y: number; width: number; height: number };
    getViewBounds: () => Bounds;
    getYAxisBounds: (yAxisId?: string) => { yMin: number; yMax: number };
    dataToPixelX: (x: number) => number;
    dataToPixelY: (y: number, yAxisId?: string) => number;
    pixelToDataX: (px: number) => number;
    pixelToDataY: (py: number, yAxisId?: string) => number;
    findNearestPoint?: (px: number, py: number, radius?: number) => PickResult | null;
    getPlugin: (name: string) => ChartPlugin | undefined;
}

/**
 * Create a complete plugin context from chart dependencies
 */
export function createPluginContext(
    pluginName: string,
    deps: ContextDependencies
): PluginContext & { _cleanup: () => void; _getStorage: () => PluginStorageImpl } {
    const storage = new PluginStorageImpl(pluginName);
    const log = new PluginLoggerImpl(pluginName);
    const events = new EventContextImpl(deps.chart);
    const ui = new UIContextImpl(deps.container, deps.theme);

    const render: RenderContext = {
        get gl() {
            return deps.getGL?.();
        },
        get ctx2d() {
            return deps.get2DContext?.();
        },
        get pixelRatio() {
            return deps.getPixelRatio();
        },
        get canvasSize() {
            return deps.getCanvasSize();
        },
        get plotArea() {
            return deps.getPlotArea();
        },
    };

    const coords: CoordinateContext = {
        dataToPixelX: deps.dataToPixelX,
        dataToPixelY: deps.dataToPixelY,
        pixelToDataX: deps.pixelToDataX,
        pixelToDataY: deps.pixelToDataY,
        pickPoint: (px, py, radius = 20) => deps.findNearestPoint?.(px, py, radius) ?? null,
    };

    const data: DataContext = {
        getAllSeries: () => deps.chart.getAllSeries(),
        getSeries: (id) => deps.chart.getSeries(id),
        getSeriesData: (id) => {
            const series = deps.chart.getSeries(id);
            if (!series) return undefined;
            return series.getData();
        },
        getViewBounds: () => deps.getViewBounds(),
        getYAxisBounds: (yAxisId) => deps.getYAxisBounds(yAxisId),
        getAnnotations: () => deps.chart.getAnnotations(),
        getSelectedPoints: () => deps.chart.getSelectedPoints(),
    };

    let animFrameIds = new Set<number>();

    const context: PluginContext & { _cleanup: () => void; _getStorage: () => PluginStorageImpl } = {
        chart: deps.chart,
        render,
        coords,
        data,
        ui,
        events,
        storage,
        log,

        getPlugin<T extends ChartPlugin>(name: string): T | undefined {
            return deps.getPlugin(name) as T | undefined;
        },

        requestRender() {
            deps.chart.render();
        },

        requestAnimationFrame(callback: () => void): number {
            const id = window.requestAnimationFrame(callback);
            animFrameIds.add(id);
            return id;
        },

        cancelAnimationFrame(id: number): void {
            window.cancelAnimationFrame(id);
            animFrameIds.delete(id);
        },

        _cleanup() {
            events._cleanup();
            ui._cleanup();
            animFrameIds.forEach((id) => window.cancelAnimationFrame(id));
            animFrameIds.clear();
        },

        _getStorage() {
            return storage;
        },
    };

    return context;
}
