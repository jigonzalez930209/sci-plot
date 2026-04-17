General-purpose utilities for data processing and formatting. These are available as standalone functions or via `chart.analysis`.

::: tip Requirement
While many of these are standalone utilities, the recommended way to use them within a chart is to load the `PluginAnalysis`.
:::

## calculateStats

Calculate basic statistics for a dataset.

```typescript
import { calculateStats } from 'sci-plot'

// Use standalone
const stats = calculateStats(yData)

// Or via chart (if PluginAnalysis is loaded)
const stats = chart.analysis.calculateStats(yData)
```

### Returns

```typescript
interface DataStats {
  min: number     // Minimum value
  max: number     // Maximum value
  mean: number    // Arithmetic mean
  stdDev: number  // Standard deviation
  count: number   // Number of points
}
```

### Example

```typescript
import { calculateStats } from 'sci-plot'

const stats = calculateStats(yData)

console.log(`Count: ${stats.count}`)
console.log(`Range: ${stats.min.toFixed(4)} to ${stats.max.toFixed(4)}`)
console.log(`Mean: ${stats.mean.toFixed(4)}`)
console.log(`Std Dev: ${stats.stdDev.toFixed(4)}`)
```

---

## movingAverage

Apply moving average smoothing to reduce noise.

```typescript
function movingAverage(
  data: Float32Array | Float64Array | number[],
  windowSize: number
): Float32Array
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Float32Array \| Float64Array \| number[]` | Input data |
| `windowSize` | `number` | Number of points to average (should be odd) |

### Example

```typescript
import { movingAverage } from 'sci-plot'

// Smooth noisy data with 5-point moving average
const smoothed = movingAverage(noisyData, 5)

chart.addSeries({
  id: 'smoothed',
  data: { x: xData, y: smoothed },
  style: { color: '#00ff88' },
})
```

---

## downsampleLTTB

Reduce point count using the Largest Triangle Three Buckets (LTTB) algorithm. Preserves visual shape while dramatically reducing data size.

```typescript
function downsampleLTTB(
  x: Float32Array | Float64Array,
  y: Float32Array | Float64Array,
  targetPoints: number
): { x: Float32Array; y: Float32Array }
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `x` | `Float32Array \| Float64Array` | X values |
| `y` | `Float32Array \| Float64Array` | Y values |
| `targetPoints` | `number` | Desired number of output points |

### Example

```typescript
import { downsampleLTTB } from 'sci-plot'

// Reduce 10 million points to 10,000 for display
const { x: sampledX, y: sampledY } = downsampleLTTB(
  originalX,
  originalY,
  10000
)

chart.addSeries({
  id: 'data',
  data: { x: sampledX, y: sampledY },
})
```

### When to Use

- Displaying very large datasets (1M+ points)
- Reducing data transfer size
- Improving render performance
- Creating thumbnails or previews

---

## validateData

Check for invalid values (NaN, Infinity, -Infinity).

```typescript
function validateData(
  data: Float32Array | Float64Array | number[]
): ValidationResult
```

### Returns

```typescript
interface ValidationResult {
  valid: boolean          // True if all values are finite
  invalidCount: number    // Number of invalid values
  firstInvalidIndex: number  // Index of first invalid (-1 if none)
}
```

### Example

```typescript
import { validateData } from 'sci-plot'

const result = validateData(yData)

if (!result.valid) {
  console.warn(`Found ${result.invalidCount} invalid values`)
  console.warn(`First invalid at index ${result.firstInvalidIndex}`)
}
```

---

## formatWithPrefix

Format numbers with automatic SI prefix (k, M, G, m, µ, n, p).

```typescript
function formatWithPrefix(
  value: number,
  unit: string,
  decimals?: number
): string
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `number` | **required** | Value to format |
| `unit` | `string` | **required** | Unit symbol (V, A, m, s, etc.) |
| `decimals` | `number` | `2` | Decimal places |

### Example

```typescript
import { formatWithPrefix } from 'sci-plot'

formatWithPrefix(0.000001, 'A')    // "1.00 µA"
formatWithPrefix(0.5, 'V')         // "500.00 mV"
formatWithPrefix(1500, 'm')        // "1.50 km"
formatWithPrefix(2.5e-9, 's')      // "2.50 ns"
formatWithPrefix(1e6, 'Hz')        // "1.00 MHz"
```

---

## formatValue

Format a number with automatic scientific notation for extreme values.

```typescript
function formatValue(value: number, decimals?: number): string
```

### Example

```typescript
import { formatValue } from 'sci-plot'

formatValue(123.456)      // "123.456"
formatValue(0.0001)       // "1.000e-4"
formatValue(1234567)      // "1.235e+6"
```

---

## formatScientific

Always format in scientific notation.

```typescript
function formatScientific(value: number, decimals?: number): string
```

### Example

```typescript
import { formatScientific } from 'sci-plot'

formatScientific(123.456)    // "1.23e+2"
formatScientific(0.001)      // "1.00e-3"
```

---

## getBestPrefix

Get the optimal SI prefix for a value.

```typescript
function getBestPrefix(value: number): PrefixInfo
```

### Returns

```typescript
interface PrefixInfo {
  symbol: string   // 'p' | 'n' | 'µ' | 'm' | '' | 'k' | 'M' | 'G'
  factor: number   // Multiplication factor (e.g., 1e-6 for µ)
}
```

### Example

```typescript
import { getBestPrefix } from 'sci-plot'

const prefix = getBestPrefix(0.000001)
// { symbol: 'µ', factor: 1e-6 }

const scaled = 0.000001 / prefix.factor  // 1
console.log(`${scaled} ${prefix.symbol}A`)  // "1 µA"
```

---

## integrate

Numerical integration using the trapezoidal rule. Essential for calculating areas under curves (e.g., total charge, energy).

```typescript
function integrate(
  x: number[] | Float32Array,
  y: number[] | Float32Array,
  xMin?: number,
  xMax?: number
): number
```

### Parameters

| Name | Type | Description |
|------|------|-------------|
| `x` | `number[] \| Float32Array` | X values (must be sorted). |
| `y` | `number[] \| Float32Array` | Y values. |
| `xMin` | `number` | Optional: start of integration range (in X units). |
| `xMax` | `number` | Optional: end of integration range (in X units). |

### Example

```typescript
import { integrate } from 'sci-plot'

const area = integrate(xData, yData, 0.2, 0.8)
// Or via chart: chart.analysis.integrate(...)
console.log(`Peak Area: ${area.toFixed(4)}`)
```

---

## subtractBaseline

Subtract a linear baseline from a dataset. Useful for removing drift or constant backgrounds.

```typescript
function subtractBaseline(
  x: number[] | Float32Array,
  y: number[] | Float32Array,
  x1: number,
  x2: number
): Float32Array
```

### Parameters

| Name | Type | Description |
|------|------|-------------|
| `x` | `number[] \| Float32Array` | X values. |
| `y` | `number[] \| Float32Array` | Y values. |
| `x1` | `number` | X coordinate of the first baseline point. |
| `x2` | `number` | X coordinate of the second baseline point. |

### Example

```typescript
import { subtractBaseline } from 'sci-plot'

// Subtract background using points at x=0.1 and x=0.9
const correctedY = subtractBaseline(xData, yData, 0.1, 0.9)
// Or via chart: chart.analysis.subtractBaseline(...)

chart.addSeries({
  id: 'corrected',
  data: { x: xData, y: correctedY }
})
```
