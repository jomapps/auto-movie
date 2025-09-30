import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Integration Tests: PayloadCMS Integration
 *
 * Tests the integration between the chat system and PayloadCMS,
 * ensuring that extracted entities are correctly mapped and stored
 * in the appropriate collections.
 *
 * Coverage includes:
 * - Character creation from chat
 * - Scene creation from chat
 * - Location creation from chat
 * - Entity relationships
 * - Data validation
 * - Error handling
 */

interface ExtractedEntity {
  type: 'character' | 'scene' | 'location' | 'prop' | 'event'
  data: Record<string, any>
  confidence: number
}

interface PayloadCharacter {
  id: string
  name: string
  description?: string
  personality?: string[]
  appearance?: Record<string, any>
  project: string
}

interface PayloadScene {
  id: string
  title: string
  description: string
  location?: string
  characters?: string[]
  project: string
}

// Mock PayloadIntegrationService - will be implemented in Phase 0
class PayloadIntegrationService {
  async createCharacter(data: any, projectId: string): Promise<PayloadCharacter> {
    throw new Error('Not implemented')
  }

  async createScene(data: any, projectId: string): Promise<PayloadScene> {
    throw new Error('Not implemented')
  }

  async createLocation(data: any, projectId: string): Promise<any> {
    throw new Error('Not implemented')
  }

  async createFromExtractedData(entities: ExtractedEntity[], projectId: string): Promise<any> {
    throw new Error('Not implemented')
  }

  async updateProjectEntities(projectId: string, entities: any): Promise<void> {
    throw new Error('Not implemented')
  }

  async getCharacter(id: string): Promise<PayloadCharacter | null> {
    throw new Error('Not implemented')
  }

  async getScene(id: string): Promise<PayloadScene | null> {
    throw new Error('Not implemented')
  }

  async linkCharacterToScene(characterId: string, sceneId: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async validateEntityExists(type: string, id: string): Promise<boolean> {
    throw new Error('Not implemented')
  }
}

// Mock Payload
const mockPayload = {
  create: vi.fn(),
  update: vi.fn(),
  findByID: vi.fn(),
  find: vi.fn(),
  delete: vi.fn()
}

describe('PayloadCMS Integration', () => {
  let service: PayloadIntegrationService
  const testProjectId = 'test-project-123'

  beforeEach(() => {
    service = new PayloadIntegrationService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createCharacter', () => {
    it('should create character in characters collection', async () => {
      const characterData = {
        name: 'John Doe',
        description: 'A brave detective',
        personality: ['brave', 'intelligent'],
        age: 35
      }

      const result = await service.createCharacter(characterData, testProjectId)

      expect(result).toBeTruthy()
      expect(result.id).toBeDefined()
      expect(result.name).toBe('John Doe')
      expect(result.project).toBe(testProjectId)
    })

    it('should handle complex character with all attributes', async () => {
      const characterData = {
        name: 'Dr. Sarah Chen',
        description: 'Brilliant neuroscientist',
        personality: ['intelligent', 'determined', 'compassionate'],
        appearance: {
          hair: 'black',
          eyes: 'brown',
          height: '5\'6"',
          ethnicity: 'Asian-American'
        },
        backstory: 'Lost her memory in an accident 5 years ago',
        age: 38,
        occupation: 'Neuroscientist'
      }

      const result = await service.createCharacter(characterData, testProjectId)

      expect(result.name).toBe('Dr. Sarah Chen')
      expect(result.personality).toContain('intelligent')
      expect(result.appearance).toBeDefined()
    })

    it('should validate required fields before creation', async () => {
      const invalidData = {
        description: 'Missing name'
        // Name is required
      }

      await expect(async () => {
        await service.createCharacter(invalidData, testProjectId)
      }).rejects.toThrow()
    })

    it('should sanitize input data', async () => {
      const unsafeData = {
        name: '<script>alert("xss")</script>John',
        description: 'Normal description'
      }

      const result = await service.createCharacter(unsafeData, testProjectId)

      expect(result.name).not.toContain('<script>')
      expect(result.name).toContain('John')
    })

    it('should link character to project', async () => {
      const characterData = {
        name: 'Test Character',
        description: 'Test description'
      }

      const result = await service.createCharacter(characterData, testProjectId)

      expect(result.project).toBe(testProjectId)
    })
  })

  describe('createScene', () => {
    it('should create scene in scenes collection', async () => {
      const sceneData = {
        title: 'Opening Scene',
        description: 'Hero discovers the ancient artifact',
        location: 'Ancient Temple',
        timeOfDay: 'dawn'
      }

      const result = await service.createScene(sceneData, testProjectId)

      expect(result).toBeTruthy()
      expect(result.id).toBeDefined()
      expect(result.title).toBe('Opening Scene')
      expect(result.project).toBe(testProjectId)
    })

    it('should handle scene with character references', async () => {
      const sceneData = {
        title: 'Confrontation',
        description: 'Hero and villain face off',
        characters: ['char-1', 'char-2'],
        location: 'Abandoned warehouse'
      }

      const result = await service.createScene(sceneData, testProjectId)

      expect(result.characters).toHaveLength(2)
      expect(result.characters).toContain('char-1')
    })

    it('should validate scene description length', async () => {
      const invalidScene = {
        title: 'Test Scene',
        description: 'Too short'
      }

      await expect(async () => {
        await service.createScene(invalidScene, testProjectId)
      }).rejects.toThrow(/description/i)
    })
  })

  describe('createLocation', () => {
    it('should create location in locations collection', async () => {
      const locationData = {
        name: 'Ancient Temple',
        description: 'A mysterious temple hidden in the jungle',
        type: 'interior',
        atmosphere: 'mysterious and foreboding'
      }

      const result = await service.createLocation(locationData, testProjectId)

      expect(result).toBeTruthy()
      expect(result.name).toBe('Ancient Temple')
      expect(result.project).toBe(testProjectId)
    })

    it('should prevent duplicate locations in same project', async () => {
      const locationData = {
        name: 'City Hall',
        description: 'Main government building'
      }

      await service.createLocation(locationData, testProjectId)

      // Second attempt with same name
      await expect(async () => {
        await service.createLocation(locationData, testProjectId)
      }).rejects.toThrow(/duplicate|already exists/i)
    })
  })

  describe('createFromExtractedData', () => {
    it('should create multiple entities from extracted data', async () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'character',
          data: {
            name: 'Hero',
            description: 'The brave protagonist'
          },
          confidence: 0.9
        },
        {
          type: 'character',
          data: {
            name: 'Villain',
            description: 'The evil antagonist'
          },
          confidence: 0.85
        },
        {
          type: 'scene',
          data: {
            title: 'Opening',
            description: 'First encounter between hero and villain'
          },
          confidence: 0.8
        }
      ]

      const result = await service.createFromExtractedData(entities, testProjectId)

      expect(result.characters).toHaveLength(2)
      expect(result.scenes).toHaveLength(1)
      expect(result.characters[0].name).toBe('Hero')
    })

    it('should skip entities with low confidence', async () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'character',
          data: { name: 'Certain', description: 'High confidence' },
          confidence: 0.9
        },
        {
          type: 'character',
          data: { name: 'Uncertain', description: 'Low confidence' },
          confidence: 0.3 // Below threshold
        }
      ]

      const result = await service.createFromExtractedData(entities, testProjectId)

      expect(result.characters).toHaveLength(1)
      expect(result.characters[0].name).toBe('Certain')
    })

    it('should handle mixed entity types', async () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'character',
          data: { name: 'John', description: 'Hero' },
          confidence: 0.9
        },
        {
          type: 'location',
          data: { name: 'Castle', description: 'Ancient fortress' },
          confidence: 0.85
        },
        {
          type: 'prop',
          data: { name: 'Sword', description: 'Magical weapon' },
          confidence: 0.8
        }
      ]

      const result = await service.createFromExtractedData(entities, testProjectId)

      expect(result.characters.length).toBeGreaterThan(0)
      expect(result.locations.length).toBeGreaterThan(0)
      expect(result.props.length).toBeGreaterThan(0)
    })

    it('should continue processing despite individual entity failures', async () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'character',
          data: { name: 'Valid', description: 'Good character' },
          confidence: 0.9
        },
        {
          type: 'character',
          data: { name: '', description: 'Invalid - no name' }, // Invalid
          confidence: 0.8
        },
        {
          type: 'scene',
          data: { title: 'Valid Scene', description: 'Good scene' },
          confidence: 0.85
        }
      ]

      const result = await service.createFromExtractedData(entities, testProjectId)

      // Should create valid entities despite one failure
      expect(result.characters.length).toBeGreaterThan(0)
      expect(result.scenes.length).toBeGreaterThan(0)
    })
  })

  describe('updateProjectEntities', () => {
    it('should update project entity counts', async () => {
      const entities = {
        characters: [
          { id: '1', name: 'Hero' },
          { id: '2', name: 'Villain' }
        ],
        scenes: [
          { id: '1', title: 'Scene 1' }
        ],
        locations: [],
        props: [],
        events: []
      }

      await service.updateProjectEntities(testProjectId, entities)

      // Verify project was updated
      // This would check mockPayload.update was called correctly
    })

    it('should handle projects with existing entities', async () => {
      const newEntities = {
        characters: [{ id: '3', name: 'New Character' }],
        scenes: [],
        locations: [],
        props: [],
        events: []
      }

      await service.updateProjectEntities(testProjectId, newEntities)

      // Should append to existing entities, not replace
    })
  })

  describe('entity relationships', () => {
    it('should link character to scene', async () => {
      const character = await service.createCharacter(
        { name: 'Hero', description: 'Main character' },
        testProjectId
      )

      const scene = await service.createScene(
        { title: 'Action Scene', description: 'Hero fights enemies' },
        testProjectId
      )

      await service.linkCharacterToScene(character.id, scene.id)

      const updatedScene = await service.getScene(scene.id)
      expect(updatedScene?.characters).toContain(character.id)
    })

    it('should handle multiple characters in one scene', async () => {
      const hero = await service.createCharacter(
        { name: 'Hero', description: 'Protagonist' },
        testProjectId
      )

      const villain = await service.createCharacter(
        { name: 'Villain', description: 'Antagonist' },
        testProjectId
      )

      const scene = await service.createScene(
        {
          title: 'Final Battle',
          description: 'Climactic confrontation',
          characters: [hero.id, villain.id]
        },
        testProjectId
      )

      expect(scene.characters).toHaveLength(2)
      expect(scene.characters).toContain(hero.id)
      expect(scene.characters).toContain(villain.id)
    })

    it('should validate referenced entities exist', async () => {
      const sceneData = {
        title: 'Invalid Scene',
        description: 'References non-existent character',
        characters: ['non-existent-char-id']
      }

      await expect(async () => {
        await service.createScene(sceneData, testProjectId)
      }).rejects.toThrow(/not found|invalid reference/i)
    })
  })

  describe('entity retrieval', () => {
    it('should retrieve character by ID', async () => {
      const created = await service.createCharacter(
        { name: 'Test Character', description: 'Test' },
        testProjectId
      )

      const retrieved = await service.getCharacter(created.id)

      expect(retrieved).toBeTruthy()
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.name).toBe('Test Character')
    })

    it('should return null for non-existent entity', async () => {
      const result = await service.getCharacter('non-existent-id')

      expect(result).toBeNull()
    })

    it('should retrieve scene with populated character references', async () => {
      const character = await service.createCharacter(
        { name: 'Hero', description: 'Main' },
        testProjectId
      )

      const scene = await service.createScene(
        {
          title: 'Scene with Hero',
          description: 'Hero appears',
          characters: [character.id]
        },
        testProjectId
      )

      const retrieved = await service.getScene(scene.id)

      expect(retrieved?.characters).toContain(character.id)
    })
  })

  describe('data validation', () => {
    it('should validate character schema', async () => {
      const invalidCharacter = {
        name: 'X'.repeat(101), // Exceeds max length
        description: 'Test'
      }

      await expect(async () => {
        await service.createCharacter(invalidCharacter, testProjectId)
      }).rejects.toThrow(/validation|invalid|length/i)
    })

    it('should validate scene schema', async () => {
      const invalidScene = {
        title: '', // Empty title
        description: 'Description'
      }

      await expect(async () => {
        await service.createScene(invalidScene, testProjectId)
      }).rejects.toThrow(/title.*required/i)
    })

    it('should validate data types', async () => {
      const invalidTypes = {
        name: 'Valid Name',
        description: 'Valid Description',
        age: 'thirty' // Should be number
      }

      await expect(async () => {
        await service.createCharacter(invalidTypes, testProjectId)
      }).rejects.toThrow(/age.*number/i)
    })
  })

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      // Simulate database error
      mockPayload.create.mockRejectedValue(new Error('Database connection failed'))

      await expect(async () => {
        await service.createCharacter(
          { name: 'Test', description: 'Test' },
          testProjectId
        )
      }).rejects.toThrow(/database/i)
    })

    it('should rollback on creation failure', async () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'character',
          data: { name: 'Valid', description: 'Good' },
          confidence: 0.9
        }
      ]

      mockPayload.create.mockRejectedValueOnce(new Error('Creation failed'))

      await expect(async () => {
        await service.createFromExtractedData(entities, testProjectId)
      }).rejects.toThrow()

      // Verify cleanup occurred
    })

    it('should provide detailed error messages', async () => {
      const invalidData = {
        name: 'Test',
        description: '' // Required but empty
      }

      try {
        await service.createCharacter(invalidData, testProjectId)
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error instanceof Error).toBe(true)
        expect((error as Error).message).toContain('description')
      }
    })
  })

  describe('performance', () => {
    it('should handle bulk entity creation efficiently', async () => {
      const entities: ExtractedEntity[] = Array.from({ length: 50 }, (_, i) => ({
        type: 'character' as const,
        data: {
          name: `Character ${i}`,
          description: `Description ${i}`
        },
        confidence: 0.8
      }))

      const startTime = Date.now()
      await service.createFromExtractedData(entities, testProjectId)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should batch database operations', async () => {
      const entities: ExtractedEntity[] = [
        { type: 'character', data: { name: 'C1', description: 'D1' }, confidence: 0.9 },
        { type: 'character', data: { name: 'C2', description: 'D2' }, confidence: 0.9 },
        { type: 'character', data: { name: 'C3', description: 'D3' }, confidence: 0.9 }
      ]

      await service.createFromExtractedData(entities, testProjectId)

      // Should use batch operations rather than individual calls
      // Verify mockPayload.create was called efficiently
    })
  })

  describe('validateEntityExists', () => {
    it('should validate existing entity', async () => {
      const character = await service.createCharacter(
        { name: 'Test', description: 'Test' },
        testProjectId
      )

      const exists = await service.validateEntityExists('character', character.id)

      expect(exists).toBe(true)
    })

    it('should return false for non-existent entity', async () => {
      const exists = await service.validateEntityExists('character', 'non-existent')

      expect(exists).toBe(false)
    })
  })
})