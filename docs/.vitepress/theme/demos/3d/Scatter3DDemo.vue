<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  const clusters = [
    { center: [-3, 0, 0], color: [0.9, 0.3, 0.3] },
    { center: [3, 0, 0], color: [0.3, 0.9, 0.3] },
    { center: [0, 3, 0], color: [0.3, 0.3, 0.9] },
  ]
  const pointsPerCluster = 2000, total = clusters.length * pointsPerCluster
  const positions = new Float32Array(total * 3), colors = new Float32Array(total * 3), scales = new Float32Array(total)
  
  clusters.forEach((cluster, ci) => {
    for (let i = 0; i < pointsPerCluster; i++) {
        const idx = ci * pointsPerCluster + i
        const r = Math.sqrt(-2 * Math.log(Math.random())) * 0.8
        const theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1)
        positions[idx * 3] = cluster.center[0] + r * Math.sin(phi) * Math.cos(theta)
        positions[idx * 3 + 1] = cluster.center[1] + r * Math.sin(phi) * Math.sin(theta)
        positions[idx * 3 + 2] = cluster.center[2] + r * Math.cos(phi)
        colors[idx * 3] = cluster.color[0], colors[idx * 3 + 1] = cluster.color[1], colors[idx * 3 + 2] = cluster.color[2]
        scales[idx] = 0.03 + Math.random() * 0.05
    }
  })
  
  const renderer = new Bubble3DRenderer({
    canvas,
    backgroundColor,
    style: { geometry: 'icosphere', subdivisions: 0, enableLighting: true },
  })
  
  renderer.setData({ positions, colors, scales })
  renderer.fitToData()
  onReady(renderer, total)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
