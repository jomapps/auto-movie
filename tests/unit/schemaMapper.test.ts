import { describe, it, expect, beforeEach } from 'vitest'

/**
 * Unit Tests: SchemaMapper
 *
 * Tests the schema mapping service that transforms extracted entities
 * into PayloadCMS collection schemas, ensuring data consistency and
 * validation before database operations.
 *
 * Coverage includes:
 * - Entity to schema mapping
 * - Field validation
 * - Type conversion
 * - Required field handling
 * - Relationship mapping
 */

interface CharacterSchema {
  name: string
  description?: string
  personality?: string[]
  appearance?: Record<string, string>
  age?: number
  occupation?: string
  backstory?: string
  relationships?: Array<{
    character: string
    relationType: string
  }>
  createdBy: string
  project: string
}

interface SceneSchema {
  title: string
  description: string
  location: string
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  weather?: string
  mood?: string
  characters?: string[] // Character IDs
  actions?: string[]
  duration?: number
  project: string
}

interface ExtractedEntity {
  type: 'character' | 'scene' | 'location' | 'dialogue'
  name: string
  attributes?: Record<string, any>
  confidence: number
}

interface MappingResult {
  schema: CharacterSchema | SceneSchema | Record<string, any>
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Mock SchemaMapper - will be implemented in Phase 0
class SchemaMapper {
  mapToCharacterSchema(entity: ExtractedEntity, context: { projectId: string; userId: string }): MappingResult {
    throw new Error('Not implemented')
  }

  mapToSceneSchema(entity: ExtractedEntity, context: { projectId: string }): MappingResult {
    throw new Error('Not implemented')
  }

  validateSchema(schema: any, collectionType: string): { isValid: boolean; errors: string[] } {
    throw new Error('Not implemented')
  }

  convertTypes(data: Record<string, any>, targetTypes: Record<string, string>): Record<string, any> {
    throw new Error('Not implemented')
  }

  handleMissingRequiredFields(schema: any, requiredFields: string[]): { hasErrors: boolean; errors: string[] } {
    throw new Error('Not implemented')
  }

  mapRelationships(entities: ExtractedEntity[]): Map<string, any[]> {
    throw new Error('Not implemented')
  }

  enrichWithDefaults(schema: Partial<CharacterSchema | SceneSchema>): CharacterSchema | SceneSchema {
    throw new Error('Not implemented')
  }
}

describe('SchemaMapper', () => {
  let mapper: SchemaMapper
  const mockContext = {
    projectId: 'project-123',
    userId: 'user-456'
  }

  beforeEach(() => {
    mapper = new SchemaMapper()
  })

  describe('mapToCharacterSchema', () => {
    it('should map basic character entity to schema', () => {
      const entity: ExtractedEntity = {
        type: 'character',
        name: 'John Smith',
        attributes: {
          age: 30,
          occupation: 'detective',
          personality: ['brave', 'intelligent']
        },
        confidence: 0.9
      }

      const result = mapper.mapToCharacterSchema(entity, mockContext)

      expect(result.isValid).toBe(true)
      expect(result.schema).toMatchObject({
        name: 'John Smith',
        age: 30,
        occupation: 'detective',
        personality: ['brave', 'intelligent'],
        project: mockContext.projectId,
        createdBy: mockContext.userId
      })
      expect(result.errors).toHaveLength(0)
    })

    it('should handle complex character with all attributes', () => {
      const entity: ExtractedEntity = {
        type: 'character',
        name: 'Dr. Elena Rodriguez',
        attributes: {
          title: 'Dr.',
          age: 35,
          occupation: 'neuroscientist',
          personality: ['brilliant', 'determined', 'haunted'],
          appearance: {
            hair: 'dark brown',
            eyes: 'green',
            height: '5\'8"'
          },
          backstory: 'Lost her memory in an accident',
          relationships: [
            { character: 'Marcus', relationType: 'colleague' }
          ]
        },
        confidence: 0.95
      }

      const result = mapper.mapToCharacterSchema(entity, mockContext)

      expect(result.isValid).toBe(true)
      expect(result.schema.name).toContain('Elena')
      expect(result.schema.occupation).toBe('neuroscientist')
      expect(result.schema.personality).toContain('brilliant')
      expect(result.schema.appearance).toBeTruthy()
      expect(result.schema.backstory).toBeTruthy()
      expect(result.schema.relationships).toHaveLength(1)
    })

    it('should generate warnings for low confidence extractions', () => {
      const entity: ExtractedEntity = {
        type: 'character',
        name: 'someone',
        attributes: {},
        confidence: 0.3
      }

      const result = mapper.mapToCharacterSchema(entity, mockContext)

      expect(result.warnings).toContain(
        expect.stringMatching(/low confidence|uncertain/i)
      )
    })

    it('should handle missing optional fields', () => {
      const entity: ExtractedEntity = {
        type: 'character',
        name: 'Jane',
        attributes: {},
        confidence: 0.8
      }

      const result = mapper.mapToCharacterSchema(entity, mockContext)

      expect(result.isValid).toBe(true)
      expect(result.schema.name).toBe('Jane')
      expect(result.schema.project).toBe(mockContext.projectId)
    })

    it('should validate required fields', () => {
      const entity: ExtractedEntity = {
        type: 'character',
        name: '', // Empty name should be invalid
        attributes: {},
        confidence: 0.8
      }

      const result = mapper.mapToCharacterSchema(entity, mockContext)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        expect.stringMatching(/name.*required/i)
      )
    })
  })

  describe('mapToSceneSchema', () => {
    it('should map basic scene entity to schema', () => {
      const entity: ExtractedEntity = {
        type: 'scene',
        name: 'Opening Scene',
        attributes: {
          location: 'Downtown alley',
          timeOfDay: 'night',
          weather: 'rainy',
          mood: 'tense'
        },
        confidence: 0.85
      }

      const result = mapper.mapToSceneSchema(entity, { projectId: mockContext.projectId })

      expect(result.isValid).toBe(true)
      expect(result.schema).toMatchObject({
        title: 'Opening Scene',
        location: 'Downtown alley',
        timeOfDay: 'night',
        weather: 'rainy',
        mood: 'tense',
        project: mockContext.projectId
      })
    })

    it('should handle scene with character references', () => {
      const entity: ExtractedEntity = {
        type: 'scene',
        name: 'Confrontation',
        attributes: {
          location: 'Warehouse',
          characters: ['char-001', 'char-002'],
          actions: [
            'Hero enters',
            'Villain reveals plan',
            'Fight ensues'
          ]
        },
        confidence: 0.9
      }

      const result = mapper.mapToSceneSchema(entity, { projectId: mockContext.projectId })

      expect(result.isValid).toBe(true)
      expect(result.schema.characters).toHaveLength(2)
      expect(result.schema.actions).toHaveLength(3)
    })

    it('should validate timeOfDay enum', () => {
      const entity: ExtractedEntity = {
        type: 'scene',
        name: 'Test Scene',
        attributes: {
          location: 'Beach',
          timeOfDay: 'invalid-time' // Invalid enum value
        },
        confidence: 0.8
      }

      const result = mapper.mapToSceneSchema(entity, { projectId: mockContext.projectId })

      expect(result.errors.some(e => e.includes('timeOfDay'))).toBe(true)
    })

    it('should generate description from attributes', () => {
      const entity: ExtractedEntity = {
        type: 'scene',
        name: 'Mystery Scene',
        attributes: {
          location: 'Abandoned mansion',
          timeOfDay: 'night',
          weather: 'foggy',
          mood: 'eerie'
        },
        confidence: 0.8
      }

      const result = mapper.mapToSceneSchema(entity, { projectId: mockContext.projectId })

      expect(result.schema.description).toBeTruthy()
      expect(result.schema.description).toContain('mansion')
    })
  })

  describe('validateSchema', () => {
    it('should validate character schema structure', () => {
      const validSchema: CharacterSchema = {
        name: 'Test Character',
        project: 'project-123',
        createdBy: 'user-456'
      }

      const result = mapper.validateSchema(validSchema, 'characters')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject schema with invalid field types', () => {
      const invalidSchema = {
        name: 'Test Character',
        age: '30', // Should be number
        personality: 'brave', // Should be array
        project: 'project-123'
      }

      const result = mapper.validateSchema(invalidSchema, 'characters')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate required fields presence', () => {
      const incompleteSchema = {
        name: 'Test Character'
        // Missing required project field
      }

      const result = mapper.validateSchema(incompleteSchema, 'characters')

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('project'))).toBe(true)
    })

    it('should validate field value constraints', () => {
      const schema = {
        name: 'X'.repeat(101), // Exceeds max length
        age: -5, // Invalid age
        project: 'project-123',
        createdBy: 'user-456'
      }

      const result = mapper.validateSchema(schema, 'characters')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('convertTypes', () => {
    it('should convert string to number', () => {
      const data = {
        age: '30',
        duration: '120'
      }

      const targetTypes = {
        age: 'number',
        duration: 'number'
      }

      const result = mapper.convertTypes(data, targetTypes)

      expect(typeof result.age).toBe('number')
      expect(result.age).toBe(30)
      expect(typeof result.duration).toBe('number')
      expect(result.duration).toBe(120)
    })

    it('should convert string to array', () => {
      const data = {
        personality: 'brave, intelligent, loyal'
      }

      const targetTypes = {
        personality: 'array'
      }

      const result = mapper.convertTypes(data, targetTypes)

      expect(Array.isArray(result.personality)).toBe(true)
      expect(result.personality).toHaveLength(3)
      expect(result.personality).toContain('brave')
    })

    it('should handle nested object conversion', () => {
      const data = {
        appearance: JSON.stringify({ hair: 'brown', eyes: 'blue' })
      }

      const targetTypes = {
        appearance: 'object'
      }

      const result = mapper.convertTypes(data, targetTypes)

      expect(typeof result.appearance).toBe('object')
      expect(result.appearance.hair).toBe('brown')
    })

    it('should preserve valid types', () => {
      const data = {
        name: 'John',
        age: 30,
        active: true
      }

      const targetTypes = {
        name: 'string',
        age: 'number',
        active: 'boolean'
      }

      const result = mapper.convertTypes(data, targetTypes)

      expect(result).toEqual(data)
    })

    it('should handle conversion errors gracefully', () => {
      const data = {
        age: 'not-a-number'
      }

      const targetTypes = {
        age: 'number'
      }

      const result = mapper.convertTypes(data, targetTypes)

      expect(result.age).toBeNaN()
    })
  })

  describe('handleMissingRequiredFields', () => {
    it('should detect missing required fields', () => {
      const schema = {
        name: 'Test'
        // Missing 'project' and 'createdBy'
      }

      const requiredFields = ['name', 'project', 'createdBy']

      const result = mapper.handleMissingRequiredFields(schema, requiredFields)

      expect(result.hasErrors).toBe(true)
      expect(result.errors).toContain(
        expect.stringMatching(/project.*required/i)
      )
      expect(result.errors).toContain(
        expect.stringMatching(/createdBy.*required/i)
      )
    })

    it('should pass when all required fields present', () => {
      const schema = {
        name: 'Test',
        project: 'project-123',
        createdBy: 'user-456'
      }

      const requiredFields = ['name', 'project', 'createdBy']

      const result = mapper.handleMissingRequiredFields(schema, requiredFields)

      expect(result.hasErrors).toBe(false)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('mapRelationships', () => {
    it('should map character relationships', () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'character',
          name: 'John',
          attributes: {
            relationships: [
              { character: 'Sarah', relationType: 'father' }
            ]
          },
          confidence: 0.9
        },
        {
          type: 'character',
          name: 'Sarah',
          attributes: {
            relationships: [
              { character: 'John', relationType: 'daughter' }
            ]
          },
          confidence: 0.9
        }
      ]

      const relationshipMap = mapper.mapRelationships(entities)

      expect(relationshipMap.has('John')).toBe(true)
      expect(relationshipMap.has('Sarah')).toBe(true)
      expect(relationshipMap.get('John')).toHaveLength(1)
      expect(relationshipMap.get('Sarah')).toHaveLength(1)
    })

    it('should handle bidirectional relationships', () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'character',
          name: 'Tom',
          attributes: {
            relationships: [{ character: 'Jerry', relationType: 'rival' }]
          },
          confidence: 0.85
        },
        {
          type: 'character',
          name: 'Jerry',
          attributes: {},
          confidence: 0.85
        }
      ]

      const relationshipMap = mapper.mapRelationships(entities)

      // Should auto-create reverse relationship
      expect(relationshipMap.get('Jerry')).toBeDefined()
      expect(relationshipMap.get('Jerry')?.[0]?.character).toBe('Tom')
    })
  })

  describe('enrichWithDefaults', () => {
    it('should add default values for missing fields', () => {
      const partialSchema: Partial<CharacterSchema> = {
        name: 'Test Character',
        project: 'project-123',
        createdBy: 'user-456'
      }

      const enriched = mapper.enrichWithDefaults(partialSchema)

      expect(enriched.personality).toBeDefined()
      expect(enriched.appearance).toBeDefined()
      expect(Array.isArray(enriched.personality)).toBe(true)
    })

    it('should not override existing values', () => {
      const schema: Partial<CharacterSchema> = {
        name: 'Test',
        personality: ['custom-trait'],
        project: 'project-123',
        createdBy: 'user-456'
      }

      const enriched = mapper.enrichWithDefaults(schema)

      expect(enriched.personality).toEqual(['custom-trait'])
    })
  })

  describe('edge cases', () => {
    it('should handle null and undefined values', () => {
      const entity: ExtractedEntity = {
        type: 'character',
        name: 'Test',
        attributes: {
          age: null,
          occupation: undefined,
          personality: []
        },
        confidence: 0.8
      }

      const result = mapper.mapToCharacterSchema(entity, mockContext)

      expect(result.isValid).toBe(true)
      expect(result.schema.age).toBeUndefined()
      expect(result.schema.occupation).toBeUndefined()
    })

    it('should sanitize dangerous input', () => {
      const entity: ExtractedEntity = {
        type: 'character',
        name: '<script>alert("xss")</script>',
        attributes: {
          description: '"><script>bad</script>'
        },
        confidence: 0.8
      }

      const result = mapper.mapToCharacterSchema(entity, mockContext)

      expect(result.schema.name).not.toContain('<script>')
      expect(result.schema.description).not.toContain('<script>')
    })

    it('should handle very large schemas', () => {
      const entity: ExtractedEntity = {
        type: 'character',
        name: 'Complex Character',
        attributes: {
          ...Object.fromEntries(
            Array.from({ length: 100 }, (_, i) => [`field${i}`, `value${i}`])
          )
        },
        confidence: 0.9
      }

      const result = mapper.mapToCharacterSchema(entity, mockContext)

      expect(result).toBeDefined()
      expect(result.isValid).toBe(true)
    })
  })
})