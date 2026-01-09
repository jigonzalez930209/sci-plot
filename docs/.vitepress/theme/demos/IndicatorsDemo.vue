<template>
  <div class="indicators-demo">
    <div class="controls">
      <select v-model="selectedIndicator" @change="updateChart">
        <option value="ma">Moving Averages (SMA, EMA)</option>
        <option value="bb">Bollinger Bands</option>
        <option value="rsi">RSI</option>
        <option value="macd">MACD</option>
      </select>
      <span class="info">{{ infoText }}</span>
    </div>
    
    <div ref="chartContainer" class="chart-main"></div>
    <div v-if="showSecondary" ref="chartSecondary" class="chart-secondary"></div>
    
    <div class="legend">
      <div v-for="item in legendItems" :key="item.name" class="legend-item">
        <span class="swatch" :style="{ background: item.color }"></span>
        <span>{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

const chartContainer = ref<HTMLDivElement | null>(null)
const chartSecondary = ref<HTMLDivElement | null>(null)
const selectedIndicator = ref('ma')
let chart: any = null
let secondaryChart: any = null
let createChartFn: any = null
let indicatorFns: any = null

// Sample stock-like data
let stockData: { x: Float32Array; close: Float32Array } | null = null

function generateStockData(points: number) {
  const x = new Float32Array(points)
  const close = new Float32Array(points)
  
  let price = 100
  for (let i = 0; i < points; i++) {
    x[i] = i
    const change = (Math.random() - 0.48) * 2 + Math.sin(i / 50) * 0.5
    price += change
    price = Math.max(50, Math.min(150, price))
    close[i] = price
  }
  
  return { x, close }
}

const showSecondary = computed(() => 
  selectedIndicator.value === 'rsi' || selectedIndicator.value === 'macd'
)

const infoText = computed(() => {
  switch (selectedIndicator.value) {
    case 'ma': return 'SMA(20) vs EMA(20) - EMA reacts faster to price changes'
    case 'bb': return 'Bollinger Bands(20,2) - Price tends to stay within bands'
    case 'rsi': return 'RSI(14) - >70 Overbought, <30 Oversold'
    case 'macd': return 'MACD(12,26,9) - Buy when MACD crosses above signal'
    default: return ''
  }
})

const legendItems = computed(() => {
  switch (selectedIndicator.value) {
    case 'ma': return [
      { name: 'Price', color: '#00f2ff' },
      { name: 'SMA(20)', color: '#ff9800' },
      { name: 'EMA(20)', color: '#4caf50' },
    ]
    case 'bb': return [
      { name: 'Price', color: '#00f2ff' },
      { name: 'Middle Band', color: '#ff9800' },
      { name: 'Upper/Lower', color: 'rgba(33, 150, 243, 0.5)' },
    ]
    case 'rsi': return [
      { name: 'Price', color: '#00f2ff' },
      { name: 'RSI', color: '#9c27b0' },
    ]
    case 'macd': return [
      { name: 'Price', color: '#00f2ff' },
      { name: 'MACD', color: '#2196f3' },
      { name: 'Signal', color: '#ff5722' },
    ]
    default: return []
  }
})

async function updateChart() {
  if (!chart || !stockData || !indicatorFns) return
  
  // Clear existing series
  chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
  
  // Add price series
  chart.addSeries({
    id: 'price',
    type: 'line',
    data: { x: stockData.x, y: stockData.close },
    style: { color: '#00f2ff', width: 1.5 },
  })
  
  const { sma, ema, bollingerBands, rsi, macd } = indicatorFns
  
  switch (selectedIndicator.value) {
    case 'ma': {
      const sma20 = sma(stockData.close, 20)
      const ema20 = ema(stockData.close, 20)
      
      chart.addSeries({
        id: 'sma',
        type: 'line',
        data: { x: stockData.x, y: sma20 },
        style: { color: '#ff9800', width: 2 },
      })
      
      chart.addSeries({
        id: 'ema',
        type: 'line',
        data: { x: stockData.x, y: ema20 },
        style: { color: '#4caf50', width: 2 },
      })
      break
    }
    
    case 'bb': {
      const bb = bollingerBands(stockData.close, 20, 2)
      
      chart.addSeries({
        id: 'bb-middle',
        type: 'line',
        data: { x: stockData.x, y: bb.values },
        style: { color: '#ff9800', width: 1.5 },
      })
      
      chart.addSeries({
        id: 'bb-upper',
        type: 'line',
        data: { x: stockData.x, y: bb.upper },
        style: { color: 'rgba(33, 150, 243, 0.5)', width: 1 },
      })
      
      chart.addSeries({
        id: 'bb-lower',
        type: 'line',
        data: { x: stockData.x, y: bb.lower },
        style: { color: 'rgba(33, 150, 243, 0.5)', width: 1 },
      })
      break
    }
    
    case 'rsi': {
      const rsiValues = rsi(stockData.close, 14)
      await setupSecondaryChart(rsiValues, 'RSI', '#9c27b0')
      break
    }
    
    case 'macd': {
      const macdResult = macd(stockData.close, 12, 26, 9)
      await setupMacdChart(macdResult)
      break
    }
  }
  
  chart.autoScale(false)
  chart.render()
}

async function setupSecondaryChart(data: Float32Array, name: string, color: string) {
  if (secondaryChart) {
    secondaryChart.destroy()
    secondaryChart = null
  }
  
  if (!chartSecondary.value || !createChartFn || !stockData) return
  
  await new Promise(r => setTimeout(r, 50))
  
  secondaryChart = createChartFn({
    container: chartSecondary.value,
    xAxis: { visible: true },
    yAxis: { label: name },
    theme: 'midnight',
    showControls: false,
  })
  
  secondaryChart.addSeries({
    id: name.toLowerCase(),
    type: 'line',
    data: { x: stockData.x, y: data },
    style: { color, width: 1.5 },
  })
  
  // Add reference lines at 30 and 70
  const refLine30 = new Float32Array(stockData.x.length).fill(30)
  const refLine70 = new Float32Array(stockData.x.length).fill(70)
  
  secondaryChart.addSeries({
    id: 'ref30',
    type: 'line',
    data: { x: stockData.x, y: refLine30 },
    style: { color: 'rgba(255,255,255,0.3)', width: 1 },
  })
  
  secondaryChart.addSeries({
    id: 'ref70',
    type: 'line',
    data: { x: stockData.x, y: refLine70 },
    style: { color: 'rgba(255,255,255,0.3)', width: 1 },
  })
  
  secondaryChart.autoScale(false)
  secondaryChart.render()
}

async function setupMacdChart(result: { values: Float32Array; signal?: Float32Array; histogram?: Float32Array }) {
  if (secondaryChart) {
    secondaryChart.destroy()
    secondaryChart = null
  }
  
  if (!chartSecondary.value || !createChartFn || !stockData) return
  
  await new Promise(r => setTimeout(r, 50))
  
  secondaryChart = createChartFn({
    container: chartSecondary.value,
    xAxis: { visible: true },
    yAxis: { label: 'MACD' },
    theme: 'midnight',
    showControls: false,
  })
  
  secondaryChart.addSeries({
    id: 'macd-line',
    type: 'line',
    data: { x: stockData.x, y: result.values },
    style: { color: '#2196f3', width: 1.5 },
  })
  
  if (result.signal) {
    secondaryChart.addSeries({
      id: 'signal',
      type: 'line',
      data: { x: stockData.x, y: result.signal },
      style: { color: '#ff5722', width: 1.5 },
    })
  }
  
  secondaryChart.autoScale(false)
  secondaryChart.render()
}

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  
  stockData = generateStockData(200)
  
  const module = await import('@src/index')
  createChartFn = module.createChart
  indicatorFns = {
    sma: module.sma,
    ema: module.ema,
    bollingerBands: module.bollingerBands,
    rsi: module.rsi,
    macd: module.macd,
  }
  
  chart = createChartFn({
    container: chartContainer.value,
    xAxis: { label: 'Time' },
    yAxis: { label: 'Price' },
    theme: 'midnight',
    showControls: true,
  })
  
  await updateChart()
})

onUnmounted(() => {
  chart?.destroy()
  secondaryChart?.destroy()
})

watch(showSecondary, async (show) => {
  if (!show && secondaryChart) {
    secondaryChart.destroy()
    secondaryChart = null
  }
})
</script>

<style scoped>
.indicators-demo {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 16px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.controls select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #16213e;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.info {
  color: #a0aec0;
  font-size: 13px;
}

.chart-main {
  width: 100%;
  height: 300px;
  border-radius: 6px;
  overflow: hidden;
}

.chart-secondary {
  width: 100%;
  height: 150px;
  margin-top: 8px;
  border-radius: 6px;
  overflow: hidden;
}

.legend {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #a0aec0;
  font-size: 12px;
}

.swatch {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
</style>
