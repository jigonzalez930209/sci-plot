/**
 * SciChart Engine - Annotations Plugin
 * 
 * Provides annotation capabilities including:
 * - Line, Rectangle, Band, Text, Arrow annotations
 * - Annotation management and rendering
 * 
 * @module plugins/annotations
 */

import { AnnotationManager } from "../../core/annotations";
import type { Annotation, AnnotationType } from "../../core/annotations";
import type { PluginManifest, ChartPlugin, PluginContext } from "../types";

export interface PluginAnnotationsConfig {
    /** Default styles for annotations */
    defaultStyles?: Record<string, any>;
}

const manifestAnnotations: PluginManifest = {
    name: "scichart-annotations",
    version: "1.0.0",
    description: "Annotation support for scichart-engine",
    provides: ["annotation"],
    tags: ["annotation", "overlay", "label"],
};

/**
 * SciChart Annotations Plugin
 * 
 * Adds support for drawing lines, shapes, and labels on the chart.
 */
export function PluginAnnotations(_config: PluginAnnotationsConfig = {}): ChartPlugin<PluginAnnotationsConfig> {
    let annotationManager: AnnotationManager;

    return {
        manifest: manifestAnnotations,

        onInit(ctx: PluginContext) {
            ctx.log.info("SciChartEngine Annotations Plugin Initialized");
            annotationManager = new AnnotationManager();

            // In a real implementation, we would register this manager in the context
            // so the chart can delegate annotation calls to it.
            // For now, we store it in storage for retrieval.
            ctx.storage.set("manager", annotationManager);
        },

        onRenderOverlay(ctx) {
            const plotArea = ctx.render.plotArea;
            const viewBounds = ctx.data.getViewBounds();

            // Render all annotations using the manager and provided contexts
            annotationManager.render(
                ctx.render.ctx2d!,
                plotArea,
                viewBounds
            );
        },

        onDestroy(ctx: PluginContext) {
            ctx.log.info("SciChartEngine Annotations Plugin Destroyed");
            annotationManager.clear();
        },

        api: {
            getManager() {
                return annotationManager;
            },
            add(annotation: Annotation) {
                return annotationManager.add(annotation);
            },
            remove(id: string) {
                return annotationManager.remove(id);
            },
            update(id: string, updates: Partial<Annotation>) {
                return annotationManager.update(id, updates);
            },
            get(id: string) {
                return annotationManager.get(id);
            },
            getAll() {
                return annotationManager.getAll();
            },
            clear() {
                annotationManager.clear();
            }
        }
    };
}

export { AnnotationManager };
export type { Annotation, AnnotationType };
export default PluginAnnotations;
