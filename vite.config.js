// vite.config.js atualizado para suportar Firebase ESM
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Modo "demo" (npm run demo / npm run build:demo): troca o Firestore por dados de
// demonstração em memória. Nesse modo o código do Firebase nem entra no build,
// então nada consegue gravar no banco real.
export default defineConfig(({ mode }) => {
  const demo = mode === 'demo'
  const fonte = demo ? './src/lib/fonteDemo.js' : './src/lib/fonteFirebase.js'
  return {
    plugins: [react()],
    resolve: {
      alias: { '@fonte': fileURLToPath(new URL(fonte, import.meta.url)) },
    },
    optimizeDeps: {
      exclude: ['firebase/app', 'firebase/firestore']
    },
    build: demo
      ? {
          outDir: 'dist-demo',
          assetsInlineLimit: 100_000_000,
          rolldownOptions: { output: { inlineDynamicImports: true } },
        }
      : {},
  }
})
