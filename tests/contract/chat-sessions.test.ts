import { describe, it, expect } from 'vitest'

describe('GET /api/v1/chat/sessions Contract', () => {
  it('should return user sessions list', async () => {
    // This test MUST fail initially (no implementation yet)
    const response = await fetch('http://localhost:3010/api/v1/chat/sessions', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })

    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('sessions')
    expect(responseData.sessions).toBeInstanceOf(Array)
    
    if (responseData.sessions.length > 0) {
      const session = responseData.sessions[0]
      expect(session).toHaveProperty('id')
      expect(session).toHaveProperty('projectId')
      expect(session).toHaveProperty('projectTitle')
      expect(session).toHaveProperty('currentStep')
      expect(session).toHaveProperty('lastActivity')
      expect(session).toHaveProperty('sessionState')
    }
  })

  it('should filter sessions by project ID', async () => {
    const response = await fetch('http://localhost:3010/api/v1/chat/sessions?projectId=test-project-id', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })

    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('sessions')
    
    // All sessions should belong to the specified project
    responseData.sessions.forEach((session: any) => {
      expect(session.projectId).toBe('test-project-id')
    })
  })

  it('should reject unauthorized requests', async () => {
    const response = await fetch('http://localhost:3010/api/v1/chat/sessions', {
      method: 'GET',
      // No Authorization header
    })

    expect(response.status).toBe(401)
  })
})