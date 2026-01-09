import type {
    PluginContext,
    PluginManifest,
    DataUpdateEvent,
} from "../../types";
import { definePlugin } from "../../PluginRegistry";

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
