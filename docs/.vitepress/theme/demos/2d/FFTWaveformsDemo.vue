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
const waveform = ref<'sine' | 'square' | 'triangle'>('sine')
const activeFilter = ref<'none' | 'lowpass' | 'highpass'>('none')

const N = 1024
const SAMPLE_RATE = 512

onMounted(async () => {
  if (typeof window === 'undefined') return
  if (!chartContainer.value) return
  
  try {
    const { createChart } = await import('@src/index')
    const { PluginTools } = await import('@src/plugins')
    
    chart = createChart({
      container: chartContainer.value,
      theme: chartTheme.value,
      showControls: true,
      showStatistics: false
    })

    await chart.use(PluginTools({ useEnhancedTooltips: true }))

    updateChart()
  } catch (err) {
    console.error('FFTWaveformsDemo: Error initializing chart', err)
  }
})

function generateWaveform(type: 'sine' | 'square' | 'triangle', freq: number, t: Float32Array): Float32Array {
  const y = new Float32Array(t.length)
  for (let i = 0; i < t.length; i++) {
    const angle = 2 * Math.PI * freq * t[i]
    if (type === 'sine') {
      y[i] = Math.sin(angle)
    } else if (type === 'square') {
      y[i] = Math.sign(Math.sin(angle)) || 1
    } else {
      const phase = (angle % (2 * Math.PI)) / (2 * Math.PI)
      y[i] = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase
    }
  }
  return y
}

function applyFilter(signal: Float32Array, type: 'none' | 'lowpass' | 'highpass'): Float32Array {
  if (type === 'none') return signal
  
  const filtered = new Float32Array(signal.length)
  if (type === 'lowpass') {
    let val = signal[0]
    const alpha = 0.1
    for (let i = 0; i < signal.length; i++) {
      val = val + alpha * (signal[i] - val)
      filtered[i] = val
    }
  } else {
    const alpha = 0.9
    filtered[0] = signal[0]
    for (let i = 1; i < signal.length; i++) {
      filtered[i] = alpha * (filtered[i - 1] + signal[i] - signal[i - 1])
    }
  }
  return filtered
}

async function updateChart() {
  if (!chart || chart.isDestroyed) return

  try {
    const seriesList = chart.getAllSeries ? chart.getAllSeries() : []
    seriesList.forEach((s: any) => chart.removeSeries(s.getId()))

    const t = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      t[i] = i / SAMPLE_RATE
    }

    const freqs = [5, 15, 30]
    const colors = ['#00eaff', '#ff8a00', '#c084fc']

    if (mode.value === 'time') {
      freqs.forEach((freq, idx) => {
        const y = generateWaveform(waveform.value, freq, t)
        const yFiltered = applyFilter(y, activeFilter.value)
        
        chart.addSeries({
          id: `wave-${freq}`,
          type: 'line',
          data: { x: t, y: yFiltered },
          style: { color: colors[idx], width: 2 }
        })
      })
    } else {
      const { analyzeSpectrum } = await import('@src/plugins/analysis')

      freqs.forEach((freq, idx) => {
        const y = generateWaveform(waveform.value, freq, t)
        const yFiltered = applyFilter(y, activeFilter.value)
        const spec = analyzeSpectrum(yFiltered, SAMPLE_RATE)
        
        chart.addSeries({
          id: `spec-${freq}`,
          type: 'line',
          data: { x: spec.frequency, y: spec.magnitude },
          style: { color: colors[idx], width: 2 }
        })
      })
    }

    chart.autoScale()
    chart.render()
  } catch (err) {
    console.error('FFTWaveformsDemo: Error in updateChart', err)
  }
}

watch([mode, waveform, activeFilter], () => {
  updateChart()
})

watch(isDark, (val) => {
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
  <div class="chart-demo" :class="{ dark: isDark }">
    <div class="chart-header">
      <div class="header-controls">
        <div class="btn-group">
          <button class="btn" :class="{ active: mode === 'time' }" @click="mode = 'time'">Time Domain</button>
          <button class="btn" :class="{ active: mode === 'fft' }" @click="mode = 'fft'">FFT Spectrum</button>
        </div>
        
        <div class="btn-group">
          <button class="btn sm" :class="{ active: waveform === 'sine' }" @click="waveform = 'sine'">Sine</button>
          <button class="btn sm" :class="{ active: waveform === 'square' }" @click="waveform = 'square'">Square</button>
          <button class="btn sm" :class="{ active: waveform === 'triangle' }" @click="waveform = 'triangle'">Triangle</button>
        </div>
        
        <div class="btn-group">
          <button class="btn sm" :class="{ active: activeFilter === 'none' }" @click="activeFilter = 'none'">No Filter</button>
          <button class="btn sm" :class="{ active: activeFilter === 'lowpass' }" @click="activeFilter = 'lowpass'">Low Pass</button>
          <button class="btn sm" :class="{ active: activeFilter === 'highpass' }" @click="activeFilter = 'highpass'">High Pass</button>
        </div>
      </div>
    </div>
    
    <div ref="chartContainer" class="chart-container" :style="{ height: height || '500px' }"></div>
    <p class="chart-hint">
      <span v-if="mode === 'time'">Time-domain {{ waveform }} waves at 5Hz (cyan), 15Hz (orange), 30Hz (purple)</span>
      <span v-else>FFT spectrum showing frequency components of {{ waveform }} waves</span>
    </p>
  </div>
</template>

<style scoped>
@import "../../demos.css";

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.btn-group {
  display: flex;
  background: rgba(255,255,255,0.05);
  padding: 3px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
}

.btn {
  background: transparent;
  border: none;
  color: #888;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn:hover {
  color: #fff;
  background: rgba(255,255,255,0.1);
}

.btn.active {
  background: #00f2ff;
  color: #000;
}

.btn.sm {
  font-size: 0.75rem;
  padding: 4px 8px;
}
</style>
