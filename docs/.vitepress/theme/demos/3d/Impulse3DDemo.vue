<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { Impulse3DRenderer } = await import('@src/plugins/3d')
  
  const rows = 15, cols = 15, count = rows * cols
  const x = new Float32Array(count), y = new Float32Array(count), z = new Float32Array(count), colors = new Float32Array(count * 3)
  
  let idx = 0
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
        x[idx] = (i - cols / 2 + 0.5) * 0.5, z[idx] = (j - rows / 2 + 0.5) * 0.5
        y[idx] = Math.sin(i * 0.5) * Math.cos(j * 0.4) * 2 + 2.5
        const t = y[idx] / 4.5
        colors[idx * 3] = 0.2 + t * 0.6, colors[idx * 3 + 1] = 0.4 + t * 0.2, colors[idx * 3 + 2] = 0.9 - t * 0.4
        idx++
    }
  }
  
  const renderer = new Impulse3DRenderer({
    canvas,
    backgroundColor,
    stemWidth: 0.015,
    stemSides: 6,
    showMarkers: true,
    markerSize: 2.5,
  })
  
  renderer.setData({ x, y, z, colors, baseY: 0 })
  renderer.fitToData()
  onReady(renderer, count)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
