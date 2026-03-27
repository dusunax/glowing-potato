import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)))
const uiPackageRoot = resolve(appRoot, '../../packages/ui')
const uiEntry = resolve(uiPackageRoot, 'src/index.ts')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@glowing-potato/ui': uiEntry,
    },
  },
  server: {
    fs: {
      allow: [appRoot, uiPackageRoot],
    },
  },
})
