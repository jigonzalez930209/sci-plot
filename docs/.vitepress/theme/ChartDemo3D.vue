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
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  // Simulated waterfall spectrogram
  const slices = 40
  const freqBins = 64
  const count = slices * freqBins
  
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  
  // Hot colormap
  const hot = (t: number): [number, number, number] => {
    return [
      Math.min(1, t * 3),
      Math.max(0, Math.min(1, t * 3 - 1)),
      Math.max(0, Math.min(1, t * 3 - 2)),
    ]
  }
  
  for (let s = 0; s < slices; s++) {
    for (let f = 0; f < freqBins; f++) {
      const idx = s * freqBins + f
      const x = (f - freqBins / 2) * 0.15
      const z = s * 0.3
      
      // Simulated spectrum with harmonics
      const freq = f / freqBins
      const y = Math.exp(-Math.pow(freq - 0.2, 2) / 0.01) * 2 +
                Math.exp(-Math.pow(freq - 0.4, 2) / 0.02) * 1.5 +
                Math.exp(-Math.pow(freq - 0.6, 2) / 0.015) * 1 +
                Math.random() * 0.2
      
      positions[idx * 3] = x
      positions[idx * 3 + 1] = y
      positions[idx * 3 + 2] = z
      
      // Color based on intensity
      const t = y / 2.5
      const [r, g, b] = hot(Math.max(0, Math.min(1, t)))
      colors[idx * 3] = r
      colors[idx * 3 + 1] = g
      colors[idx * 3 + 2] = b
      
      // Fade older slices
      const fade = 1 - s / slices * 0.5
      colors[idx * 3] *= fade
      colors[idx * 3 + 1] *= fade
      colors[idx * 3 + 2] *= fade
      
      scales[idx] = 0.08
    }
  }
  
  renderer = new Bubble3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    style: {
      geometry: 'cube',
      enableLighting: true,
      ambient: 0.3,
    },
  })
  
  renderer.setData({ positions, colors, scales })
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = count
}

async function initPointLineDemo(canvas: HTMLCanvasElement) {
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  // 3D spiral trajectory
  const spirals = 3
  const pointsPerSpiral = 500
  const count = spirals * pointsPerSpiral
  
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  
  const spiralColors = [
    [0.9, 0.3, 0.5],
    [0.3, 0.9, 0.5],
    [0.5, 0.3, 0.9],
  ]
  
  for (let s = 0; s < spirals; s++) {
    const offset = (s / spirals) * Math.PI * 2
    for (let i = 0; i < pointsPerSpiral; i++) {
      const idx = s * pointsPerSpiral + i
      const t = i / pointsPerSpiral
      const theta = t * Math.PI * 6 + offset
      const r = 2 + t * 2
      
      positions[idx * 3] = r * Math.cos(theta)
      positions[idx * 3 + 1] = t * 8 - 4
      positions[idx * 3 + 2] = r * Math.sin(theta)
      
      colors[idx * 3] = spiralColors[s][0]
      colors[idx * 3 + 1] = spiralColors[s][1]
      colors[idx * 3 + 2] = spiralColors[s][2]
      
      scales[idx] = 0.05 + t * 0.03
    }
  }
  
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
  
  pointCount.value = count
}

async function initColumnDemo(canvas: HTMLCanvasElement) {
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  // 3D bar chart
  const rows = 10
  const cols = 10
  const count = rows * cols
  
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = j * cols + i
      const x = (i - cols / 2 + 0.5) * 0.8
      const z = (j - rows / 2 + 0.5) * 0.8
      const height = Math.random() * 3 + 0.5
      
      positions[idx * 3] = x
      positions[idx * 3 + 1] = height / 2
      positions[idx * 3 + 2] = z
      
      // Rainbow color based on position
      const hue = (i / cols + j / rows) * 0.5
      const h = hue * 6
      const c = 1
      const x2 = c * (1 - Math.abs(h % 2 - 1))
      let r = 0, g = 0, b = 0
      if (h < 1) { r = c; g = x2 }
      else if (h < 2) { r = x2; g = c }
      else if (h < 3) { g = c; b = x2 }
      else if (h < 4) { g = x2; b = c }
      else if (h < 5) { r = x2; b = c }
      else { r = c; b = x2 }
      
      colors[idx * 3] = r * 0.7 + 0.3
      colors[idx * 3 + 1] = g * 0.7 + 0.3
      colors[idx * 3 + 2] = b * 0.7 + 0.3
      
      scales[idx] = 0.35
    }
  }
  
  renderer = new Bubble3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    style: {
      geometry: 'cube',
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

async function initRibbonDemo(canvas: HTMLCanvasElement) {
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  // Double helix ribbon
  const pointsPerStrand = 300
  const strandsCount = 2
  const count = strandsCount * pointsPerStrand
  
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  
  for (let s = 0; s < strandsCount; s++) {
    const offset = s * Math.PI
    for (let i = 0; i < pointsPerStrand; i++) {
      const idx = s * pointsPerStrand + i
      const t = (i / pointsPerStrand) * Math.PI * 4
      const r = 2
      
      positions[idx * 3] = r * Math.cos(t + offset)
      positions[idx * 3 + 1] = (i / pointsPerStrand) * 10 - 5
      positions[idx * 3 + 2] = r * Math.sin(t + offset)
      
      // Gradient color along ribbon
      const gradient = i / pointsPerStrand
      if (s === 0) {
        colors[idx * 3] = 0.2 + gradient * 0.6
        colors[idx * 3 + 1] = 0.5
        colors[idx * 3 + 2] = 0.9 - gradient * 0.4
      } else {
        colors[idx * 3] = 0.9 - gradient * 0.4
        colors[idx * 3 + 1] = 0.5
        colors[idx * 3 + 2] = 0.2 + gradient * 0.6
      }
      
      scales[idx] = 0.15
    }
  }
  
  renderer = new Bubble3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    style: {
      geometry: 'icosphere',
      subdivisions: 1,
      enableLighting: true,
    },
  })
  
  renderer.setData({ positions, colors, scales })
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = count
}

async function initAreaDemo(canvas: HTMLCanvasElement) {
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  // Filled curtain visualization
  const curves = 5
  const pointsPerCurve = 100
  const fillDensity = 10 // Points per unit height
  
  // First pass: calculate total points
  let totalPoints = 0
  for (let c = 0; c < curves; c++) {
    for (let i = 0; i < pointsPerCurve; i++) {
      const t = i / pointsPerCurve
      const y = Math.sin(t * Math.PI * 2 + c) * 2 + 2
      const fillPoints = Math.max(1, Math.floor(y * fillDensity))
      totalPoints += fillPoints
    }
  }
  
  const positions = new Float32Array(totalPoints * 3)
  const colors = new Float32Array(totalPoints * 3)
  const scales = new Float32Array(totalPoints)
  
  let idx = 0
  for (let c = 0; c < curves; c++) {
    const z = (c - curves / 2 + 0.5) * 2
    for (let i = 0; i < pointsPerCurve; i++) {
      const t = i / pointsPerCurve
      const x = (t - 0.5) * 10
      const maxY = Math.sin(t * Math.PI * 2 + c) * 2 + 2
      const fillPoints = Math.max(1, Math.floor(maxY * fillDensity))
      
      for (let f = 0; f < fillPoints; f++) {
        const y = (f / fillDensity)
        
        positions[idx * 3] = x
        positions[idx * 3 + 1] = y
        positions[idx * 3 + 2] = z
        
        // Color gradient
        const heightRatio = y / maxY
        colors[idx * 3] = 0.2 + c * 0.15
        colors[idx * 3 + 1] = 0.3 + heightRatio * 0.5
        colors[idx * 3 + 2] = 0.7 + heightRatio * 0.3
        
        scales[idx] = 0.08
        idx++
      }
    }
  }
  
  renderer = new Bubble3DRenderer({
    canvas,
    backgroundColor: backgroundColor.value,
    style: {
      geometry: 'cube',
      enableLighting: true,
      ambient: 0.4,
    },
  })
  
  renderer.setData({ 
    positions: positions.subarray(0, idx * 3), 
    colors: colors.subarray(0, idx * 3), 
    scales: scales.subarray(0, idx) 
  })
  renderer.fitToData()
  
  renderer.on('render', (e: any) => {
    fps.value = Math.round(e.stats.fps)
  })
  
  pointCount.value = idx
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
  const { Bubble3DRenderer } = await import('@src/core/3d')
  
  // Impulse/stem plot
  const rows = 15
  const cols = 15
  const stemDensity = 5 // Points per stem
  const count = rows * cols * stemDensity
  
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  
  let idx = 0
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i - cols / 2 + 0.5) * 0.5
      const z = (j - rows / 2 + 0.5) * 0.5
      const height = Math.sin(i * 0.5) * Math.cos(j * 0.4) * 2 + 2.5
      
      // Create stem (vertical line of points)
      for (let s = 0; s < stemDensity; s++) {
        const y = (s / (stemDensity - 1)) * height
        
        positions[idx * 3] = x
        positions[idx * 3 + 1] = y
        positions[idx * 3 + 2] = z
        
        // Color: cool blue at base, warm at top
        const t = y / height
        colors[idx * 3] = 0.2 + t * 0.6
        colors[idx * 3 + 1] = 0.4 + t * 0.2
        colors[idx * 3 + 2] = 0.9 - t * 0.4
        
        // Larger sphere at top
        scales[idx] = s === stemDensity - 1 ? 0.12 : 0.04
        
        idx++
      }
    }
  }
  
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
  
  pointCount.value = idx
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
