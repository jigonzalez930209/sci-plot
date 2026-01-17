/**
 * SciChartEngine - Snapshot Plugin
 * 
 * Provides high-resolution image export capabilities.
 * Supports different formats (PNG, JPEG, WebP) and resolutions (Standard, 2K, 4K, 8K).
 * 
 * @module plugins/snapshot
 */

import type { 
  PluginManifest, 
  ChartPlugin, 
  PluginContext,
} from '../types';

import type {
  PluginSnapshotConfig,
  SnapshotExportAPI,
  SnapshotExportOptions,
  SnapshotResolution,
} from './types';

const manifestSnapshot: PluginManifest = {
  name: "scichart-snapshot",
  version: "1.0.0",
  description: "High-resolution image export for scichart-engine",
  provides: ["export", "snapshot"],
  tags: ["snapshot", "export", "publication", "image"],
};

const DEFAULT_OPTIONS: Required<SnapshotExportOptions> = {
  format: 'png',
  quality: 0.9,
  resolution: 'standard',
  includeBackground: true,
  includeOverlays: true,
  watermarkText: '',
  transparent: false,
  fileName: 'scichart-snapshot-export',
  download: false
};

function resolutionToScale(res: SnapshotResolution): number {
  if (typeof res === 'number') return res;
  switch (res) {
    case '8k': return 8;
    case '4k': return 4;
    case '2k': return 2;
    case 'standard': return 1;
    default: return 1;
  }
}

/**
 * SciChartEngine Snapshot Plugin
 * 
 * Captures the current chart view with all layers (WebGL + Overlay).
 */
export function PluginSnapshot(
  config: PluginSnapshotConfig = {}
): ChartPlugin<PluginSnapshotConfig> {
  let ctx: PluginContext | null = null;

  /**
   * Captures the chart as an image
   */
  async function takeSnapshot(options: SnapshotExportOptions = {}): Promise<string | Blob> {
    if (!ctx) throw new Error("Snapshot plugin not initialized");
    
    const opt = { ...DEFAULT_OPTIONS, ...config.defaultOptions, ...options };
    const chart = ctx.chart;
    
    // 1. Determine target resolution scale
    const scale = resolutionToScale(opt.resolution);
    const originalDPR = chart.getDPR();
    
    try {
        // 2. High-res re-render if scale > 1
        // We temporarily boost the device pixel ratio to force a higher resolution render
        if (scale > 1) {
            chart.setDPR(originalDPR * scale);
            // Wait for DOM and GL updates
            await new Promise(r => requestAnimationFrame(r));
            // Small delay to ensure all overlays (which might have their own throttles) are ready
            await new Promise(r => setTimeout(r, 100));
        }

        const webglCanvas = (ctx.render.gl?.canvas) as HTMLCanvasElement;
        const overlayCanvas = (ctx.render.ctx2d?.canvas) as HTMLCanvasElement;
        
        if (!webglCanvas) throw new Error("WebGL canvas not found");

        // 3. Compose layers into a final canvas
        const compositionCanvas = document.createElement('canvas');
        compositionCanvas.width = webglCanvas.width;
        compositionCanvas.height = webglCanvas.height;
        const compCtx = compositionCanvas.getContext('2d')!;
        
        // Fill background if not transparent
        if (!opt.transparent && opt.includeBackground) {
          compCtx.fillStyle = ctx.ui.theme.backgroundColor || '#ffffff';
          compCtx.fillRect(0, 0, compositionCanvas.width, compositionCanvas.height);
        }
        
        // Draw WebGL layer (bottom)
        compCtx.drawImage(webglCanvas, 0, 0);
        
        // Draw Overlay layer (top) - contains annotations, tooltips, etc.
        if (opt.includeOverlays && overlayCanvas) {
          compCtx.drawImage(overlayCanvas, 0, 0);
        }
        
        // Apply Watermark
        if (opt.watermarkText) {
          drawWatermark(compCtx, opt.watermarkText, compositionCanvas.width, compositionCanvas.height, originalDPR * scale);
        }
        
        const mimeType = `image/${opt.format}`;
        const dataUrl = compositionCanvas.toDataURL(mimeType, opt.quality);
        
        // Automatic download if requested
        if (opt.download) {
          const extension = opt.format === 'jpeg' ? 'jpg' : opt.format;
          const link = document.createElement('a');
          link.download = `${opt.fileName}.${extension}`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        return dataUrl;
    } finally {
        // 4. Restore original resolution
        if (scale > 1) {
            chart.setDPR(originalDPR);
        }
    }
  }

  /**
   * Helper to draw a watermark on the captured image
   */
  function drawWatermark(c: CanvasRenderingContext2D, text: string, w: number, h: number, dpr: number) {
    c.save();
    // Scale font size according to DPR
    const fontSize = Math.max(16, 24 * (dpr / 2));
    c.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    c.fillStyle = 'rgba(128, 128, 128, 0.4)';
    c.textAlign = 'right';
    c.textBaseline = 'bottom';
    c.fillText(text, w - (20 * dpr/2), h - (20 * dpr/2));
    c.restore();
  }

  const api: SnapshotExportAPI & Record<string, unknown> = {
    takeSnapshot,
    downloadSnapshot: async (opt: SnapshotExportOptions) => {
      await takeSnapshot({ ...opt, download: true });
    }
  };

  return {
    manifest: manifestSnapshot,
    onInit(c) { 
        ctx = c; 
        ctx.log.info("Snapshot plugin initialized");
    },
    onDestroy() {
        ctx = null;
    },
    api
  };
}

export default PluginSnapshot;

export type {
  SnapshotFormat,
  SnapshotResolution,
  SnapshotExportOptions,
  SnapshotExportAPI,
  PluginSnapshotConfig
} from './types';
