<script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue'

const props = defineProps<{
  type: string
  height?: string
}>()

const demoComponent = computed(() => {
  switch (props.type) {
    case 'bubble-3d': return defineAsyncComponent(() => import('./demos/3d/Bubble3DDemo.vue'))
    case 'scatter-3d': return defineAsyncComponent(() => import('./demos/3d/Scatter3DDemo.vue'))
    case 'surface-mesh-3d': return defineAsyncComponent(() => import('./demos/3d/SurfaceMesh3DDemo.vue'))
    case 'waterfall-3d': return defineAsyncComponent(() => import('./demos/3d/Waterfall3DDemo.vue'))
    case 'point-line-3d': return defineAsyncComponent(() => import('./demos/3d/PointLine3DDemo.vue'))
    case 'column-3d': return defineAsyncComponent(() => import('./demos/3d/Column3DDemo.vue'))
    case 'ribbon-3d': return defineAsyncComponent(() => import('./demos/3d/Ribbon3DDemo.vue'))
    case 'area-3d': return defineAsyncComponent(() => import('./demos/3d/Area3DDemo.vue'))
    case 'heatmap-3d': return defineAsyncComponent(() => import('./demos/3d/Heatmap3DDemo.vue'))
    case 'impulse-3d': return defineAsyncComponent(() => import('./demos/3d/Impulse3DDemo.vue'))
    case 'quiver-3d': return defineAsyncComponent(() => import('./demos/3d/Quiver3DDemo.vue'))
    case 'point-cloud-3d': return defineAsyncComponent(() => import('./demos/3d/PointCloud3DDemo.vue'))
    case 'voxel-3d': return defineAsyncComponent(() => import('./demos/3d/Voxel3DDemo.vue'))
    default: return defineAsyncComponent(() => import('./demos/3d/Bubble3DDemo.vue'))
  }
})
</script>

<template>
  <component :is="demoComponent" :height="height" />
</template>
