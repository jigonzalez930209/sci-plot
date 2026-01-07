<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { Voxel3DRenderer } = await import('@src/core/3d')
  
  const size = 25, values = new Float32Array(size * size * size)
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - size / 2) / (size / 2), dy = (y - size / 2) / (size / 2), dz = (z - size / 2) / (size / 2)
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
        values[z * size * size + y * size + x] = Math.max(0, 1.0 - Math.abs(dist - 0.7) * 3.0)
      }
    }
  }
  
  const renderer = new Voxel3DRenderer({
    canvas,
    backgroundColor,
    voxelScale: 0.9,
    threshold: 0.15,
    opacity: 0.7
  })
  
  renderer.setData({ dimensions: [size, size, size], values, spacing: [0.5, 0.5, 0.5], origin: [-size*0.25, -size*0.25, -size*0.25] })
  renderer.fitToData()
  onReady(renderer, size * size * size)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
