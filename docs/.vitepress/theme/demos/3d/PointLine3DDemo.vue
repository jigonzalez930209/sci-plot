<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { Line3DRenderer } = await import('@src/core/3d')
  
  const spirals = 3
  const pointsPerSpiral = 500
  const lines: any[] = []
  const spiralColors: [number, number, number][] = [[0.9, 0.3, 0.5], [0.3, 0.9, 0.5], [0.5, 0.3, 0.9]]
  
  for (let s = 0; s < spirals; s++) {
    const x = new Float32Array(pointsPerSpiral), y = new Float32Array(pointsPerSpiral), z = new Float32Array(pointsPerSpiral)
    const offset = (s / spirals) * Math.PI * 2
    for (let i = 0; i < pointsPerSpiral; i++) {
      const t = i / pointsPerSpiral
      const theta = t * Math.PI * 6 + offset
      const r = 2 + t * 2
      x[i] = r * Math.cos(theta), y[i] = t * 8 - 4, z[i] = r * Math.sin(theta)
    }
    lines.push({ x, y, z, color: spiralColors[s] })
  }
  
  const renderer = new Line3DRenderer({
    canvas,
    backgroundColor,
    lineWidth: 0.08,
    tubeSides: 8,
  })
  
  renderer.setData(lines)
  renderer.fitToData()
  
  onReady(renderer, spirals * pointsPerSpiral)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
