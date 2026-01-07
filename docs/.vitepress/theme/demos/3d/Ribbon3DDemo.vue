<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { Ribbon3DRenderer } = await import('@src/core/3d')
  
  const seriesCount = 5, pointsCount = 150, series: any[] = []
  for (let s = 0; s < seriesCount; s++) {
    const xValues = new Float32Array(pointsCount), yValues = new Float32Array(pointsCount)
    const z = (s - (seriesCount-1)/2) * 1.5
    for (let i = 0; i < pointsCount; i++) {
      const t = i / pointsCount
      xValues[i] = (t - 0.5) * 12
      yValues[i] = Math.sin(t * Math.PI * (2 + s * 0.5)) * 1.5 + Math.cos(t * Math.PI * 1.5) * 0.8
    }
    series.push({ xValues, yValues, z, width: 0.8 })
  }

  const renderer = new Ribbon3DRenderer({
    canvas,
    backgroundColor,
    opacity: 0.85
  })
  
  renderer.setData(series)
  renderer.fitToData()
  
  onReady(renderer, seriesCount * pointsCount)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
