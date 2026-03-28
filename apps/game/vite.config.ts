import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const appRoot = process.cwd()
const uiPackageRoot = path.resolve(appRoot, '../../packages/ui')
const uiEntry = path.resolve(uiPackageRoot, 'src/index.ts')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
