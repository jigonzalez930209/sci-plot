<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { Area3DRenderer } = await import('@src/plugins/3d')
  
  const curves = 5, pointsPerCurve = 100, areas: any[] = []
  for (let c = 0; c < curves; c++) {
    const x = new Float32Array(pointsPerCurve), y = new Float32Array(pointsPerCurve), z = new Float32Array(pointsPerCurve)
    const zPos = (c - curves / 2 + 0.5) * 2
    for (let i = 0; i < pointsPerCurve; i++) {
      const t = i / pointsPerCurve
      x[i] = (t - 0.5) * 10, y[i] = Math.sin(t * Math.PI * 2 + c) * 2 + 2, z[i] = zPos
    }
    areas.push({ x, y, z, baseY: 0 })
  }
  
  const renderer = new Area3DRenderer({
    canvas,
    backgroundColor,
    opacity: 0.85,
  })
  
  renderer.setData(areas)
  renderer.fitToData()
  
  onReady(renderer, curves * pointsPerCurve)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
