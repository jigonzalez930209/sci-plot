export function parseColor(color: string): [number, number, number, number] {
  if (!color) return [1, 0, 1, 1];
  
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255;
      const g = parseInt(hex[1] + hex[1], 16) / 255;
      const b = parseInt(hex[2] + hex[2], 16) / 255;
      return [r, g, b, 1];
    } else if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return [r, g, b, 1];
    } else if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return [r, g, b, a];
    }
  }

  if (color.startsWith("rgb")) {
    const matches = color.match(/[\d.]+/g);
    if (matches && matches.length >= 3) {
      const r = parseFloat(matches[0]) / 255;
      const g = parseFloat(matches[1]) / 255;
      const b = parseFloat(matches[2]) / 255;
      const a = matches.length >= 4 ? parseFloat(matches[3]) : 1;
      return [r, g, b, a];
    }
  }

  return [1, 0, 1, 1];
}

export function brightenColor(color: string, isDarkTheme: boolean = true): string {
  const [r, g, b, a] = parseColor(color);
  const [h, s, l] = rgbToHsl(r, g, b);
  
  /**
   * Smart Contrast Algorithm:
   * 1. Shift Hue (H): Rotate by 43° (0.12) to make it distinct.
   * 2. Boost Saturation (S): Force high vibrance (+0.4) so it looks "active".
   * 3. Intelligent Luminance (L):
   *    - On DARK backgrounds: If original is dark, jump to bright (0.8). If light, keep it light.
   *    - On LIGHT backgrounds: If original is light, jump to deep (0.25). If dark, keep it dark/intense.
   */
  const newH = (h + 0.12) % 1.0;
  const newS = Math.min(1.0, s + 0.4);
  
  let newL;
  if (isDarkTheme) {
    // Dark mode -> High brightness
    newL = l < 0.4 ? 0.8 : Math.min(0.95, l + 0.2);
  } else {
    // Light mode -> High depth
    newL = l > 0.6 ? 0.25 : Math.max(0.1, l - 0.2);
  }

  // Ensure reasonable limits
  newL = Math.max(0.15, Math.min(0.9, newL));

  const [nr, ng, nb] = hslToRgb(newH, newS, newL);
  
  const ri = Math.round(nr * 255);
  const gi = Math.round(ng * 255);
  const bi = Math.round(nb * 255);
  
  return a < 1 
    ? `rgba(${ri}, ${gi}, ${bi}, ${a})` 
    : `rgb(${ri}, ${gi}, ${bi})`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [r, g, b];
}

export function interleaveData(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[]
): Float32Array {
  const length = Math.min(x.length, y.length);
  const result = new Float32Array(length * 2);

  for (let i = 0; i < length; i++) {
    result[i * 2] = x[i];
    result[i * 2 + 1] = y[i];
  }

  return result;
}

export function interleaveStepData(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[],
  mode: "before" | "after" | "center" = "after"
): Float32Array {
  const length = Math.min(x.length, y.length);
  if (length < 2) {
    return interleaveData(x, y);
  }

  const stepCount = mode === "center" ? 1 + (length - 1) * 3 : length * 2 - 1;
  const result = new Float32Array(stepCount * 2);

  let resultIdx = 0;

  for (let i = 0; i < length; i++) {
    if (i === 0) {
      result[resultIdx++] = x[0];
      result[resultIdx++] = y[0];
    } else {
      const prevX = x[i - 1];
      const prevY = y[i - 1];
      const currX = x[i];
      const currY = y[i];

      if (mode === "after") {
        result[resultIdx++] = currX;
        result[resultIdx++] = prevY;
        result[resultIdx++] = currX;
        result[resultIdx++] = currY;
      } else if (mode === "before") {
        result[resultIdx++] = prevX;
        result[resultIdx++] = currY;
        result[resultIdx++] = currX;
        result[resultIdx++] = currY;
      } else {
        const midX = (prevX + currX) / 2;
        result[resultIdx++] = midX;
        result[resultIdx++] = prevY;
        result[resultIdx++] = midX;
        result[resultIdx++] = currY;
        result[resultIdx++] = currX;
        result[resultIdx++] = currY;
      }
    }
  }

  return result.subarray(0, resultIdx);
}

export function interleaveBandData(
  x: Float32Array | Float64Array | number[],
  y1: Float32Array | Float64Array | number[],
  y2: Float32Array | Float64Array | number[]
): Float32Array {
  const n = Math.min(x.length, y1.length, y2.length);
  const result = new Float32Array(n * 2 * 2);

  for (let i = 0; i < n; i++) {
    const idx = i * 4;
    const xi = x[i];
    result[idx + 0] = xi;
    result[idx + 1] = y1[i];
    result[idx + 2] = xi;
    result[idx + 3] = y2[i];
  }
  return result;
}

export function interleaveErrorData(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[],
  yErr?: {
    yError?: Float32Array | Float64Array;
    yErrorMinus?: Float32Array | Float64Array;
    yErrorPlus?: Float32Array | Float64Array;
  },
  xErr?: {
    xError?: Float32Array | Float64Array;
    xErrorMinus?: Float32Array | Float64Array;
    xErrorPlus?: Float32Array | Float64Array;
  }
): Float32Array {
  const n = x.length;
  // We'll generate lines. Each Error bar can have up to 2 segments (vertical + horizontal) if both are present.
  let segmentCount = 0;
  if (yErr) segmentCount++;
  if (xErr) segmentCount++;

  const result = new Float32Array(n * segmentCount * 2 * 2);
  let idx = 0;

  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];

    if (yErr) {
      let minus = 0;
      let plus = 0;
      if (yErr.yError && i < yErr.yError.length) {
        minus = plus = yErr.yError[i];
      } else {
        minus = yErr.yErrorMinus ? yErr.yErrorMinus[i] : 0;
        plus = yErr.yErrorPlus ? yErr.yErrorPlus[i] : 0;
      }
      
      result[idx++] = xi;
      result[idx++] = yi - minus;
      result[idx++] = xi;
      result[idx++] = yi + plus;
    }

    if (xErr) {
      let minus = 0;
      let plus = 0;
      if (xErr.xError && i < xErr.xError.length) {
        minus = plus = xErr.xError[i];
      } else {
        minus = xErr.xErrorMinus ? xErr.xErrorMinus[i] : 0;
        plus = xErr.xErrorPlus ? xErr.xErrorPlus[i] : 0;
      }
      
      result[idx++] = xi - minus;
      result[idx++] = yi;
      result[idx++] = xi + plus;
      result[idx++] = yi;
    }
  }

  return result.subarray(0, idx);
}

export function interleaveBoxPlotData(
  x: Float32Array | Float64Array | number[],
  min: Float32Array | Float64Array | number[],
  q1: Float32Array | Float64Array | number[],
  median: Float32Array | Float64Array | number[],
  q3: Float32Array | Float64Array | number[],
  max: Float32Array | Float64Array | number[],
  width: number
): { lines: Float32Array; boxes: Float32Array } {
  const n = x.length;
  const w = width / 2;
  
  // Lines: 5 segments per box: 14 points per box if we use separate lines
  // Actually, let's use 10 points (5 lines x 2 points)
  const lineData = new Float32Array(n * 20);
  
  // Boxes: 1 rectangle (2 triangles) per box = 6 vertices * 2 floats = 12 floats per box
  const boxData = new Float32Array(n * 12);
  
  let lIdx = 0;
  let bIdx = 0;
  
  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const mi = min[i];
    const q1i = q1[i];
    const medi = median[i];
    const q3i = q3[i];
    const maxti = max[i];
    
    // Lines
    // 1. Lower whisker
    lineData[lIdx++] = xi; lineData[lIdx++] = mi;
    lineData[lIdx++] = xi; lineData[lIdx++] = q1i;
    // 2. Upper whisker
    lineData[lIdx++] = xi; lineData[lIdx++] = q3i;
    lineData[lIdx++] = xi; lineData[lIdx++] = maxti;
    // 3. Median
    lineData[lIdx++] = xi - w; lineData[lIdx++] = medi;
    lineData[lIdx++] = xi + w; lineData[lIdx++] = medi;
    // 4. Q1 bottom cap
    lineData[lIdx++] = xi - w; lineData[lIdx++] = q1i;
    lineData[lIdx++] = xi + w; lineData[lIdx++] = q1i;
    // 5. Q3 top cap
    lineData[lIdx++] = xi - w; lineData[lIdx++] = q3i;
    lineData[lIdx++] = xi + w; lineData[lIdx++] = q3i;
    
    // Rectangle (Box)
    boxData[bIdx++] = xi - w; boxData[bIdx++] = q1i;
    boxData[bIdx++] = xi + w; boxData[bIdx++] = q1i;
    boxData[bIdx++] = xi + w; boxData[bIdx++] = q3i;
    boxData[bIdx++] = xi - w; boxData[bIdx++] = q1i;
    boxData[bIdx++] = xi + w; boxData[bIdx++] = q3i;
    boxData[bIdx++] = xi - w; boxData[bIdx++] = q3i;
  }
  
  return { lines: lineData, boxes: boxData };
}

/**
 * Interleave data for Waterfall charts
 * Creates rectangles that show cumulative changes from a running total
 */
export function interleaveWaterfallData(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[],
  width: number,
  isSubtotal?: boolean[]
): { 
  positiveData: Float32Array; 
  negativeData: Float32Array; 
  subtotalData: Float32Array;
  connectorData: Float32Array;
  positiveCount: number;
  negativeCount: number;
  subtotalCount: number;
} {
  const n = x.length;
  const w = width / 2;
  
  // Each bar is 2 triangles = 6 vertices
  const positiveData = new Float32Array(n * 12);
  const negativeData = new Float32Array(n * 12);
  const subtotalData = new Float32Array(n * 12);
  const connectorData = new Float32Array((n - 1) * 4); // Horizontal lines connecting bars
  
  let pIdx = 0, nIdx = 0, sIdx = 0, cIdx = 0;
  let runningTotal = 0;
  
  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    const isSub = isSubtotal?.[i] ?? false;
    
    let barBottom: number, barTop: number;
    
    if (isSub) {
      // Subtotal bar: from 0 to current running total
      barBottom = 0;
      barTop = runningTotal;
      
      // Draw subtotal bar
      subtotalData[sIdx++] = xi - w; subtotalData[sIdx++] = barBottom;
      subtotalData[sIdx++] = xi + w; subtotalData[sIdx++] = barBottom;
      subtotalData[sIdx++] = xi + w; subtotalData[sIdx++] = barTop;
      subtotalData[sIdx++] = xi - w; subtotalData[sIdx++] = barBottom;
      subtotalData[sIdx++] = xi + w; subtotalData[sIdx++] = barTop;
      subtotalData[sIdx++] = xi - w; subtotalData[sIdx++] = barTop;
    } else {
      // Regular bar: from running total to running total + value
      barBottom = runningTotal;
      barTop = runningTotal + yi;
      runningTotal = barTop;
      
      if (yi >= 0) {
        // Positive bar
        positiveData[pIdx++] = xi - w; positiveData[pIdx++] = barBottom;
        positiveData[pIdx++] = xi + w; positiveData[pIdx++] = barBottom;
        positiveData[pIdx++] = xi + w; positiveData[pIdx++] = barTop;
        positiveData[pIdx++] = xi - w; positiveData[pIdx++] = barBottom;
        positiveData[pIdx++] = xi + w; positiveData[pIdx++] = barTop;
        positiveData[pIdx++] = xi - w; positiveData[pIdx++] = barTop;
      } else {
        // Negative bar (barTop < barBottom)
        negativeData[nIdx++] = xi - w; negativeData[nIdx++] = barTop;
        negativeData[nIdx++] = xi + w; negativeData[nIdx++] = barTop;
        negativeData[nIdx++] = xi + w; negativeData[nIdx++] = barBottom;
        negativeData[nIdx++] = xi - w; negativeData[nIdx++] = barTop;
        negativeData[nIdx++] = xi + w; negativeData[nIdx++] = barBottom;
        negativeData[nIdx++] = xi - w; negativeData[nIdx++] = barBottom;
      }
    }
    
    // Connector line to next bar (if not last)
    if (i < n - 1) {
      const nextX = x[i + 1];
      connectorData[cIdx++] = xi + w;
      connectorData[cIdx++] = barTop;
      connectorData[cIdx++] = nextX - w;
      connectorData[cIdx++] = barTop;
    }
  }
  
  return {
    positiveData: positiveData.subarray(0, pIdx),
    negativeData: negativeData.subarray(0, nIdx),
    subtotalData: subtotalData.subarray(0, sIdx),
    connectorData: connectorData.subarray(0, cIdx),
    positiveCount: pIdx / 2,
    negativeCount: nIdx / 2,
    subtotalCount: sIdx / 2
  };
}
