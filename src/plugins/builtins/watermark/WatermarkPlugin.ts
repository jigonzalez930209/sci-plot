import type {
    PluginContext,
    PluginManifest,
} from "../../types";
import { definePlugin } from "../../PluginRegistry";

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
