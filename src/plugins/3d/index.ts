/**
 * SciChart Engine - 3D Visualization Plugin
 * 
 * This plugin provides 3D rendering capabilities including:
 * - Line3D, Area3D, Bubble3D, Impulse3D renderers
 * - Surface mesh and waterfall visualizations
 * - 3D axes with depth perspective
 * - Camera controls and raycasting
 * 
 * @module plugins/3d
 */

// Re-export all 3D functionality from core
export {
    // Renderers
    Area3DRenderer,
    Bubble3DRenderer,
    Impulse3DRenderer,
    Line3DRenderer,
    PointCloud3DRenderer,
    Ribbon3DRenderer,
    SurfaceBar3DRenderer,
    SurfaceMesh3DRenderer,
    VectorField3DRenderer,
    Voxel3DRenderer,
    Waterfall3DRenderer,

    // Axes and utilities
    Axes3D,
    createRayFromScreen,
    Tooltip3D,

    // Math
    Mat4,
    Vec3,

    // Camera & Controls
    OrbitCamera,
    OrbitController,
} from "../../core/3d";

export * from "../../core/3d/colorThemes";

// Re-export series
export * from "../../core/3d/series";

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
 * SciChart 3D Plugin
 * 
 * Provides interactive 3D charts, surfaces, and meshes.
 */
export function Plugin3D(config: Plugin3DConfig = {}): ChartPlugin<Plugin3DConfig> {
    return {
        manifest: manifest3D,

        onInit(ctx: PluginContext) {
            ctx.log.info("SciChart 3D Plugin Initialized");

            // Store configuration for later use
            ctx.storage.set("config", config);
        },

        onConfigChange(ctx: PluginContext, newConfig: Plugin3DConfig) {
            ctx.log.info("3D Plugin configuration updated", newConfig);
        },

        onDestroy(ctx: PluginContext) {
            ctx.log.info("SciChart 3D Plugin Destroyed");
        }
    };
}

export default Plugin3D;
