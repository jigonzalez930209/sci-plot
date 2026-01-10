import type {
    PluginContext,
    PluginManifest,
    AfterRenderEvent,
} from "../../types";
import { definePlugin } from "../../PluginRegistry";

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
