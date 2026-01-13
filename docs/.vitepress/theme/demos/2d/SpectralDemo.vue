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

// State
const mode = ref<'time' | 'fft'>('time')
const activeFilter = ref<'none' | 'lowpass' | 'highpass'>('none')
const fps = ref(0)
const pointCount = ref(0)
let animationId: number | null = null

// Data Config
const N = 2048
const SAMPLE_RATE = 1000 // 1kHz
const FREQ1 = 50  // 50Hz signal
const FREQ2 = 120 // 120Hz noise/interference
const NOISE_LEVEL = 0.5

onMounted(async () => {
  console.log('SpectralDemo: onMounted')
  if (typeof window === 'undefined') return
  if (!chartContainer.value) {
    console.error('SpectralDemo: chartContainer is null')
    return
  }
  
  try {
    const { createChart } = await import('@src/index')
    const { PluginAnnotations, PluginTools } = await import('@src/plugins')
    console.log('SpectralDemo: createChart imported')
    
    chart = createChart({
      container: chartContainer.value,
      theme: chartTheme.value,
      showControls: false,
      showStatistics: false
    })

    await chart.use(PluginAnnotations())
    await chart.use(PluginTools({ useEnhancedTooltips: true }))
    console.log('SpectralDemo: chart created', chart)

    chart.on('render', (e: any) => { fps.value = Math.round(e.fps) })

    updateChart()
  } catch (err) {
    console.error('SpectralDemo: Error initializing chart', err)
  }
})

function generateSignal(): { t: Float32Array, y: Float32Array, yClean: Float32Array } {
  const t = new Float32Array(N)
  const y = new Float32Array(N)
  const yClean = new Float32Array(N)
  
  for (let i = 0; i < N; i++) {
    t[i] = i / SAMPLE_RATE
    // Clean Signal: 50Hz sine wave
    yClean[i] = Math.sin(2 * Math.PI * FREQ1 * t[i])
    // Noise: 120Hz interference + random noise
    y[i] = yClean[i] + 
           Math.sin(2 * Math.PI * FREQ2 * t[i]) * 0.5 + 
           (Math.random() - 0.5) * NOISE_LEVEL
  }
  return { t, y, yClean }
}

async function updateChart() {
  if (!chart || chart.isDestroyed) return

  try {
      // Clear existing
      const seriesList = chart.getAllSeries ? chart.getAllSeries() : []
      seriesList.forEach((s: any) => chart.removeSeries(s.getId()))
      chart.clearAnnotations?.()

      // Generate Composite Signal
      // Low Freq (Signal) = 10Hz
      // High Freq (Noise) = 80Hz
      const n = 1024
      const t = new Float32Array(n)
      const y = new Float32Array(n) // Mixed
      const yClean = new Float32Array(n) // Low Freq only
      
      const freqSignal = 10
      const freqNoise = 80
      
      for(let i=0; i<n; i++) {
        t[i] = i / 200 // 0.005s sample time -> 200Hz Sample Rate (Nyquist OK for 80Hz)
        
        // Clean 10Hz Wave
        yClean[i] = Math.sin(2 * Math.PI * freqSignal * t[i]) * 2.0 
        
        // Add 80Hz Noise
        y[i] = yClean[i] + Math.sin(2 * Math.PI * freqNoise * t[i]) * 0.8 + (Math.random() - 0.5) * 0.2
      }
      
      if (mode.value === 'time') {
        // --- TIME DOMAIN ---
        chart.updateYAxis('default', { label: 'Amplitude (V)', auto: true })

        let displayY = y
        
        if (activeFilter.value !== 'none') {
           const filtered = new Float32Array(n)
           // Simple simulation of filters
           if (activeFilter.value === 'lowpass') {
             // Lowpass: Remove 80Hz noise, keep 10Hz
             // Simple Moving Average / EMA
             let val = y[0]
             const alpha = 0.15 // Smoothing factor
             for(let i=0; i<n; i++) {
                val = val + alpha * (y[i] - val)
                filtered[i] = val
             }
           } else {
             // Highpass: Remove 10Hz signal, keep 80Hz noise
             // Effectively subtracting the "clean" approximate
             for(let i=0; i<n; i++) {
               filtered[i] = y[i] - yClean[i] // Showing the noise we removed
             }
           }
           displayY = filtered
        }

        // Display subset for zoom effect
        const zoom = 400
        const tSlice = t.slice(0, zoom)
        const ySlice = displayY.slice(0, zoom)

        chart.addSeries({
          id: 'signal',
          type: 'line',
          data: { x: tSlice, y: ySlice },
          style: { 
            color: activeFilter.value === 'none' ? '#ff6b6b' : '#00f2ff', 
            width: 3 
          }
        })
        
        // Show Ghost "Clean Ref" only in Raw mode for comparison
        if (activeFilter.value === 'none') {
             const cleanRefX = t.slice(0, zoom)
             const cleanRefY = yClean.slice(0, zoom)
             chart.addSeries({
                id: 'clean-ref',
                type: 'line',
                data: { x: cleanRefX, y: cleanRefY },
                style: { color: 'rgba(255,255,255,0.3)', width: 1, lineDash: [5,5] }
            })
        }

      } else {
        // --- FREQUENCY DOMAIN (FFT) ---
        chart.updateYAxis('default', { label: 'Magnitude (dB)', auto: true })

        const bins = 200
        const xFreq = new Float32Array(bins)
        const yPower = new Float32Array(bins)
        
        for(let i=0; i<bins; i++) {
            xFreq[i] = i // 0 to 200Hz
            // Noise floor
            let p = -50 + Math.random() * 5
            
            // Peak at Signal (10Hz)
            if (Math.abs(i - freqSignal) < 4) p += 60 * Math.exp(-Math.abs(i-freqSignal)/2)
            
            // Peak at Noise (80Hz)
            if (Math.abs(i - freqNoise) < 5) p += 40 * Math.exp(-Math.abs(i-freqNoise)/3)
            
            yPower[i] = p
        }

        chart.addSeries({
          id: 'fft',
          type: 'area', // Area chart for spectrum
          data: { x: xFreq, y: yPower },
          style: { 
            color: '#a855f7',
            fillColor: 'rgba(168, 85, 247, 0.2)',
            width: 2 
          }
        })
        
        chart.addAnnotation({
            type: 'text', x: 10, y: 10, text: '10Hz Signal', color: '#00f2ff', anchor: 'bottom-center'
        })
        chart.addAnnotation({
            type: 'text', x: 80, y: -10, text: '80Hz Noise', color: '#ff6b6b', anchor: 'bottom-center'
        })
      }
      
      chart.autoScale()
      chart.render()

  } catch (err) {
      console.error('SpectralDemo: Error in updateChart', err)
  }
}

watch([mode, activeFilter], () => {
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
            <button class="btn" :class="{ active: mode === 'fft' }" @click="mode = 'fft'">Frequency (FFT)</button>
         </div>
         
         <div class="btn-group" v-if="mode === 'time'">
            <button class="btn sm" :class="{ active: activeFilter === 'none' }" @click="activeFilter = 'none'">Raw</button>
            <button class="btn sm" :class="{ active: activeFilter === 'lowpass' }" @click="activeFilter = 'lowpass'">Low Pass</button>
            <button class="btn sm" :class="{ active: activeFilter === 'highpass' }" @click="activeFilter = 'highpass'">High Pass</button>
         </div>
      </div>
      
      <div class="chart-stats">
        <span class="stat">🚀 <strong>{{ fps }}</strong> FPS</span>
      </div>
    </div>
    
    <div ref="chartContainer" class="chart-container" :style="{ height: height || '400px' }"></div>
    <p class="chart-hint" v-if="mode === 'time'">Visualizing 50Hz Signal with 120Hz Interference</p>
    <p class="chart-hint" v-else>Spectral Analysis revealing dominant frequencies</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";

.header-controls {
    display: flex;
    gap: 1.5rem;
    align-items: center;
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
