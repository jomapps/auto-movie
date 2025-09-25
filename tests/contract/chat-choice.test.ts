import { describe, it, expect } from 'vitest'

describe('POST /api/v1/chat/choice Contract', () => {
  it('should accept valid choice selection', async () => {
    const validRequest = {
      sessionId: 'test-session-id',
      choiceId: 'develop_story',
    }

    // This test MUST fail initially (no implementation yet)
    const response = await fetch('http://localhost:3010/api/v1/chat/choice', {
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

  it('should accept manual override with custom input', async () => {
    const manualOverrideRequest = {
      sessionId: 'test-session-id',
      choiceId: 'manual_override',
      customInput: 'I want to focus specifically on character development first',
    }

    const response = await fetch('http://localhost:3010/api/v1/chat/choice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify(manualOverrideRequest),
    })

    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData.response).toContain('character development')
  })

  it('should reject invalid session ID', async () => {
    const invalidRequest = {
      sessionId: 'invalid-session-id',
      choiceId: 'develop_story',
    }

    const response = await fetch('http://localhost:3010/api/v1/chat/choice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify(invalidRequest),
    })

    expect(response.status).toBe(404)
    
    const errorData = await response.json()
    expect(errorData).toHaveProperty('error')
  })
})