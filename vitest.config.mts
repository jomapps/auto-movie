import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

const shouldRunIntegration = process.env.RUN_INTEGRATION_TESTS === 'true'
const shouldRunAllUnitTests = process.env.RUN_ALL_UNIT_TESTS === 'true'

if (!shouldRunIntegration) {
  console.warn(
    '[vitest] Skipping integration suites. Set RUN_INTEGRATION_TESTS=true to enable integration tests.',
  )
}

if (!shouldRunAllUnitTests) {
  console.warn(
    '[vitest] Running limited unit test suite. Set RUN_ALL_UNIT_TESTS=true to enable full unit tests.',
  )
}

const unitTestPatterns = shouldRunAllUnitTests
  ? ['tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}']
  : ['tests/unit/workflowEngine.test.ts']

const testIncludePatterns = [
  ...unitTestPatterns,
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
