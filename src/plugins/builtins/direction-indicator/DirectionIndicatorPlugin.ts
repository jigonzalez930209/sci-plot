import type {
    PluginContext,
    PluginManifest,
} from "../../types";
import { definePlugin } from "../../PluginRegistry";

export interface DirectionIndicatorConfig {
    /** Series ID to track (if not specified, tracks the first series) */
    seriesId?: string;
    /** Number of recent points to analyze for direction (default: 20) */
    sampleSize?: number;
    /** Arrow color (default: from theme) */
    color?: string;
    /** Arrow size in pixels (default: 40) */
    size?: number;
    /** Minimum velocity to show arrow (default: 0.01) */
    minVelocity?: number;
    /** Number of points for smoothing the position/angle (default: 20) */
    historySize?: number;
    /** Hide arrow if no new points are received for this duration in ms (default: undefined/disabled) */
    idleTimeout?: number;
}

interface DirectionData {
    angle: number; // Continuous angle in radians
    magnitude: number; // Normalized magnitude 0-1
    lastX: number; // Last data point X coordinate (data space)
    lastY: number; // Last data point Y coordinate (data space)
    smoothX: number; // Smoothed X position (pixel space)
    smoothY: number; // Smoothed Y position (pixel space)
}

const directionIndicatorManifest: PluginManifest = {
    name: "direction-indicator",
    version: "1.0.0",
    description: "Shows an arrow indicating the direction and trend of streaming data",
    provides: ["visualization", "analysis"],
    tags: ["streaming", "direction", "trend", "arrow"],
};

export const DirectionIndicatorPlugin = definePlugin<DirectionIndicatorConfig>(
    directionIndicatorManifest,
    (config = {}) => {
        const {
            seriesId,
            sampleSize = 20,
            color,
            size = 40,
            minVelocity = 0.01,
            historySize = 20,
            idleTimeout,
        } = config;

        let overlayId: string;
        let canvas: HTMLCanvasElement | null = null;
        let ctx: CanvasRenderingContext2D | null = null;
        let currentDirection: DirectionData | null = null;
        let targetSeriesId: string | null = null;
        
        // Smoothing buffers (moving average to reduce jitter)
        const positionHistoryX: number[] = [];
        const positionHistoryY: number[] = [];
        const angleHistory: number[] = [];

        let maxHistorySize = historySize;
        let timeoutTimer: any = null;
        let lastPointTimestamp = Date.now();
        let lastSeenX = -Infinity;
        let lastSeenY = -Infinity;
        let currentIdleTimeout = idleTimeout;

        return {
            onInit(pluginCtx: PluginContext) {
                overlayId = "direction-indicator-overlay";
                const overlay = pluginCtx.ui.createOverlay(overlayId, {
                    zIndex: 600,
                    position: { top: "0", left: "0", right: "0", bottom: "0" },
                    pointerEvents: false,
                });

                canvas = document.createElement("canvas");
                canvas.style.cssText = "width: 100%; height: 100%; pointer-events: none;";
                overlay.appendChild(canvas);

                ctx = canvas.getContext("2d");
                resizeCanvas(pluginCtx);

                // Determine which series to track
                if (seriesId) {
                    targetSeriesId = seriesId;
                } else {
                    const allSeries = pluginCtx.data.getAllSeries();
                    if (allSeries.length > 0) {
                        targetSeriesId = allSeries[0].getId();
                    }
                }
            },

            onDestroy(pluginCtx: PluginContext) {
                pluginCtx.ui.removeOverlay(overlayId);
                if (timeoutTimer) clearTimeout(timeoutTimer);
                canvas = null;
                ctx = null;
                currentDirection = null;
            },

            onResize(pluginCtx: PluginContext) {
                resizeCanvas(pluginCtx);
            },

            onAfterRender(pluginCtx: PluginContext) {
                // Update direction every frame for smooth rendering
                updateDirection(pluginCtx);
                render(pluginCtx);

                // Ensure we render again when the idle timeout expires to hide the arrow
                if (currentIdleTimeout) {
                    if (timeoutTimer) clearTimeout(timeoutTimer);
                    const age = Date.now() - lastPointTimestamp;
                    if (age < currentIdleTimeout) {
                        timeoutTimer = setTimeout(() => {
                            pluginCtx.requestRender();
                        }, currentIdleTimeout - age + 10);
                    }
                }
            },

            onConfigChange(_pluginCtx: PluginContext, newConfig: DirectionIndicatorConfig) {
                if (newConfig.historySize !== undefined) {
                    maxHistorySize = newConfig.historySize;
                    // Reset history buffers if size changes significantly or just trim/expand? 
                    // Simpler to just let them adjust over time or trim if needed.
                    // If we want immediate effect, we might want to trim if smaller.
                    while (positionHistoryX.length > maxHistorySize) positionHistoryX.shift();
                    while (positionHistoryY.length > maxHistorySize) positionHistoryY.shift();
                    while (angleHistory.length > maxHistorySize) angleHistory.shift();
                }

                if (newConfig.idleTimeout !== undefined) {
                    currentIdleTimeout = newConfig.idleTimeout;
                }
            }
        };

        function resizeCanvas(pluginCtx: PluginContext) {
            if (!canvas || !ctx) return;
            const canvasSize = pluginCtx.render.canvasSize;
            const dpr = pluginCtx.render.pixelRatio;
            canvas.width = canvasSize.width * dpr;
            canvas.height = canvasSize.height * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
        }

        function updateDirection(pluginCtx: PluginContext) {
            if (!targetSeriesId) return;

            const series = pluginCtx.data.getSeries(targetSeriesId);
            if (!series) return;

            const data = pluginCtx.data.getSeriesData(targetSeriesId);
            if (!data || !data.x || !data.y) return;

            const totalPoints = data.x.length;
            if (totalPoints < 2) return;

            // Get last point coordinates in data space
            const lastX = data.x[totalPoints - 1];
            const lastY = data.y[totalPoints - 1];

            // Detect if this is a new point
            if (lastX !== lastSeenX || lastY !== lastSeenY) {
                lastSeenX = lastX;
                lastSeenY = lastY;
                lastPointTimestamp = Date.now();
            }

            // Get last N points for direction calculation
            const n = Math.min(sampleSize, totalPoints);
            const startIdx = totalPoints - n;

            // Calculate direction using linear regression on recent points IN PIXEL SPACE
            let sumT = 0, sumPX = 0, sumPY = 0, sumTPX = 0, sumTPY = 0, sumTT = 0;

            for (let i = startIdx; i < totalPoints; i++) {
                const t = i - startIdx; // Time index
                const dataX = data.x[i];
                const dataY = data.y[i];
                
                // Convert to pixel coordinates
                const pixelX = pluginCtx.coords.dataToPixelX(dataX);
                const pixelY = pluginCtx.coords.dataToPixelY(dataY);

                sumT += t;
                sumPX += pixelX;
                sumPY += pixelY;
                sumTPX += t * pixelX;
                sumTPY += t * pixelY;
                sumTT += t * t;
            }

            const meanT = sumT / n;
            const meanPX = sumPX / n;
            const meanPY = sumPY / n;

            // Calculate slopes in pixel space (dpx/dt and dpy/dt)
            const denominator = sumTT - n * meanT * meanT;
            if (Math.abs(denominator) < 1e-10) return; // Avoid division by zero
            
            const slopePX = (sumTPX - n * meanT * meanPX) / denominator;
            const slopePY = (sumTPY - n * meanT * meanPY) / denominator;

            // Calculate continuous angle in pixel space (canvas coordinates)
            const rawAngle = Math.atan2(slopePY, slopePX);
            
            // Convert last point to pixel coordinates
            const lastPixelX = pluginCtx.coords.dataToPixelX(lastX);
            const lastPixelY = pluginCtx.coords.dataToPixelY(lastY);
            
            // Add to position history for smoothing
            positionHistoryX.push(lastPixelX);
            positionHistoryY.push(lastPixelY);
            if (positionHistoryX.length > maxHistorySize) {
                positionHistoryX.shift();
                positionHistoryY.shift();
            }
            
            // Add to angle history for smoothing
            angleHistory.push(rawAngle);
            if (angleHistory.length > maxHistorySize) {
                angleHistory.shift();
            }
            
            // Apply moving average to smooth position and angle
            const smoothX = average(positionHistoryX);
            const smoothY = average(positionHistoryY);
            const smoothedAngle = smoothAngle(angleHistory);
            
            // Calculate magnitude in pixel space
            const magnitude = Math.sqrt(slopePX * slopePX + slopePY * slopePY);

            currentDirection = { angle: smoothedAngle, magnitude, lastX, lastY, smoothX, smoothY };
        }
        
        function average(values: number[]): number {
            if (values.length === 0) return 0;
            return values.reduce((sum, val) => sum + val, 0) / values.length;
        }
        
        function smoothAngle(angles: number[]): number {
            if (angles.length === 0) return 0;
            
            // Convert angles to unit vectors to handle wraparound correctly
            let sumX = 0;
            let sumY = 0;
            
            for (const angle of angles) {
                sumX += Math.cos(angle);
                sumY += Math.sin(angle);
            }
            
            // Average the vectors and convert back to angle
            return Math.atan2(sumY / angles.length, sumX / angles.length);
        }

        function render(pluginCtx: PluginContext) {
            if (!ctx || !canvas || !currentDirection) return;

            const { width, height } = pluginCtx.render.canvasSize;
            ctx.clearRect(0, 0, width, height);

            // Check for idle timeout
            if (currentIdleTimeout !== undefined) {
                const age = Date.now() - lastPointTimestamp;
                if (age > currentIdleTimeout) return;
            }

            if (currentDirection.magnitude < minVelocity) return;

            // Use smoothed position for fluid movement
            const smoothX = currentDirection.smoothX;
            const smoothY = currentDirection.smoothY;

            const arrowColor = color || "#FF9800";
            
            ctx.save();

            // Draw arrow at smoothed position with smoothed angle
            drawArrow(ctx, smoothX, smoothY, currentDirection.angle, size, arrowColor);

            ctx.restore();
        }

        function drawArrow(
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            angle: number,
            length: number,
            color: string
        ) {
            // Triangle dimensions (only the arrow head)
            const triangleHeight = length * 0.6;
            const triangleWidth = length * 0.4;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            // Draw filled triangle pointing in the direction of movement
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(triangleHeight / 2, 0); // Tip of the triangle
            ctx.lineTo(-triangleHeight / 2, -triangleWidth / 2); // Bottom left
            ctx.lineTo(-triangleHeight / 2, triangleWidth / 2); // Bottom right
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }
);
