<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { Line3DRenderer } = await import('@src/core/3d')
  
  const spirals = 5
  const pointsPerSpiral = 800
  const lines: any[] = []
  const spiralColors: [number, number, number][] = [
    [0.0, 0.95, 1.0], // Cyan
    [0.66, 0.33, 1.0], // Purple
    [1.0, 0.92, 0.0], // Yellow
    [1.0, 0.4, 0.0],  // Orange
    [0.0, 1.0, 0.5]   // Green
  ]
  
  for (let s = 0; s < spirals; s++) {
    const x = new Float32Array(pointsPerSpiral), y = new Float32Array(pointsPerSpiral), z = new Float32Array(pointsPerSpiral)
    const offset = (s / spirals) * Math.PI * 2
    for (let i = 0; i < pointsPerSpiral; i++) {
      const t = i / pointsPerSpiral
      const theta = t * Math.PI * 10 + offset // More turns
      const r = 1.5 + Math.sin(t * Math.PI) * 2 // Variable radius
      x[i] = r * Math.cos(theta), y[i] = t * 10 - 5, z[i] = r * Math.sin(theta)
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
