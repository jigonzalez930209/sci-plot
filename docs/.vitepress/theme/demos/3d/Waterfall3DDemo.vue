<script setup lang="ts">
import BaseChart3D from './BaseChart3D.vue'

async function onInit({ canvas, backgroundColor, onReady }: any) {
  const { Waterfall3DRenderer } = await import('@src/plugins/3d')
  
  const slicesCount = 50
  const freqBins = 100
  const xValues = new Float32Array(freqBins)
  for (let i = 0; i < freqBins; i++) xValues[i] = (i - freqBins / 2) * 0.1
  
  const slices: any[] = []
  for (let s = 0; s < slicesCount; s++) {
    const yValues = new Float32Array(freqBins)
    const z = s * 0.2
    const sFactor = s / slicesCount
    for (let f = 0; f < freqBins; f++) {
      const freq = f / freqBins
      yValues[f] = Math.exp(-Math.pow(freq - (0.3 + Math.sin(sFactor * 3) * 0.1), 2) / 0.005) * 3 + Math.random() * 0.3
    }
    slices.push({ yValues, z })
  }
  
  const renderer = new Waterfall3DRenderer({
    canvas,
    backgroundColor,
    xValues,
    sliceStyle: 'area',
    baseY: -1,
    opacity: 0.85
  })
  
  renderer.setData(slices)
  renderer.fitToData()
  
  onReady(renderer, freqBins * slicesCount)
}
</script>

<template>
  <BaseChart3D @init="onInit" />
</template>
