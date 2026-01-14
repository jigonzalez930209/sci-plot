/**
 * Regression Plugin Types
 * 
 * Provides types for advanced scientific regression and curve fitting.
 * Supports linear, polynomial, exponential, logarithmic, and custom models.
 * 
 * @packageDocumentation
 * @module plugins/regression
 */

// ============================================
// Regression Types
// ============================================

export type RegressionMethod = 
  | 'linear'
  | 'polynomial'
  | 'exponential'
  | 'logarithmic'
  | 'power'
  | 'gaussian'
  | 'lorentzian'
  | 'sigmoid'
  | 'custom';

export interface RegressionData {
  /** X values (independent variable) */
  x: Float32Array | Float64Array | number[];
  /** Y values (dependent variable) */
  y: Float32Array | Float64Array | number[];
  /** Weights for weighted regression (optional) */
  weights?: Float32Array | Float64Array | number[];
  /** Standard deviations for y values (for weighted fitting) */
  yErrors?: Float32Array | Float64Array | number[];
}

export interface RegressionParameters {
  /** Fitted parameters */
  parameters: number[];
  /** Parameter uncertainties (standard errors) */
  uncertainties?: number[];
  /** Parameter correlation matrix */
  correlationMatrix?: number[][];
  /** Covariance matrix */
  covarianceMatrix?: number[][];
}

export interface RegressionStatistics {
  /** Coefficient of determination (R²) */
  rSquared: number;
  /** Adjusted R² */
  adjustedRSquared: number;
  /** Root mean square error */
  rmse: number;
  /** Residual sum of squares */
  rss: number;
  /** Total sum of squares */
  tss: number;
  /** F-statistic */
  fStatistic?: number;
  /** p-value */
  pValue?: number;
  /** Akaike information criterion */
  aic?: number;
  /** Bayesian information criterion */
  bic?: number;
  /** Number of data points */
  n: number;
  /** Number of parameters */
  k: number;
}

export interface RegressionResult {
  /** Regression method used */
  method: RegressionMethod;
  /** Fitted parameters */
  parameters: RegressionParameters;
  /** Statistics */
  statistics: RegressionStatistics;
  /** Fitted values (predicted y) */
  fittedValues: Float32Array;
  /** Residuals (observed - fitted) */
  residuals: Float32Array;
  /** Confidence intervals for fitted values */
  confidenceIntervals?: {
    lower: Float32Array;
    upper: Float32Array;
    level: number; // e.g., 0.95 for 95% CI
  };
  /** Prediction intervals */
  predictionIntervals?: {
    lower: Float32Array;
    upper: Float32Array;
    level: number;
  };
  /** Goodness of fit assessment */
  goodnessOfFit: 'excellent' | 'good' | 'fair' | 'poor';
  /** Convergence status */
  converged: boolean;
  /** Number of iterations */
  iterations: number;
  /** Processing time in milliseconds */
  processingTime: number;
}

// ============================================
// Method-Specific Configurations
// ============================================

export interface LinearRegressionConfig {
  /** Force intercept through origin */
  forceOrigin?: boolean;
  /** Include confidence intervals */
  includeConfidenceIntervals?: boolean;
  /** Confidence level (0-1) */
  confidenceLevel?: number;
}

export interface PolynomialRegressionConfig {
  /** Polynomial degree */
  degree: number;
  /** Orthogonal polynomial fitting */
  orthogonal?: boolean;
  /** Regularization parameter (ridge regression) */
  regularization?: number;
}

export interface ExponentialRegressionConfig {
  /** Initial guess for amplitude */
  initialAmplitude?: number;
  /** Initial guess for rate */
  initialRate?: number;
  /** Initial guess for offset */
  initialOffset?: number;
  /** Constrain parameters to be positive */
  constrainPositive?: boolean;
}

export interface LogarithmicRegressionConfig {
  /** Base of logarithm (default: e) */
  base?: number;
  /** Include constant term */
  includeConstant?: boolean;
}

export interface PowerRegressionConfig {
  /** Initial guess for exponent */
  initialExponent?: number;
  /** Initial guess for coefficient */
  initialCoefficient?: number;
  /** Force zero intercept */
  forceZeroIntercept?: boolean;
}

export interface GaussianRegressionConfig {
  /** Initial guess for amplitude */
  initialAmplitude?: number;
  /** Initial guess for mean */
  initialMean?: number;
  /** Initial guess for standard deviation */
  initialStd?: number;
  /** Initial guess for offset */
  initialOffset?: number;
  /** Constrain std to be positive */
  constrainStdPositive?: boolean;
}

export interface LorentzianRegressionConfig {
  /** Initial guess for amplitude */
  initialAmplitude?: number;
  /** Initial guess for center */
  initialCenter?: number;
  /** Initial guess for width (FWHM) */
  initialWidth?: number;
  /** Initial guess for offset */
  initialOffset?: number;
}

export interface SigmoidRegressionConfig {
  /** Type of sigmoid function */
  type?: 'logistic' | 'tanh' | 'arctan';
  /** Initial guess for maximum value */
  initialMax?: number;
  /** Initial guess for minimum value */
  initialMin?: number;
  /** Initial guess for inflection point */
  initialInflection?: number;
  /** Initial guess for steepness */
  initialSteepness?: number;
}

export interface CustomRegressionConfig {
  /** Model function: f(x, parameters) */
  modelFunction: (x: number, parameters: number[]) => number;
  /** Jacobian function: ∂f/∂parameters */
  jacobianFunction?: (x: number, parameters: number[]) => number[];
  /** Initial parameter guesses */
  initialParameters: number[];
  /** Parameter bounds */
  parameterBounds?: {
    min: number[];
    max: number[];
  };
  /** Optimization method */
  optimizationMethod?: 'levenberg-marquardt' | 'gradient-descent' | 'newton';
}

// ============================================
// Plugin Configuration
// ============================================

export interface PluginRegressionConfig {
  /** Default regression method */
  defaultMethod: RegressionMethod;
  /** Enable automatic model selection */
  enableAutoSelection?: boolean;
  /** Model selection criteria */
  modelSelectionCriteria: 'aic' | 'bic' | 'adjusted-r2' | 'cross-validation';
  /** Enable weighted regression */
  enableWeightedRegression?: boolean;
  /** Enable robust regression (outlier-resistant) */
  enableRobustRegression?: boolean;
  /** Robust regression method */
  robustMethod?: 'huber' | 'tukey' | 'least-trimmed-squares';
  /** Maximum number of iterations for non-linear fitting */
  maxIterations: number;
  /** Convergence tolerance */
  convergenceTolerance: number;
  /** Default confidence level */
  defaultConfidenceLevel: number;
  /** Enable parallel processing for large datasets */
  enableParallelProcessing?: boolean;
  /** Chunk size for parallel processing */
  parallelChunkSize?: number;
}

// ============================================
// Event Types
// ============================================

export interface RegressionCompletedEvent {
  result: RegressionResult;
  seriesId: string;
  method: RegressionMethod;
  timestamp: number;
}

export interface RegressionFailedEvent {
  error: Error | string;
  seriesId: string;
  method: RegressionMethod;
  reason: string;
  timestamp: number;
}

export interface ModelSelectedEvent {
  selectedMethod: RegressionMethod;
  candidateResults: RegressionResult[];
  selectionCriteria: string;
  seriesId: string;
  timestamp: number;
}

// ============================================
// API Types
// ============================================

export interface RegressionAPI {
  /** Perform regression analysis */
  fit(
    seriesId: string,
    data: RegressionData,
    method?: RegressionMethod,
    config?: any
  ): Promise<RegressionResult>;
  
  /** Fit multiple models and compare */
  fitAndCompare(
    seriesId: string,
    data: RegressionData,
    methods: RegressionMethod[],
    configs?: any[]
  ): Promise<RegressionResult[]>;
  
  /** Automatic model selection */
  autoFit(
    seriesId: string,
    data: RegressionData,
    candidateMethods?: RegressionMethod[]
  ): Promise<RegressionResult>;
  
  /** Get regression results for a series */
  getResults(seriesId: string): RegressionResult[];
  
  /** Clear regression results for a series */
  clearResults(seriesId: string): void;
  
  /** Predict values using fitted model */
  predict(
    seriesId: string,
    xValues: Float32Array | Float64Array | number[],
    resultIndex?: number
  ): Float32Array;
  
  /** Get confidence intervals for predictions */
  getConfidenceIntervals(
    seriesId: string,
    xValues: Float32Array | Float64Array | number[],
    level?: number,
    resultIndex?: number
  ): { lower: Float32Array; upper: Float32Array };
  
  /** Evaluate model on new data */
  evaluate(
    seriesId: string,
    data: RegressionData,
    resultIndex?: number
  ): RegressionStatistics;
  
  /** Enable real-time fitting for series */
  enableRealtimeFitting(
    seriesId: string,
    method?: RegressionMethod,
    config?: any
  ): void;
  
  /** Disable real-time fitting for series */
  disableRealtimeFitting(seriesId: string): void;
  
  /** Get regression statistics summary */
  getStatistics(seriesId?: string): {
    totalFittings: number;
    methodsUsed: Record<RegressionMethod, number>;
    averageRSquared: number;
    averageProcessingTime: number;
  };
  
  /** Update plugin configuration */
  updateConfig(config: Partial<PluginRegressionConfig>): void;
  
  /** Get current configuration */
  getConfig(): PluginRegressionConfig;
  
  /** Visualize regression fit on chart */
  visualizeFit(seriesId: string, resultIndex?: number): void;
  
  /** Hide regression visualization */
  hideVisualization(seriesId: string): void;
  
  /** Export regression results */
  exportResults(seriesId: string, format?: 'json' | 'csv' | 'matlab'): string;
}