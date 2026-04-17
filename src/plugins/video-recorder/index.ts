/**
 * @fileoverview Video Recorder plugin for capturing chart animations.
 * @module plugins/video-recorder
 */

import type {
  PluginVideoRecorderConfig,
  VideoRecorderAPI,
  VideoRecorderOptions,
} from './types';
import type {
  ChartPlugin,
  PluginContext,
  PluginManifest,
} from '../types';

const manifest: PluginManifest = {
  name: 'velo-plot-video-recorder',
  version: '1.0.0',
  description: 'Capture chart animations and export to video files',
  provides: ['video-export', 'media-tools'],
  tags: ['export', 'video', 'animation'],
};

const DEFAULT_CONFIG: Required<PluginVideoRecorderConfig> = {
  format: 'webm',
  fps: 30,
  bitrate: 2500000,
  fillBackground: true,
  backgroundColor: '#ffffff',
  quality: 0.9,
  autoDownload: false,
  filename: 'chart-recording',
  debug: false,
};

export function PluginVideoRecorder(
  userConfig: Partial<PluginVideoRecorderConfig> = {}
): ChartPlugin<PluginVideoRecorderConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;
  
  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];
  let isRecording = false;
  let isPaused = false;
  
  // Composite canvas for capturing both WebGL and Overlay
  let compositeCanvas: HTMLCanvasElement | null = null;
  let compositeCtx: CanvasRenderingContext2D | null = null;
  let animationFrameId: number | null = null;

  function createCompositeCanvas() {
    if (!ctx) return;
    
    // Get canvases from the rendering context
    const mainCanvas = ctx.render.gl?.canvas as HTMLCanvasElement;
    
    if (!mainCanvas) return;

    compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = mainCanvas.width;
    compositeCanvas.height = mainCanvas.height;
    compositeCtx = compositeCanvas.getContext('2d');
  }

  function updateComposite() {
    if (!ctx || !compositeCtx || !compositeCanvas) return;
    
    const mainCanvas = ctx.render.gl?.canvas as HTMLCanvasElement;
    const overlayCanvas = ctx.render.ctx2d?.canvas as HTMLCanvasElement;
    
    // Clear/Background
    if (config.fillBackground) {
        compositeCtx.fillStyle = config.backgroundColor || (ctx.chart as any).getTheme?.()?.background || '#ffffff';
        compositeCtx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
    } else {
        compositeCtx.clearRect(0, 0, compositeCanvas.width, compositeCanvas.height);
    }

    // Draw all chart canvases in order
    if (mainCanvas) compositeCtx.drawImage(mainCanvas, 0, 0);
    if (overlayCanvas) compositeCtx.drawImage(overlayCanvas, 0, 0);

    if (isRecording && !isPaused) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(updateComposite);
    }
  }

  const api: VideoRecorderAPI = {
    start() {
        if (isRecording || !ctx) return;
        
        createCompositeCanvas();
        if (!compositeCanvas) {
            console.error('[VideoRecorder] Could not initialize capture canvas');
            return;
        }

        recordedChunks = [];
        const stream = compositeCanvas.captureStream(config.fps);
        
        const options: MediaRecorderOptions = {
            mimeType: config.format === 'mp4' ? 'video/mp4;codecs=h264' : 'video/webm;codecs=vp9',
            videoBitsPerSecond: config.bitrate
        };

        // Check for browser support and fallback
        if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
            options.mimeType = 'video/webm';
        }

        try {
            mediaRecorder = new MediaRecorder(stream, options);
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                isRecording = false;
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
            };

            isRecording = true;
            isPaused = false;
            mediaRecorder.start(100); // Collect data every 100ms
            
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            updateComposite(); // Start render loop
            
            if (config.debug) console.log('[VideoRecorder] Recording started');
        } catch (e) {
            console.error('[VideoRecorder] Failed to start MediaRecorder:', e);
        }
    },

    async stop(): Promise<Blob> {
        return new Promise((resolve) => {
            if (!mediaRecorder || !isRecording) {
                resolve(new Blob([], { type: 'video/webm' }));
                return;
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, {
                    type: config.format === 'mp4' ? 'video/mp4' : 'video/webm'
                });
                
                if (config.autoDownload) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${config.filename}.${config.format}`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                }

                resolve(blob);
                isRecording = false;
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                if (config.debug) console.log('[VideoRecorder] Recording stopped, size:', blob.size);
            };

            mediaRecorder.stop();
        });
    },

    pause() {
        if (mediaRecorder && isRecording && !isPaused) {
            mediaRecorder.pause();
            isPaused = true;
        }
    },

    resume() {
        if (mediaRecorder && isRecording && isPaused) {
            mediaRecorder.resume();
            isPaused = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            updateComposite();
        }
    },

    isRecording() { return isRecording; },
    isPaused() { return isPaused; },
    
    updateConfig(newConfig: Partial<VideoRecorderOptions>) {
        Object.assign(config, newConfig);
    }
  };

  const pluginApi: VideoRecorderAPI & Record<string, unknown> = api as any;

  return {
    manifest,
    onInit(pCtx) {
      ctx = pCtx;
    },
    onDestroy() {
      if (isRecording) {
          mediaRecorder?.stop();
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
      }
      ctx = null;
    },
    api: pluginApi
  };
}

export default PluginVideoRecorder;

// Type exports
export type {
  PluginVideoRecorderConfig,
  VideoRecorderAPI,
  VideoRecorderOptions,
} from './types';
