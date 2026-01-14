import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'scichart-engine': resolve(__dirname, 'src/index.core.ts'),
        'scichart-engine.full': resolve(__dirname, 'src/index.ts'),
        'plugins/3d': resolve(__dirname, 'src/plugins/3d/index.ts'),
        'plugins/gpu': resolve(__dirname, 'src/plugins/gpu/index.ts'),
        'plugins/analysis': resolve(__dirname, 'src/plugins/analysis/index.ts'),
        'plugins/tools': resolve(__dirname, 'src/plugins/tools/index.ts'),
        'plugins/annotations': resolve(__dirname, 'src/plugins/annotations/index.ts'),
        'plugins/streaming': resolve(__dirname, 'src/plugins/streaming/index.ts'),
        'plugins/theme-editor': resolve(__dirname, 'src/plugins/theme-editor/index.ts'),
        'plugins/i18n': resolve(__dirname, 'src/plugins/i18n/index.ts'),
        'plugins/keyboard': resolve(__dirname, 'src/plugins/keyboard/index.ts'),
        'plugins/clipboard': resolve(__dirname, 'src/plugins/clipboard/index.ts'),
        'plugins/sync': resolve(__dirname, 'src/plugins/sync/index.ts'),
        'plugins/debug': resolve(__dirname, 'src/plugins/debug/index.ts'),
        'plugins/loading': resolve(__dirname, 'src/plugins/loading/index.ts'),
        'plugins/data-export': resolve(__dirname, 'src/plugins/data-export/index.ts'),
      },
      name: 'SciChartEngine',
      formats: ['es']
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    sourcemap: true,
    emptyOutDir: true
  },
  plugins: [
    dts({
      include: ['src'],
      insertTypesEntry: true,
    })
  ]
});
