import type { SankeyData, SankeyStyle, PlotArea, SankeyNode, SankeyLink } from "../types";

export function drawSankey(
  ctx: CanvasRenderingContext2D,
  data: SankeyData,
  style: SankeyStyle,
  plotArea: PlotArea
): void {
  const { nodes, links } = data;
  const {
    nodeWidth = 18,
    nodePadding = 12,
    palette = ["#6366f1", "#10b981", "#3b82f6", "#f43f5e", "#f59e0b"],
    linkOpacity = 0.4,
    showLabels = true
  } = style;

  if (!links.length) return;

  // Apply zoom out factor to reduce the diagram size
  const zoomFactor = 1.8;
  const effectiveWidth = plotArea.width / zoomFactor;
  const effectiveHeight = plotArea.height / zoomFactor;
  const offsetX = (plotArea.width - effectiveWidth) / 2;
  const offsetY = (plotArea.height - effectiveHeight) / 2;
  
  const scaledPlotArea = {
    x: plotArea.x + offsetX,
    y: plotArea.y + offsetY,
    width: effectiveWidth,
    height: effectiveHeight
  };

  // Use scaledPlotArea for all calculations below
  const workingArea = scaledPlotArea;

  // 1. Build node ID set
  const allNodeIds = new Set<string | number>();
  links.forEach((l: SankeyLink) => {
    allNodeIds.add(l.source);
    allNodeIds.add(l.target);
  });
  const nodeIds = Array.from(allNodeIds);

  // 2. Calculate layers (depth-first from sources)
  const nodeLevels = new Map<string | number, number>();
  const targets = new Set(links.map((l: SankeyLink) => l.target));
  const roots = nodeIds.filter(id => !targets.has(id));
  
  roots.forEach(id => nodeLevels.set(id, 0));
  
  let changed = true;
  while (changed) {
    changed = false;
    links.forEach((l: SankeyLink) => {
      const srcLevel = nodeLevels.get(l.source);
      if (srcLevel !== undefined) {
        const currentDstLevel = nodeLevels.get(l.target);
        const newDstLevel = srcLevel + 1;
        if (currentDstLevel === undefined || newDstLevel > currentDstLevel) {
          nodeLevels.set(l.target, newDstLevel);
          changed = true;
        }
      }
    });
  }

  nodeIds.forEach(id => {
    if (nodeLevels.get(id) === undefined) nodeLevels.set(id, 0);
  });

  const maxLevel = Math.max(...Array.from(nodeLevels.values()));
  const layers: (string | number)[][] = Array.from({ length: maxLevel + 1 }, () => []);
  nodeIds.forEach(id => layers[nodeLevels.get(id)!].push(id));

  // 3. Calculate node values (max of in/out)
  const nodeInValue = new Map<string | number, number>();
  const nodeOutValue = new Map<string | number, number>();
  
  links.forEach((l: SankeyLink) => {
    nodeOutValue.set(l.source, (nodeOutValue.get(l.source) || 0) + l.value);
    nodeInValue.set(l.target, (nodeInValue.get(l.target) || 0) + l.value);
  });

  const getNodeValue = (id: string | number) => Math.max(nodeInValue.get(id) || 0, nodeOutValue.get(id) || 0);

  // 4. Calculate global scale
  let maxLayerTotal = 0;
  layers.forEach(layerNodes => {
    let layerTotal = 0;
    layerNodes.forEach(id => layerTotal += getNodeValue(id));
    if (layerTotal > maxLayerTotal) maxLayerTotal = layerTotal;
  });

  // 5. Position nodes
  type NodeLayout = { x: number; y: number; width: number; height: number; color: string; value: number };
  const nodeRegistry = new Map<string | number, NodeLayout>();
  
  const numLayers = layers.length;
  const horizontalSpacing = (workingArea.width - nodeWidth) / Math.max(1, numLayers - 1);

  layers.forEach((layerNodes, lIdx) => {
    const x = workingArea.x + (lIdx * horizontalSpacing);
    
    // Calculate all node heights first
    const nodeHeights: number[] = [];
    let layerHeightSum = 0;
    layerNodes.forEach(id => {
      const val = getNodeValue(id);
      const h = maxLayerTotal > 0 ? (val / maxLayerTotal) * (workingArea.height * 0.9) : 20;
      nodeHeights.push(h);
      layerHeightSum += h;
    });

    // Center nodes vertically
    const totalPadding = (layerNodes.length - 1) * nodePadding;
    const totalContentHeight = layerHeightSum + totalPadding;
    let currentY = workingArea.y + (workingArea.height - totalContentHeight) / 2;

    layerNodes.forEach((id, nIdx) => {
      const height = nodeHeights[nIdx];
      
      let color = palette[nIdx % palette.length];
      if (nodes.length > 0) {
        const found = (nodes as SankeyNode[]).find(n => n.id === id);
        if (found?.color) color = found.color;
      }
      
      nodeRegistry.set(id, { x, y: currentY, width: nodeWidth, height, color, value: getNodeValue(id) });
      currentY += height + nodePadding;
    });
  });

  // 6. Draw flow bands FIRST (behind nodes)
  ctx.save();
  
  const sourceOffsets = new Map<string | number, number>();
  const targetOffsets = new Map<string | number, number>();

  links.forEach((link: SankeyLink) => {
    const src = nodeRegistry.get(link.source);
    const dst = nodeRegistry.get(link.target);
    if (!src || !dst) return;

    const sOffset = sourceOffsets.get(link.source) || 0;
    const tOffset = targetOffsets.get(link.target) || 0;
    
    const sValue = nodeOutValue.get(link.source) || 1;
    const tValue = nodeInValue.get(link.target) || 1;

    const srcFlowHeight = (link.value / sValue) * src.height;
    const dstFlowHeight = (link.value / tValue) * dst.height;

    // Coordinates
    const x0 = src.x + src.width;
    const y0 = src.y + sOffset;
    const y1 = y0 + srcFlowHeight;

    const x2 = dst.x;
    const y2 = dst.y + tOffset;
    const y3 = y2 + dstFlowHeight;

    const cpOffset = (x2 - x0) * 0.5;

    // Create gradient for the flow
    const gradient = ctx.createLinearGradient(x0, (y0 + y1) / 2, x2, (y2 + y3) / 2);
    gradient.addColorStop(0, src.color);
    gradient.addColorStop(1, dst.color);

    // Draw filled flow band
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x0 + cpOffset, y0, x2 - cpOffset, y2, x2, y2);
    ctx.lineTo(x2, y3);
    ctx.bezierCurveTo(x2 - cpOffset, y3, x0 + cpOffset, y1, x0, y1);
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.globalAlpha = linkOpacity;
    ctx.fill();
    
    // Optional: Add a subtle stroke for definition
    ctx.strokeStyle = src.color;
    ctx.globalAlpha = linkOpacity * 0.3;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    sourceOffsets.set(link.source, sOffset + srcFlowHeight);
    targetOffsets.set(link.target, tOffset + dstFlowHeight);
  });
  
  ctx.restore();

  // 7. Draw nodes ON TOP
  ctx.save();
  ctx.globalAlpha = 1.0;
  
  nodeRegistry.forEach((node) => {
    // Main node rectangle
    ctx.fillStyle = node.color;
    ctx.fillRect(node.x, node.y, node.width, node.height);
    
    // Optional: Add slight gradient for depth
    const grad = ctx.createLinearGradient(node.x, node.y, node.x + node.width, node.y);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.15)");
    ctx.fillStyle = grad;
    ctx.fillRect(node.x, node.y, node.width, node.height);
  });
  
  ctx.restore();

  // 8. Draw labels LAST
  if (showLabels) {
    ctx.save();
    ctx.font = "bold 11px Inter, -apple-system, sans-serif";
    ctx.textBaseline = "middle";
    
    nodeRegistry.forEach((node, id) => {
      let nodeName = String(id);
      const found = (nodes as SankeyNode[]).find(n => n.id === id);
      if (found?.name) nodeName = found.name;

      const isFirstLayer = node.x <= workingArea.x + 5;
      const isLastLayer = node.x >= workingArea.x + workingArea.width - nodeWidth - 5;
      
      // White text with dark shadow for contrast
      ctx.shadowBlur = 3;
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.fillStyle = "#ffffff";

      if (isFirstLayer) {
        ctx.textAlign = "right";
        ctx.fillText(nodeName, node.x - 10, node.y + node.height / 2);
      } else if (isLastLayer) {
        ctx.textAlign = "left";
        ctx.fillText(nodeName, node.x + node.width + 10, node.y + node.height / 2);
      } else {
        // Middle layers: label above
        ctx.textAlign = "center";
        ctx.fillText(nodeName, node.x + node.width / 2, node.y - 10);
      }
    });
    
    ctx.restore();
  }
}
