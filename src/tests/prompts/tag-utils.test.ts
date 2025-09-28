import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  parseTag,
  extractTagGroups,
  getTagGroupTemplates,
  createTagGroupExecution,
  calculateProgress,
  getNextStep,
  getPreviousStep,
  canMoveNext,
  canMovePrevious,
  extractVariablesFromOutput,
  generateExecutionSummary,
  saveExecutionState,
  loadExecutionState,
  clearExecutionState,
  getActiveExecutions
} from '@/lib/prompts/tag-utils'
import type { PromptTemplate, TagGroupExecution } from '@/types/prompts'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Tag Parsing and Grouping', () => {
  describe('parseTag', () => {
    it('should parse valid tag format correctly', () => {
      const result = parseTag('story-001')

      expect(result).toEqual({
        prefix: 'story',
        order: 1
      })
    })

    it('should parse multi-digit order numbers', () => {
      const result = parseTag('character-123')

      expect(result).toEqual({
        prefix: 'character',
        order: 123
      })
    })

    it('should parse tags with leading zeros', () => {
      const result = parseTag('scene-007')

      expect(result).toEqual({
        prefix: 'scene',
        order: 7
      })
    })

    it('should return null for invalid formats', () => {
      expect(parseTag('invalid')).toBeNull()
      expect(parseTag('no-number-here')).toBeNull()
      expect(parseTag('123-backwards')).toBeNull()
      expect(parseTag('multiple-dash-001')).toBeNull()
      expect(parseTag('')).toBeNull()
    })

    it('should handle edge cases', () => {
      expect(parseTag('a-0')).toEqual({ prefix: 'a', order: 0 })
      expect(parseTag('Z-999')).toEqual({ prefix: 'Z', order: 999 })
      expect(parseTag('mixedCase-042')).toEqual({ prefix: 'mixedCase', order: 42 })
    })
  })

  describe('extractTagGroups', () => {
    const mockTemplates: PromptTemplate[] = [
      {
        id: 'template-1',
        name: 'Story Setup',
        tags: ['story-001', 'meta-tag'],
        template: 'Setup story with {{premise}}',
        variableDefs: [{ name: 'premise', type: 'string', required: true }],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      },
      {
        id: 'template-2',
        name: 'Story Development',
        tags: ['story-002'],
        template: 'Develop story with {{plot}}',
        variableDefs: [{ name: 'plot', type: 'string', required: true }],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      },
      {
        id: 'template-3',
        name: 'Character Intro',
        tags: ['character-001'],
        template: 'Introduce {{character}}',
        variableDefs: [{ name: 'character', type: 'string', required: true }],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      },
      {
        id: 'template-4',
        name: 'Story Conclusion',
        tags: ['story-003'],
        template: 'Conclude with {{ending}}',
        variableDefs: [{ name: 'ending', type: 'string', required: true }],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      }
    ]

    it('should group templates by tag prefix correctly', () => {
      const groups = extractTagGroups(mockTemplates)

      expect(groups).toHaveLength(2) // 'character' and 'story'

      const storyGroup = groups.find(g => g.name === 'story')
      const characterGroup = groups.find(g => g.name === 'character')

      expect(storyGroup).toBeDefined()
      expect(storyGroup!.count).toBe(3) // story-001, story-002, story-003
      expect(storyGroup!.templates).toHaveLength(3)

      expect(characterGroup).toBeDefined()
      expect(characterGroup!.count).toBe(1)
      expect(characterGroup!.templates).toHaveLength(1)
    })

    it('should sort templates within groups by numeric order', () => {
      const groups = extractTagGroups(mockTemplates)
      const storyGroup = groups.find(g => g.name === 'story')

      expect(storyGroup!.templates[0].name).toBe('Story Setup') // story-001
      expect(storyGroup!.templates[1].name).toBe('Story Development') // story-002
      expect(storyGroup!.templates[2].name).toBe('Story Conclusion') // story-003
    })

    it('should handle templates with multiple tags', () => {
      const templatesWithMultipleTags: PromptTemplate[] = [
        {
          id: 'multi-template',
          name: 'Multi-tag Template',
          tags: ['story-001', 'character-001', 'invalid-tag'],
          template: 'Multi-purpose template',
          variableDefs: [],
          app: 'auto-movie',
          stage: 'development',
          model: 'anthropic/claude-sonnet-4'
        }
      ]

      const groups = extractTagGroups(templatesWithMultipleTags)

      expect(groups).toHaveLength(2) // Should appear in both 'story' and 'character'
      expect(groups.find(g => g.name === 'story')?.templates[0].id).toBe('multi-template')
      expect(groups.find(g => g.name === 'character')?.templates[0].id).toBe('multi-template')
    })

    it('should filter out templates without valid tags', () => {
      const templatesWithInvalidTags: PromptTemplate[] = [
        {
          id: 'no-tags',
          name: 'No Tags Template',
          tags: [],
          template: 'No tags',
          variableDefs: [],
          app: 'auto-movie',
          stage: 'development',
          model: 'anthropic/claude-sonnet-4'
        },
        {
          id: 'invalid-tags',
          name: 'Invalid Tags Template',
          tags: ['invalid', 'also-invalid'],
          template: 'Invalid tags',
          variableDefs: [],
          app: 'auto-movie',
          stage: 'development',
          model: 'anthropic/claude-sonnet-4'
        }
      ]

      const groups = extractTagGroups(templatesWithInvalidTags)

      expect(groups).toHaveLength(0)
    })
  })

  describe('getTagGroupTemplates', () => {
    const mockTemplates: PromptTemplate[] = [
      {
        id: 'template-1',
        name: 'Story Start',
        tags: ['story-003'], // Intentionally out of order
        template: 'Start story',
        variableDefs: [],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      },
      {
        id: 'template-2',
        name: 'Story Middle',
        tags: ['story-001'],
        template: 'Middle story',
        variableDefs: [],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      },
      {
        id: 'template-3',
        name: 'Story End',
        tags: ['story-002'],
        template: 'End story',
        variableDefs: [],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      }
    ]

    it('should return templates sorted by order for specific group', () => {
      const storyTemplates = getTagGroupTemplates(mockTemplates, 'story')

      expect(storyTemplates).toHaveLength(3)
      expect(storyTemplates[0].name).toBe('Story Middle') // story-001
      expect(storyTemplates[1].name).toBe('Story End')    // story-002
      expect(storyTemplates[2].name).toBe('Story Start')  // story-003
    })

    it('should return empty array for non-existent group', () => {
      const templates = getTagGroupTemplates(mockTemplates, 'nonexistent')
      expect(templates).toHaveLength(0)
    })

    it('should handle templates without matching tags', () => {
      const templatesWithoutGroup = mockTemplates.filter(t =>
        !t.tags.some(tag => parseTag(tag)?.prefix === 'story')
      )

      const result = getTagGroupTemplates(templatesWithoutGroup, 'story')
      expect(result).toHaveLength(0)
    })
  })
})

describe('Tag Group Execution Management', () => {
  const mockTemplates: PromptTemplate[] = [
    {
      id: 'template-1',
      name: 'Step 1',
      tags: ['workflow-001'],
      template: 'First step: {{input1}}',
      variableDefs: [{ name: 'input1', type: 'string', required: true }],
      app: 'auto-movie',
      stage: 'development',
      model: 'anthropic/claude-sonnet-4'
    },
    {
      id: 'template-2',
      name: 'Step 2',
      tags: ['workflow-002'],
      template: 'Second step: {{input2}}',
      variableDefs: [{ name: 'input2', type: 'string', required: true }],
      app: 'auto-movie',
      stage: 'development',
      model: 'anthropic/claude-sonnet-4'
    }
  ]

  describe('createTagGroupExecution', () => {
    it('should create execution with properly ordered steps', () => {
      const execution = createTagGroupExecution('workflow', mockTemplates, 'project-123')

      expect(execution.groupName).toBe('workflow')
      expect(execution.projectId).toBe('project-123')
      expect(execution.steps).toHaveLength(2)
      expect(execution.currentStepIndex).toBe(0)
      expect(execution.status).toBe('pending')

      // Verify step ordering
      expect(execution.steps[0].templateName).toBe('Step 1')
      expect(execution.steps[0].order).toBe(1)
      expect(execution.steps[1].templateName).toBe('Step 2')
      expect(execution.steps[1].order).toBe(2)

      // Verify step structure
      expect(execution.steps[0]).toMatchObject({
        templateId: 'template-1',
        status: 'pending',
        inputs: {},
        notes: ''
      })
    })

    it('should generate unique execution and step IDs', () => {
      const execution1 = createTagGroupExecution('test', mockTemplates)
      const execution2 = createTagGroupExecution('test', mockTemplates)

      expect(execution1.id).not.toBe(execution2.id)
      expect(execution1.steps[0].id).not.toBe(execution2.steps[0].id)
    })
  })

  describe('calculateProgress', () => {
    let execution: TagGroupExecution

    beforeEach(() => {
      execution = createTagGroupExecution('test', mockTemplates)
    })

    it('should calculate progress for pending execution', () => {
      const progress = calculateProgress(execution)

      expect(progress).toEqual({
        groupExecutionId: execution.id,
        currentStep: 1,
        totalSteps: 2,
        completedSteps: 0,
        skippedSteps: 0,
        failedSteps: 0
      })
    })

    it('should calculate progress with mixed step statuses', () => {
      execution.steps[0].status = 'completed'
      execution.steps[1].status = 'failed'
      execution.currentStepIndex = 1

      const progress = calculateProgress(execution)

      expect(progress).toEqual({
        groupExecutionId: execution.id,
        currentStep: 2,
        totalSteps: 2,
        completedSteps: 1,
        skippedSteps: 0,
        failedSteps: 1
      })
    })
  })

  describe('navigation functions', () => {
    let execution: TagGroupExecution

    beforeEach(() => {
      execution = createTagGroupExecution('test', mockTemplates)
    })

    describe('getNextStep and getPreviousStep', () => {
      it('should get next step correctly', () => {
        const nextStep = getNextStep(execution)

        expect(nextStep).toBeDefined()
        expect(nextStep!.templateName).toBe('Step 2')
      })

      it('should return null when at last step', () => {
        execution.currentStepIndex = 1 // Last step

        const nextStep = getNextStep(execution)

        expect(nextStep).toBeNull()
      })

      it('should get previous step correctly', () => {
        execution.currentStepIndex = 1

        const previousStep = getPreviousStep(execution)

        expect(previousStep).toBeDefined()
        expect(previousStep!.templateName).toBe('Step 1')
      })

      it('should return null when at first step', () => {
        const previousStep = getPreviousStep(execution)

        expect(previousStep).toBeNull()
      })
    })

    describe('canMoveNext and canMovePrevious', () => {
      it('should not allow next when current step is not completed', () => {
        expect(canMoveNext(execution)).toBe(false)
      })

      it('should allow next when current step is completed', () => {
        execution.steps[0].status = 'completed'

        expect(canMoveNext(execution)).toBe(true)
      })

      it('should allow next when current step is skipped', () => {
        execution.steps[0].status = 'skipped'

        expect(canMoveNext(execution)).toBe(true)
      })

      it('should not allow next when at last step', () => {
        execution.currentStepIndex = 1
        execution.steps[1].status = 'completed'

        expect(canMoveNext(execution)).toBe(false)
      })

      it('should allow previous when not at first step', () => {
        execution.currentStepIndex = 1

        expect(canMovePrevious(execution)).toBe(true)
      })

      it('should not allow previous when at first step', () => {
        expect(canMovePrevious(execution)).toBe(false)
      })
    })
  })
})

describe('Variable Extraction and Carry-over', () => {
  describe('extractVariablesFromOutput', () => {
    it('should extract variables from JSON output', () => {
      const jsonOutput = JSON.stringify({
        character: 'Alice',
        setting: 'Wonderland',
        mood: 'curious'
      })

      const variables = extractVariablesFromOutput(jsonOutput)

      expect(variables).toEqual({
        character: 'Alice',
        setting: 'Wonderland',
        mood: 'curious'
      })
    })

    it('should extract variables from key-value text patterns', () => {
      const textOutput = `
        character: "Alice"
        setting = 'Wonderland'
        mood: curious
        count = 42
      `

      const variables = extractVariablesFromOutput(textOutput)

      expect(variables.character).toBe('Alice')
      expect(variables.setting).toBe('Wonderland')
      expect(variables.mood).toBe('curious')
      expect(variables.count).toBe('42')
    })

    it('should handle mixed format outputs', () => {
      const mixedOutput = `
        Some narrative text here...

        character: "Bob"
        location = "Forest"

        More text content...

        items: sword, shield, potion
      `

      const variables = extractVariablesFromOutput(mixedOutput)

      expect(variables.character).toBe('Bob')
      expect(variables.location).toBe('Forest')
      expect(variables.items).toBe('sword, shield, potion')
    })

    it('should return empty object for plain text without patterns', () => {
      const plainText = 'This is just a plain text response without any structured data.'

      const variables = extractVariablesFromOutput(plainText)

      expect(variables).toEqual({})
    })

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{ "character": "Alice", "incomplete": '

      const variables = extractVariablesFromOutput(malformedJson)

      // Should not throw and should attempt pattern extraction
      expect(typeof variables).toBe('object')
    })
  })
})

describe('Execution Summary and Reporting', () => {
  let execution: TagGroupExecution

  beforeEach(() => {
    const templates: PromptTemplate[] = [
      {
        id: 'template-1',
        name: 'First Step',
        tags: ['test-001'],
        template: 'First step',
        variableDefs: [],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      },
      {
        id: 'template-2',
        name: 'Second Step',
        tags: ['test-002'],
        template: 'Second step',
        variableDefs: [],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      }
    ]

    execution = createTagGroupExecution('test', templates)
  })

  describe('generateExecutionSummary', () => {
    it('should generate summary for pending execution', () => {
      const summary = generateExecutionSummary(execution)

      expect(summary.summary).toContain("Tag Group 'test' execution completed")
      expect(summary.summary).toContain('0/2 steps successful')
      expect(summary.summary).toContain('0.0% success rate')

      expect(summary.statistics).toEqual({
        total: 2,
        completed: 0,
        skipped: 0,
        failed: 0,
        successRate: 0,
        totalExecutionTime: 0
      })

      expect(summary.results).toHaveLength(2)
      expect(summary.results[0].stepName).toBe('First Step')
      expect(summary.results[0].status).toBe('pending')
      expect(summary.results[0].hasOutput).toBe(false)
    })

    it('should generate summary for completed execution with timing', () => {
      // Mark steps as completed with execution data
      execution.steps[0].status = 'completed'
      execution.steps[0].execution = {
        id: 'exec-1',
        executionTime: 1500,
        outputRaw: 'First output',
        status: 'success',
        startedAt: '2024-01-01T00:00:00.000Z',
        finishedAt: '2024-01-01T00:01:30.000Z'
      } as any

      execution.steps[1].status = 'completed'
      execution.steps[1].execution = {
        id: 'exec-2',
        executionTime: 2500,
        outputRaw: 'Second output',
        status: 'success',
        startedAt: '2024-01-01T00:01:30.000Z',
        finishedAt: '2024-01-01T00:04:00.000Z'
      } as any

      const summary = generateExecutionSummary(execution)

      expect(summary.summary).toContain('2/2 steps successful')
      expect(summary.summary).toContain('100.0% success rate')
      expect(summary.summary).toContain('4.00s') // Total execution time

      expect(summary.statistics.successRate).toBe(100)
      expect(summary.statistics.totalExecutionTime).toBe(4000)

      expect(summary.results[0].hasOutput).toBe(true)
      expect(summary.results[1].hasOutput).toBe(true)
    })

    it('should handle mixed execution results', () => {
      execution.steps[0].status = 'completed'
      execution.steps[0].execution = {
        id: 'exec-1',
        executionTime: 1000,
        outputRaw: 'Success',
        status: 'success'
      } as any

      execution.steps[1].status = 'failed'
      execution.steps[1].execution = {
        id: 'exec-2',
        executionTime: 500,
        errorMessage: 'Failed execution',
        status: 'error'
      } as any

      const summary = generateExecutionSummary(execution)

      expect(summary.statistics.completed).toBe(1)
      expect(summary.statistics.failed).toBe(1)
      expect(summary.statistics.successRate).toBe(50)
      expect(summary.statistics.totalExecutionTime).toBe(1500)
    })
  })
})

describe('Local Storage Management', () => {
  let execution: TagGroupExecution

  beforeEach(() => {
    localStorageMock.clear()
    execution = createTagGroupExecution('test', [])
    execution.id = 'test-execution-123'
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('saveExecutionState', () => {
    it('should save execution state to localStorage', () => {
      saveExecutionState(execution)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'taggroup-execution-test-execution-123',
        JSON.stringify(execution)
      )

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'taggroup-active-executions',
        JSON.stringify(['test-execution-123'])
      )
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded')
      })

      // Should not throw
      expect(() => saveExecutionState(execution)).not.toThrow()
    })
  })

  describe('loadExecutionState', () => {
    it('should load execution state from localStorage', () => {
      const serialized = JSON.stringify(execution)
      localStorageMock.getItem.mockReturnValue(serialized)

      const loaded = loadExecutionState('test-execution-123')

      expect(loaded).toEqual(execution)
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'taggroup-execution-test-execution-123'
      )
    })

    it('should return null for non-existent execution', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const loaded = loadExecutionState('non-existent')

      expect(loaded).toBeNull()
    })

    it('should handle corrupted data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('corrupted json{')

      const loaded = loadExecutionState('corrupted')

      expect(loaded).toBeNull()
    })
  })

  describe('getActiveExecutions', () => {
    it('should return list of active execution IDs', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(['exec-1', 'exec-2', 'exec-3'])
      )

      const active = getActiveExecutions()

      expect(active).toEqual(['exec-1', 'exec-2', 'exec-3'])
    })

    it('should return empty array when no active executions', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const active = getActiveExecutions()

      expect(active).toEqual([])
    })
  })

  describe('clearExecutionState', () => {
    it('should remove execution from storage and active list', () => {
      // Setup active executions
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(['exec-1', 'test-execution-123', 'exec-3'])
      )

      clearExecutionState('test-execution-123')

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'taggroup-execution-test-execution-123'
      )

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'taggroup-active-executions',
        JSON.stringify(['exec-1', 'exec-3'])
      )
    })

    it('should handle storage errors when clearing', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })

      expect(() => clearExecutionState('test-execution-123')).not.toThrow()
    })
  })
})

describe('Edge Cases and Performance', () => {
  describe('tag parsing performance', () => {
    it('should handle large numbers of templates efficiently', () => {
      const largeTemplateSet: PromptTemplate[] = Array(1000).fill(null).map((_, i) => ({
        id: `template-${i}`,
        name: `Template ${i}`,
        tags: [`group${i % 10}-${String(i).padStart(3, '0')}`],
        template: `Template ${i} content`,
        variableDefs: [],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      }))

      const startTime = performance.now()
      const groups = extractTagGroups(largeTemplateSet)
      const duration = performance.now() - startTime

      expect(groups).toHaveLength(10) // 10 different prefixes
      expect(duration).toBeLessThan(100) // Should complete quickly
      expect(groups.every(g => g.templates.length === 100)).toBe(true)
    })
  })

  describe('variable extraction edge cases', () => {
    it('should handle extremely large outputs', () => {
      const largeOutput = 'result: ' + 'A'.repeat(100000) // 100KB output

      const startTime = performance.now()
      const variables = extractVariablesFromOutput(largeOutput)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(100) // Should process quickly
      expect(variables.result).toBe('A'.repeat(100000))
    })

    it('should handle outputs with many variable patterns', () => {
      const outputWithManyVars = Array(100).fill(null)
        .map((_, i) => `var${i}: value${i}`)
        .join('\n')

      const variables = extractVariablesFromOutput(outputWithManyVars)

      expect(Object.keys(variables)).toHaveLength(100)
      expect(variables.var0).toBe('value0')
      expect(variables.var99).toBe('value99')
    })
  })

  describe('execution state management stress tests', () => {
    it('should handle many concurrent save operations', () => {
      const executions = Array(50).fill(null).map((_, i) => {
        const exec = createTagGroupExecution('test', [])
        exec.id = `concurrent-exec-${i}`
        return exec
      })

      const startTime = performance.now()

      // Save all executions
      executions.forEach(exec => saveExecutionState(exec))

      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(500) // Should complete within 500ms
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(100) // 50 executions + 50 active lists
    })

    it('should maintain data consistency during rapid updates', () => {
      const execution = createTagGroupExecution('test', [])
      execution.id = 'consistency-test'

      // Simulate rapid state changes
      for (let i = 0; i < 10; i++) {
        execution.notes = `Update ${i}`
        saveExecutionState(execution)
      }

      const loaded = loadExecutionState('consistency-test')

      expect(loaded).toBeDefined()
      expect(loaded!.notes).toBe('Update 9')
    })
  })
})

describe('Integration with Real Data Scenarios', () => {
  it('should handle realistic movie production workflow', () => {
    const movieWorkflowTemplates: PromptTemplate[] = [
      {
        id: 'concept-1',
        name: 'Concept Development',
        tags: ['preproduction-001'],
        template: 'Develop concept for {{genre}} movie with {{theme}}',
        variableDefs: [
          { name: 'genre', type: 'string', required: true },
          { name: 'theme', type: 'string', required: true }
        ],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      },
      {
        id: 'script-1',
        name: 'Script Outline',
        tags: ['preproduction-002'],
        template: 'Create script outline based on {{concept}}',
        variableDefs: [
          { name: 'concept', type: 'text', required: true }
        ],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      },
      {
        id: 'character-1',
        name: 'Character Design',
        tags: ['preproduction-003'],
        template: 'Design characters for {{story}} with {{style}}',
        variableDefs: [
          { name: 'story', type: 'text', required: true },
          { name: 'style', type: 'string', required: true }
        ],
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      }
    ]

    const execution = createTagGroupExecution('preproduction', movieWorkflowTemplates, 'movie-project-1')

    expect(execution.steps).toHaveLength(3)
    expect(execution.steps[0].templateName).toBe('Concept Development')
    expect(execution.steps[1].templateName).toBe('Script Outline')
    expect(execution.steps[2].templateName).toBe('Character Design')

    // Test variable carry-over scenario
    execution.steps[0].status = 'completed'
    execution.steps[0].execution = {
      id: 'exec-1',
      outputRaw: '{"concept": "A sci-fi thriller about AI consciousness", "tone": "dark"}',
      status: 'success',
      executionTime: 2000
    } as any

    const availableVars = extractVariablesFromOutput(execution.steps[0].execution.outputRaw)

    expect(availableVars.concept).toBeDefined()
    expect(availableVars.tone).toBeDefined()

    // Verify the concept can be used in step 2
    execution.steps[1].inputs = { concept: availableVars.concept }

    expect(execution.steps[1].inputs.concept).toContain('sci-fi thriller')
  })

  it('should handle complex tag group hierarchies', () => {
    const complexTemplates: PromptTemplate[] = [
      // Main story arc
      { id: '1', name: 'Story Act 1', tags: ['mainStory-001'], template: 'Act 1', variableDefs: [], app: 'auto-movie', stage: 'development', model: 'anthropic/claude-sonnet-4' },
      { id: '2', name: 'Story Act 2', tags: ['mainStory-002'], template: 'Act 2', variableDefs: [], app: 'auto-movie', stage: 'development', model: 'anthropic/claude-sonnet-4' },
      { id: '3', name: 'Story Act 3', tags: ['mainStory-003'], template: 'Act 3', variableDefs: [], app: 'auto-movie', stage: 'development', model: 'anthropic/claude-sonnet-4' },

      // Character development
      { id: '4', name: 'Protagonist', tags: ['character-001'], template: 'Protagonist', variableDefs: [], app: 'auto-movie', stage: 'development', model: 'anthropic/claude-sonnet-4' },
      { id: '5', name: 'Antagonist', tags: ['character-002'], template: 'Antagonist', variableDefs: [], app: 'auto-movie', stage: 'development', model: 'anthropic/claude-sonnet-4' },
      { id: '6', name: 'Supporting Cast', tags: ['character-003'], template: 'Supporting', variableDefs: [], app: 'auto-movie', stage: 'development', model: 'anthropic/claude-sonnet-4' },

      // Visual design
      { id: '7', name: 'Environment Design', tags: ['visual-001'], template: 'Environment', variableDefs: [], app: 'auto-movie', stage: 'development', model: 'fal-ai/nano-banana' },
      { id: '8', name: 'Character Appearance', tags: ['visual-002'], template: 'Appearance', variableDefs: [], app: 'auto-movie', stage: 'development', model: 'fal-ai/nano-banana' }
    ]

    const groups = extractTagGroups(complexTemplates)

    expect(groups).toHaveLength(3)

    const mainStoryGroup = groups.find(g => g.name === 'mainStory')
    const characterGroup = groups.find(g => g.name === 'character')
    const visualGroup = groups.find(g => g.name === 'visual')

    expect(mainStoryGroup?.count).toBe(3)
    expect(characterGroup?.count).toBe(3)
    expect(visualGroup?.count).toBe(2)

    // Verify ordering within groups
    expect(mainStoryGroup?.templates[0].name).toBe('Story Act 1')
    expect(mainStoryGroup?.templates[2].name).toBe('Story Act 3')
  })
})