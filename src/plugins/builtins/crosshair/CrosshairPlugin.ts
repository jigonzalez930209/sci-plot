import type {
    PluginContext,
    PluginManifest,
    InteractionEvent,
} from "../../types";
import { definePlugin } from "../../PluginRegistry";

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
