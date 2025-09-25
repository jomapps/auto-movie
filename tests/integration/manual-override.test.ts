import { describe, it, expect, beforeEach } from 'vitest'

describe('Manual Override Integration', () => {
  let projectId: string
  let sessionId: string
  let authToken: string

  beforeEach(async () => {
    authToken = 'test-auth-token'
    projectId = 'test-project-id'
    sessionId = 'test-session-id'
  })

  it('should allow custom instructions via manual override', async () => {
    // Step 1: AI presents choices
    const messageResponse = await fetch('http://localhost:3010/api/v1/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        projectId,
        sessionId,
        message: 'What should I do next with my movie project?',
      }),
    })

    expect(messageResponse.status).toBe(200)
    const messageData = await messageResponse.json()
    expect(messageData).toHaveProperty('choices')
    expect(messageData.choices.length).toBeGreaterThan(0)
    
    // Verify manual override option is available
    const manualOverride = messageData.choices.find((choice: any) => choice.isManualOverride)
    expect(manualOverride).toBeDefined()
    expect(manualOverride.id).toBe('manual_override')
    
    // Step 2: User selects manual override
    const overrideResponse = await fetch('http://localhost:3010/api/v1/chat/choice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        sessionId,
        choiceId: 'manual_override',
        customInput: 'I want to focus specifically on creating a dark, atmospheric horror setting with practical effects inspiration',
      }),
    })

    expect(overrideResponse.status).toBe(200)
    const overrideData = await overrideResponse.json()
    
    // Step 3: User provides custom instructions
    // Step 4: System incorporates custom input
    // Expected: Custom instructions processed, workflow continues
    expect(overrideData).toHaveProperty('response')
    expect(overrideData.response.toLowerCase()).toMatch(/dark|atmospheric|horror|setting|practical/)
    expect(overrideData).toHaveProperty('currentStep')
    expect(overrideData).toHaveProperty('choices')
  })

  it('should validate manual override input', async () => {
    const response = await fetch('http://localhost:3010/api/v1/chat/choice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        sessionId,
        choiceId: 'manual_override',
        customInput: '', // Empty custom input
      }),
    })

    expect(response.status).toBe(400)
    
    const errorData = await response.json()
    expect(errorData).toHaveProperty('error')
    expect(errorData.error).toContain('custom input required')
  })

  it('should allow returning to guided workflow after manual override', async () => {
    // First, use manual override
    const overrideResponse = await fetch('http://localhost:3010/api/v1/chat/choice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        sessionId,
        choiceId: 'manual_override',
        customInput: 'Create a cyberpunk aesthetic',
      }),
    })

    expect(overrideResponse.status).toBe(200)
    const overrideData = await overrideResponse.json()
    
    // Then continue with normal workflow
    const followupResponse = await fetch('http://localhost:3010/api/v1/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        projectId,
        sessionId: overrideData.sessionId,
        message: 'What should I do next?',
      }),
    })

    expect(followupResponse.status).toBe(200)
    const followupData = await followupResponse.json()
    
    // Should present normal workflow choices
    expect(followupData).toHaveProperty('choices')
    expect(followupData.choices.some((choice: any) => !choice.isManualOverride)).toBe(true)
  })
})