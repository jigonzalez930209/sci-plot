---
title: LaTeX Rendering
description: Native mathematical expressions without external dependencies
---

# LaTeX Rendering

The Sci Plot includes a **native LaTeX rendering plugin** that allows you to display mathematical expressions directly in your charts without requiring external libraries like KaTeX or MathJax.

## Interactive Demo

Try editing the LaTeX expression below and see it rendered in real-time:

<LaTeXDemo height="500px" />

## Key Features

✅ **Zero Dependencies** - 100% native implementation using Canvas 2D API  
✅ **Performance** - Intelligent caching for fast re-renders  
✅ **Comprehensive** - Greek letters, operators, fractions, roots  
✅ **Customizable** - Font size, color, and style options

## Common Use Cases

### Scientific Publications

Display equations exactly as they would appear in academic papers:

```latex
\frac{\partial^2 \psi}{\partial t^2} = c^2 \nabla^2 \psi
```

### Chemical Formulas

Express molecular structures clearly:

```latex
H_2O + CO_2 \rightarrow H_2CO_3
```

### Statistical Notation

Show summations, integrals, and statistical operators:

```latex
\sum_{i=1}^{n} (x_i - \mu)^2
```

### Physical Constants

Present equations with proper notation:

```latex
\sigma_x \times \sigma_y \geq \frac{\hbar}{2}
```

## Integration Examples

### Axis Labels

Use LaTeX for axis labels to display units and mathematical expressions:

```typescript
import { createChart } from 'sci-plot';
import { PluginLaTeX } from 'sci-plot/plugins';

const chart = createChart({ container });
await chart.use(PluginLaTeX());

// Set axis labels with LaTeX
chart.xAxis.label = '\\Delta E (eV)';
chart.yAxis.label = '\\frac{dI}{dV} (nA/mV)';
```

### Annotations

Add mathematical annotations to highlight key points:

```typescript
chart.addAnnotation({
  type: 'text',
  text: 'E = mc^2',
  position: { x: 100, y: 200 },
  latex: true,
  style: {
    fontSize: 20,
    color: '#ff0000'
  }
});
```

### Legend Labels

Use LaTeX in series labels:

```typescript
chart.addSeries({
  id: 'wave1',
  data: waveData,
  label: '\\psi(x,t) = A e^{i(kx - \\omega t)}',
  latex: true
});
```

## Supported Syntax

### Greek Letters

All Greek letters are supported (both lowercase and uppercase):

- Lowercase: `\alpha`, `\beta`, `\gamma`, `\delta`, `\epsilon`, `\theta`, `\lambda`, `\mu`, `\pi`, `\sigma`, `\tau`, `\phi`, `\omega`
- Uppercase: `\Delta`, `\Gamma`, `\Lambda`, `\Sigma`, `\Omega`

### Mathematical Operators

Common operators and symbols:

- Arithmetic: `\pm`, `\times`, `\div`, `\cdot`
- Calculus: `\sum`, `\int`, `\partial`, `\nabla`
- Relations: `\leq`, `\geq`, `\neq`, `\approx`, `\equiv`
- Set Theory: `\in`, `\notin`, `\subset`, `\cup`, `\cap`
- Logic: `\forall`, `\exists`, `\neg`, `\vee`, `\wedge`
- Arrows: `\rightarrow`, `\Rightarrow`, `\leftrightarrow`
- Special: `\infty`, `\emptyset`, `\angle`, `\perp`

### Expressions

- **Superscripts**: `x^2` renders as x²
- **Subscripts**: `H_2O` renders as H₂O
- **Fractions**: `\frac{a}{b}` renders as a vertical fraction
- **Square Roots**: `\sqrt{x}` renders with a radical symbol

## Performance Tips

### Enable Caching

The plugin includes intelligent caching to avoid re-parsing and re-measuring:

```typescript
await chart.use(PluginLaTeX({
  enableCache: true // Default: true
}));
```

### Pre-measure Large Expressions

For complex expressions, measure dimensions before rendering:

```typescript
const dims = chart.latex.measure('\\frac{\\partial^2 y}{\\partial x^2}');
console.log(`Width: ${dims.width}, Height: ${dims.height}`);
```

### Clear Cache When Needed

Free memory by clearing the cache after bulk operations:

```typescript
chart.latex.clearCache();
```

## Limitations

This is a **lightweight native implementation** optimized for common scientific use cases. It intentionally does **not** support:

- Complex matrices with `\begin{matrix}`
- Multi-line equations with `\begin{align}`
- Advanced spacing commands like `\quad`, `\hspace`
- Text mode vs. math mode distinction
- All 1000+ LaTeX commands

For full LaTeX support, consider integrating KaTeX or MathJax separately.

## Future Roadmap

Planned enhancements for future versions:

- 📊Matrices and arrays
- 🎨 Color commands (`\color{red}`)
- 📏 Custom spacing
- 🔄 Limits on integrals and sums (`\int_0^\infty`)
- 🔢 More complex fractions

## Technical Implementation

The plugin uses a **three-stage pipeline**:

1. **Tokenization**: Splits LaTeX string into tokens (commands, text, special chars)
2. **Parsing**: Builds an Abstract Syntax Tree (AST) from tokens
3. **Rendering**: Traverses AST and draws to Canvas 2D context

All symbol mappings use **Unicode characters**, ensuring compatibility across all modern browsers without requiring font downloads.

## See Also

- [LaTeX Plugin API Reference](/api/plugin-latex)
- [Annotations Plugin](/api/plugin-annotations)
- [Theme Customization](/guide/themes)
