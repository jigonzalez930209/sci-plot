/**
 * @fileoverview Types for Video Recorder plugin
 * @module plugins/video-recorder/types
 */

export type VideoFormat = "webm" | "mp4";

export interface VideoRecorderOptions {
  /** Video format (default: 'webm') */
  format?: VideoFormat;
  /** Frame rate in FPS (default: 30) */
  fps?: number;
  /** Video bitrate in bits per second (default: 2.5Mbps) */
  bitrate?: number;
  /** Whether to include a white background if chart is transparent */
  fillBackground?: boolean;
  /** Background color if fillBackground is true */
  backgroundColor?: string;
  /** Quality for webm/mp4 (0-1) */
  quality?: number;
}

export interface RecordingMetadata {
  /** Duration of the recording in seconds */
  duration: number;
  /** Number of frames recorded */
  frameCount: number;
  /** Width of the video */
  width: number;
  /** Height of the video */
  height: number;
  /** Timestamp of the recording */
  timestamp: number;
}

export interface VideoRecorderAPI {
  /** Start recording the chart area */
  start(): void;
  /** Stop recording and return the video blob */
  stop(): Promise<Blob>;
  /** Pause recording */
  pause(): void;
  /** Resume recording */
  resume(): void;
  /** Whether the recorder is currently active */
  isRecording(): boolean;
  /** Whether the recorder is currently paused */
  isPaused(): boolean;
  /** Update current recording options */
  updateConfig(config: Partial<VideoRecorderOptions>): void;
}

export interface PluginVideoRecorderConfig extends VideoRecorderOptions {
  /** Automatically download the file after stopping (default: false) */
  autoDownload?: boolean;
  /** Filename for auto-download (default: 'chart-recording') */
  filename?: string;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}
