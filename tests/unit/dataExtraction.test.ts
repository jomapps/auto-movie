import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit Tests: DataExtractionService
 *
 * Tests the natural language processing service that extracts structured
 * data from chat messages, including characters, scenes, dialogue, and
 * other movie production entities.
 *
 * Coverage includes:
 * - Entity extraction (characters, scenes, locations)
 * - Confidence scoring
 * - Ambiguity detection
 * - Multi-entity extraction
 * - Error handling
 */

interface ExtractedEntity {
  type: 'character' | 'scene' | 'location' | 'dialogue' | 'action'
  name: string
  attributes?: Record<string, any>
  confidence: number
  context?: string
}

interface ExtractionResult {
  entities: ExtractedEntity[]
  metadata: {
    totalEntities: number
    averageConfidence: number
    hasAmbiguity: boolean
    suggestions?: string[]
  }
}

// Mock DataExtractionService - will be implemented in Phase 0
class DataExtractionService {
  async extractEntities(message: string): Promise<ExtractionResult> {
    throw new Error('Not implemented')
  }

  async extractCharacter(message: string): Promise<ExtractedEntity | null> {
    throw new Error('Not implemented')
  }

  async extractScene(message: string): Promise<ExtractedEntity | null> {
    throw new Error('Not implemented')
  }

  async extractMultipleCharacters(message: string): Promise<ExtractedEntity[]> {
    throw new Error('Not implemented')
  }

  calculateConfidence(entity: Partial<ExtractedEntity>): number {
    throw new Error('Not implemented')
  }

  detectAmbiguity(entities: ExtractedEntity[]): boolean {
    throw new Error('Not implemented')
  }
}

describe('DataExtractionService', () => {
  let service: DataExtractionService

  beforeEach(() => {
    service = new DataExtractionService()
  })

  describe('extractCharacter', () => {
    it('should extract a single character with basic attributes', async () => {
      const message = 'Create a character named John, a 35-year-old detective with a mysterious past.'

      const result = await service.extractCharacter(message)

      expect(result).toBeTruthy()
      expect(result?.type).toBe('character')
      expect(result?.name).toBe('John')
      expect(result?.attributes).toMatchObject({
        age: 35,
        occupation: 'detective',
        trait: 'mysterious past'
      })
      expect(result?.confidence).toBeGreaterThan(0.7)
    })

    it('should handle character descriptions without explicit name', async () => {
      const message = 'I want a brave knight who fights for justice'

      const result = await service.extractCharacter(message)

      expect(result).toBeTruthy()
      expect(result?.type).toBe('character')
      expect(result?.attributes?.occupation).toContain('knight')
      expect(result?.attributes?.traits).toContain('brave')
    })

    it('should return null when no character is detected', async () => {
      const message = 'The sun is shining today'

      const result = await service.extractCharacter(message)

      expect(result).toBeNull()
    })

    it('should extract physical appearance attributes', async () => {
      const message = 'Sarah has long red hair, green eyes, and wears a leather jacket'

      const result = await service.extractCharacter(message)

      expect(result?.name).toBe('Sarah')
      expect(result?.attributes?.appearance).toMatchObject({
        hair: 'long red hair',
        eyes: 'green eyes',
        clothing: 'leather jacket'
      })
    })

    it('should extract personality traits', async () => {
      const message = 'Mike is a cheerful, optimistic programmer who loves helping others'

      const result = await service.extractCharacter(message)

      expect(result?.name).toBe('Mike')
      expect(result?.attributes?.personality).toEqual(
        expect.arrayContaining(['cheerful', 'optimistic'])
      )
      expect(result?.attributes?.occupation).toBe('programmer')
    })

    it('should handle complex character backstory', async () => {
      const message = `Create Dr. Elena Rodriguez, a brilliant neuroscientist who lost her memory
                       in an accident and is now searching for her identity while being hunted by
                       mysterious forces.`

      const result = await service.extractCharacter(message)

      expect(result?.name).toContain('Elena')
      expect(result?.attributes?.title).toBe('Dr.')
      expect(result?.attributes?.occupation).toBe('neuroscientist')
      expect(result?.attributes?.backstory).toBeTruthy()
      expect(result?.confidence).toBeGreaterThan(0.8)
    })
  })

  describe('extractMultipleCharacters', () => {
    it('should extract multiple characters from a single message', async () => {
      const message = `I need two characters: Alex, a 28-year-old cop, and Maya,
                       a hacker in her early 20s.`

      const results = await service.extractMultipleCharacters(message)

      expect(results).toHaveLength(2)
      expect(results[0].name).toBe('Alex')
      expect(results[0].attributes?.age).toBe(28)
      expect(results[0].attributes?.occupation).toBe('cop')

      expect(results[1].name).toBe('Maya')
      expect(results[1].attributes?.occupation).toBe('hacker')
    })

    it('should handle character relationships', async () => {
      const message = 'Tom is the father of Lisa, and Lisa is best friends with Emma'

      const results = await service.extractMultipleCharacters(message)

      expect(results).toHaveLength(3)
      expect(results.find(c => c.name === 'Tom')?.attributes?.relationships).toContain('father of Lisa')
      expect(results.find(c => c.name === 'Lisa')?.attributes?.relationships).toEqual(
        expect.arrayContaining(['daughter of Tom', 'best friends with Emma'])
      )
    })

    it('should assign different confidence scores based on clarity', async () => {
      const message = 'Sarah is a teacher and there might be someone named John'

      const results = await service.extractMultipleCharacters(message)

      const sarah = results.find(c => c.name === 'Sarah')
      const john = results.find(c => c.name === 'John')

      expect(sarah?.confidence).toBeGreaterThan(john?.confidence || 0)
    })
  })

  describe('extractScene', () => {
    it('should extract scene with location and time', async () => {
      const message = 'Scene: Night time in a dark alley downtown, rain pouring heavily'

      const result = await service.extractScene(message)

      expect(result?.type).toBe('scene')
      expect(result?.attributes).toMatchObject({
        location: 'dark alley downtown',
        timeOfDay: 'night',
        weather: 'rain'
      })
    })

    it('should extract scene mood and atmosphere', async () => {
      const message = 'A tense confrontation in an abandoned warehouse, dim lighting, eerie silence'

      const result = await service.extractScene(message)

      expect(result?.attributes?.location).toContain('warehouse')
      expect(result?.attributes?.mood).toContain('tense')
      expect(result?.attributes?.atmosphere).toEqual(
        expect.arrayContaining(['dim lighting', 'eerie silence'])
      )
    })

    it('should extract action sequences', async () => {
      const message = `The hero jumps off the building, lands on the moving train,
                       and fights three guards while the train speeds through the tunnel`

      const result = await service.extractScene(message)

      expect(result?.attributes?.actions).toHaveLength(3)
      expect(result?.attributes?.location).toContain('train')
    })
  })

  describe('extractEntities', () => {
    it('should extract mixed entity types from complex message', async () => {
      const message = `Create a character named Jack who appears in a scene at the old mansion
                       where he discovers a mysterious letter. The mansion is gothic style with
                       creaky floors.`

      const result = await service.extractEntities(message)

      expect(result.entities.length).toBeGreaterThan(1)

      const character = result.entities.find(e => e.type === 'character')
      expect(character?.name).toBe('Jack')

      const scene = result.entities.find(e => e.type === 'scene')
      expect(scene?.attributes?.location).toContain('mansion')
    })

    it('should calculate metadata correctly', async () => {
      const message = 'Sarah and Tom meet at the cafe'

      const result = await service.extractEntities(message)

      expect(result.metadata.totalEntities).toBe(result.entities.length)
      expect(result.metadata.averageConfidence).toBeGreaterThan(0)
      expect(result.metadata.averageConfidence).toBeLessThanOrEqual(1)
    })
  })

  describe('calculateConfidence', () => {
    it('should assign high confidence to explicit entities', () => {
      const entity: Partial<ExtractedEntity> = {
        type: 'character',
        name: 'John Smith',
        attributes: {
          age: 30,
          occupation: 'detective',
          appearance: 'tall with brown hair'
        }
      }

      const confidence = service.calculateConfidence(entity)

      expect(confidence).toBeGreaterThan(0.8)
    })

    it('should assign lower confidence to vague entities', () => {
      const entity: Partial<ExtractedEntity> = {
        type: 'character',
        name: 'someone',
        attributes: {}
      }

      const confidence = service.calculateConfidence(entity)

      expect(confidence).toBeLessThan(0.5)
    })

    it('should consider context in confidence calculation', () => {
      const withContext: Partial<ExtractedEntity> = {
        type: 'character',
        name: 'Alex',
        context: 'Previously mentioned in the story as the protagonist'
      }

      const withoutContext: Partial<ExtractedEntity> = {
        type: 'character',
        name: 'Alex'
      }

      expect(service.calculateConfidence(withContext))
        .toBeGreaterThan(service.calculateConfidence(withoutContext))
    })
  })

  describe('detectAmbiguity', () => {
    it('should detect when multiple entities have similar attributes', () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'character',
          name: 'John',
          attributes: { age: 30, occupation: 'detective' },
          confidence: 0.7
        },
        {
          type: 'character',
          name: 'Jonathan',
          attributes: { age: 30, occupation: 'detective' },
          confidence: 0.6
        }
      ]

      const hasAmbiguity = service.detectAmbiguity(entities)

      expect(hasAmbiguity).toBe(true)
    })

    it('should not detect ambiguity for clearly distinct entities', () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'character',
          name: 'Sarah',
          attributes: { age: 25, occupation: 'teacher' },
          confidence: 0.9
        },
        {
          type: 'character',
          name: 'Mike',
          attributes: { age: 40, occupation: 'chef' },
          confidence: 0.85
        }
      ]

      const hasAmbiguity = service.detectAmbiguity(entities)

      expect(hasAmbiguity).toBe(false)
    })

    it('should detect pronoun ambiguity', () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'character',
          name: 'he',
          attributes: {},
          confidence: 0.4
        }
      ]

      const hasAmbiguity = service.detectAmbiguity(entities)

      expect(hasAmbiguity).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty messages', async () => {
      const result = await service.extractEntities('')

      expect(result.entities).toHaveLength(0)
      expect(result.metadata.totalEntities).toBe(0)
    })

    it('should handle very long messages without performance degradation', async () => {
      const longMessage = `
        ${Array(100).fill('Create a character named Person').join('. ')}
      `

      const startTime = Date.now()
      await service.extractEntities(longMessage)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle special characters in names', async () => {
      const message = "Create O'Brien and François as characters"

      const results = await service.extractMultipleCharacters(message)

      expect(results.some(c => c.name.includes("O'Brien"))).toBe(true)
      expect(results.some(c => c.name.includes('François'))).toBe(true)
    })

    it('should handle Unicode characters', async () => {
      const message = '创建一个名叫李明的角色'

      const result = await service.extractCharacter(message)

      expect(result).toBeTruthy()
      expect(result?.name).toContain('李明')
    })

    it('should provide suggestions when extraction is uncertain', async () => {
      const message = 'Maybe add someone to the scene'

      const result = await service.extractEntities(message)

      expect(result.metadata.hasAmbiguity).toBe(true)
      expect(result.metadata.suggestions).toBeTruthy()
      expect(result.metadata.suggestions?.length).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('should handle malformed input gracefully', async () => {
      const malformedInputs = [
        null,
        undefined,
        123,
        {},
        []
      ]

      for (const input of malformedInputs) {
        await expect(async () => {
          await service.extractEntities(input as any)
        }).rejects.toThrow()
      }
    })

    it('should recover from extraction failures', async () => {
      const message = 'Normal message with @#$%^&* special characters'

      const result = await service.extractEntities(message)

      expect(result).toBeTruthy()
      expect(result.entities).toBeDefined()
      expect(result.metadata).toBeDefined()
    })
  })
})