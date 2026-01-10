<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { SurfaceMesh3DRenderer } = await import('@src/plugins/3d')
  
  const cols = 50
  const rows = 50
  
  const xValues = new Float32Array(cols)
  const zValues = new Float32Array(rows)
  const yValues = new Float32Array(cols * rows)
  
  for (let i = 0; i < cols; i++) xValues[i] = (i - cols / 2) * 0.2
  for (let j = 0; j < rows; j++) zValues[j] = (j - rows / 2) * 0.2
  
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = xValues[i], z = zValues[j]
      yValues[j * cols + i] = Math.sin(x * 0.8) * Math.cos(z * 0.8) * 2
    }
  }
  
  const colors = new Float32Array(cols * rows * 3)
  for (let i = 0; i < yValues.length; i++) {
    const t = (yValues[i] + 2) / 4
    colors[i * 3] = t
    colors[i * 3 + 1] = 1 - t
    colors[i * 3 + 2] = 0.5
  }
  
  const renderer = new SurfaceMesh3DRenderer({
    canvas,
    backgroundColor,
    wireframe: false,
    enableLighting: true,
    axes: {
      xAxis: { label: 'X Axis' },
      yAxis: { label: 'Y Axis' },
      zAxis: { label: 'Z Axis' },
    },
  })
  
  renderer.setData({ xValues, zValues, yValues, colors })
  renderer.fitToData()
  
  onReady(renderer, cols * rows)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
