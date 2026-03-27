import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)))
const uiPackageRoot = resolve(appRoot, '../../packages/ui')
const uiEntry = resolve(uiPackageRoot, 'src/index.ts')
const themePackageRoot = resolve(appRoot, '../../packages/theme')
const themeEntry = resolve(themePackageRoot, 'src/index.ts')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Exact-match aliases so subpath imports (e.g. /index.css, /tailwind)
      // fall through to normal node_modules resolution.
      { find: /^@glowing-potato\/ui$/, replacement: uiEntry },
      { find: /^@glowing-potato\/theme$/, replacement: themeEntry },
    ],
  },
  server: {
    fs: {
      allow: [appRoot, uiPackageRoot, themePackageRoot],
    },
  },
})
