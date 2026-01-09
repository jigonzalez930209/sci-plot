<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { PointCloud3DRenderer } = await import('@src/plugins/3d')
  
  const count = 100000
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 4), sizes = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2, v = Math.random() * Math.PI * 2, R = 4, r = 1.5
    positions[i * 3] = (R + r * Math.cos(v)) * Math.cos(u)
    positions[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u)
    positions[i * 3 + 2] = r * Math.sin(v)
    colors[i * 4] = 0.5 + Math.sin(u) * 0.5, colors[i * 4 + 1] = 0.5 + Math.cos(v) * 0.5, colors[i * 4 + 2] = 0.8, colors[i * 4 + 3] = 1.0
    sizes[i] = 1.0 + Math.random() * 2.0
  }
  
  const renderer = new PointCloud3DRenderer({
    canvas,
    backgroundColor,
    pointSize: 3.0,
    circular: true
  })
  
  renderer.setData({ positions, colors, sizes })
  renderer.fitToData()
  onReady(renderer, count)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
