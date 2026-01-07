<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
  title?: string
}>()

const emit = defineEmits(['init'])

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

function renderLabels() {
  if (!renderer || !overlayRef.value || !overlayCtx) return
  const canvas = overlayRef.value
  const ctx = overlayCtx
  const dpr = window.devicePixelRatio || 1
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const labels = renderer.getAxisLabels()
  if (!labels || labels.length === 0) return
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const label of labels) {
    const screen = renderer.projectToScreen(label.worldPosition)
    if (!screen.visible) continue
    const x = screen.x * dpr
    const y = screen.y * dpr
    const isTitle = label.axis === 'title'
    ctx.font = isTitle ? `bold ${14 * dpr}px Inter, sans-serif` : `${11 * dpr}px Inter, sans-serif`
    const [r, g, b] = label.color
    ctx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${isTitle ? 0.9 : 0.7})`
    ctx.fillText(label.text, x, y)
  }
}

async function init() {
    if (!chartContainer.value) return
    isLoading.value = true
    try {
        const canvas = document.createElement('canvas')
        canvas.style.cssText = 'width:100%;height:100%;display:block;position:absolute;top:0;left:0;'
        chartContainer.value.appendChild(canvas)
        canvasRef.value = canvas

        const overlay = document.createElement('canvas')
        overlay.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;'
        chartContainer.value.appendChild(overlay)
        overlayRef.value = overlay
        overlayCtx = overlay.getContext('2d')

        const dpr = window.devicePixelRatio || 1
        const rect = chartContainer.value.getBoundingClientRect()
        overlay.width = rect.width * dpr
        overlay.height = rect.height * dpr

        // Emit to parent to handle specific renderer initialization
        const result = await new Promise((resolve, reject) => {
            emit('init', { 
                canvas, 
                backgroundColor: backgroundColor.value,
                onReady: (r: any, count: number) => {
                    renderer = r
                    pointCount.value = count
                    resolve(r)
                },
                onError: (e: any) => reject(e)
            })
        })

        if (renderer) {
            renderer.on('render', (e: any) => {
                fps.value = Math.round(e.stats.fps)
                renderLabels()
            })
            renderer.on('cameraChange', () => renderLabels())
            renderer.resize()
            renderer.render()
        }
    } catch (err: any) {
        error.value = err.message
    } finally {
        isLoading.value = false
    }
}

onMounted(() => init())
onUnmounted(() => {
    if (renderer) renderer.destroy()
})

watch(isDark, () => {
  if (renderer && renderer.setBackgroundColor) {
    const [r, g, b, a] = backgroundColor.value
    renderer.setBackgroundColor(r, g, b, a)
  }
})

function reset() {
    if (renderer) {
        renderer.destroy()
        renderer = null
    }
    if (chartContainer.value) chartContainer.value.innerHTML = ''
    init()
}

defineExpose({ reset })
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
        <button @click="reset" class="btn">🔄 Reset</button>
      </div>
    </div>
    
    <div class="chart-wrapper" :style="{ height: height || '450px' }">
      <div ref="chartContainer" class="chart-container"></div>
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Loading 3D renderer...</p>
      </div>
      <div v-if="error" class="error-overlay">
        <p>⚠️ {{ error }}</p>
        <button @click="reset" class="btn">Try Again</button>
      </div>
    </div>
    <p class="chart-hint">🖱️ Left drag to rotate • Scroll to zoom • Right drag to pan</p>
  </div>
</template>

<style scoped>
@import "../../demos3d.css";
</style>
