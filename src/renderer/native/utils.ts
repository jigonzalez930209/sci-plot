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
