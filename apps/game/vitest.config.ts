import path from 'path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const appRoot = fileURLToPath(new URL('.', import.meta.url))
const monoRepoRoot = path.resolve(appRoot, '../../')
const uiPackageRoot = path.resolve(monoRepoRoot, 'packages/ui/src/index.ts')
const themePackageRoot = path.resolve(monoRepoRoot, 'packages/theme/src/index.ts')

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.tsx'],
    setupFiles: ['./src/test/setup.ts'],
    alias: {
      '@glowing-potato/ui': uiPackageRoot,
      '@glowing-potato/theme': themePackageRoot,
    },
  },
})
