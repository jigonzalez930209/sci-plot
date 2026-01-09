<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { VectorField3DRenderer } = await import('@src/plugins/3d')
  
  const size = 15, total = size * size * size
  const positions = new Float32Array(total * 3), directions = new Float32Array(total * 3), colors = new Float32Array(total * 3)
  
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (z * size * size + y * size + x)
        const px = (x - size / 2) * 0.8, py = (y - size / 2) * 0.8, pz = (z - size / 2) * 0.8
        positions[idx * 3] = px, positions[idx * 3 + 1] = py, positions[idx * 3 + 2] = pz
        const dx = -py * 0.2, dy = px * 0.2, dz = Math.sin(px * 0.5) * 0.1
        directions[idx * 3] = dx, directions[idx * 3 + 1] = dy, directions[idx * 3 + 2] = dz
        colors[idx * 3] = 0.2 + idx/total * 0.5, colors[idx * 3 + 1] = 0.5, colors[idx * 3 + 2] = 0.9
      }
    }
  }
  
  const renderer = new VectorField3DRenderer({
    canvas,
    backgroundColor,
    scaleMultiplier: 2.0,
    opacity: 0.9
  })
  
  renderer.setData({ positions, directions, colors })
  renderer.fitToData()
  onReady(renderer, total)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
