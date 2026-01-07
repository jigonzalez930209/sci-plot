<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  const count = 10000
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  
  for (let i = 0; i < count; i++) {
    const r = Math.pow(Math.random(), 0.5) * 5
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
    
    const dist = r / 5
    colors[i * 3] = 0.2 + dist * 0.5
    colors[i * 3 + 1] = 0.5 - dist * 0.3
    colors[i * 3 + 2] = 0.9 - dist * 0.4
    
    scales[i] = 0.05 + Math.random() * 0.1
  }
  
  const renderer = new Bubble3DRenderer({
    canvas,
    backgroundColor,
    style: {
      geometry: 'icosphere',
      subdivisions: 1,
      enableLighting: true,
      ambient: 0.35,
    },
  })
  
  renderer.setData({ positions, colors, scales })
  renderer.fitToData()
  
  onReady(renderer, count)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
