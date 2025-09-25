export async function setupEnv() {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/auto-movie-test'
  process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || 'test-secret-key'
}