/**
 * @fileoverview LaTeX renderer using native Canvas API
 * @module plugins/latex/renderer
 */

import { LaTeXNode, LaTeXRenderContext, LaTeXDimensions } from './types';

/**
 * Render a list of LaTeX nodes to canvas
 */
export function renderNodes(
  nodes: LaTeXNode[],
  ctx: LaTeXRenderContext
): LaTeXDimensions {
  let currentX = ctx.x;
  let maxHeight = 0;
  let maxBaseline = 0;

  for (const node of nodes) {
    const dims = renderNode(node, { ...ctx, x: currentX });
    currentX += dims.width;
    maxHeight = Math.max(maxHeight, dims.height);
    maxBaseline = Math.max(maxBaseline, dims.baseline);
  }

  return {
    width: currentX - ctx.x,
    height: maxHeight,
    baseline: maxBaseline,
  };
}

/**
 * Render a single LaTeX node
 */
function renderNode(node: LaTeXNode, ctx: LaTeXRenderContext): LaTeXDimensions {
  switch (node.type) {
    case 'text':
      return renderText(node.content || '', ctx);

    case 'symbol':
      return renderSymbol(node.content || '', ctx);

    case 'superscript':
      return renderSuperscript(node.children || [], ctx);

    case 'subscript':
      return renderSubscript(node.children || [], ctx);

    case 'fraction':
      return renderFraction(
        node.numerator || [],
        node.denominator || [],
        ctx
      );

    case 'sqrt':
      return renderSqrt(node.children || [], ctx);

    case 'group':
      return renderNodes(node.children || [], ctx);

    default:
      return { width: 0, height: 0, baseline: 0 };
  }
}

/**
 * Render plain text
 */
function renderText(text: string, ctx: LaTeXRenderContext): LaTeXDimensions {
  ctx.ctx.save();
  ctx.ctx.font = `${ctx.fontSize}px ${ctx.fontFamily}`;
  ctx.ctx.fillStyle = ctx.color;
  ctx.ctx.textBaseline = 'alphabetic';

  const metrics = ctx.ctx.measureText(text);
  ctx.ctx.fillText(text, ctx.x, ctx.y);

  ctx.ctx.restore();

  const height = ctx.fontSize;
  const baseline = height * 0.75; // Approximate baseline

  return {
    width: metrics.width,
    height,
    baseline,
  };
}

/**
 * Render mathematical symbol
 */
function renderSymbol(symbol: string, ctx: LaTeXRenderContext): LaTeXDimensions {
  // Use larger font size for symbols
  ctx.ctx.save();
  ctx.ctx.font = `${ctx.fontSize * 1.1}px ${ctx.fontFamily}`;
  ctx.ctx.fillStyle = ctx.color;
  ctx.ctx.textBaseline = 'alphabetic';

  const metrics = ctx.ctx.measureText(symbol);
  ctx.ctx.fillText(symbol, ctx.x, ctx.y);

  ctx.ctx.restore();

  const height = ctx.fontSize * 1.1;
  const baseline = height * 0.75;

  return {
    width: metrics.width,
    height,
    baseline,
  };
}

/**
 * Render superscript (exponent)
 */
function renderSuperscript(
  nodes: LaTeXNode[],
  ctx: LaTeXRenderContext
): LaTeXDimensions {
  const scaledFontSize = ctx.fontSize * 0.7;
  const yOffset = -ctx.fontSize * 0.4;

  const dims = renderNodes(nodes, {
    ...ctx,
    fontSize: scaledFontSize,
    y: ctx.y + yOffset,
  });

  return {
    width: dims.width,
    height: ctx.fontSize,
    baseline: ctx.fontSize * 0.75,
  };
}

/**
 * Render subscript
 */
function renderSubscript(
  nodes: LaTeXNode[],
  ctx: LaTeXRenderContext
): LaTeXDimensions {
  const scaledFontSize = ctx.fontSize * 0.7;
  const yOffset = ctx.fontSize * 0.3;

  const dims = renderNodes(nodes, {
    ...ctx,
    fontSize: scaledFontSize,
    y: ctx.y + yOffset,
  });

  return {
    width: dims.width,
    height: ctx.fontSize,
    baseline: ctx.fontSize * 0.75,
  };
}

/**
 * Render fraction
 */
function renderFraction(
  numerator: LaTeXNode[],
  denominator: LaTeXNode[],
  ctx: LaTeXRenderContext
): LaTeXDimensions {
  const scaledFontSize = ctx.fontSize * 0.85;
  const lineThickness = Math.max(1, ctx.fontSize * 0.05);
  const padding = ctx.fontSize * 0.1;

  // Measure both parts
  const numDims = measureNodes(numerator, {
    ...ctx,
    fontSize: scaledFontSize,
  });
  const denDims = measureNodes(denominator, {
    ...ctx,
    fontSize: scaledFontSize,
  });

  const maxWidth = Math.max(numDims.width, denDims.width);
  const totalHeight = numDims.height + denDims.height + padding * 2 + lineThickness;

  // Render numerator (centered)
  const numX = ctx.x + (maxWidth - numDims.width) / 2;
  const numY = ctx.y - padding - lineThickness / 2;
  renderNodes(numerator, {
    ...ctx,
    x: numX,
    y: numY,
    fontSize: scaledFontSize,
  });

  // Draw fraction line
  ctx.ctx.fillStyle = ctx.color;
  ctx.ctx.fillRect(
    ctx.x,
    ctx.y - lineThickness / 2,
    maxWidth,
    lineThickness
  );

  // Render denominator (centered)
  const denX = ctx.x + (maxWidth - denDims.width) / 2;
  const denY = ctx.y + denDims.baseline + padding + lineThickness / 2;
  renderNodes(denominator, {
    ...ctx,
    x: denX,
    y: denY,
    fontSize: scaledFontSize,
  });

  return {
    width: maxWidth,
    height: totalHeight,
    baseline: totalHeight / 2,
  };
}

/**
 * Render square root
 */
function renderSqrt(nodes: LaTeXNode[], ctx: LaTeXRenderContext): LaTeXDimensions {
  const contentDims = renderNodes(nodes, {
    ...ctx,
    x: ctx.x + ctx.fontSize * 0.4,
  });

  const totalWidth = contentDims.width + ctx.fontSize * 0.5;
  const totalHeight = contentDims.height * 1.1;

  // Draw radical symbol
  ctx.ctx.save();
  ctx.ctx.strokeStyle = ctx.color;
  ctx.ctx.lineWidth = Math.max(1, ctx.fontSize * 0.05);
  ctx.ctx.lineCap = 'round';
  ctx.ctx.lineJoin = 'miter';

  ctx.ctx.beginPath();
  // Left tick
  ctx.ctx.moveTo(ctx.x, ctx.y - totalHeight * 0.3);
  ctx.ctx.lineTo(ctx.x + ctx.fontSize * 0.15, ctx.y);
  // Down stroke
  ctx.ctx.lineTo(ctx.x + ctx.fontSize * 0.3, ctx.y - totalHeight * 0.9);
  // Top bar
  ctx.ctx.lineTo(ctx.x + totalWidth, ctx.y - totalHeight * 0.9);
  ctx.ctx.stroke();

  ctx.ctx.restore();

  return {
    width: totalWidth,
    height: totalHeight,
    baseline: contentDims.baseline,
  };
}

/**
 * Measure nodes without rendering
 */
function measureNodes(
  nodes: LaTeXNode[],
  ctx: LaTeXRenderContext
): LaTeXDimensions {
  // Create an offscreen canvas for measurement
  const canvas = document.createElement('canvas');
  const measureCtx = canvas.getContext('2d');
  if (!measureCtx) {
    return { width: 0, height: 0, baseline: 0 };
  }

  return renderNodes(nodes, { ...ctx, ctx: measureCtx, x: 0, y: 0 });
}
