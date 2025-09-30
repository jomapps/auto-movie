import { it, expect } from 'vitest'
import { describeContract, getContractBaseUrl } from './utils'

describeContract('POST /api/v1/chat/message Contract', () => {
  const BASE_URL = getContractBaseUrl()

  it('should accept valid chat message request', async () => {
    const validRequest = {
      projectId: 'test-project-id',
      sessionId: 'test-session-id',
      message: 'Hello, I want to create a sci-fi movie about robots',
    }

    // This test MUST fail initially (no implementation yet)
    const response = await fetch(`${BASE_URL}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify(validRequest),
    })

    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('sessionId')
    expect(responseData).toHaveProperty('response')
    expect(responseData).toHaveProperty('currentStep')
    expect(responseData.choices).toBeInstanceOf(Array)
  })

  it('should reject requests without required fields', async () => {
    const invalidRequest = {
      projectId: 'test-project-id',
      // Missing message field
    }

    const response = await fetch(`${BASE_URL}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify(invalidRequest),
    })

    expect(response.status).toBe(400)
    
    const errorData = await response.json()
    expect(errorData).toHaveProperty('error')
    expect(errorData.error).toContain('Missing required fields')
  })

  it('should reject unauthorized requests', async () => {
    const validRequest = {
      projectId: 'test-project-id',
      message: 'Hello',
    }

    const response = await fetch(`${BASE_URL}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header
      },
      body: JSON.stringify(validRequest),
    })

    expect(response.status).toBe(401)
  })
})