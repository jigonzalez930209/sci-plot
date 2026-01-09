<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { SurfaceBar3DRenderer } = await import('@src/plugins/3d')
  
  const rows = 15, cols = 15, count = rows * cols
  const heights = new Float32Array(count), colors = new Float32Array(count * 3)
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c
      const dx = (c - cols / 2) / (cols / 2), dz = (r - rows / 2) / (rows / 2)
      const dist = Math.sqrt(dx * dx + dz * dz)
      heights[idx] = Math.cos(dist * Math.PI) * 1.5 + 2.5
      const h = heights[idx] / 4.0
      colors[idx * 3] = h, colors[idx * 3 + 1] = 0.8 - h, colors[idx * 3 + 2] = 0.5 + h * 0.5
    }
  }
  
  const renderer = new SurfaceBar3DRenderer({
    canvas,
    backgroundColor,
    barScale: 0.85,
    opacity: 1.0
  })
  
  renderer.setData({ rows, cols, heights, colors, spacing: [1.0, 1.0], origin: [-cols / 2, 0, -rows / 2] })
  renderer.fitToData()
  
  onReady(renderer, count)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
