import { beforeAll, afterAll, afterEach } from 'vitest'
import { setupEnv } from './utils/test-env'

beforeAll(async () => {
  await setupEnv()
})

afterEach(() => {
  // Reset any global state between tests
})

afterAll(async () => {
  // Cleanup after all tests
})