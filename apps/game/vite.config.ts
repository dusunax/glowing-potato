import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const appRoot = process.cwd()
const monoRepoRoot = path.resolve(appRoot, '../../')
const uiPackageRoot = path.resolve(appRoot, '../../packages/ui')
const uiEntry = path.resolve(uiPackageRoot, 'src/index.ts')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: monoRepoRoot,
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  resolve: {
    alias: [
      { find: '@glowing-potato/ui', replacement: uiEntry },
    ],
  },
  server: {
    fs: {
      allow: [appRoot, uiPackageRoot],
    },
  },
})
