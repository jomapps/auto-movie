import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Integration Tests: Chat Data Flow
 *
 * Tests the complete data flow from chat message through extraction,
 * validation, storage, and production triggering. Ensures all Phase 0
 * components work together correctly.
 *
 * Coverage includes:
 * - Message to entity extraction
 * - Entity to schema mapping
 * - Schema to database storage
 * - Database to production triggering
 * - End-to-end workflow validation
 * - Error propagation
 */

interface ChatMessage {
  projectId: string
  sessionId?: string
  message: string
  userId: string
}

interface ChatResponse {
  sessionId: string
  response: string
  choices: any[]
  createdEntities: {
    characters: Array<{ id: string; name: string }>
    scenes: Array<{ id: string; title: string }>
    locations: Array<{ id: string; name: string }>
  }
  productionTasks: Array<{
    taskId: string
    status: string
    type: string
  }>
  extraction: {
    summary: string
    entityCount: number
  }
}

// Mock complete chat pipeline
class ChatPipeline {
  async processMessage(message: ChatMessage): Promise<ChatResponse> {
    throw new Error('Not implemented')
  }

  async getSessionHistory(sessionId: string): Promise<any[]> {
    throw new Error('Not implemented')
  }

  async validateWorkflowStep(sessionId: string, targetStep: string): Promise<boolean> {
    throw new Error('Not implemented')
  }
}

describe('Chat Data Flow Integration', () => {
  let pipeline: ChatPipeline
  const testUser = 'test-user-123'
  let testProjectId: string

  beforeEach(() => {
    pipeline = new ChatPipeline()
    testProjectId = `test-proj-${Date.now()}`
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Character Creation Flow', () => {
    it('should create character from natural language message', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: 'Create a character named Sarah, a 28-year-old detective with a troubled past',
        userId: testUser
      }

      const response = await pipeline.processMessage(message)

      expect(response).toBeTruthy()
      expect(response.sessionId).toBeDefined()
      expect(response.createdEntities.characters).toHaveLength(1)
      expect(response.createdEntities.characters[0].name).toBe('Sarah')
      expect(response.productionTasks.length).toBeGreaterThan(0)
      expect(response.productionTasks[0].type).toBe('character_sheet')
    })

    it('should track complete data flow lifecycle', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: 'Add John, a brave knight, and Emma, a wise wizard',
        userId: testUser
      }

      const response = await pipeline.processMessage(message)

      // 1. Extraction happened
      expect(response.extraction.entityCount).toBe(2)

      // 2. Entities created
      expect(response.createdEntities.characters).toHaveLength(2)

      // 3. Production tasks triggered
      expect(response.productionTasks).toHaveLength(2)

      // 4. AI response generated
      expect(response.response.length).toBeGreaterThan(0)

      // 5. Choices provided
      expect(response.choices.length).toBeGreaterThan(0)
    })

    it('should persist character to database', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: 'Create Marcus, a veteran soldier',
        userId: testUser
      }

      const response = await pipeline.processMessage(message)
      const characterId = response.createdEntities.characters[0].id

      // Verify character can be retrieved
      expect(characterId).toBeDefined()
      expect(characterId.length).toBeGreaterThan(0)
    })
  })

  describe('Complete Scene Creation Flow', () => {
    it('should create scene from description', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: 'Add an opening scene in a dark alley at night, rain pouring down',
        userId: testUser
      }

      const response = await pipeline.processMessage(message)

      expect(response.createdEntities.scenes).toHaveLength(1)
      expect(response.createdEntities.scenes[0].title).toBeTruthy()
      expect(response.productionTasks.some(t => t.type === 'scene_visualization')).toBe(true)
    })

    it('should link characters to scenes', async () => {
      // First create characters
      const charMessage: ChatMessage = {
        projectId: testProjectId,
        message: 'Create hero John and villain Mike',
        userId: testUser
      }

      const charResponse = await pipeline.processMessage(charMessage)
      const johnId = charResponse.createdEntities.characters[0].id
      const mikeId = charResponse.createdEntities.characters[1].id

      // Then create scene with characters
      const sceneMessage: ChatMessage = {
        projectId: testProjectId,
        sessionId: charResponse.sessionId,
        message: 'Add a confrontation scene where John faces Mike',
        userId: testUser
      }

      const sceneResponse = await pipeline.processMessage(sceneMessage)

      expect(sceneResponse.createdEntities.scenes).toHaveLength(1)
      // Scene should reference the characters
    })
  })

  describe('Multi-Entity Creation Flow', () => {
    it('should handle complex message with multiple entity types', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: `Create a scene at an abandoned warehouse where detective Sarah
                  confronts the mysterious villain known as Shadow. The warehouse
                  is dark, filled with crates and has a skylight.`,
        userId: testUser
      }

      const response = await pipeline.processMessage(message)

      expect(response.extraction.entityCount).toBeGreaterThan(2)
      expect(response.createdEntities.characters.length).toBeGreaterThan(0)
      expect(response.createdEntities.scenes.length).toBeGreaterThan(0)
      expect(response.createdEntities.locations.length).toBeGreaterThan(0)
    })

    it('should maintain relationships between entities', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: 'Create a scene where Tom and Jerry meet at Central Park',
        userId: testUser
      }

      const response = await pipeline.processMessage(message)

      // Should create characters, location, and scene
      // And link them appropriately
      expect(response.createdEntities.characters.length).toBeGreaterThan(0)
      expect(response.createdEntities.scenes.length).toBeGreaterThan(0)
      expect(response.createdEntities.locations.length).toBeGreaterThan(0)
    })
  })

  describe('Workflow Validation Integration', () => {
    it('should prevent creating production assets without characters', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: 'Start production now',
        userId: testUser
      }

      const response = await pipeline.processMessage(message)

      // Should provide helpful feedback about missing prerequisites
      expect(response.response).toContain('character')
      expect(response.choices.some(c => c.id === 'create_characters')).toBe(true)
    })

    it('should validate workflow prerequisites', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: 'I want to start editing',
        userId: testUser
      }

      const response = await pipeline.processMessage(message)

      const canAdvance = await pipeline.validateWorkflowStep(
        response.sessionId,
        'editing'
      )

      expect(canAdvance).toBe(false)
    })

    it('should allow valid workflow progression', async () => {
      // Create initial concept
      const conceptMsg: ChatMessage = {
        projectId: testProjectId,
        message: 'A sci-fi thriller about AI and consciousness',
        userId: testUser
      }

      const conceptResponse = await pipeline.processMessage(conceptMsg)

      // Create characters
      const charMsg: ChatMessage = {
        projectId: testProjectId,
        sessionId: conceptResponse.sessionId,
        message: 'Add protagonist Dr. Elena Chen, AI researcher',
        userId: testUser
      }

      const charResponse = await pipeline.processMessage(charMsg)

      // Should now be able to advance to story structure
      const canAdvance = await pipeline.validateWorkflowStep(
        charResponse.sessionId,
        'story_structure'
      )

      expect(canAdvance).toBe(true)
    })
  })

  describe('Session Management', () => {
    it('should maintain conversation history', async () => {
      const message1: ChatMessage = {
        projectId: testProjectId,
        message: 'Create character John',
        userId: testUser
      }

      const response1 = await pipeline.processMessage(message1)

      const message2: ChatMessage = {
        projectId: testProjectId,
        sessionId: response1.sessionId,
        message: 'Make him a detective',
        userId: testUser
      }

      const response2 = await pipeline.processMessage(message2)

      const history = await pipeline.getSessionHistory(response2.sessionId)

      expect(history).toHaveLength(4) // 2 user messages + 2 AI responses
      expect(history[0].role).toBe('user')
      expect(history[1].role).toBe('assistant')
    })

    it('should accumulate entity creation across messages', async () => {
      const message1: ChatMessage = {
        projectId: testProjectId,
        message: 'Create Sarah',
        userId: testUser
      }

      const response1 = await pipeline.processMessage(message1)

      const message2: ChatMessage = {
        projectId: testProjectId,
        sessionId: response1.sessionId,
        message: 'Also add Tom',
        userId: testUser
      }

      const response2 = await pipeline.processMessage(message2)

      // Both characters should exist in the project
      expect(response2.createdEntities.characters.length).toBeGreaterThan(0)
    })

    it('should maintain context across conversation', async () => {
      const messages: ChatMessage[] = [
        {
          projectId: testProjectId,
          message: 'Create a detective story',
          userId: testUser
        },
        {
          projectId: testProjectId,
          message: 'The main character is John',
          userId: testUser
        },
        {
          projectId: testProjectId,
          message: 'He should be in his 40s',
          userId: testUser
        }
      ]

      let sessionId: string | undefined

      for (const msg of messages) {
        if (sessionId) {
          msg.sessionId = sessionId
        }

        const response = await pipeline.processMessage(msg)
        sessionId = response.sessionId

        expect(response.response.length).toBeGreaterThan(0)
      }

      // Final result should have character with all attributes
      const history = await pipeline.getSessionHistory(sessionId!)
      expect(history.length).toBeGreaterThan(4)
    })
  })

  describe('Production Task Coordination', () => {
    it('should trigger appropriate production tasks for each entity type', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: 'Create character Alice and a scene at the beach',
        userId: testUser
      }

      const response = await pipeline.processMessage(message)

      const taskTypes = response.productionTasks.map(t => t.type)
      expect(taskTypes).toContain('character_sheet')

      if (response.createdEntities.scenes.length > 0) {
        expect(taskTypes.some(t => t.includes('scene'))).toBe(true)
      }
    })

    it('should handle production task failures gracefully', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: 'Create character that will fail production',
        userId: testUser
      }

      const response = await pipeline.processMessage(message)

      // Character should still be created even if production fails
      expect(response.createdEntities.characters.length).toBeGreaterThan(0)

      // Failed task should be tracked
      if (response.productionTasks.some(t => t.status === 'failed')) {
        expect(response.response).toContain('production')
      }
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle extraction failures', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: '@#$%^&*()!', // Gibberish
        userId: testUser
      }

      const response = await pipeline.processMessage(message)

      expect(response).toBeTruthy()
      expect(response.response).toBeTruthy()
      expect(response.extraction.entityCount).toBe(0)
      // Should still provide helpful response
    })

    it('should recover from database errors', async () => {
      const message: ChatMessage = {
        projectId: 'invalid-project-id',
        message: 'Create character',
        userId: testUser
      }

      await expect(async () => {
        await pipeline.processMessage(message)
      }).rejects.toThrow()
    })

    it('should handle malformed input', async () => {
      const malformedMessages = [
        { projectId: '', message: 'test', userId: testUser },
        { projectId: testProjectId, message: '', userId: testUser },
        { projectId: testProjectId, message: 'test', userId: '' }
      ]

      for (const msg of malformedMessages) {
        await expect(async () => {
          await pipeline.processMessage(msg as ChatMessage)
        }).rejects.toThrow()
      }
    })

    it('should validate message length', async () => {
      const tooLongMessage: ChatMessage = {
        projectId: testProjectId,
        message: 'x'.repeat(10000), // Exceeds limit
        userId: testUser
      }

      await expect(async () => {
        await pipeline.processMessage(tooLongMessage)
      }).rejects.toThrow(/length|too long/i)
    })
  })

  describe('AI Response Quality', () => {
    it('should generate contextual responses', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: 'Create a mysterious villain',
        userId: testUser
      }

      const response = await pipeline.processMessage(message)

      expect(response.response).toContain('villain')
      expect(response.response.length).toBeGreaterThan(50)
    })

    it('should provide helpful choices', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: 'I have an idea for a movie',
        userId: testUser
      }

      const response = await pipeline.processMessage(message)

      expect(response.choices.length).toBeGreaterThan(0)
      expect(response.choices.some(c => c.isRecommended)).toBe(true)
    })

    it('should adapt choices to context', async () => {
      const message1: ChatMessage = {
        projectId: testProjectId,
        message: 'Create 5 characters',
        userId: testUser
      }

      const response1 = await pipeline.processMessage(message1)

      const message2: ChatMessage = {
        projectId: testProjectId,
        sessionId: response1.sessionId,
        message: 'What next?',
        userId: testUser
      }

      const response2 = await pipeline.processMessage(message2)

      // Should recommend scene or story structure, not more characters
      expect(response2.choices.some(c =>
        c.id.includes('scene') || c.id.includes('story')
      )).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should process message within acceptable time', async () => {
      const message: ChatMessage = {
        projectId: testProjectId,
        message: 'Create character Test',
        userId: testUser
      }

      const startTime = Date.now()
      await pipeline.processMessage(message)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(5000) // Less than 5 seconds
    })

    it('should handle concurrent messages efficiently', async () => {
      const messages: ChatMessage[] = Array.from({ length: 5 }, (_, i) => ({
        projectId: testProjectId,
        message: `Create character ${i}`,
        userId: testUser
      }))

      const startTime = Date.now()

      await Promise.all(messages.map(msg => pipeline.processMessage(msg)))

      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(10000) // All should complete within 10 seconds
    }, 15000)
  })
})