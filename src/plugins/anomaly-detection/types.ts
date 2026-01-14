/**
 * Anomaly Detection Plugin Types
 */

export type AnomalyMethod = 'zscore' | 'mad' | 'iqr' | 'isolation-forest';

export interface AnomalyPoint {
  /** Index in the data array */
  index: number;
  /** X value */
  x: number;
  /** Y value */
  y: number;
  /** Anomaly score (higher = more anomalous) */
  score: number;
  /** Method used for detection */
  method: AnomalyMethod;
}

export interface PluginAnomalyDetectionConfig {
  /** Detection method (default: 'zscore') */
  method?: AnomalyMethod;
  
  /** Sensitivity threshold (default: 0.95)
   * - For zscore: number of standard deviations (e.g., 3)
   * - For mad: MAD multiplier (e.g., 3.5)
   * - For iqr: IQR multiplier (e.g., 1.5)
   * - For isolation-forest: contamination rate (e.g., 0.05)
   */
  sensitivity?: number;
  
  /** Enable real-time detection on data updates (default: false) */
  realtime?: boolean;
  
  /** Highlight anomalies on the chart (default: true) */
  highlight?: boolean;
  
  /** Highlight color (default: '#ff0000') */
  highlightColor?: string;
  
  /** Highlight marker size (default: 8) */
  highlightSize?: number;
  
  /** Minimum window size for detection (default: 30) */
  minWindowSize?: number;
  
  /** Use rolling window for real-time detection (default: false) */
  rollingWindow?: boolean;
  
  /** Rolling window size (default: 100) */
  windowSize?: number;
  
  /** Series IDs to monitor (empty = all series) */
  seriesIds?: string[];
}

export interface AnomalyDetectionResult {
  /** Series ID */
  seriesId: string;
  /** Detected anomalies */
  anomalies: AnomalyPoint[];
  /** Total points analyzed */
  totalPoints: number;
  /** Detection method used */
  method: AnomalyMethod;
  /** Threshold value used */
  threshold: number;
  /** Timestamp of detection */
  timestamp: number;
}
