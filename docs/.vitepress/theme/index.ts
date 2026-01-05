import DefaultTheme from 'vitepress/theme'
import ChartDemo from './ChartDemo.vue'
import ChartDemo3D from './ChartDemo3D.vue'
import TenMillionPoints from './TenMillionPoints.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component('ChartDemo', ChartDemo)
    app.component('ChartDemo3D', ChartDemo3D)
    app.component('TenMillionPoints', TenMillionPoints)
  }
}
