<script setup lang="ts">
import { computed } from 'vue'

// Eager imports for 3D demos
import Bubble3DDemo from './demos/3d/Bubble3DDemo.vue'
import Scatter3DDemo from './demos/3d/Scatter3DDemo.vue'
import SurfaceMesh3DDemo from './demos/3d/SurfaceMesh3DDemo.vue'
import Waterfall3DDemo from './demos/3d/Waterfall3DDemo.vue'
import PointLine3DDemo from './demos/3d/PointLine3DDemo.vue'
import Column3DDemo from './demos/3d/Column3DDemo.vue'
import Ribbon3DDemo from './demos/3d/Ribbon3DDemo.vue'
import Area3DDemo from './demos/3d/Area3DDemo.vue'
import Heatmap3DDemo from './demos/3d/Heatmap3DDemo.vue'
import Impulse3DDemo from './demos/3d/Impulse3DDemo.vue'
import Quiver3DDemo from './demos/3d/Quiver3DDemo.vue'
import PointCloud3DDemo from './demos/3d/PointCloud3DDemo.vue'
import Voxel3DDemo from './demos/3d/Voxel3DDemo.vue'

const props = defineProps<{
  type: string
  height?: string
}>()

const demoComponent = computed(() => {
  switch (props.type) {
    case 'bubble-3d': return Bubble3DDemo
    case 'scatter-3d': return Scatter3DDemo
    case 'surface-mesh-3d': return SurfaceMesh3DDemo
    case 'waterfall-3d': return Waterfall3DDemo
    case 'point-line-3d': return PointLine3DDemo
    case 'column-3d': return Column3DDemo
    case 'ribbon-3d': return Ribbon3DDemo
    case 'area-3d': return Area3DDemo
    case 'heatmap-3d': return Heatmap3DDemo
    case 'impulse-3d': return Impulse3DDemo
    case 'quiver-3d': return Quiver3DDemo
    case 'point-cloud-3d': return PointCloud3DDemo
    case 'voxel-3d': return Voxel3DDemo
    default: return Bubble3DDemo
  }
})
</script>


<template>
  <component :is="demoComponent" :height="height" />
</template>
