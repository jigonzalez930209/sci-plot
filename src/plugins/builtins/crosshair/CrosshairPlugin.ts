import type {
    PluginContext,
    PluginManifest,
    InteractionEvent,
} from "../../types";
import { definePlugin } from "../../PluginRegistry";
import type {
    CrosshairValueMode,
    CornerPosition
} from "../../../core/layout";

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
    /** 
     * @deprecated Use valueDisplayMode instead
     * Show axis labels (will be converted to valueDisplayMode)
     */
    showAxisLabels?: boolean;
    /**
     * Display mode for X,Y coordinate values (default: 'disabled')
     * - 'disabled': Never show coordinate values
     * - 'corner': Show values in a fixed corner position
     * - 'floating': Show values next to the cursor (axis labels)
     */
    valueDisplayMode?: CrosshairValueMode;
    /**
     * Corner position when valueDisplayMode is 'corner' (default: 'top-left')
     */
    cornerPosition?: CornerPosition;
    /** Snap to nearest data point (default: false) */
    snapToData?: boolean;
    /** Value format options */
    valueFormat?: {
        /** X value precision (default: 4) */
        xPrecision?: number;
        /** Y value precision (default: 4) */
        yPrecision?: number;
    };
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
            snapToData = false,
            valueFormat = { xPrecision: 4, yPrecision: 4 },
        } = config;

        // Handle deprecated showAxisLabels -> convert to valueDisplayMode
        let valueDisplayMode: CrosshairValueMode = config.valueDisplayMode ?? 'disabled';
        if (config.showAxisLabels !== undefined && config.valueDisplayMode === undefined) {
            valueDisplayMode = config.showAxisLabels ? 'floating' : 'disabled';
        }
        const cornerPosition: CornerPosition = config.cornerPosition ?? 'top-left';

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

            // Value display based on mode
            if (valueDisplayMode === 'floating') {
                drawFloatingLabels(pluginCtx, ctx, cursorX, cursorY, lineColor);
            } else if (valueDisplayMode === 'corner') {
                drawCornerLabels(pluginCtx, ctx, cursorX, cursorY, lineColor);
            }
            // 'disabled' mode: don't draw any labels
        }

        function drawFloatingLabels(
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
            const xText = dataX.toPrecision(valueFormat.xPrecision);
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
            const yText = dataY.toPrecision(valueFormat.yPrecision);
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

        function drawCornerLabels(
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

            const xText = `X: ${dataX.toPrecision(valueFormat.xPrecision)}`;
            const yText = `Y: ${dataY.toPrecision(valueFormat.yPrecision)}`;

            const xMetrics = ctx.measureText(xText);
            const yMetrics = ctx.measureText(yText);
            const maxWidth = Math.max(xMetrics.width, yMetrics.width);
            const padding = 6;
            const lineHeight = 16;
            const boxWidth = maxWidth + padding * 2;
            const boxHeight = lineHeight * 2 + padding * 2;

            // Determine corner position
            let boxX: number;
            let boxY: number;

            switch (cornerPosition) {
                case 'top-left':
                    boxX = plotArea.x + 8;
                    boxY = plotArea.y + 8;
                    break;
                case 'top-right':
                    boxX = plotArea.x + plotArea.width - boxWidth - 8;
                    boxY = plotArea.y + 8;
                    break;
                case 'bottom-left':
                    boxX = plotArea.x + 8;
                    boxY = plotArea.y + plotArea.height - boxHeight - 8;
                    break;
                case 'bottom-right':
                    boxX = plotArea.x + plotArea.width - boxWidth - 8;
                    boxY = plotArea.y + plotArea.height - boxHeight - 8;
                    break;
                default:
                    boxX = plotArea.x + 8;
                    boxY = plotArea.y + 8;
            }

            // Draw background
            ctx.fillStyle = bgColor;
            ctx.globalAlpha = 0.85;
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            ctx.globalAlpha = 1.0;

            // Draw border
            ctx.strokeStyle = "rgba(255,255,255,0.3)";
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

            // Draw text
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText(xText, boxX + padding, boxY + padding);
            ctx.fillText(yText, boxX + padding, boxY + padding + lineHeight);

            ctx.restore();
        }
    }
);

