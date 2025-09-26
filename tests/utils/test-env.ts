export async function setupEnv() {
  // Set test environment variables
  // NODE_ENV is read-only in some environments, so we use Object.defineProperty
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
    configurable: true,
  })
  process.env.DATABASE_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/auto-movie-test'
  process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || 'test-secret-key'
}
