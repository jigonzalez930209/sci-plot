import type { Scale } from "../../scales";
import type { AxisBreak } from "./types";

export class BrokenAxisScale implements Scale {
  public domain: [number, number] = [0, 1];
  public range: [number, number] = [0, 100];
  public readonly type = "linear"; // Compatible with linear for renderer selection

  private underlying: Scale;
  private sortedBreaks: AxisBreak[] = [];
  private visibleRanges: { start: number; end: number; pixelOffset: number; pixelScale: number }[] = [];
  private availableVisualRatio: number = 1.0;

  constructor(originalScale: Scale, private breaks: AxisBreak[]) {
    this.underlying = originalScale;
    this.domain = [...originalScale.domain];
    this.range = [...originalScale.range];
    this.refresh();
  }

  setDomain(min: number, max: number): void {
    this.domain = [min, max];
    this.underlying.setDomain(min, max);
    this.refresh();
  }

  setRange(min: number, max: number): void {
    this.range = [min, max];
    this.underlying.setRange(min, max);
    this.refresh();
  }

  updateBreaks(breaks: AxisBreak[]) {
    this.breaks = breaks;
    this.refresh();
  }

  private refresh() {
    const [min, max] = this.domain;
    
    // 1. Sort and filter breaks within [min, max]
    this.sortedBreaks = this.breaks
      .filter(b => b.start < max && b.end > min)
      .map(b => ({
        ...b,
        start: Math.max(min, b.start),
        end: Math.min(max, b.end),
        visualRatio: b.visualRatio ?? 0.02
      }))
      .sort((a, b) => a.start - b.start);

    // 2. Identify visible data segments
    const segments: { start: number; end: number }[] = [];
    let current = min;

    for (const b of this.sortedBreaks) {
      if (b.start > current) {
        segments.push({ start: current, end: b.start });
      }
      current = b.end;
    }
    if (current < max) {
      segments.push({ start: current, end: max });
    }

    // 3. Calculate total data span of visible segments
    const totalVisibleDataWidth = segments.reduce((sum, s) => sum + (s.end - s.start), 0) || 1e-10;
    const totalBreakVisualRatio = this.sortedBreaks.reduce((sum, b) => sum + (b.visualRatio || 0.02), 0);
    this.availableVisualRatio = Math.max(0.1, 1.0 - totalBreakVisualRatio);

    // 4. Calculate mapping for each segment (in 0-1 ratio space)
    let currentRatioOffset = 0;
    this.visibleRanges = segments.map(s => {
      const dataWidth = s.end - s.start;
      const visualWidth = (dataWidth / totalVisibleDataWidth) * this.availableVisualRatio;
      const range = {
        start: s.start,
        end: s.end,
        pixelOffset: currentRatioOffset,
        pixelScale: visualWidth / dataWidth
      };
      
      // Find following break if any to advance offset
      const nextBreak = this.sortedBreaks.find(b => Math.abs(b.start - s.end) < 1e-10);
      currentRatioOffset += visualWidth + (nextBreak?.visualRatio ?? 0);
      
      return range;
    });
  }

  transform(value: number): number {
    const [min, max] = this.domain;
    const [r0, r1] = this.range;
    const isReverse = r1 < r0;
    
    let ratio = 0;
    if (value <= min) ratio = 0;
    else if (value >= max) ratio = 1;
    else {
        let found = false;
        // Check visible segments
        for (const range of this.visibleRanges) {
          if (value >= range.start && value <= range.end) {
            ratio = range.pixelOffset + (value - range.start) * range.pixelScale;
            found = true;
            break;
          }
        }
        
        // If in break
        if (!found) {
            for (const b of this.sortedBreaks) {
              if (value >= b.start && value <= b.end) {
                const prevRange = this.visibleRanges.find(r => Math.abs(r.end - b.start) < 1e-10);
                const offset = prevRange ? prevRange.pixelOffset + (prevRange.end - prevRange.start) * prevRange.pixelScale : 0;
                ratio = offset + (value - b.start) / (b.end - b.start) * (b.visualRatio ?? 0.02);
                found = true;
                break;
              }
            }
        }
        
        if (!found) ratio = 0;
    }

    // Map ratio to pixels
    return isReverse ? r0 - ratio * (r0 - r1) : r0 + ratio * (r1 - r0);
  }

  /** Map data value to 0-1 ratio space (handles breaks) */
  mapToRatio(value: number): number {
    const [min, max] = this.domain;
    if (value <= min) return 0;
    if (value >= max) return 1;

    for (const range of this.visibleRanges) {
      if (value >= range.start && value <= range.end) {
        return range.pixelOffset + (value - range.start) * range.pixelScale;
      }
    }

    for (const b of this.sortedBreaks) {
      if (value >= b.start && value <= b.end) {
        const prevRange = this.visibleRanges.find(r => Math.abs(r.end - b.start) < 1e-10);
        const offset = prevRange ? prevRange.pixelOffset + (prevRange.end - prevRange.start) * prevRange.pixelScale : 0;
        return offset + (value - b.start) / (b.end - b.start) * (b.visualRatio ?? 0.02);
      }
    }

    return 0;
  }

  invert(pixel: number): number {
    const [r0, r1] = this.range;
    const ratio = (pixel - r0) / (r1 - r0);
    
    const r = Math.max(0, Math.min(1, ratio));

    for (const range of this.visibleRanges) {
      const visualEnd = range.pixelOffset + (range.end - range.start) * range.pixelScale;
      if (r >= range.pixelOffset && r <= visualEnd) {
        return range.start + (r - range.pixelOffset) / range.pixelScale;
      }
    }

    // In break, return nearest segment boundary
    for (let i = 0; i < this.sortedBreaks.length; i++) {
        const b = this.sortedBreaks[i];
        const prevRange = this.visibleRanges.find(range => Math.abs(range.end - b.start) < 1e-10);
        const offset = prevRange ? prevRange.pixelOffset + (prevRange.end - prevRange.start) * prevRange.pixelScale : 0;
        if (r >= offset && r <= offset + (b.visualRatio ?? 0.02)) {
            return b.start;
        }
    }

    return this.domain[0];
  }

  ticks(count: number = 10): number[] {
    // Generate ticks for each visible segment based on their visual weight
    const allTicks: number[] = [];
    
    for (const range of this.visibleRanges) {
        const visualWeight = (range.end - range.start) / (this.domain[1] - this.domain[0]);
        const segmentCount = Math.max(2, Math.round(count * visualWeight / this.availableVisualRatio));
        
        // Use underlying logic for "nice" steps but restricted to this range
        const segmentTicks = this.generateSegmentTicks(range.start, range.end, segmentCount);
        allTicks.push(...segmentTicks);
    }

    // Remove duplicates and sort
    return Array.from(new Set(allTicks)).sort((a, b) => a - b);
  }

  private generateSegmentTicks(min: number, max: number, count: number): number[] {
      const range = max - min;
      if (range <= 0 || !isFinite(range)) return [];
      
      // Re-use niceStep logic
      const rawStep = range / count;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const normalized = rawStep / magnitude;
      let step: number;
      if (normalized < 1.5) step = 1; else if (normalized < 3) step = 2; else if (normalized < 7) step = 5; else step = 10;
      step *= magnitude;

      const start = Math.ceil(min / step) * step;
      const ticks: number[] = [];
      let t = start;
      while (t <= max + step * 0.1) {
          ticks.push(Math.round(t * 1e12) / 1e12);
          t += step;
      }
      return ticks;
  }
}
