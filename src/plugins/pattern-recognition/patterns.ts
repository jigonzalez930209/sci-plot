/**
 * Pattern Recognition Plugin - Pattern Definitions
 * 
 * Implements common technical analysis patterns for financial and scientific data.
 * Includes head-shoulders, double tops/bottoms, triangles, and more.
 * 
 * @packageDocumentation
 * @module plugins/pattern-recognition
 */

import type {
  PatternDefinition,
  PatternType,
  PatternPoint,
  PatternValidationResult,
  PatternSegment,
  PatternMeasurements
} from './types';

// ============================================
// Utility Functions
// ============================================

function findPeaksAndValleys(points: PatternPoint[]): { peaks: PatternPoint[], valleys: PatternPoint[] } {
  const peaks: PatternPoint[] = [];
  const valleys: PatternPoint[] = [];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    // Peak detection
    if (curr.y > prev.y && curr.y > next.y) {
      peaks.push({ ...curr, type: 'peak' });
    }
    // Valley detection
    else if (curr.y < prev.y && curr.y < next.y) {
      valleys.push({ ...curr, type: 'valley' });
    }
  }
  
  return { peaks, valleys };
}

function calculateSlope(p1: PatternPoint, p2: PatternPoint): number {
  return (p2.y - p1.y) / (p2.x - p1.x);
}

function calculatePatternMeasurements(points: PatternPoint[]): PatternMeasurements {
  const yValues = points.map(p => p.y);
  const xValues = points.map(p => p.x);
  
  const height = Math.max(...yValues) - Math.min(...yValues);
  const width = Math.max(...xValues) - Math.min(...xValues);
  const slope = calculateSlope(points[0], points[points.length - 1]);
  
  return {
    height,
    width,
    slope,
    volumeProfile: {
      increasing: 0.4, // Mock values
      decreasing: 0.3,
      neutral: 0.3
    },
    breakoutTarget: Math.max(...yValues) + height * 0.8,
    stopLoss: Math.min(...yValues) - height * 0.2
  };
}

// ============================================
// Head and Shoulders Pattern
// ============================================

function validateHeadShoulders(points: PatternPoint[]): PatternValidationResult {
  if (points.length < 5) {
    return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient points for head-shoulders pattern'] };
  }
  
  const { peaks, valleys } = findPeaksAndValleys(points);
  
  // Need at least 3 peaks and 2 valleys for head-shoulders
  if (peaks.length < 3 || valleys.length < 2) {
    return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient peaks/valleys'] };
  }
  
  // Find left shoulder, head, and right shoulder
  const leftShoulder = peaks[0];
  const head = peaks[1];
  const rightShoulder = peaks[2];
  
  // Find the valleys between shoulders and head
  const leftValley = valleys[0];
  const rightValley = valleys[1];
  
  // Validate pattern structure
  const headHigherThanShoulders = head.y > leftShoulder.y && head.y > rightShoulder.y;
  const shouldersApproximatelyEqual = Math.abs(leftShoulder.y - rightShoulder.y) / leftShoulder.y < 0.1;
  const valleyBelowShoulders = leftValley.y < leftShoulder.y && rightValley.y < rightShoulder.y;
  
  if (!headHigherThanShoulders || !shouldersApproximatelyEqual || !valleyBelowShoulders) {
    return { 
      valid: false, 
      confidence: 0, 
      segments: [], 
      keyPoints: [], 
      errors: ['Invalid head-shoulders structure'] 
    };
  }
  
  // Create segments
  const segments: PatternSegment[] = [
    { start: leftShoulder, end: leftValley, type: 'resistance', strength: 0.8 },
    { start: leftValley, end: head, type: 'support', strength: 0.7 },
    { start: head, end: rightValley, type: 'resistance', strength: 0.8 },
    { start: rightValley, end: rightShoulder, type: 'support', strength: 0.7 }
  ];
  
  const keyPoints = [leftShoulder, leftValley, head, rightValley, rightShoulder];
  const measurements = calculatePatternMeasurements(points);
  
  // Calculate confidence based on pattern symmetry
  const shoulderSymmetry = 1 - Math.abs(leftShoulder.y - rightShoulder.y) / head.y;
  const valleySymmetry = 1 - Math.abs(leftValley.y - rightValley.y) / head.y;
  const confidence = (shoulderSymmetry + valleySymmetry) / 2;
  
  return {
    valid: true,
    confidence,
    segments,
    keyPoints,
    measurements
  };
}

// ============================================
// Double Top/Bottom Pattern
// ============================================

function validateDoubleTop(points: PatternPoint[]): PatternValidationResult {
  if (points.length < 4) {
    return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient points for double top'] };
  }
  
  const { peaks, valleys } = findPeaksAndValleys(points);
  
  if (peaks.length < 2 || valleys.length < 1) {
    return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient peaks/valleys'] };
  }
  
  const firstTop = peaks[0];
  const secondTop = peaks[1];
  const valley = valleys[0];
  
  // Validate double top structure
  const topsApproximatelyEqual = Math.abs(firstTop.y - secondTop.y) / firstTop.y < 0.05;
  const valleyBelowTops = valley.y < firstTop.y && valley.y < secondTop.y;
  const significantDrop = (firstTop.y - valley.y) / firstTop.y > 0.1;
  
  if (!topsApproximatelyEqual || !valleyBelowTops || !significantDrop) {
    return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Invalid double top structure'] };
  }
  
  const segments: PatternSegment[] = [
    { start: firstTop, end: valley, type: 'resistance', strength: 0.9 },
    { start: valley, end: secondTop, type: 'support', strength: 0.8 },
    { start: firstTop, end: secondTop, type: 'resistance', strength: 0.9 }
  ];
  
  const keyPoints = [firstTop, valley, secondTop];
  const measurements = calculatePatternMeasurements(points);
  
  // Confidence based on top equality and depth of valley
  const topEquality = 1 - Math.abs(firstTop.y - secondTop.y) / firstTop.y;
  const depthRatio = (firstTop.y - valley.y) / firstTop.y;
  const confidence = (topEquality + Math.min(depthRatio * 2, 1)) / 2;
  
  return {
    valid: true,
    confidence,
    segments,
    keyPoints,
    measurements
  };
}

function validateDoubleBottom(points: PatternPoint[]): PatternValidationResult {
  if (points.length < 4) {
    return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient points for double bottom'] };
  }
  
  const { peaks, valleys } = findPeaksAndValleys(points);
  
  if (valleys.length < 2 || peaks.length < 1) {
    return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient peaks/valleys'] };
  }
  
  const firstBottom = valleys[0];
  const secondBottom = valleys[1];
  const peak = peaks[0];
  
  // Validate double bottom structure
  const bottomsApproximatelyEqual = Math.abs(firstBottom.y - secondBottom.y) / firstBottom.y < 0.05;
  const peakAboveBottoms = peak.y > firstBottom.y && peak.y > secondBottom.y;
  const significantRise = (peak.y - firstBottom.y) / firstBottom.y > 0.1;
  
  if (!bottomsApproximatelyEqual || !peakAboveBottoms || !significantRise) {
    return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Invalid double bottom structure'] };
  }
  
  const segments: PatternSegment[] = [
    { start: firstBottom, end: peak, type: 'support', strength: 0.9 },
    { start: peak, end: secondBottom, type: 'resistance', strength: 0.8 },
    { start: firstBottom, end: secondBottom, type: 'support', strength: 0.9 }
  ];
  
  const keyPoints = [firstBottom, peak, secondBottom];
  const measurements = calculatePatternMeasurements(points);
  
  // Confidence based on bottom equality and height of peak
  const bottomEquality = 1 - Math.abs(firstBottom.y - secondBottom.y) / firstBottom.y;
  const heightRatio = (peak.y - firstBottom.y) / firstBottom.y;
  const confidence = (bottomEquality + Math.min(heightRatio * 2, 1)) / 2;
  
  return {
    valid: true,
    confidence,
    segments,
    keyPoints,
    measurements
  };
}

// ============================================
// Triangle Patterns
// ============================================

function validateAscendingTriangle(points: PatternPoint[]): PatternValidationResult {
  if (points.length < 4) {
    return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient points for ascending triangle'] };
  }
  
  // Find horizontal resistance line and ascending support line
  const yValues = points.map(p => p.y);
  const resistanceLevel = Math.max(...yValues);
  const resistancePoints = points.filter(p => Math.abs(p.y - resistanceLevel) / resistanceLevel < 0.02);
  
  if (resistancePoints.length < 2) {
    return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient resistance points'] };
  }
  
  // Check for ascending support (higher lows)
  const lows = points.filter((p, i) => i === 0 || p.y < points[i - 1].y);
  if (lows.length < 2) {
    return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient low points'] };
  }
  
  const firstLow = lows[0];
  const lastLow = lows[lows.length - 1];
  const supportSlope = calculateSlope(firstLow, lastLow);
  
  // Support should be ascending (positive slope)
  if (supportSlope <= 0) {
    return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Support not ascending'] };
  }
  
  const segments: PatternSegment[] = [
    { start: resistancePoints[0], end: resistancePoints[resistancePoints.length - 1], type: 'resistance', strength: 0.8 },
    { start: firstLow, end: lastLow, type: 'support', strength: 0.7 }
  ];
  
  const keyPoints = [...resistancePoints.slice(0, 2), firstLow, lastLow];
  const measurements = calculatePatternMeasurements(points);
  
  // Confidence based on horizontal resistance and ascending support
  const resistanceFlatness = 1 - Math.abs(resistancePoints[0].y - resistancePoints[resistancePoints.length - 1].y) / resistanceLevel;
  const supportAscending = Math.min(supportSlope / 0.01, 1); // Normalize slope
  const confidence = (resistanceFlatness + supportAscending) / 2;
  
  return {
    valid: true,
    confidence,
    segments,
    keyPoints,
    measurements
  };
}

// ============================================
// Pattern Definitions Registry
// ============================================

export const BUILTIN_PATTERNS: Record<PatternType, PatternDefinition> = {
  'head-shoulders': {
    id: 'head-shoulders',
    type: 'head-shoulders',
    name: 'Head and Shoulders',
    description: 'Bearish reversal pattern with three peaks',
    minPoints: 5,
    maxPoints: 7,
    validator: validateHeadShoulders
  },
  
  'inverse-head-shoulders': {
    id: 'inverse-head-shoulders',
    type: 'inverse-head-shoulders',
    name: 'Inverse Head and Shoulders',
    description: 'Bullish reversal pattern with three valleys',
    minPoints: 5,
    maxPoints: 7,
    validator: (points) => {
      // Invert points and validate as regular head-shoulders
      const invertedPoints = points.map(p => ({ ...p, y: -p.y }));
      const result = validateHeadShoulders(invertedPoints);
      return result;
    }
  },
  
  'double-top': {
    id: 'double-top',
    type: 'double-top',
    name: 'Double Top',
    description: 'Bearish reversal pattern with two equal peaks',
    minPoints: 4,
    maxPoints: 6,
    validator: validateDoubleTop
  },
  
  'double-bottom': {
    id: 'double-bottom',
    type: 'double-bottom',
    name: 'Double Bottom',
    description: 'Bullish reversal pattern with two equal valleys',
    minPoints: 4,
    maxPoints: 6,
    validator: validateDoubleBottom
  },
  
  'triple-top': {
    id: 'triple-top',
    type: 'triple-top',
    name: 'Triple Top',
    description: 'Bearish reversal pattern with three equal peaks',
    minPoints: 5,
    maxPoints: 7,
    validator: (points) => {
      if (points.length < 5) {
        return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient points'] };
      }
      
      const { peaks } = findPeaksAndValleys(points);
      if (peaks.length < 3) {
        return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Need at least 3 peaks'] };
      }
      
      const peak1 = peaks[0].y;
      const peak2 = peaks[1].y;
      const peak3 = peaks[2].y;
      
      const tolerance = 0.05;
      const peaksEqual = Math.abs(peak1 - peak2) / peak1 < tolerance && Math.abs(peak2 - peak3) / peak2 < tolerance;
      
      if (!peaksEqual) {
        return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Peaks not equal'] };
      }
      
      const segments: PatternSegment[] = [
        { start: peaks[0], end: peaks[1], type: 'resistance', strength: 0.8 },
        { start: peaks[1], end: peaks[2], type: 'resistance', strength: 0.8 }
      ];
      
      const keyPoints = [peaks[0], peaks[1], peaks[2]];
      const measurements = calculatePatternMeasurements(points);
      
      return {
        valid: true,
        confidence: 0.8,
        segments,
        keyPoints,
        measurements
      };
    }
  },
  
  'triple-bottom': {
    id: 'triple-bottom',
    type: 'triple-bottom',
    name: 'Triple Bottom',
    description: 'Bullish reversal pattern with three equal valleys',
    minPoints: 5,
    maxPoints: 7,
    validator: (points) => {
      const invertedPoints = points.map(p => ({ ...p, y: -p.y }));
      return BUILTIN_PATTERNS['triple-top'].validator(invertedPoints);
    }
  },
  
  'ascending-triangle': {
    id: 'ascending-triangle',
    type: 'ascending-triangle',
    name: 'Ascending Triangle',
    description: 'Continuation pattern with horizontal resistance and ascending support',
    minPoints: 4,
    maxPoints: 8,
    validator: validateAscendingTriangle
  },
  
  'descending-triangle': {
    id: 'descending-triangle',
    type: 'descending-triangle',
    name: 'Descending Triangle',
    description: 'Continuation pattern with horizontal support and descending resistance',
    minPoints: 4,
    maxPoints: 8,
    validator: (points) => {
      // Invert points and validate as ascending triangle
      const invertedPoints = points.map(p => ({ ...p, y: -p.y }));
      const result = validateAscendingTriangle(invertedPoints);
      return result;
    }
  },
  
  'symmetrical-triangle': {
    id: 'symmetrical-triangle',
    type: 'symmetrical-triangle',
    name: 'Symmetrical Triangle',
    description: 'Continuation pattern with converging support and resistance',
    minPoints: 4,
    maxPoints: 8,
    validator: (points) => {
      // Simplified validation for symmetrical triangle
      if (points.length < 4) {
        return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient points'] };
      }
      
      // Check for converging trendlines
      const firstHalf = points.slice(0, Math.floor(points.length / 2));
      const secondHalf = points.slice(Math.floor(points.length / 2));
      
      const firstSlope = calculateSlope(firstHalf[0], firstHalf[firstHalf.length - 1]);
      const secondSlope = calculateSlope(secondHalf[0], secondHalf[secondHalf.length - 1]);
      
      // Slopes should be converging (opposite signs)
      const converging = (firstSlope > 0 && secondSlope < 0) || (firstSlope < 0 && secondSlope > 0);
      
      if (!converging) {
        return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Lines not converging'] };
      }
      
      const segments: PatternSegment[] = [
        { start: firstHalf[0], end: firstHalf[firstHalf.length - 1], type: 'trendline', strength: 0.7 },
        { start: secondHalf[0], end: secondHalf[secondHalf.length - 1], type: 'trendline', strength: 0.7 }
      ];
      
      const keyPoints = [firstHalf[0], firstHalf[firstHalf.length - 1], secondHalf[0], secondHalf[secondHalf.length - 1]];
      const measurements = calculatePatternMeasurements(points);
      
      return {
        valid: true,
        confidence: 0.7,
        segments,
        keyPoints,
        measurements
      };
    }
  },
  
  'rising-wedge': {
    id: 'rising-wedge',
    type: 'rising-wedge',
    name: 'Rising Wedge',
    description: 'Bearish reversal pattern with two converging upward lines',
    minPoints: 4,
    maxPoints: 8,
    validator: (points) => {
      // Simplified rising wedge validation
      if (points.length < 4) {
        return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient points'] };
      }
      
      const { peaks, valleys } = findPeaksAndValleys(points);
      if (peaks.length < 2 || valleys.length < 2) {
        return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient peaks/valleys'] };
      }
      
      const peakSlope = calculateSlope(peaks[0], peaks[peaks.length - 1]);
      const valleySlope = calculateSlope(valleys[0], valleys[valleys.length - 1]);
      
      // Both lines should be rising but converging (valley slope > peak slope)
      const wedgePattern = peakSlope > 0 && valleySlope > 0 && valleySlope > peakSlope;
      
      if (!wedgePattern) {
        return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Not a rising wedge pattern'] };
      }
      
      const segments: PatternSegment[] = [
        { start: peaks[0], end: peaks[peaks.length - 1], type: 'resistance', strength: 0.8 },
        { start: valleys[0], end: valleys[valleys.length - 1], type: 'support', strength: 0.8 }
      ];
      
      const keyPoints = [peaks[0], peaks[peaks.length - 1], valleys[0], valleys[valleys.length - 1]];
      const measurements = calculatePatternMeasurements(points);
      
      return {
        valid: true,
        confidence: 0.75,
        segments,
        keyPoints,
        measurements
      };
    }
  },
  
  'falling-wedge': {
    id: 'falling-wedge',
    type: 'falling-wedge',
    name: 'Falling Wedge',
    description: 'Bullish reversal pattern with two converging downward lines',
    minPoints: 4,
    maxPoints: 8,
    validator: (points) => {
      // Invert points and validate as rising wedge
      const invertedPoints = points.map(p => ({ ...p, y: -p.y }));
      const result = BUILTIN_PATTERNS['rising-wedge'].validator(invertedPoints);
      return result;
    }
  },
  
  'rectangle': {
    id: 'rectangle',
    type: 'rectangle',
    name: 'Rectangle',
    description: 'Continuation pattern with horizontal support and resistance',
    minPoints: 4,
    maxPoints: 10,
    validator: (points) => {
      if (points.length < 4) {
        return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient points'] };
      }
      
      const yValues = points.map(p => p.y);
      const resistance = Math.max(...yValues);
      const support = Math.min(...yValues);
      
      // Check for relatively flat top and bottom
      const resistancePoints = points.filter(p => Math.abs(p.y - resistance) / resistance < 0.05);
      const supportPoints = points.filter(p => Math.abs(p.y - support) / support < 0.05);
      
      if (resistancePoints.length < 2 || supportPoints.length < 2) {
        return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient horizontal lines'] };
      }
      
      const segments: PatternSegment[] = [
        { start: resistancePoints[0], end: resistancePoints[resistancePoints.length - 1], type: 'resistance', strength: 0.9 },
        { start: supportPoints[0], end: supportPoints[supportPoints.length - 1], type: 'support', strength: 0.9 }
      ];
      
      const keyPoints = [resistancePoints[0], resistancePoints[resistancePoints.length - 1], supportPoints[0], supportPoints[supportPoints.length - 1]];
      const measurements = calculatePatternMeasurements(points);
      
      return {
        valid: true,
        confidence: 0.8,
        segments,
        keyPoints,
        measurements
      };
    }
  },
  
  'flag': {
    id: 'flag',
    type: 'flag',
    name: 'Flag',
    description: 'Short-term continuation pattern after strong move',
    minPoints: 3,
    maxPoints: 6,
    validator: (points) => {
      // Simplified flag validation
      if (points.length < 3) {
        return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Insufficient points'] };
      }
      
      const slope = calculateSlope(points[0], points[points.length - 1]);
      
      // Flag should be relatively horizontal (small slope)
      const horizontal = Math.abs(slope) < 0.01;
      
      if (!horizontal) {
        return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Not horizontal enough'] };
      }
      
      const segments: PatternSegment[] = [
        { start: points[0], end: points[points.length - 1], type: 'trendline', strength: 0.6 }
      ];
      
      const keyPoints = [points[0], points[points.length - 1]];
      const measurements = calculatePatternMeasurements(points);
      
      return {
        valid: true,
        confidence: 0.6,
        segments,
        keyPoints,
        measurements
      };
    }
  },
  
  'pennant': {
    id: 'pennant',
    type: 'pennant',
    name: 'Pennant',
    description: 'Short-term continuation pattern with converging lines',
    minPoints: 3,
    maxPoints: 5,
    validator: (points) => {
      // Similar to symmetrical triangle but smaller
      return BUILTIN_PATTERNS['symmetrical-triangle'].validator(points);
    }
  },
  
  'custom': {
    id: 'custom',
    type: 'custom',
    name: 'Custom Pattern',
    description: 'User-defined pattern',
    minPoints: 3,
    validator: (_points) => {
      return { valid: false, confidence: 0, segments: [], keyPoints: [], errors: ['Custom pattern not implemented'] };
    }
  }
};