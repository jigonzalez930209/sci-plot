<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')
let chart: any = null

const mode = ref<'time' | 'fft'>('time')
const activeFilter = ref<'none' | 'lowpass' | 'highpass' | 'bandpass'>('none')

const N = 1024
const SAMPLE_RATE = 512

const FREQUENCIES = [5, 12, 25, 47, 80]
const COLORS = ['#00eaff', '#ff8a00', '#c084fc', '#10b981', '#f43f5e']

onMounted(async () => {
  if (typeof window === 'undefined') return
  if (!chartContainer.value) return
  
  try {
    const { createChart } = await import('@src/index')
    
    chart = createChart({
      container: chartContainer.value,
      theme: chartTheme.value,
      showControls: true,
      showStatistics: false,
    })

    updateChart()
  } catch (err) {
    console.error('SineWavesChart: Error initializing chart', err)
  }
})

function generateSineWave(freq: number, t: Float32Array, amplitude: number = 1): Float32Array {
  const y = new Float32Array(t.length)
  for (let i = 0; i < t.length; i++) {
    y[i] = amplitude * Math.sin(2 * Math.PI * freq * t[i])
  }
  return y
}

function generateCombinedSineWaves(frequencies: number[], t: Float32Array): Float32Array {
  const y = new Float32Array(t.length)
  frequencies.forEach((freq, idx) => {
    const amplitude = 1 / (idx + 1)
    for (let i = 0; i < t.length; i++) {
      y[i] += amplitude * Math.sin(2 * Math.PI * freq * t[i])
    }
  })
  return y
}

function applyFilter(signal: Float32Array, type: string): Float32Array {
  if (type === 'none') return signal
  
  const filtered = new Float32Array(signal.length)
  
  if (type === 'lowpass') {
    let val = signal[0]
    const alpha = 0.1
    for (let i = 0; i < signal.length; i++) {
      val = val + alpha * (signal[i] - val)
      filtered[i] = val
    }
  } else if (type === 'highpass') {
    const alpha = 0.9
    filtered[0] = signal[0]
    for (let i = 1; i < signal.length; i++) {
      filtered[i] = alpha * (filtered[i - 1] + signal[i] - signal[i - 1])
    }
  } else if (type === 'bandpass') {
    let val = signal[0]
    const alphaLow = 0.3
    const temp = new Float32Array(signal.length)
    for (let i = 0; i < signal.length; i++) {
      val = val + alphaLow * (signal[i] - val)
      temp[i] = val
    }
    const alphaHigh = 0.7
    filtered[0] = temp[0]
    for (let i = 1; i < signal.length; i++) {
      filtered[i] = alphaHigh * (filtered[i - 1] + temp[i] - temp[i - 1])
    }
  }
  return filtered
}

async function updateChart() {
  if (!chart || chart.isDestroyed) return

  try {
    const seriesList = chart.getAllSeries ? chart.getAllSeries() : []
    seriesList.forEach((s: any) => chart.removeSeries(s.getId()))
    chart.clearAnnotations?.()

    const t = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      t[i] = i / SAMPLE_RATE
    }

    if (mode.value === 'time') {
      FREQUENCIES.forEach((freq, idx) => {
        const y = generateSineWave(freq, t)
        const yFiltered = applyFilter(y, activeFilter.value)
        
        chart.addSeries({
          id: `sine-${freq}Hz`,
          type: 'line',
          data: { x: t, y: yFiltered },
          style: { color: COLORS[idx], width: 2 }
        })
      })

      const combined = generateCombinedSineWaves(FREQUENCIES, t)
      const combinedFiltered = applyFilter(combined, activeFilter.value)
      chart.addSeries({
        id: 'combined',
        type: 'line',
        data: { x: t, y: combinedFiltered },
        style: { color: '#ffffff', width: 2, lineDash: [5, 3] }
      })

    } else {
      const { analyzeSpectrum } = await import('@src/analysis')

      FREQUENCIES.forEach((freq, idx) => {
        const y = generateSineWave(freq, t)
        const yFiltered = applyFilter(y, activeFilter.value)
        const spec = analyzeSpectrum(yFiltered, SAMPLE_RATE)
        
        chart.addSeries({
          id: `spec-${freq}Hz`,
          type: 'line',
          data: { x: spec.frequency, y: spec.magnitude },
          style: { color: COLORS[idx], width: 2 }
        })
      })

      const combined = generateCombinedSineWaves(FREQUENCIES, t)
      const combinedFiltered = applyFilter(combined, activeFilter.value)
      const combinedSpec = analyzeSpectrum(combinedFiltered, SAMPLE_RATE)
      chart.addSeries({
        id: 'spec-combined',
        type: 'area',
        data: { x: combinedSpec.frequency, y: combinedSpec.magnitude },
        style: { color: '#ffffff', fillColor: 'rgba(255,255,255,0.1)', width: 2 }
      })
    }

    chart.autoScale()
    chart.render()
  } catch (err) {
    console.error('SineWavesChart: Error in updateChart', err)
  }
}

watch([mode, activeFilter], () => {
  updateChart()
})

watch(isDark, () => {
  if (chart) {
    chart.setTheme(chartTheme.value)
    setTimeout(() => { chart.render() }, 100)
  }
})

onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="chart-compact" :class="{ dark: isDark }">
    <div class="toolbar">
      <div class="toolbar-row">
        <span class="title">〰️ Sine Waves</span>
        
        <div class="btn-group primary">
          <button :class="{ active: mode === 'time' }" @click="mode = 'time'">Time</button>
          <button :class="{ active: mode === 'fft' }" @click="mode = 'fft'">FFT</button>
        </div>
        
        <div class="btn-group">
          <button :class="{ active: activeFilter === 'none' }" @click="activeFilter = 'none'">Raw</button>
          <button :class="{ active: activeFilter === 'lowpass' }" @click="activeFilter = 'lowpass'">LP</button>
          <button :class="{ active: activeFilter === 'highpass' }" @click="activeFilter = 'highpass'">HP</button>
          <button :class="{ active: activeFilter === 'bandpass' }" @click="activeFilter = 'bandpass'">BP</button>
        </div>
        
        <div class="legend">
          <span v-for="(freq, idx) in FREQUENCIES" :key="freq" class="legend-item" :style="{ color: COLORS[idx] }">{{ freq }}Hz</span>
        </div>
      </div>
    </div>
    
    <div ref="chartContainer" class="chart-area" :style="{ height: height || '450px' }"></div>
    
    <div class="info-bar">
      <span v-if="mode === 'time'">Time domain: {{ FREQUENCIES.join(', ') }} Hz</span>
      <span v-else>FFT Spectrum: single peaks at fundamental frequencies</span>
      <span v-if="activeFilter !== 'none'" class="filter-tag">{{ activeFilter }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart-compact {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
  margin: 1rem 0;
}

.toolbar {
  padding: 8px 12px;
  background: rgba(0,0,0,0.3);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.title {
  font-weight: 600;
  font-size: 12px;
  color: #94a3b8;
}

.btn-group {
  display: inline-flex;
  background: rgba(255,255,255,0.05);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.btn-group button {
  background: transparent;
  border: none;
  color: #64748b;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-group button:hover {
  color: #94a3b8;
  background: rgba(255,255,255,0.05);
}

.btn-group button.active {
  background: #00f2ff;
  color: #000;
}

.btn-group.primary button.active {
  background: linear-gradient(135deg, #00f2ff, #00c8ff);
  box-shadow: 0 2px 8px rgba(0,242,255,0.3);
}

.legend {
  display: flex;
  gap: 10px;
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
}

.legend-item {
  opacity: 0.9;
}

.chart-area {
  background: transparent;
}

.info-bar {
  padding: 6px 12px;
  background: rgba(0,0,0,0.2);
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-tag {
  background: rgba(0,242,255,0.15);
  color: #00f2ff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  text-transform: uppercase;
}
</style>
