import { describe, it, expect, beforeEach } from 'vitest'

/**
 * Unit Tests: StepValidator
 *
 * Tests validation logic for workflow step requirements, ensuring
 * that users have completed necessary prerequisites and have the
 * required entities before advancing.
 *
 * Coverage includes:
 * - Step requirement validation
 * - Entity existence checks
 * - Data completeness validation
 * - Helpful error messages
 * - Validation rules
 */

type WorkflowStep =
  | 'initial_concept'
  | 'story_structure'
  | 'character_development'
  | 'storyboard'
  | 'asset_creation'
  | 'production'

interface ValidationRule {
  field: string
  type: 'required' | 'min_count' | 'min_length' | 'format' | 'custom'
  value?: any
  validator?: (value: any) => boolean
  message: string
}

interface StepRequirements {
  step: WorkflowStep
  minimumCharacters?: number
  minimumScenes?: number
  requiredFields?: string[]
  customValidations?: ValidationRule[]
}

interface ValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    severity: 'error' | 'warning'
  }>
  warnings: string[]
  suggestions: string[]
  canProceed: boolean
}

interface ProjectContext {
  characters: Array<{ id: string; name: string; description?: string }>
  scenes: Array<{ id: string; title: string; description: string }>
  concept: { description?: string; genre?: string }
  storyStructure?: { acts?: any[]; arcs?: any[] }
}

// Mock StepValidator - will be implemented in Phase 0
class StepValidator {
  private requirements: Map<WorkflowStep, StepRequirements> = new Map()

  constructor() {
    this.initializeRequirements()
  }

  private initializeRequirements(): void {
    throw new Error('Not implemented')
  }

  validateStep(step: WorkflowStep, context: ProjectContext): ValidationResult {
    throw new Error('Not implemented')
  }

  validateCharacterCount(count: number, minimum: number): boolean {
    throw new Error('Not implemented')
  }

  validateSceneCount(count: number, minimum: number): boolean {
    throw new Error('Not implemented')
  }

  validateCharacterCompleteness(character: any): { isComplete: boolean; missing: string[] } {
    throw new Error('Not implemented')
  }

  validateSceneCompleteness(scene: any): { isComplete: boolean; missing: string[] } {
    throw new Error('Not implemented')
  }

  generateHelpfulMessage(errors: any[]): string {
    throw new Error('Not implemented')
  }

  canProceedWithWarnings(result: ValidationResult): boolean {
    throw new Error('Not implemented')
  }

  getRequirementsForStep(step: WorkflowStep): StepRequirements | undefined {
    throw new Error('Not implemented')
  }
}

describe('StepValidator', () => {
  let validator: StepValidator

  beforeEach(() => {
    validator = new StepValidator()
  })

  describe('initialization', () => {
    it('should initialize requirements for all workflow steps', () => {
      const steps: WorkflowStep[] = [
        'initial_concept',
        'story_structure',
        'character_development',
        'storyboard',
        'asset_creation',
        'production'
      ]

      steps.forEach(step => {
        const requirements = validator.getRequirementsForStep(step)
        expect(requirements).toBeDefined()
        expect(requirements?.step).toBe(step)
      })
    })

    it('should define increasing requirements for later steps', () => {
      const conceptReqs = validator.getRequirementsForStep('initial_concept')
      const productionReqs = validator.getRequirementsForStep('production')

      expect(productionReqs?.minimumCharacters || 0).toBeGreaterThan(
        conceptReqs?.minimumCharacters || 0
      )
    })
  })

  describe('validateStep - initial_concept', () => {
    it('should pass with valid concept description', () => {
      const context: ProjectContext = {
        characters: [],
        scenes: [],
        concept: {
          description: 'A thrilling sci-fi adventure about time travel and paradoxes',
          genre: 'sci-fi'
        }
      }

      const result = validator.validateStep('initial_concept', context)

      expect(result.isValid).toBe(true)
      expect(result.canProceed).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail without concept description', () => {
      const context: ProjectContext = {
        characters: [],
        scenes: [],
        concept: {}
      }

      const result = validator.validateStep('initial_concept', context)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'concept.description')).toBe(true)
    })

    it('should fail with too short concept description', () => {
      const context: ProjectContext = {
        characters: [],
        scenes: [],
        concept: {
          description: 'Short',
          genre: 'action'
        }
      }

      const result = validator.validateStep('initial_concept', context)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.message.includes('description') && e.message.includes('length'))).toBe(true)
    })

    it('should warn if genre is missing', () => {
      const context: ProjectContext = {
        characters: [],
        scenes: [],
        concept: {
          description: 'A complete concept description with sufficient detail'
        }
      }

      const result = validator.validateStep('initial_concept', context)

      expect(result.warnings.some(w => w.includes('genre'))).toBe(true)
    })
  })

  describe('validateStep - character_development', () => {
    it('should pass with minimum required characters', () => {
      const context: ProjectContext = {
        characters: [
          { id: '1', name: 'Hero', description: 'The brave protagonist' },
          { id: '2', name: 'Villain', description: 'The evil antagonist' }
        ],
        scenes: [],
        concept: { description: 'Concept', genre: 'action' }
      }

      const result = validator.validateStep('character_development', context)

      expect(result.isValid).toBe(true)
      expect(result.canProceed).toBe(true)
    })

    it('should fail with insufficient characters', () => {
      const context: ProjectContext = {
        characters: [
          { id: '1', name: 'Hero' }
        ],
        scenes: [],
        concept: { description: 'Concept', genre: 'action' }
      }

      const result = validator.validateStep('character_development', context)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.message.includes('character') && e.message.includes('minimum'))).toBe(true)
    })

    it('should fail with incomplete character profiles', () => {
      const context: ProjectContext = {
        characters: [
          { id: '1', name: 'Hero' }, // Missing description
          { id: '2', name: 'Villain', description: 'Evil' }
        ],
        scenes: [],
        concept: { description: 'Concept', genre: 'action' }
      }

      const result = validator.validateStep('character_development', context)

      expect(result.errors.some(e => e.field.includes('character'))).toBe(true)
    })

    it('should provide suggestions for improving characters', () => {
      const context: ProjectContext = {
        characters: [
          { id: '1', name: 'Hero', description: 'Basic description' },
          { id: '2', name: 'Villain', description: 'Simple villain' }
        ],
        scenes: [],
        concept: { description: 'Concept', genre: 'action' }
      }

      const result = validator.validateStep('character_development', context)

      if (result.suggestions.length > 0) {
        expect(result.suggestions.some(s =>
          s.includes('personality') || s.includes('backstory') || s.includes('appearance')
        )).toBe(true)
      }
    })
  })

  describe('validateStep - storyboard', () => {
    it('should pass with sufficient scenes and characters', () => {
      const context: ProjectContext = {
        characters: [
          { id: '1', name: 'Hero', description: 'Brave warrior' },
          { id: '2', name: 'Villain', description: 'Evil lord' }
        ],
        scenes: [
          { id: '1', title: 'Opening', description: 'Hero discovers the quest' },
          { id: '2', title: 'Confrontation', description: 'Hero meets villain' },
          { id: '3', title: 'Climax', description: 'Final battle' }
        ],
        concept: { description: 'Epic fantasy', genre: 'fantasy' },
        storyStructure: {
          acts: [{ title: 'Act 1' }, { title: 'Act 2' }, { title: 'Act 3' }],
          arcs: [{ character: '1', arc: 'Hero\'s journey' }]
        }
      }

      const result = validator.validateStep('storyboard', context)

      expect(result.isValid).toBe(true)
      expect(result.canProceed).toBe(true)
    })

    it('should fail without story structure', () => {
      const context: ProjectContext = {
        characters: [
          { id: '1', name: 'Hero', description: 'Brave' }
        ],
        scenes: [
          { id: '1', title: 'Scene 1', description: 'First scene' }
        ],
        concept: { description: 'Story', genre: 'action' }
      }

      const result = validator.validateStep('storyboard', context)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field.includes('storyStructure'))).toBe(true)
    })

    it('should require minimum number of scenes', () => {
      const context: ProjectContext = {
        characters: [
          { id: '1', name: 'Hero', description: 'Brave' }
        ],
        scenes: [
          { id: '1', title: 'Only Scene', description: 'One scene only' }
        ],
        concept: { description: 'Story', genre: 'action' },
        storyStructure: { acts: [], arcs: [] }
      }

      const result = validator.validateStep('storyboard', context)

      expect(result.errors.some(e => e.message.includes('scene') && e.message.includes('minimum'))).toBe(true)
    })
  })

  describe('validateCharacterCount', () => {
    it('should validate sufficient character count', () => {
      const isValid = validator.validateCharacterCount(5, 2)

      expect(isValid).toBe(true)
    })

    it('should fail with insufficient character count', () => {
      const isValid = validator.validateCharacterCount(1, 2)

      expect(isValid).toBe(false)
    })

    it('should handle exact minimum', () => {
      const isValid = validator.validateCharacterCount(2, 2)

      expect(isValid).toBe(true)
    })
  })

  describe('validateSceneCount', () => {
    it('should validate sufficient scene count', () => {
      const isValid = validator.validateSceneCount(10, 3)

      expect(isValid).toBe(true)
    })

    it('should fail with insufficient scene count', () => {
      const isValid = validator.validateSceneCount(1, 3)

      expect(isValid).toBe(false)
    })
  })

  describe('validateCharacterCompleteness', () => {
    it('should validate complete character', () => {
      const character = {
        name: 'John Doe',
        description: 'A brave detective',
        personality: ['brave', 'intelligent'],
        appearance: { hair: 'brown', eyes: 'blue' },
        backstory: 'Former soldier turned detective'
      }

      const result = validator.validateCharacterCompleteness(character)

      expect(result.isComplete).toBe(true)
      expect(result.missing).toHaveLength(0)
    })

    it('should identify missing required fields', () => {
      const character = {
        name: 'John Doe'
        // Missing description and other fields
      }

      const result = validator.validateCharacterCompleteness(character)

      expect(result.isComplete).toBe(false)
      expect(result.missing).toContain('description')
    })

    it('should handle partially complete character', () => {
      const character = {
        name: 'Jane Smith',
        description: 'A scientist',
        personality: ['curious']
        // Missing appearance and backstory
      }

      const result = validator.validateCharacterCompleteness(character)

      expect(result.missing.length).toBeGreaterThan(0)
    })
  })

  describe('validateSceneCompleteness', () => {
    it('should validate complete scene', () => {
      const scene = {
        title: 'Opening Scene',
        description: 'The hero discovers the ancient artifact in a hidden temple',
        location: 'Ancient Temple',
        timeOfDay: 'dawn',
        characters: ['char-1', 'char-2'],
        actions: ['Hero enters', 'Discovers artifact', 'Triggered trap']
      }

      const result = validator.validateSceneCompleteness(scene)

      expect(result.isComplete).toBe(true)
      expect(result.missing).toHaveLength(0)
    })

    it('should identify missing scene elements', () => {
      const scene = {
        title: 'Test Scene'
        // Missing description and other fields
      }

      const result = validator.validateSceneCompleteness(scene)

      expect(result.isComplete).toBe(false)
      expect(result.missing).toContain('description')
    })

    it('should validate minimum description length', () => {
      const scene = {
        title: 'Scene',
        description: 'Short', // Too short
        location: 'Place'
      }

      const result = validator.validateSceneCompleteness(scene)

      expect(result.isComplete).toBe(false)
    })
  })

  describe('generateHelpfulMessage', () => {
    it('should generate clear error message for missing characters', () => {
      const errors = [
        {
          field: 'characters',
          message: 'Minimum 2 characters required',
          severity: 'error' as const
        }
      ]

      const message = validator.generateHelpfulMessage(errors)

      expect(message).toContain('character')
      expect(message.length).toBeGreaterThan(20)
    })

    it('should provide actionable guidance', () => {
      const errors = [
        {
          field: 'scenes',
          message: 'Minimum 3 scenes required',
          severity: 'error' as const
        }
      ]

      const message = validator.generateHelpfulMessage(errors)

      expect(message).toMatch(/add|create|need/i)
    })

    it('should handle multiple errors gracefully', () => {
      const errors = [
        { field: 'characters', message: 'Need more characters', severity: 'error' as const },
        { field: 'scenes', message: 'Need more scenes', severity: 'error' as const },
        { field: 'concept', message: 'Incomplete concept', severity: 'error' as const }
      ]

      const message = validator.generateHelpfulMessage(errors)

      expect(message.length).toBeGreaterThan(50)
      expect(message).toContain('character')
      expect(message).toContain('scene')
    })
  })

  describe('canProceedWithWarnings', () => {
    it('should allow proceeding with only warnings', () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: ['Consider adding more character details'],
        suggestions: ['Add backstory', 'Add personality traits'],
        canProceed: true
      }

      const canProceed = validator.canProceedWithWarnings(result)

      expect(canProceed).toBe(true)
    })

    it('should not allow proceeding with errors', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [
          { field: 'characters', message: 'Not enough characters', severity: 'error' }
        ],
        warnings: [],
        suggestions: [],
        canProceed: false
      }

      const canProceed = validator.canProceedWithWarnings(result)

      expect(canProceed).toBe(false)
    })

    it('should handle mixed warnings and errors', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [
          { field: 'scenes', message: 'Missing scenes', severity: 'error' }
        ],
        warnings: ['Could add more details'],
        suggestions: [],
        canProceed: false
      }

      const canProceed = validator.canProceedWithWarnings(result)

      expect(canProceed).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty context', () => {
      const context: ProjectContext = {
        characters: [],
        scenes: [],
        concept: {}
      }

      const result = validator.validateStep('initial_concept', context)

      expect(result).toBeDefined()
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle null values in context', () => {
      const context = {
        characters: [],
        scenes: [],
        concept: {
          description: null as any,
          genre: undefined
        }
      }

      const result = validator.validateStep('initial_concept', context)

      expect(result.errors.some(e => e.field.includes('concept'))).toBe(true)
    })

    it('should validate large datasets efficiently', () => {
      const context: ProjectContext = {
        characters: Array.from({ length: 100 }, (_, i) => ({
          id: `${i}`,
          name: `Character ${i}`,
          description: `Description ${i}`
        })),
        scenes: Array.from({ length: 100 }, (_, i) => ({
          id: `${i}`,
          title: `Scene ${i}`,
          description: `Scene description ${i}`
        })),
        concept: {
          description: 'Large project concept',
          genre: 'epic'
        }
      }

      const startTime = Date.now()
      const result = validator.validateStep('production', context)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(1000) // Should complete within 1 second
      expect(result).toBeDefined()
    })

    it('should handle special characters in names', () => {
      const context: ProjectContext = {
        characters: [
          { id: '1', name: "O'Brien <script>", description: 'Test' }
        ],
        scenes: [],
        concept: { description: 'Test', genre: 'test' }
      }

      const result = validator.validateStep('character_development', context)

      expect(result).toBeDefined()
    })
  })

  describe('custom validation rules', () => {
    it('should support custom validation functions', () => {
      const requirements = validator.getRequirementsForStep('character_development')

      if (requirements?.customValidations) {
        expect(requirements.customValidations.length).toBeGreaterThanOrEqual(0)
      }
    })

    it('should provide severity levels for errors', () => {
      const context: ProjectContext = {
        characters: [{ id: '1', name: 'Test', description: 'Short' }],
        scenes: [],
        concept: { description: 'Concept', genre: 'action' }
      }

      const result = validator.validateStep('character_development', context)

      result.errors.forEach(error => {
        expect(['error', 'warning']).toContain(error.severity)
      })
    })
  })
})