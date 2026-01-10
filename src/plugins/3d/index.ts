/**
 * SciChartEngine Engine - 3D Visualization Plugin
 * 
 * This plugin provides 3D rendering capabilities including:
 * - Line3D, Area3D, Bubble3D, Impulse3D renderers
 * - Surface mesh and waterfall visualizations
 * - 3D axes with depth perspective
 * - Camera controls and raycasting
 * 
 * @module plugins/3d
 */

// Re-export all 3D functionality
export * from "./Area3DRenderer";
export * from "./Bubble3DRenderer";
export * from "./Impulse3DRenderer";
export * from "./Line3DRenderer";
export * from "./PointCloud3DRenderer";
export * from "./Ribbon3DRenderer";
export * from "./SurfaceBar3DRenderer";
export * from "./SurfaceMesh3DRenderer";
export * from "./VectorField3DRenderer";
export * from "./Voxel3DRenderer";
export * from "./Waterfall3DRenderer";
export * from "./Axes3D";
export * from "./Tooltip3D";
export * from "./Raycaster3D";

// Math
export * from "./math";

// Camera & Controls
export * from "./camera";
export * from "./controls";

export * from "./colorThemes";

// Re-export series
export * from "./series";

import type { PluginManifest, ChartPlugin, PluginContext } from "../types";

// ============================================
// 3D Plugin Factory
// ============================================

export interface Plugin3DConfig {
    /** Enable WebGL2 features if available (default: true) */
    preferWebGL2?: boolean;
    /** Default camera configuration */
    camera?: {
        position?: [number, number, number];
        target?: [number, number, number];
        fov?: number;
    };
    /** Enable orbit controls (default: true) */
    enableOrbitControls?: boolean;
}

const manifest3D: PluginManifest = {
    name: "scichart-3d",
    version: "1.0.0",
    description: "Advanced 3D visualization for scichart-engine",
    provides: ["visualization", "3d"],
    tags: ["3d", "webgl", "surface", "mesh"],
};

/**
 * SciChartEngine 3D Plugin
 * 
 * Provides interactive 3D charts, surfaces, and meshes.
 */
export function Plugin3D(config: Plugin3DConfig = {}): ChartPlugin<Plugin3DConfig> {
    return {
        manifest: manifest3D,

        onInit(ctx: PluginContext) {
            ctx.log.info("SciChartEngine 3D Plugin Initialized");

            // Store configuration for later use
            ctx.storage.set("config", config);
        },

        onConfigChange(ctx: PluginContext, newConfig: Plugin3DConfig) {
            ctx.log.info("3D Plugin configuration updated", newConfig);
        },

        onDestroy(ctx: PluginContext) {
            ctx.log.info("SciChartEngine 3D Plugin Destroyed");
        }
    };
}

export default Plugin3D;
