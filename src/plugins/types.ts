/**
 * SciChart Engine - Plugin System Types
 * 
 * Comprehensive type definitions for the extensible plugin architecture.
 * Designed to allow third-party developers to extend the chart with
 * almost any functionality imaginable.
 * 
 * @module plugins/types
 */

import type { Chart } from "../core/chart/types";
import type { Series } from "../core/Series";
import type { Bounds, SeriesData, ChartEventMap } from "../types";
import type { Annotation } from "../core/annotations";
import type { SelectedPoint } from "../core/selection";
import type { ChartTheme } from "../theme";

// ============================================
// Plugin Manifest & Metadata
// ============================================

/**
 * Plugin semantic version (major.minor.patch)
 */
export type PluginVersion = `${number}.${number}.${number}`;

/**
 * Plugin capability identifiers
 * Plugins can declare what features they provide
 */
export type PluginCapability =
    | "analysis"           // Data analysis (FFT, filters, etc.)
    | "visualization"      // Custom rendering/overlays
    | "interaction"        // Custom tool/interaction modes
    | "data-source"        // Data streaming/loading
    | "export"             // Custom export formats
    | "ui"                 // Custom UI components
    | "annotation"         // Custom annotation types
    | "theme"              // Theme extensions
    | string;              // Allow custom capabilities

/**
 * Plugin manifest with metadata
 */
export interface PluginManifest {
    /** Unique plugin identifier (e.g., '@myorg/fft-plugin') */
    name: string;

    /** Plugin version following semver */
    version: PluginVersion;

    /** Human-readable description */
    description?: string;

    /** Author name or organization */
    author?: string;

    /** URL for documentation or homepage */
    homepage?: string;

    /** License identifier (e.g., 'MIT', 'Apache-2.0') */
    license?: string;

    /** Capabilities this plugin provides */
    provides?: PluginCapability[];

    /** Required plugins that must be loaded first */
    dependencies?: string[];

    /** Optional plugins that enhance this one if present */
    optionalDependencies?: string[];

    /** Minimum SciChart Engine version required */
    engineVersion?: PluginVersion;

    /** Plugin-specific configuration schema (JSON Schema format) */
    configSchema?: Record<string, unknown>;

    /** Tags for discovery/categorization */
    tags?: string[];
}

// ============================================
// Plugin Context - Access to Chart Internals
// ============================================

/**
 * Read-only access to chart rendering context
 */
export interface RenderContext {
    /** WebGL rendering context */
    readonly gl?: WebGLRenderingContext | WebGL2RenderingContext;

    /** Overlay 2D canvas context */
    readonly ctx2d?: CanvasRenderingContext2D;

    /** Current device pixel ratio */
    readonly pixelRatio: number;

    /** Current canvas dimensions */
    readonly canvasSize: { width: number; height: number };

    /** Current plot area bounds */
    readonly plotArea: { x: number; y: number; width: number; height: number };
}

/**
 * Coordinate conversion utilities
 */
export interface CoordinateContext {
    /** Convert data X to pixel X */
    dataToPixelX(dataX: number): number;

    /** Convert data Y to pixel Y */
    dataToPixelY(dataY: number, yAxisId?: string): number;

    /** Convert pixel X to data X */
    pixelToDataX(pixelX: number): number;

    /** Convert pixel Y to data Y */
    pixelToDataY(pixelY: number, yAxisId?: string): number;

    /** Get data point at pixel position */
    pickPoint(pixelX: number, pixelY: number, radius?: number): PickResult | null;
}

/**
 * Result from coordinate picking
 */
export interface PickResult {
    seriesId: string;
    index: number;
    x: number;
    y: number;
    pixelX: number;
    pixelY: number;
    distance: number;
}

/**
 * Data access context for plugins
 */
export interface DataContext {
    /** Get all series in the chart */
    getAllSeries(): readonly Series[];

    /** Get specific series by ID */
    getSeries(id: string): Series | undefined;

    /** Get series data as typed arrays */
    getSeriesData(id: string): Readonly<SeriesData> | undefined;

    /** Get visible data bounds */
    getViewBounds(): Readonly<Bounds>;

    /** Get data bounds for a specific Y axis */
    getYAxisBounds(yAxisId?: string): { yMin: number; yMax: number };

    /** Get all annotations */
    getAnnotations(): readonly Annotation[];

    /** Get selected points */
    getSelectedPoints(): readonly SelectedPoint[];
}

/**
 * UI context for plugins that need to add UI elements
 */
export interface UIContext {
    /** Chart container element */
    readonly container: HTMLDivElement;

    /** Create a plugin UI container (positioned over chart) */
    createOverlay(id: string, options?: OverlayOptions): HTMLDivElement;

    /** Remove a plugin UI overlay */
    removeOverlay(id: string): boolean;

    /** Get existing overlay by ID */
    getOverlay(id: string): HTMLDivElement | undefined;

    /** Show a notification/toast message */
    showNotification(message: string, options?: NotificationOptions): void;

    /** Current theme */
    readonly theme: Readonly<ChartTheme>;
}

export interface OverlayOptions {
    /** Z-index order (default: 1000) */
    zIndex?: number;
    /** CSS class name */
    className?: string;
    /** Initial position */
    position?: { top?: string; right?: string; bottom?: string; left?: string };
    /** Whether overlay should intercept pointer events (default: false) */
    pointerEvents?: boolean;
}

export interface NotificationOptions {
    type?: "info" | "success" | "warning" | "error";
    duration?: number; // ms, 0 = persistent
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

/**
 * Event context for plugins
 */
export interface EventContext {
    /** Subscribe to chart events */
    on<K extends keyof ChartEventMap>(
        event: K,
        handler: (data: ChartEventMap[K]) => void
    ): () => void; // Returns unsubscribe function

    /** Subscribe once to chart events */
    once<K extends keyof ChartEventMap>(
        event: K,
        handler: (data: ChartEventMap[K]) => void
    ): () => void;

    /** Emit custom plugin events */
    emit(event: string, data?: unknown): void;

    /** Listen to custom plugin events */
    onPlugin(event: string, handler: (data: unknown) => void): () => void;
}

/**
 * Complete plugin context provided to plugins
 */
export interface PluginContext {
    /** The chart instance (full API) */
    readonly chart: Chart;

    /** Rendering context access */
    readonly render: RenderContext;

    /** Coordinate conversion */
    readonly coords: CoordinateContext;

    /** Data access */
    readonly data: DataContext;

    /** UI management */
    readonly ui: UIContext;

    /** Event handling */
    readonly events: EventContext;

    /** Plugin storage (persisted with chart state) */
    readonly storage: PluginStorage;

    /** Logger namespaced to plugin */
    readonly log: PluginLogger;

    /** Access other loaded plugins */
    getPlugin<T extends ChartPlugin = ChartPlugin>(name: string): T | undefined;

    /** Request a re-render */
    requestRender(): void;

    /** Schedule work on next frame */
    requestAnimationFrame(callback: () => void): number;

    /** Cancel scheduled work */
    cancelAnimationFrame(id: number): void;
}

/**
 * Plugin-scoped storage
 */
export interface PluginStorage {
    /** Get a stored value */
    get<T>(key: string): T | undefined;

    /** Set a value */
    set<T>(key: string, value: T): void;

    /** Remove a value */
    remove(key: string): void;

    /** Clear all plugin storage */
    clear(): void;

    /** Get all storage keys */
    keys(): string[];
}

/**
 * Plugin-scoped logger
 */
export interface PluginLogger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}

// ============================================
// Hook Event Data
// ============================================

/**
 * Data passed to beforeRender hook
 */
export interface BeforeRenderEvent {
    /** Current timestamp */
    timestamp: number;
    /** Time since last render (ms) */
    deltaTime: number;
    /** Current frame number */
    frameNumber: number;
    /** Whether this is a forced render */
    forced: boolean;
}

/**
 * Data passed to afterRender hook
 */
export interface AfterRenderEvent extends BeforeRenderEvent {
    /** Render duration (ms) */
    renderTime: number;
}

/**
 * Data passed to interaction hooks
 */
export interface InteractionEvent {
    /** Event type */
    type: "mousedown" | "mouseup" | "mousemove" | "wheel" | "click" | "dblclick" | "contextmenu";
    /** Pixel coordinates */
    pixelX: number;
    pixelY: number;
    /** Data coordinates (if in plot area) */
    dataX?: number;
    dataY?: number;
    /** Whether event is inside plot area */
    inPlotArea: boolean;
    /** Original DOM event */
    originalEvent: MouseEvent | WheelEvent;
    /** Prevent default chart handling */
    preventDefault(): void;
    /** Whether default was prevented */
    readonly defaultPrevented: boolean;
}

/**
 * Data passed to zoom/pan hooks  
 */
export interface ViewChangeEvent {
    /** Previous bounds */
    previous: Readonly<Bounds>;
    /** New bounds */
    current: Readonly<Bounds>;
    /** Change trigger */
    trigger: "zoom" | "pan" | "autoScale" | "reset" | "api";
    /** Whether animated */
    animated: boolean;
}

/**
 * Data passed to series change hooks
 */
export interface SeriesChangeEvent {
    /** The series that changed */
    series: Series;
    /** Change type */
    changeType: "add" | "remove" | "update" | "style" | "visibility";
}

/**
 * Data passed to data update hooks
 */
export interface DataUpdateEvent {
    /** Series ID */
    seriesId: string;
    /** Whether data was appended or replaced */
    mode: "append" | "replace";
    /** Number of points added/changed */
    pointCount: number;
    /** New data bounds */
    bounds: Readonly<Bounds>;
}

// ============================================
// Plugin Interface
// ============================================

/**
 * Main plugin interface
 * 
 * Plugins can implement any subset of these hooks.
 * All hooks receive the PluginContext as first argument.
 */
export interface ChartPlugin<TConfig = unknown> {
    // ============================================
    // Required
    // ============================================

    /** Plugin manifest with metadata */
    readonly manifest: PluginManifest;

    // ============================================
    // Lifecycle Hooks
    // ============================================

    /**
     * Called when plugin is attached to chart
     * Use for initial setup, event subscriptions, UI creation
     */
    onInit?(ctx: PluginContext, config?: TConfig): void | Promise<void>;

    /**
     * Called when plugin is about to be removed
     * Clean up resources, remove UI elements, unsubscribe events
     */
    onDestroy?(ctx: PluginContext): void;

    /**
     * Called when plugin configuration changes
     */
    onConfigChange?(ctx: PluginContext, newConfig: TConfig, oldConfig: TConfig): void;

    // ============================================
    // Render Hooks
    // ============================================

    /**
     * Called before each render cycle
     * Can be used to prepare data or skip render
     * Return false to skip this frame
     */
    onBeforeRender?(ctx: PluginContext, event: BeforeRenderEvent): boolean | void;

    /**
     * Called after WebGL rendering, before overlay rendering
     * Use for custom WebGL-based rendering
     */
    onRenderWebGL?(ctx: PluginContext, event: AfterRenderEvent): void;

    /**
     * Called after overlay rendering
     * Use for custom 2D canvas rendering
     */
    onRenderOverlay?(ctx: PluginContext, event: AfterRenderEvent): void;

    /**
     * Called after all rendering is complete
     */
    onAfterRender?(ctx: PluginContext, event: AfterRenderEvent): void;

    // ============================================
    // Data Hooks
    // ============================================

    /**
     * Called when any series data changes
     */
    onDataUpdate?(ctx: PluginContext, event: DataUpdateEvent): void;

    /**
     * Called when a series is added
     */
    onSeriesAdd?(ctx: PluginContext, event: SeriesChangeEvent): void;

    /**
     * Called when a series is removed
     */
    onSeriesRemove?(ctx: PluginContext, event: SeriesChangeEvent): void;

    /**
     * Called when series style/visibility changes
     */
    onSeriesChange?(ctx: PluginContext, event: SeriesChangeEvent): void;

    // ============================================
    // View Hooks
    // ============================================

    /**
     * Called when view bounds change (zoom/pan)
     */
    onViewChange?(ctx: PluginContext, event: ViewChangeEvent): void;

    /**
     * Called when chart is resized
     */
    onResize?(ctx: PluginContext, size: { width: number; height: number }): void;

    /**
     * Called when theme changes
     */
    onThemeChange?(ctx: PluginContext, theme: ChartTheme): void;

    // ============================================
    // Interaction Hooks
    // ============================================

    /**
     * Called for all mouse/touch interactions
     * Return false to prevent default chart handling
     */
    onInteraction?(ctx: PluginContext, event: InteractionEvent): boolean | void;

    /**
     * Called when selection changes
     */
    onSelectionChange?(ctx: PluginContext, points: readonly SelectedPoint[]): void;

    // ============================================
    // Serialization Hooks
    // ============================================

    /**
     * Called when chart state is being serialized
     * Return plugin-specific state to include
     */
    onSerialize?(ctx: PluginContext): unknown;

    /**
     * Called when chart state is being deserialized
     * Restore plugin state from saved data
     */
    onDeserialize?(ctx: PluginContext, data: unknown): void;

    // ============================================
    // Extension Points
    // ============================================

    /**
     * Expose public API for other plugins or user code
     * Accessible via ctx.getPlugin<MyPlugin>('my-plugin').api
     */
    readonly api?: Record<string, unknown>;
}

// ============================================
// Plugin Factory
// ============================================

/**
 * Factory function to create plugin instances
 * Useful for plugins that need configuration
 */
export type PluginFactory<TConfig = unknown> = (
    config?: TConfig
) => ChartPlugin<TConfig>;

/**
 * Type helper for creating typed plugin factories
 */
export type TypedPlugin<T extends ChartPlugin> = T;

// ============================================
// Plugin Manager Interface
// ============================================

/**
 * Plugin manager interface
 */
export interface PluginManager {
    /** Register a plugin */
    use<TConfig>(
        plugin: ChartPlugin<TConfig> | PluginFactory<TConfig>,
        config?: TConfig
    ): Promise<void>;

    /** Remove a plugin by name */
    remove(name: string): Promise<boolean>;

    /** Get a plugin by name */
    get<T extends ChartPlugin = ChartPlugin>(name: string): T | undefined;

    /** Check if a plugin is loaded */
    has(name: string): boolean;

    /** Get all loaded plugin names */
    getNames(): string[];

    /** Get all loaded plugin manifests */
    getManifests(): PluginManifest[];

    /** Update plugin configuration */
    configure<TConfig>(name: string, config: TConfig): void;

    /** Notify all plugins of an event */
    notify(hook: string, ...args: unknown[]): void;

    /** Destroy all plugins and cleanup */
    destroy(): void;
}

// ============================================
// Global Plugin Registry
// ============================================

/**
 * Registration entry for global plugin registry
 */
export interface PluginRegistryEntry {
    manifest: PluginManifest;
    factory: PluginFactory;
}

/**
 * Global plugin registry for third-party plugins
 */
export interface PluginRegistry {
    /** Register a plugin globally */
    register(entry: PluginRegistryEntry): void;

    /** Unregister a plugin */
    unregister(name: string): boolean;

    /** Get a registered plugin factory */
    get(name: string): PluginFactory | undefined;

    /** List all registered plugins */
    list(): PluginManifest[];

    /** Search plugins by capability */
    findByCapability(capability: PluginCapability): PluginManifest[];

    /** Search plugins by tag */
    findByTag(tag: string): PluginManifest[];
}
