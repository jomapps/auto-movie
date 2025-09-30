import { describe } from 'vitest'

const envBaseUrl = process.env.CONTRACT_API_BASE_URL
const defaultBaseUrl = process.env.CI ? undefined : 'http://localhost:3010'

export const CONTRACT_API_BASE_URL = envBaseUrl ?? defaultBaseUrl

if (!CONTRACT_API_BASE_URL) {
  console.warn(
    '[contract-tests] CONTRACT_API_BASE_URL not set. Contract suites will be skipped. '
      + 'Set CONTRACT_API_BASE_URL to run contract tests against a live server.',
  )
}

export const describeContract: typeof describe = CONTRACT_API_BASE_URL ? describe : describe.skip

export function getContractBaseUrl(): string {
  if (!CONTRACT_API_BASE_URL) {
    throw new Error('CONTRACT_API_BASE_URL is not configured')
  }

  return CONTRACT_API_BASE_URL
}
