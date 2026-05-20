import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', '.keystone', '.claude'],
  },
  resolve: {
    alias: {
      '@/actions': resolve(__dirname, './lib/server/actions'),
      '@/components': resolve(__dirname, './lib/components'),
      '@/layouts': resolve(__dirname, './lib/components/layouts'),
      '@/server': resolve(__dirname, './lib/server'),
      '@/types': resolve(__dirname, './lib/types'),
      '@/ui': resolve(__dirname, './lib/components/ui'),
      '@/utils': resolve(__dirname, './lib/utils'),
      '@': resolve(__dirname, './lib'),
      '~': resolve(__dirname, '.'),
    },
  },
})
