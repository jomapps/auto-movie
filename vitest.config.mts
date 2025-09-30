import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

const shouldRunIntegration = process.env.RUN_INTEGRATION_TESTS === 'true'

if (!shouldRunIntegration) {
  console.warn(
    '[vitest] Skipping integration suites. Set RUN_INTEGRATION_TESTS=true to enable integration tests.',
  )
}

const testIncludePatterns = [
  'tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}',
  'tests/contract/**/*.{test,spec}.{js,ts,jsx,tsx}',
]

if (shouldRunIntegration) {
  testIncludePatterns.push(
    'tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}',
    'tests/int/**/*.int.spec.ts',
  )
}

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: testIncludePatterns,
    exclude: ['tests/e2e/**/*'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/payload-types': path.resolve(__dirname, './payload-types'),
    },
  },
})
