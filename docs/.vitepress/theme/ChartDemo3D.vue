<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useData } from 'vitepress'

type Demo3DType = 
  | 'bubble-3d'
  | 'scatter-3d'
  | 'surface-mesh-3d'
  | 'waterfall-3d'
  | 'point-line-3d'
  | 'column-3d'
  | 'ribbon-3d'
  | 'area-3d'
  | 'heatmap-3d'
  | 'impulse-3d'
  | 'quiver-3d'
  | 'point-cloud-3d'
  | 'voxel-3d'

const props = defineProps<{
  type: Demo3DType
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const overlayRef = ref<HTMLCanvasElement | null>(null)
const fps = ref(0)
const pointCount = ref(0)
const isLoading = ref(true)
const error = ref<string | null>(null)

let renderer: any = null
let overlayCtx: CanvasRenderingContext2D | null = null

const backgroundColor = computed(() => isDark.value 
  ? [0.05, 0.05, 0.1, 1] as [number, number, number, number]
  : [0.95, 0.95, 0.98, 1] as [number, number, number, number]
)

// Render axis labels as 2D text overlay
function renderLabels() {
  if (!renderer || !overlayRef.value || !overlayCtx) return
  
  const canvas = overlayRef.value
  const ctx = overlayCtx
  const dpr = window.devicePixelRatio || 1
  
  // Clear overlay
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Get labels and project to screen
  const labels = renderer.getAxisLabels()
  if (!labels || labels.length === 0) return
  
  const { width, height } = renderer.getCanvasSize()
  const viewProj = renderer.getViewProjectionMatrix()
  
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  for (const label of labels) {
    const screen = renderer.projectToScreen(label.worldPosition)
    
    if (!screen.visible) continue
    
    // Scale for DPR
    const x = screen.x * dpr
    const y = screen.y * dpr
    
    // Style based on label type
    const isTitle = label.axis === 'title'
    ctx.font = isTitle 
      ? `bold ${14 * dpr}px Inter, system-ui, sans-serif`
      : `${11 * dpr}px Inter, system-ui, sans-serif`
    
    // Color based on axis
    const [r, g, b] = label.color
    ctx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${isTitle ? 0.9 : 0.7})`
    
    // Optional shadow for readability
    ctx.shadowColor = isDark.value ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'
    ctx.shadowBlur = 3 * dpr
    
    ctx.fillText(label.text, x, y)
    
    // Reset shadow
    ctx.shadowBlur = 0
  }
}

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  
  try {
    isLoading.value = true
    error.value = null
    
    // Wait for next tick to ensure DOM is ready
    await nextTick()
    
    // Create WebGL canvas
    const canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    chartContainer.value.appendChild(canvas)
    canvasRef.value = canvas
    
    // Create 2D overlay canvas for text labels
    const overlay = document.createElement('canvas')
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.position = 'absolute'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.pointerEvents = 'none' // Allow clicks to pass through
    chartContainer.value.appendChild(overlay)
    overlayRef.value = overlay
    overlayCtx = overlay.getContext('2d')
    
    // Wait for layout to complete with multiple frames
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve(undefined)
        })
      })
    })
    
    // Set overlay canvas size
    const dpr = window.devicePixelRatio || 1
    const rect = chartContainer.value.getBoundingClientRect()
    overlay.width = rect.width * dpr
    overlay.height = rect.height * dpr
    
    await initDemo()
    
    // Force a resize and render after initialization
    if (renderer) {
      await nextTick()
      
      // Listen for render events to update labels
      renderer.on('render', () => {
        renderLabels()
      })
      
      // Also update on camera changes
      renderer.on('cameraChange', () => {
        renderLabels()
      })
      
      requestAnimationFrame(() => {
        if (renderer) {
          renderer.resize()
          renderer.render()
          renderLabels()
        }
      })
    }
    
  } catch (err) {
    console.error('[ChartDemo3D] Error initializing:', err)
    error.value = err instanceof Error ? err.message : 'Failed to initialize 3D chart'
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (renderer) {
    renderer.destroy()
    renderer = null
  }
})

watch(isDark, () => {
  if (renderer && renderer.setBackgroundColor) {
    const [r, g, b, a] = backgroundColor.value
    renderer.setBackgroundColor(r, g, b, a)
  }
})

async function initDemo() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  switch (props.type) {
    case 'bubble-3d':
      await initBubbleDemo(canvas)
      break
    case 'scatter-3d':
      await initScatterDemo(canvas)
      break
    case 'surface-mesh-3d':
      await initSurfaceDemo(canvas)
      break
    case 'waterfall-3d':
      await initWaterfallDemo(canvas)
      break
    case 'point-line-3d':
      await initPointLineDemo(canvas)
      break
    case 'column-3d':
      await initColumnDemo(canvas)
      break
    case 'ribbon-3d':
      await initRibbonDemo(canvas)
      break
    case 'area-3d':
      await initAreaDemo(canvas)
      break
    case 'heatmap-3d':
      await initHeatmapDemo(canvas)
      break
    case 'impulse-3d':
      await initImpulseDemo(canvas)
      break
    case 'quiver-3d':
      await initQuiverDemo(canvas)
      break
    case 'point-cloud-3d':
      await initPointCloudDemo(canvas)
      break
    case 'voxel-3d':
      await initVoxelDemo(canvas)
      break
    default:
      await initBubbleDemo(canvas)
  }
}

async function initBubbleDemo(canvas: HTMLCanvasElement) {
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  const count = 10000
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  
  for (let i = 0; i < count; i++) {
    // Spherical cluster distribution
    const r = Math.pow(Math.random(), 0.5) * 5
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
    
    // Color based on distance
    const dist = r / 5
    colors[i * 3] = 0.2 + dist * 0.5
    colors[i * 3 + 1] = 0.5 - dist * 0.3
    colors[i * 3 + 2] = 0.9 - dist * 0.4
    
    scales[i] = 0.05 + Math.random() * 0.1
  }
  
  renderer = new Bubble3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    style: {
      geometry: 'icosphere',
      subdivisions: 1,
      enableLighting: true,
      ambient: 0.35,
    },
  })
  
  renderer.setData({ positions, colors, scales })
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = count
}

async function initScatterDemo(canvas: HTMLCanvasElement) {
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  // Create 3 clusters
  const clusters = [
    { center: [-3, 0, 0], color: [0.9, 0.3, 0.3] },
    { center: [3, 0, 0], color: [0.3, 0.9, 0.3] },
    { center: [0, 3, 0], color: [0.3, 0.3, 0.9] },
  ]
  
  const pointsPerCluster = 2000
  const total = clusters.length * pointsPerCluster
  
  const positions = new Float32Array(total * 3)
  const colors = new Float32Array(total * 3)
  const scales = new Float32Array(total)
  
  clusters.forEach((cluster, ci) => {
    for (let i = 0; i < pointsPerCluster; i++) {
      const idx = ci * pointsPerCluster + i
      
      // Gaussian-like distribution around center
      const r = Math.sqrt(-2 * Math.log(Math.random())) * 0.8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[idx * 3] = cluster.center[0] + r * Math.sin(phi) * Math.cos(theta)
      positions[idx * 3 + 1] = cluster.center[1] + r * Math.sin(phi) * Math.sin(theta)
      positions[idx * 3 + 2] = cluster.center[2] + r * Math.cos(phi)
      
      colors[idx * 3] = cluster.color[0]
      colors[idx * 3 + 1] = cluster.color[1]
      colors[idx * 3 + 2] = cluster.color[2]
      
      scales[idx] = 0.03 + Math.random() * 0.05
    }
  })
  
  renderer = new Bubble3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    style: {
      geometry: 'icosphere',
      subdivisions: 0,
      enableLighting: true,
    },
  })
  
  renderer.setData({ positions, colors, scales })
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = total
}

async function initSurfaceDemo(canvas: HTMLCanvasElement) {
  const { SurfaceMesh3DRenderer } = await import('@src/core/3d')
  
  // Create surface mesh data
  const cols = 50
  const rows = 50
  
  const xValues = new Float32Array(cols)
  const zValues = new Float32Array(rows)
  const yValues = new Float32Array(cols * rows)
  
  // Generate X and Z axis values
  for (let i = 0; i < cols; i++) {
    xValues[i] = (i - cols / 2) * 0.2
  }
  for (let j = 0; j < rows; j++) {
    zValues[j] = (j - rows / 2) * 0.2
  }
  
  // Generate Y values (height) from mathematical function
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = xValues[i]
      const z = zValues[j]
      const y = Math.sin(x * 0.8) * Math.cos(z * 0.8) * 2
      yValues[j * cols + i] = y
    }
  }
  
  // Optional: Generate colors based on height (viridis colormap)
  const colors = new Float32Array(cols * rows * 3)
  const viridis = (t: number): [number, number, number] => {
    const c0 = [0.267004, 0.004874, 0.329415]
    const c1 = [0.282327, 0.140926, 0.457517]
    const c2 = [0.253935, 0.265254, 0.529983]
    const c3 = [0.206756, 0.371758, 0.553117]
    const c4 = [0.163625, 0.471133, 0.558148]
    const c5 = [0.127568, 0.566949, 0.550556]
    const c6 = [0.134692, 0.658636, 0.517649]
    const c7 = [0.266941, 0.748751, 0.440573]
    const c8 = [0.477504, 0.821444, 0.318195]
    const c9 = [0.741388, 0.873449, 0.149561]
    const colorStops = [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9]
    const idx = Math.min(Math.floor(t * 9), 8)
    const frac = t * 9 - idx
    const a = colorStops[idx]
    const b = colorStops[idx + 1]
    return [
      a[0] + (b[0] - a[0]) * frac,
      a[1] + (b[1] - a[1]) * frac,
      a[2] + (b[2] - a[2]) * frac,
    ]
  }
  
  // Find Y range for normalization
  let minY = Infinity, maxY = -Infinity
  for (let i = 0; i < yValues.length; i++) {
    if (yValues[i] < minY) minY = yValues[i]
    if (yValues[i] > maxY) maxY = yValues[i]
  }
  const rangeY = maxY - minY || 1
  
  for (let i = 0; i < yValues.length; i++) {
    const t = (yValues[i] - minY) / rangeY
    const [r, g, b] = viridis(Math.max(0, Math.min(1, t)))
    colors[i * 3] = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }
  
  renderer = new SurfaceMesh3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    wireframe: false,
    enableLighting: true,
    ambient: 0.35,
    axes: {
      xAxis: { label: 'X Axis' },
      yAxis: { label: 'Y Axis' },
      zAxis: { label: 'Z Axis' },
    },
  })
  
  renderer.setData({ xValues, zValues, yValues, colors })
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = cols * rows
}

async function initWaterfallDemo(canvas: HTMLCanvasElement) {
  const { Waterfall3DRenderer } = await import('@src/core/3d')
  
  // Simulated waterfall spectrogram
  const slicesCount = 50
  const freqBins = 100
  
  const xValues = new Float32Array(freqBins)
  for (let i = 0; i < freqBins; i++) {
    xValues[i] = (i - freqBins / 2) * 0.1
  }
  
  const slices: any[] = []
  
  for (let s = 0; s < slicesCount; s++) {
    const yValues = new Float32Array(freqBins)
    const z = s * 0.2
    
    // Dynamic noise and harmonic movement
    const shift = Date.now() * 0.001
    const sFactor = s / slicesCount
    
    for (let f = 0; f < freqBins; f++) {
      const freq = f / freqBins
      const val = Math.exp(-Math.pow(freq - (0.3 + Math.sin(sFactor * 3 + shift) * 0.1), 2) / 0.005) * 3 +
                  Math.exp(-Math.pow(freq - (0.6 + Math.cos(sFactor * 2 + shift * 0.5) * 0.1), 2) / 0.01) * 2 +
                  Math.random() * 0.3
      yValues[f] = val
    }
    
    // Let renderer auto-assign colors from palette
    slices.push({
      yValues,
      z
    })
  }
  
  renderer = new Waterfall3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    xValues,
    sliceStyle: 'area',
    baseY: -1,
    opacity: 0.85
  })
  
  renderer.setData(slices)
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = freqBins * slicesCount
}

async function initPointLineDemo(canvas: HTMLCanvasElement) {
  const { Line3DRenderer } = await import('@src/core/3d')
  
  // 3D spiral trajectory
  const spirals = 3
  const pointsPerSpiral = 500
  
  const lines: { x: Float32Array; y: Float32Array; z: Float32Array; color: [number, number, number] }[] = []
  
  const spiralColors: [number, number, number][] = [
    [0.9, 0.3, 0.5],
    [0.3, 0.9, 0.5],
    [0.5, 0.3, 0.9],
  ]
  
  for (let s = 0; s < spirals; s++) {
    const x = new Float32Array(pointsPerSpiral)
    const y = new Float32Array(pointsPerSpiral)
    const z = new Float32Array(pointsPerSpiral)
    
    const offset = (s / spirals) * Math.PI * 2
    for (let i = 0; i < pointsPerSpiral; i++) {
      const t = i / pointsPerSpiral
      const theta = t * Math.PI * 6 + offset
      const r = 2 + t * 2
      
      x[i] = r * Math.cos(theta)
      y[i] = t * 8 - 4
      z[i] = r * Math.sin(theta)
    }
    
    lines.push({ x, y, z, color: spiralColors[s] })
  }
  
  renderer = new Line3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    lineWidth: 0.08,
    tubeSides: 8,
  })
  
  renderer.setData(lines)
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = spirals * pointsPerSpiral
}

async function initColumnDemo(canvas: HTMLCanvasElement) {
  const { SurfaceBar3DRenderer } = await import('@src/core/3d')
  
  const rows = 15
  const cols = 15
  const count = rows * cols
  
  const heights = new Float32Array(count)
  const colors = new Float32Array(count * 3)
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c
      const dx = (c - cols / 2) / (cols / 2)
      const dz = (r - rows / 2) / (rows / 2)
      const dist = Math.sqrt(dx * dx + dz * dz)
      
      // Funky circular wave height pattern
      heights[idx] = Math.cos(dist * Math.PI) * 1.5 + 2.5
      
      // Color based on height (normalized)
      const h = heights[idx] / 4.0
      colors[idx * 3] = h 
      colors[idx * 3 + 1] = 0.8 - h
      colors[idx * 3 + 2] = 0.5 + h * 0.5
    }
  }
  
  renderer = new SurfaceBar3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    barScale: 0.85,
    opacity: 1.0
  })
  
  renderer.setData({
    rows,
    cols,
    heights,
    colors,
    spacing: [1.0, 1.0],
    origin: [-cols / 2, 0, -rows / 2]
  })
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = count
}

async function initRibbonDemo(canvas: HTMLCanvasElement) {
  const { Ribbon3DRenderer } = await import('@src/core/3d')
  
  // Multiple overlapping ribbons
  const seriesCount = 5
  const pointsCount = 150
  const series: any[] = []
  
  for (let s = 0; s < seriesCount; s++) {
    const xValues = new Float32Array(pointsCount)
    const yValues = new Float32Array(pointsCount)
    const z = (s - (seriesCount-1)/2) * 1.5
    
    for (let i = 0; i < pointsCount; i++) {
      const t = i / pointsCount
      xValues[i] = (t - 0.5) * 12
      // Wave-like pattern with different frequencies
      yValues[i] = Math.sin(t * Math.PI * (2 + s * 0.5)) * 1.5 + 
                   Math.cos(t * Math.PI * 1.5) * 0.8
    }
    
    // Let renderer auto-assign colors from palette
    series.push({
      xValues, 
      yValues, 
      z,
      width: 0.8
    })
  }

  renderer = new Ribbon3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    opacity: 0.85
  })
  
  renderer.setData(series)
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = seriesCount * pointsCount
}

async function initAreaDemo(canvas: HTMLCanvasElement) {
  const { Area3DRenderer } = await import('@src/core/3d')
  
  // Filled curtain visualization
  const curves = 5
  const pointsPerCurve = 100
  
  const areas: any[] = []
  
  for (let c = 0; c < curves; c++) {
    const x = new Float32Array(pointsPerCurve)
    const y = new Float32Array(pointsPerCurve)
    const z = new Float32Array(pointsPerCurve)
    
    const zPos = (c - curves / 2 + 0.5) * 2
    
    for (let i = 0; i < pointsPerCurve; i++) {
      const t = i / pointsPerCurve
      x[i] = (t - 0.5) * 10
      y[i] = Math.sin(t * Math.PI * 2 + c) * 2 + 2
      z[i] = zPos
    }
    
    // Let renderer auto-assign colors from palette
    areas.push({ x, y, z, baseY: 0 })
  }
  
  renderer = new Area3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    opacity: 0.85,
  })
  
  renderer.setData(areas)
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = curves * pointsPerCurve
}

async function initHeatmapDemo(canvas: HTMLCanvasElement) {
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  // Flat heatmap on XZ plane
  const rows = 40
  const cols = 40
  const count = rows * cols
  
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  
  // Plasma colormap
  const plasma = (t: number): [number, number, number] => {
    const r = Math.min(1, Math.max(0, 0.05 + t * 0.8 + Math.sin(t * Math.PI) * 0.3))
    const g = Math.min(1, Math.max(0, t * 0.5))
    const b = Math.min(1, Math.max(0, 0.5 + Math.cos(t * Math.PI * 0.5) * 0.5))
    return [r, g, b]
  }
  
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = j * cols + i
      const x = (i - cols / 2 + 0.5) * 0.2
      const z = (j - rows / 2 + 0.5) * 0.2
      
      // Value based on 2D Gaussian peaks
      const v1 = Math.exp(-((x - 1) ** 2 + (z - 1) ** 2) / 1.5)
      const v2 = Math.exp(-((x + 1.5) ** 2 + (z + 0.5) ** 2) / 2)
      const v3 = Math.exp(-((x) ** 2 + (z - 2) ** 2) / 1)
      const value = v1 + v2 * 0.8 + v3 * 0.6
      
      positions[idx * 3] = x
      positions[idx * 3 + 1] = 0
      positions[idx * 3 + 2] = z
      
      const [r, g, b] = plasma(Math.min(1, value))
      colors[idx * 3] = r
      colors[idx * 3 + 1] = g
      colors[idx * 3 + 2] = b
      
      scales[idx] = 0.1
    }
  }
  
  renderer = new Bubble3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    style: {
      geometry: 'cube',
      enableLighting: false,
    },
  })
  
  renderer.setData({ positions, colors, scales })
  renderer.fitToData()
  
  // Adjust camera for top-down view
  const camera = renderer.getCamera()
  camera.phi = 0.3
  camera.theta = 0.5
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = count
}

async function initImpulseDemo(canvas: HTMLCanvasElement) {
  const { Impulse3DRenderer } = await import('@src/core/3d')
  
  // Impulse/stem plot
  const rows = 15
  const cols = 15
  const count = rows * cols
  
  const x = new Float32Array(count)
  const y = new Float32Array(count)
  const z = new Float32Array(count)
  const colors = new Float32Array(count * 3)
  
  let idx = 0
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      x[idx] = (i - cols / 2 + 0.5) * 0.5
      z[idx] = (j - rows / 2 + 0.5) * 0.5
      y[idx] = Math.sin(i * 0.5) * Math.cos(j * 0.4) * 2 + 2.5
      
      // Color: gradient based on height
      const t = y[idx] / 4.5
      colors[idx * 3] = 0.2 + t * 0.6
      colors[idx * 3 + 1] = 0.4 + t * 0.2
      colors[idx * 3 + 2] = 0.9 - t * 0.4
      
      idx++
    }
  }
  
  renderer = new Impulse3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    stemWidth: 0.015,
    stemSides: 6,
    showMarkers: true,
    markerSize: 2.5,
  })
  
  renderer.setData({ x, y, z, colors, baseY: 0 })
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = count
}

async function resetDemo() {
  if (renderer) {
    renderer.destroy()
    renderer = null
  }
  pointCount.value = 0
  fps.value = 0
  
  if (canvasRef.value) {
    canvasRef.value.remove()
  }
  if (overlayRef.value) {
    overlayRef.value.remove()
  }
  
  if (chartContainer.value) {
    // Create WebGL canvas
    const canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    chartContainer.value.appendChild(canvas)
    canvasRef.value = canvas
    
    // Create 2D overlay canvas
    const overlay = document.createElement('canvas')
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.position = 'absolute'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.pointerEvents = 'none'
    chartContainer.value.appendChild(overlay)
    overlayRef.value = overlay
    overlayCtx = overlay.getContext('2d')
    
    // Wait for layout
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve(undefined)
        })
      })
    })
    
    // Set overlay canvas size
    const dpr = window.devicePixelRatio || 1
    const rect = chartContainer.value.getBoundingClientRect()
    overlay.width = rect.width * dpr
    overlay.height = rect.height * dpr
    
    await initDemo()
    
    // Force resize and render
    if (renderer) {
      // Listen for render events to update labels
      renderer.on('render', () => {
        renderLabels()
      })
      renderer.on('cameraChange', () => {
        renderLabels()
      })
      
      await nextTick()
      requestAnimationFrame(() => {
        if (renderer) {
          renderer.resize()
          renderer.render()
          renderLabels()
        }
      })
    }
  }
}
async function initQuiverDemo(canvas: HTMLCanvasElement) {
  const { VectorField3DRenderer } = await import('@src/core/3d')
  
  const size = 15
  const total = size * size * size
  const positions = new Float32Array(total * 3)
  const directions = new Float32Array(total * 3)
  const colors = new Float32Array(total * 3)
  
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (z * size * size + y * size + x)
        const px = (x - size / 2) * 0.8
        const py = (y - size / 2) * 0.8
        const pz = (z - size / 2) * 0.8
        
        positions[idx * 3] = px
        positions[idx * 3 + 1] = py
        positions[idx * 3 + 2] = pz
        
        // Simular un campo de flujo rotacional
        const dx = -py * 0.2
        const dy = px * 0.2
        const dz = Math.sin(px * 0.5) * 0.1
        
        directions[idx * 3] = dx
        directions[idx * 3 + 1] = dy
        directions[idx * 3 + 2] = dz
        
        const mag = Math.sqrt(dx*dx + dy*dy + dz*dz)
        colors[idx * 3] = 0.2 + mag * 0.5
        colors[idx * 3 + 1] = 0.5 + Math.sin(pz) * 0.3
        colors[idx * 3 + 2] = 0.9
      }
    }
  }
  
  renderer = new VectorField3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    scaleMultiplier: 2.0,
    opacity: 0.9
  })
  
  renderer.setData({ positions, directions, colors })
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = total
}
async function initPointCloudDemo(canvas: HTMLCanvasElement) {
  const { PointCloud3DRenderer } = await import('@src/core/3d')
  
  const count = 100000
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 4)
  const sizes = new Float32Array(count)
  
  for (let i = 0; i < count; i++) {
    // Toroide de puntos
    const u = Math.random() * Math.PI * 2
    const v = Math.random() * Math.PI * 2
    const R = 4, r = 1.5
    
    positions[i * 3] = (R + r * Math.cos(v)) * Math.cos(u)
    positions[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u)
    positions[i * 3 + 2] = r * Math.sin(v)
    
    // Gradiente de color senoidal
    colors[i * 4] = 0.5 + Math.sin(u) * 0.5
    colors[i * 4 + 1] = 0.5 + Math.cos(v) * 0.5
    colors[i * 4 + 2] = 0.8
    colors[i * 4 + 3] = 1.0
    
    sizes[i] = 1.0 + Math.random() * 2.0
  }
  
  renderer = new PointCloud3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    pointSize: 3.0,
    circular: true
  })
  
  renderer.setData({ positions, colors, sizes })
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = count
}
async function initVoxelDemo(canvas: HTMLCanvasElement) {
  const { Voxel3DRenderer } = await import('@src/core/3d')
  
  const size = 25
  const values = new Float32Array(size * size * size)
  
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - size / 2) / (size / 2)
        const dy = (y - size / 2) / (size / 2)
        const dz = (z - size / 2) / (size / 2)
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
        
        // Simular una esfera hueca o campo de intensidad
        const val = Math.max(0, 1.0 - Math.abs(dist - 0.7) * 3.0)
        values[z * size * size + y * size + x] = val
      }
    }
  }
  
  renderer = new Voxel3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    voxelScale: 0.9,
    threshold: 0.15,
    opacity: 0.7
  })
  
  renderer.setData({
    dimensions: [size, size, size],
    values,
    spacing: [0.5, 0.5, 0.5],
    origin: [-size*0.25, -size*0.25, -size*0.25]
  })
  
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = size * size * size
}
</script>

<template>
  <div class="chart-demo-3d" :class="{ dark: isDark }">
    <div class="chart-header">
      <div class="chart-stats">
        <span class="stat">
          🎨 <strong>{{ pointCount.toLocaleString() }}</strong> objects
        </span>
        <span class="stat">
          ⚡ <strong>{{ fps }}</strong> FPS
        </span>
      </div>
      <div class="chart-controls">
        <button @click="resetDemo" class="btn">🔄 Reset</button>
      </div>
    </div>
    
    <div class="chart-wrapper" :style="{ height: height || '450px' }">
      <!-- Chart container is always rendered for proper sizing -->
      <div 
        ref="chartContainer" 
        class="chart-container"
      ></div>
      
      <!-- Loading overlay positioned on top -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Loading 3D renderer...</p>
      </div>
      
      <!-- Error overlay positioned on top -->
      <div v-if="error && !isLoading" class="error-overlay">
        <p class="error-icon">⚠️</p>
        <p class="error-message">{{ error }}</p>
        <button @click="resetDemo" class="btn">Try Again</button>
      </div>
    </div>
    
    <p class="chart-hint">
      🖱️ Left drag to rotate • Scroll to zoom • Right drag to pan
    </p>
  </div>
</template>

<style scoped>
.chart-demo-3d {
  margin: 1.5rem 0;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.chart-demo-3d:not(.dark) {
  background: linear-gradient(135deg, #f0f4f8 0%, #e8ecf0 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chart-demo-3d:not(.dark) .chart-header {
  background: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.chart-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.chart-demo-3d:not(.dark) .stat {
  color: rgba(0, 0, 0, 0.7);
}

.stat strong {
  color: #00f2ff;
}

.chart-demo-3d:not(.dark) .stat strong {
  color: #0066cc;
}

.chart-controls {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-demo-3d:not(.dark) .btn {
  border: 1px solid rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.8);
  color: rgba(0, 0, 0, 0.8);
}

.btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #00f2ff;
}

.chart-demo-3d:not(.dark) .btn:hover {
  background: rgba(0, 102, 204, 0.1);
  border-color: #0066cc;
}

.chart-wrapper {
  position: relative;
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-container canvas {
  display: block;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.7);
  z-index: 10;
}

.chart-demo-3d:not(.dark) .loading-overlay,
.chart-demo-3d:not(.dark) .error-overlay {
  color: rgba(0, 0, 0, 0.6);
  background: rgba(255, 255, 255, 0.8);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #00f2ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.chart-demo-3d:not(.dark) .loading-spinner {
  border-color: rgba(0, 0, 0, 0.1);
  border-top-color: #0066cc;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 2rem;
}

.error-message {
  color: #ff6b6b;
  font-size: 0.9rem;
}

.chart-hint {
  text-align: center;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 0.5rem;
  margin: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.chart-demo-3d:not(.dark) .chart-hint {
  color: rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
