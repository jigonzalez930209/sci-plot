<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  const rows = 40, cols = 40, count = rows * cols
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3), scales = new Float32Array(count)
  
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
        const idx = j * cols + i
        const x = (i - cols / 2 + 0.5) * 0.2, z = (j - rows / 2 + 0.5) * 0.2
        const value = Math.exp(-((x - 1) ** 2 + (z - 1) ** 2) / 1.5) + Math.exp(-((x + 1.5) ** 2 + (z + 0.5) ** 2) / 2)
        positions[idx * 3] = x, positions[idx * 3 + 1] = 0, positions[idx * 3 + 2] = z
        colors[idx * 3] = value, colors[idx * 3 + 1] = 0.5, colors[idx * 3 + 2] = 1 - value
        scales[idx] = 0.1
    }
  }
  
  const renderer = new Bubble3DRenderer({
    canvas,
    backgroundColor,
    style: { geometry: 'cube', enableLighting: false },
  })
  
  renderer.setData({ positions, colors, scales })
  renderer.fitToData()
  onReady(renderer, count)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
