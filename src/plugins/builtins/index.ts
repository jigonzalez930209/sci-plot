/**
 * SciChart Engine - Built-in Plugins
 * 
 * Collection of official plugins that demonstrate the plugin system
 * capabilities and provide common functionality.
 * 
 * @module plugins/builtins
 */

import type {
    PluginContext,
    PluginManifest,
    AfterRenderEvent,
    InteractionEvent,
    ViewChangeEvent,
    DataUpdateEvent,
} from "../types";
import { definePlugin } from "../PluginRegistry";

// ============================================
// Crosshair Plugin
// ============================================

export interface CrosshairPluginConfig {
    /** Show vertical line (default: true) */
    showVertical?: boolean;
    /** Show horizontal line (default: true) */
    showHorizontal?: boolean;
    /** Line color (default: from theme) */
    color?: string;
    /** Line style (default: 'dashed') */
    lineStyle?: "solid" | "dashed" | "dotted";
    /** Line width (default: 1) */
    lineWidth?: number;
    /** Show axis labels (default: true) */
    showAxisLabels?: boolean;
    /** Snap to nearest data point (default: false) */
    snapToData?: boolean;
}

const crosshairManifest: PluginManifest = {
    name: "crosshair",
    version: "1.0.0",
    description: "Interactive crosshair that follows mouse cursor",
    provides: ["interaction", "visualization"],
    tags: ["cursor", "crosshair", "tooltip"],
};

export const CrosshairPlugin = definePlugin<CrosshairPluginConfig>(
    crosshairManifest,
    (config = {}) => {
        const {
            showVertical = true,
            showHorizontal = true,
            color,
            lineStyle = "dashed",
            lineWidth = 1,
            showAxisLabels = true,
            snapToData = false,
        } = config;

        let cursorX = -1;
        let cursorY = -1;
        let overlayId: string;
        let canvas: HTMLCanvasElement | null = null;
        let ctx: CanvasRenderingContext2D | null = null;

        return {
            onInit(pluginCtx: PluginContext) {
                overlayId = "crosshair-overlay";
                const overlay = pluginCtx.ui.createOverlay(overlayId, {
                    zIndex: 500,
                    position: { top: "0", left: "0", right: "0", bottom: "0" },
                });

                canvas = document.createElement("canvas");
                canvas.style.cssText = "width: 100%; height: 100%;";
                overlay.appendChild(canvas);

                ctx = canvas.getContext("2d");
                resizeCanvas(pluginCtx);
            },

            onDestroy(pluginCtx: PluginContext) {
                pluginCtx.ui.removeOverlay(overlayId);
                canvas = null;
                ctx = null;
            },

            onResize(pluginCtx: PluginContext) {
                resizeCanvas(pluginCtx);
            },

            onInteraction(pluginCtx: PluginContext, event: InteractionEvent) {
                if (event.type === "mousemove") {
                    cursorX = event.pixelX;
                    cursorY = event.pixelY;

                    if (snapToData && event.inPlotArea) {
                        const nearest = pluginCtx.coords.pickPoint(cursorX, cursorY);
                        if (nearest) {
                            cursorX = nearest.pixelX;
                            cursorY = nearest.pixelY;
                        }
                    }

                    render(pluginCtx);
                }
            },

            onViewChange() {
                // Re-render on zoom/pan
                if (cursorX >= 0 && cursorY >= 0) {
                    // Will be re-rendered on next frame
                }
            },
        };

        function resizeCanvas(pluginCtx: PluginContext) {
            if (!canvas || !ctx) return;
            const size = pluginCtx.render.canvasSize;
            const dpr = pluginCtx.render.pixelRatio;
            canvas.width = size.width * dpr;
            canvas.height = size.height * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
        }

        function render(pluginCtx: PluginContext) {
            if (!ctx || !canvas) return;

            const { width, height } = pluginCtx.render.canvasSize;
            ctx.clearRect(0, 0, width, height);

            if (cursorX < 0 || cursorY < 0) return;

            const plotArea = pluginCtx.render.plotArea;
            if (
                cursorX < plotArea.x ||
                cursorX > plotArea.x + plotArea.width ||
                cursorY < plotArea.y ||
                cursorY > plotArea.y + plotArea.height
            ) {
                return;
            }

            const lineColor = color || (pluginCtx.ui.theme.cursor as unknown as Record<string, unknown>)?.color as string || "#888888";

            ctx.save();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lineWidth;

            if (lineStyle === "dashed") {
                ctx.setLineDash([6, 4]);
            } else if (lineStyle === "dotted") {
                ctx.setLineDash([2, 2]);
            }

            // Vertical line
            if (showVertical) {
                ctx.beginPath();
                ctx.moveTo(cursorX, plotArea.y);
                ctx.lineTo(cursorX, plotArea.y + plotArea.height);
                ctx.stroke();
            }

            // Horizontal line
            if (showHorizontal) {
                ctx.beginPath();
                ctx.moveTo(plotArea.x, cursorY);
                ctx.lineTo(plotArea.x + plotArea.width, cursorY);
                ctx.stroke();
            }

            ctx.restore();

            // Axis labels
            if (showAxisLabels) {
                drawAxisLabels(pluginCtx, ctx, cursorX, cursorY, lineColor);
            }
        }

        function drawAxisLabels(
            pluginCtx: PluginContext,
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            bgColor: string
        ) {
            const dataX = pluginCtx.coords.pixelToDataX(x);
            const dataY = pluginCtx.coords.pixelToDataY(y);
            const plotArea = pluginCtx.render.plotArea;

            ctx.save();
            ctx.font = "11px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";

            // X axis label
            const xText = dataX.toPrecision(4);
            const xMetrics = ctx.measureText(xText);
            const xLabelWidth = xMetrics.width + 8;
            const xLabelHeight = 18;
            const xLabelX = x - xLabelWidth / 2;
            const xLabelY = plotArea.y + plotArea.height + 2;

            ctx.fillStyle = bgColor;
            ctx.fillRect(xLabelX, xLabelY, xLabelWidth, xLabelHeight);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(xText, x, xLabelY + 3);

            // Y axis label
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            const yText = dataY.toPrecision(4);
            const yMetrics = ctx.measureText(yText);
            const yLabelWidth = yMetrics.width + 8;
            const yLabelHeight = 18;
            const yLabelX = plotArea.x - yLabelWidth - 2;
            const yLabelY = y - yLabelHeight / 2;

            ctx.fillStyle = bgColor;
            ctx.fillRect(yLabelX, yLabelY, yLabelWidth, yLabelHeight);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(yText, plotArea.x - 6, y);

            ctx.restore();
        }
    }
);

// ============================================
// Statistics Overlay Plugin
// ============================================

export interface StatsPluginConfig {
    /** Position of the stats overlay */
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    /** Which stats to show */
    show?: Array<"count" | "mean" | "min" | "max" | "std" | "range">;
    /** Series ID to compute stats for (default: all) */
    seriesId?: string;
    /** Update on every data change (default: true) */
    autoUpdate?: boolean;
}

const statsManifest: PluginManifest = {
    name: "statistics-overlay",
    version: "1.0.0",
    description: "Displays real-time statistics for chart data",
    provides: ["visualization", "analysis"],
    tags: ["statistics", "overlay", "analytics"],
};

export const StatsPlugin = definePlugin<StatsPluginConfig>(
    statsManifest,
    (config = {}) => {
        const {
            position = "top-right",
            show = ["count", "mean", "min", "max"],
            seriesId,
            autoUpdate = true,
        } = config;

        let overlayId: string;
        let container: HTMLDivElement | null = null;

        return {
            onInit(ctx: PluginContext) {
                overlayId = "stats-overlay";
                const posStyle: Record<string, string> = {};

                if (position.includes("top")) posStyle.top = "10px";
                if (position.includes("bottom")) posStyle.bottom = "10px";
                if (position.includes("left")) posStyle.left = "10px";
                if (position.includes("right")) posStyle.right = "10px";

                container = ctx.ui.createOverlay(overlayId, {
                    zIndex: 800,
                    position: posStyle,
                    pointerEvents: false,
                });

                container.innerHTML = `
          <div style="
            background: rgba(0, 0, 0, 0.85);
            color: #fff;
            padding: 10px 14px;
            border-radius: 6px;
            font-family: ui-monospace, monospace;
            font-size: 12px;
            line-height: 1.6;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          ">
            <div style="font-weight: bold; margin-bottom: 4px; color: #4ade80;">📊 Statistics</div>
            <div class="stats-content"></div>
          </div>
        `;

                updateStats(ctx);
            },

            onDestroy(ctx: PluginContext) {
                ctx.ui.removeOverlay(overlayId);
                container = null;
            },

            onDataUpdate(ctx: PluginContext) {
                if (autoUpdate) {
                    updateStats(ctx);
                }
            },

            onSeriesAdd(ctx: PluginContext) {
                updateStats(ctx);
            },

            onSeriesRemove(ctx: PluginContext) {
                updateStats(ctx);
            },

            api: {
                refresh(ctx: PluginContext) {
                    updateStats(ctx);
                },
            },
        };

        function updateStats(ctx: PluginContext) {
            if (!container) return;

            const content = container.querySelector(".stats-content");
            if (!content) return;

            const allSeries = ctx.data.getAllSeries();
            const targetSeries = seriesId
                ? allSeries.filter((s) => s.getId() === seriesId)
                : allSeries;

            if (targetSeries.length === 0) {
                content.innerHTML = "<div style='color: #888'>No data</div>";
                return;
            }

            // Aggregate all Y data
            let allY: number[] = [];
            targetSeries.forEach((series) => {
                const data = series.getData();
                if (data?.y) {
                    allY = allY.concat(Array.from(data.y));
                }
            });

            if (allY.length === 0) {
                content.innerHTML = "<div style='color: #888'>No data</div>";
                return;
            }

            const stats = computeStats(allY);
            const lines: string[] = [];

            if (show.includes("count")) {
                lines.push(`<div>N: <span style="color: #60a5fa">${stats.count.toLocaleString()}</span></div>`);
            }
            if (show.includes("mean")) {
                lines.push(`<div>μ: <span style="color: #60a5fa">${stats.mean.toPrecision(4)}</span></div>`);
            }
            if (show.includes("min")) {
                lines.push(`<div>Min: <span style="color: #60a5fa">${stats.min.toPrecision(4)}</span></div>`);
            }
            if (show.includes("max")) {
                lines.push(`<div>Max: <span style="color: #60a5fa">${stats.max.toPrecision(4)}</span></div>`);
            }
            if (show.includes("std")) {
                lines.push(`<div>σ: <span style="color: #60a5fa">${stats.std.toPrecision(4)}</span></div>`);
            }
            if (show.includes("range")) {
                lines.push(`<div>Range: <span style="color: #60a5fa">${stats.range.toPrecision(4)}</span></div>`);
            }

            content.innerHTML = lines.join("");
        }

        function computeStats(values: number[]) {
            const n = values.length;
            let sum = 0;
            let min = Infinity;
            let max = -Infinity;

            for (const v of values) {
                sum += v;
                if (v < min) min = v;
                if (v > max) max = v;
            }

            const mean = sum / n;

            let sumSq = 0;
            for (const v of values) {
                sumSq += (v - mean) ** 2;
            }
            const std = Math.sqrt(sumSq / n);

            return {
                count: n,
                mean,
                min,
                max,
                std,
                range: max - min,
            };
        }
    }
);

// ============================================
// Watermark Plugin
// ============================================

export interface WatermarkPluginConfig {
    /** Watermark text */
    text: string;
    /** Font size (default: 48) */
    fontSize?: number;
    /** Font family (default: system-ui) */
    fontFamily?: string;
    /** Text color with opacity (default: rgba(128,128,128,0.15)) */
    color?: string;
    /** Position (default: center) */
    position?: "center" | "bottom-right" | "bottom-left";
    /** Rotation in degrees (default: -30 for center, 0 for corners) */
    rotation?: number;
}

const watermarkManifest: PluginManifest = {
    name: "watermark",
    version: "1.0.0",
    description: "Adds a customizable watermark to the chart",
    provides: ["visualization"],
    tags: ["watermark", "branding", "overlay"],
};

export const WatermarkPlugin = definePlugin<WatermarkPluginConfig>(
    watermarkManifest,
    (config) => {
        if (!config?.text) {
            throw new Error("WatermarkPlugin requires 'text' configuration");
        }

        const {
            text,
            fontSize = 48,
            fontFamily = "system-ui, sans-serif",
            color = "rgba(128, 128, 128, 0.15)",
            position = "center",
            rotation = position === "center" ? -30 : 0,
        } = config;

        return {
            onRenderOverlay(ctx: PluginContext) {
                const ctx2d = ctx.render.ctx2d;
                if (!ctx2d) return;

                // width/height available for future use
                void ctx.render.canvasSize;
                const plotArea = ctx.render.plotArea;

                ctx2d.save();
                ctx2d.font = `${fontSize}px ${fontFamily}`;
                ctx2d.fillStyle = color;
                ctx2d.textAlign = "center";
                ctx2d.textBaseline = "middle";

                let x: number, y: number;

                if (position === "center") {
                    x = plotArea.x + plotArea.width / 2;
                    y = plotArea.y + plotArea.height / 2;
                } else if (position === "bottom-right") {
                    x = plotArea.x + plotArea.width - fontSize;
                    y = plotArea.y + plotArea.height - fontSize / 2;
                } else {
                    x = plotArea.x + fontSize;
                    y = plotArea.y + plotArea.height - fontSize / 2;
                }

                ctx2d.translate(x, y);
                ctx2d.rotate((rotation * Math.PI) / 180);
                ctx2d.fillText(text, 0, 0);
                ctx2d.restore();
            },
        };
    }
);

// ============================================
// Grid Highlight Plugin
// ============================================

export interface GridHighlightConfig {
    /** Highlight intervals on X axis */
    xIntervals?: Array<{ start: number; end: number; color: string }>;
    /** Highlight intervals on Y axis */
    yIntervals?: Array<{ start: number; end: number; color: string }>;
    /** Opacity for highlight regions (default: 0.1) */
    opacity?: number;
}

const gridHighlightManifest: PluginManifest = {
    name: "grid-highlight",
    version: "1.0.0",
    description: "Highlights specific regions of the chart grid",
    provides: ["visualization"],
    tags: ["grid", "highlight", "regions"],
};

export const GridHighlightPlugin = definePlugin<GridHighlightConfig>(
    gridHighlightManifest,
    (config = {}) => {
        const { xIntervals = [], yIntervals = [], opacity = 0.1 } = config;

        return {
            onRenderOverlay(ctx: PluginContext, _event: AfterRenderEvent) {
                const ctx2d = ctx.render.ctx2d;
                if (!ctx2d) return;

                const plotArea = ctx.render.plotArea;
                // bounds available if needed for future features
                void ctx.data.getViewBounds();

                ctx2d.save();

                // Clip to plot area
                ctx2d.beginPath();
                ctx2d.rect(plotArea.x, plotArea.y, plotArea.width, plotArea.height);
                ctx2d.clip();

                ctx2d.globalAlpha = opacity;

                // Draw X intervals (vertical bands)
                for (const interval of xIntervals) {
                    const x1 = ctx.coords.dataToPixelX(interval.start);
                    const x2 = ctx.coords.dataToPixelX(interval.end);

                    ctx2d.fillStyle = interval.color;
                    ctx2d.fillRect(
                        Math.min(x1, x2),
                        plotArea.y,
                        Math.abs(x2 - x1),
                        plotArea.height
                    );
                }

                // Draw Y intervals (horizontal bands)
                for (const interval of yIntervals) {
                    const y1 = ctx.coords.dataToPixelY(interval.start);
                    const y2 = ctx.coords.dataToPixelY(interval.end);

                    ctx2d.fillStyle = interval.color;
                    ctx2d.fillRect(
                        plotArea.x,
                        Math.min(y1, y2),
                        plotArea.width,
                        Math.abs(y2 - y1)
                    );
                }

                ctx2d.restore();
            },
        };
    }
);

// ============================================
// Data Logger Plugin (for debugging)
// ============================================

export interface DataLoggerConfig {
    /** Log data updates (default: true) */
    logDataUpdates?: boolean;
    /** Log view changes (default: true) */
    logViewChanges?: boolean;
    /** Log interactions (default: false) */
    logInteractions?: boolean;
    /** Maximum log entries to keep (default: 100) */
    maxEntries?: number;
}

const dataLoggerManifest: PluginManifest = {
    name: "data-logger",
    version: "1.0.0",
    description: "Logs chart events for debugging and analysis",
    provides: ["analysis"],
    tags: ["debug", "logging", "events"],
};

export const DataLoggerPlugin = definePlugin<DataLoggerConfig>(
    dataLoggerManifest,
    (config = {}) => {
        const {
            logDataUpdates = true,
            logViewChanges = true,
            logInteractions = false,
            maxEntries = 100,
        } = config;

        interface LogEntry {
            timestamp: number;
            type: string;
            data: unknown;
        }

        const entries: LogEntry[] = [];

        function addEntry(type: string, data: unknown) {
            entries.push({
                timestamp: Date.now(),
                type,
                data,
            });

            if (entries.length > maxEntries) {
                entries.shift();
            }
        }

        return {
            onInit(ctx: PluginContext) {
                ctx.log.info("Data logger initialized");
            },

            onDataUpdate(ctx: PluginContext, event: DataUpdateEvent) {
                if (logDataUpdates) {
                    addEntry("dataUpdate", {
                        seriesId: event.seriesId,
                        mode: event.mode,
                        pointCount: event.pointCount,
                    });
                    ctx.log.debug(`Data update: ${event.seriesId} (${event.mode}, ${event.pointCount} points)`);
                }
            },

            onViewChange(ctx: PluginContext, event: ViewChangeEvent) {
                if (logViewChanges) {
                    addEntry("viewChange", {
                        trigger: event.trigger,
                        bounds: event.current,
                    });
                    ctx.log.debug(`View change: ${event.trigger}`);
                }
            },

            onInteraction(_ctx: PluginContext, event: InteractionEvent) {
                if (logInteractions) {
                    addEntry("interaction", {
                        type: event.type,
                        pixelX: event.pixelX,
                        pixelY: event.pixelY,
                        inPlotArea: event.inPlotArea,
                    });
                }
            },

            onSerialize(_ctx: PluginContext) {
                return { entries };
            },

            onDeserialize(_ctx: PluginContext, data: unknown) {
                const saved = data as { entries?: LogEntry[] };
                if (saved?.entries) {
                    entries.length = 0;
                    entries.push(...saved.entries);
                }
            },

            api: {
                getEntries() {
                    return [...entries];
                },
                clear() {
                    entries.length = 0;
                },
                export() {
                    return JSON.stringify(entries, null, 2);
                },
            },
        };
    }
);

// ============================================
// Export All Built-in Plugins
// ============================================

export const BuiltinPlugins = {
    Crosshair: CrosshairPlugin,
    Statistics: StatsPlugin,
    Watermark: WatermarkPlugin,
    GridHighlight: GridHighlightPlugin,
    DataLogger: DataLoggerPlugin,
};
