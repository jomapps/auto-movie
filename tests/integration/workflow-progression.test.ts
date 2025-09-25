import { describe, it, expect, beforeEach } from 'vitest'

describe('Workflow Progression Integration', () => {
  let projectId: string
  let sessionId: string
  let authToken: string

  beforeEach(async () => {
    authToken = 'test-auth-token'
    projectId = 'test-project-id'
    sessionId = 'test-session-id'
  })

  it('should advance workflow step when choice selected', async () => {
    // Step 1: AI presents multiple choices
    const initialMessage = await fetch('http://localhost:3000/api/v1/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        projectId,
        sessionId,
        message: 'I want to start creating my movie',
      }),
    })

    expect(initialMessage.status).toBe(200)
    const initialData = await initialMessage.json()
    expect(initialData).toHaveProperty('choices')
    expect(initialData.choices.length).toBeGreaterThan(0)
    
    const initialStep = initialData.currentStep
    const recommendedChoice = initialData.choices.find((choice: any) => choice.isRecommended)
    expect(recommendedChoice).toBeDefined()
    
    // Step 2: User selects recommended option
    const choiceResponse = await fetch('http://localhost:3000/api/v1/chat/choice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        sessionId,
        choiceId: recommendedChoice.id,
      }),
    })

    expect(choiceResponse.status).toBe(200)
    const choiceData = await choiceResponse.json()
    
    // Step 3: System advances to next step
    expect(choiceData).toHaveProperty('currentStep')
    expect(choiceData.currentStep).not.toBe(initialStep)
    
    // Step 4: Progress percentage updates
    expect(choiceData).toHaveProperty('progress')
    expect(typeof choiceData.progress).toBe('number')
    expect(choiceData.progress).toBeGreaterThan(0)
    
    // Expected: Step advanced, progress increased, new choices presented
    expect(choiceData).toHaveProperty('choices')
    expect(choiceData.choices.length).toBeGreaterThan(0)
    expect(choiceData).toHaveProperty('response')
  })

  it('should maintain workflow state across multiple interactions', async () => {
    let currentStep = 'initial_concept'
    let currentProgress = 0

    // Simulate multiple workflow steps
    for (let i = 0; i < 3; i++) {
      const messageResponse = await fetch('http://localhost:3000/api/v1/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          projectId,
          sessionId,
          message: `Continue with step ${i + 1}`,
        }),
      })

      const data = await messageResponse.json()
      
      if (data.choices && data.choices.length > 0) {
        const nextChoice = data.choices[0]
        
        const choiceResponse = await fetch('http://localhost:3000/api/v1/chat/choice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            sessionId,
            choiceId: nextChoice.id,
          }),
        })

        const choiceData = await choiceResponse.json()
        
        // Progress should increase
        expect(choiceData.progress).toBeGreaterThanOrEqual(currentProgress)
        currentProgress = choiceData.progress
        currentStep = choiceData.currentStep
      }
    }

    // Final state should show progression
    expect(currentProgress).toBeGreaterThan(0)
  })
})