---
title: LaTeX Plugin API
description: Native LaTeX rendering for mathematical expressions
---

# PluginLaTeX

The `PluginLaTeX` provides native LaTeX rendering capabilities without any external dependencies. It supports common mathematical notation including Greek letters, superscripts, subscripts, fractions, square roots, and mathematical operators.

## Features

- **Zero Dependencies**: 100% native implementation using Canvas 2D API
- **Caching**: Intelligent caching for improved performance
- **Comprehensive Symbols**: Support for Greek letters and mathematical operators
- **Mathematical Expressions**: Superscripts, subscripts, fractions, and square roots
- **Customizable**: Configurable font size, family, and color

## Installation

```typescript
import { createChart } from 'scichart-engine';
import { PluginLaTeX } from 'scichart-engine/plugins';

const chart = createChart({ container });

// Install with default configuration
await chart.use(Plugin LaTeX());

// Or with custom configuration
await chart.use(PluginLaTeX({
  fontSize: 16,
  fontFamily: 'serif',
  color: '#333333',
  enableCache: true
}));
```

## Configuration

### PluginLaTeXConfig

```typescript
interface PluginLaTeXConfig {
  /**
   * Default font size for LaTeX text (in pixels)
   * @default 14
   */
  fontSize?: number;

  /**
   * Default font family
   * @default 'serif'
   */
  fontFamily?: string;

  /**
   * Default text color
   * @default '#000000'
   */
  color?: string;

  /**
   * Enable caching of rendered LaTeX
   * @default true
   */
  enableCache?: boolean;

  /**
   * Custom symbol mappings
   */
  customSymbols?: Record<string, string>;
}
```

## API Methods

Once installed, the plugin exposes the `chart.latex` API with the following methods:

### render()

Render a LaTeX string to canvas at a specified position.

```typescript
chart.latex.render(
  latex: string,
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  options?: Partial<PluginLaTeXConfig>
): LaTeXDimensions
```

**Example:**
```typescript
const dims = chart.latex.render(
  'E = mc^2',
  ctx,
  100,
  100,
  { fontSize: 20, color: '#ff0000' }
);
```

### measure()

Measure LaTeX string dimensions without rendering.

```typescript
chart.latex.measure(
  latex: string,
  options?: Partial<PluginLaTeXConfig>
): LaTeXDimensions
```

**Example:**
```typescript
const dims = chart.latex.measure('\\frac{a}{b}', { fontSize: 16 });
console.log(`Width: ${dims.width}, Height: ${dims.height}`);
```

### clearCache()

Clear the rendering cache.

```typescript
chart.latex.clearCache(): void
```

## Supported LaTeX Commands

### Greek Letters

#### Lowercase
- `\alpha` → α
- `\beta` → β
- `\gamma` → γ
- `\delta` → δ
- `\epsilon` → ε
- `\theta` → θ
- `\lambda` → λ
- `\mu` → μ
- `\pi` → π
- `\sigma` → σ
- `\omega` → ω
- And all other Greek letters...

#### Uppercase
- `\Delta` → Δ
- `\Gamma` → Γ
- `\Lambda` → Λ
- `\Sigma` → Σ
- `\Omega` → Ω
- And all other uppercase Greek letters...

### Mathematical Operators

- `\sum` → ∑ (summation)
- `\int` → ∫ (integral)
- `\partial` → ∂ (partial derivative)
- `\infty` → ∞ (infinity)
- `\pm` → ± (plus-minus)
- `\times` → × (multiplication)
- `\div` → ÷ (division)
- `\leq` → ≤ (less than or equal)
- `\geq` → ≥ (greater than or equal)
- `\neq` → ≠ (not equal)
- `\approx` → ≈ (approximately equal)
- `\rightarrow` → → (right arrow)
- `\Rightarrow` → ⇒ (implies)
- And many more...

### Superscripts and Subscripts

```typescript
// Superscript
'x^2' → x²
'E = mc^2' → E = mc²

// Subscript
'H_2O' → H₂O
'x_i' →  x ᵢ

// Combined
'x_i^2' → xᵢ²
```

### Fractions

```typescript
'\\frac{a}{b}' → a/b (rendered as vertical fraction)
'\\frac{\\partial y}{\\partial x}' → ∂y/∂x
```

### Square Roots

```typescript
'\\sqrt{x}' → √x
'\\sqrt{x^2 + y^2}' → √(x² + y²)
```

## Usage Examples

### Axis Labels

```typescript
// Set axis labels with LaTeX
chart.xAxis.label = '\\Delta E (eV)';
chart.yAxis.label = '\\frac{dI}{dV} (nA/mV)';
```

### Annotations

```typescript
// Add annotation with LaTeX
chart.addAnnotation({
  type: 'text',
  text: 'E = mc^2',
  position: { x: 100, y: 200 },
  latex: true,
  style: {
    fontSize: 20,
    color: '#0066ff'
  }
});
```

### Complex Math Expressions

```typescript
// Summation
const expr1 = '\\sum_{i=1}^{n} x_i';

// Integral
const expr2 = '\\int_{0}^{\\infty} f(x) dx';

// Differential equation
const expr3 = '\\frac{\\partial^2 y}{\\partial x^2} + \\alpha y = 0';

// Greek letters with subscripts
const expr4 = '\\sigma_x \\times \\sigma_y \\geq \\frac{\\hbar}{2}';
```

## Performance Considerations

1. **Caching**: The plugin caches both parsed AST and measured dimensions. Enable caching for better performance:
   ```typescript
   PluginLaTeX({ enableCache: true })
   ```

2. **Measurement**: Use `measure()` to get dimensions before rendering if you need to calculate layouts.

3. **Clear Cache**: Call `clearCache()` if you change LaTeX content dynamically to free memory.

## Limitations

This is a **lightweight, native implementation** designed for common scientific use cases. It does not support:

- Complex matrices
- Multi-line equations
- Advanced spacing commands
- All LaTeX commands (only the most common ones)

For full LaTeX support, consider integrating an external library like KaTeX or MathJax.

## Future Enhancements

The following features are planned for future releases:

- [ ] Matrices (`\begin{matrix}...\end{matrix}`)
- [ ] Subscripts and superscripts for integrals
- [ ] Color commands (`\color{red}`)
- [ ] Text mode vs. math mode distinction
- [ ] More complex layout algorithms

## TypeScript Types

```typescript
interface LaTeXDimensions {
  width: number;
  height: number;
  baseline: number;
}

interface LaTeXPluginAPI {
  render(
    latex: string,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    options?: Partial<PluginLaTeXConfig>
  ): LaTeXDimensions;

  measure(
    latex: string,
    options?: Partial<PluginLaTeXConfig>
  ): LaTeXDimensions;

  clearCache(): void;
}
```

## See Also

- [LaTeX Demo Example](/examples/latex-rendering)
- [Annotations Plugin](/api/plugin-annotations)
- [Theme Editor](/api/plugin-theme-editor)
