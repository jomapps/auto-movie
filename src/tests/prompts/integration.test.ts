import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { createExecutionEngine } from '@/lib/prompts/engine'
import {
  createTagGroupExecution,
  extractTagGroups,
  extractVariablesFromOutput
} from '@/lib/prompts/tag-utils'
import type {
  PromptTemplate,
  PromptExecution
} from '@/types/prompts'
import type {
  ExecutionConfig,
  VariableContext,
  ModelType
} from '@/lib/prompts/types'
import {
  mockPromptTemplates,
  mockVariableContexts,
  TestUtils,
  performanceTestData
} from '../setup/test-fixtures'

describe('End-to-End Prompt Management Integration', () => {
  let engine: ReturnType<typeof createExecutionEngine>
  let mockConfig: ExecutionConfig

  beforeEach(() => {
    mockConfig = {
      apiKeys: {
        openrouter: 'integration-test-openrouter-key',
        fal: 'integration-test-fal-key'
      },
      mockMode: true, // Use mock mode for consistent testing
      timeout: 10000,
      retryAttempts: 2,
      logLevel: 'info'
    }

    engine = createExecutionEngine(mockConfig)
    engine.setMockMode(true)
  })

  describe('Complete Workflow: Template Creation → Execution → Results', () => {
    it('should handle complete story generation workflow', async () => {
      // Step 1: Setup tag group templates
      const storyTemplates: PromptTemplate[] = [
        {
          id: 'concept-template',
          name: 'Story Concept',
          app: 'auto-movie',
          stage: 'development',
          feature: 'story-generation',
          tags: ['storyflow-001'],
          template: `Create a story concept about {{character}} in {{setting}}.

Genre: {{genre}}
Target length: {{wordCount}} words
Themes: {{themes}}

Generate a compelling concept that includes:
- Logline
- Character motivation
- Central conflict
- Key themes`,
          variableDefs: [
            { name: 'character', type: 'string', required: true },
            { name: 'setting', type: 'string', required: true },
            { name: 'genre', type: 'string', required: true },
            { name: 'wordCount', type: 'number', required: false, defaultValue: 1000 },
            { name: 'themes', type: 'array', required: false, defaultValue: [] }
          ],
          model: 'anthropic/claude-sonnet-4',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'outline-template',
          name: 'Story Outline',
          app: 'auto-movie',
          stage: 'development',
          feature: 'story-generation',
          tags: ['storyflow-002'],
          template: `Based on the concept: {{concept}}

Create a detailed story outline with:
- Three-act structure
- Scene breakdown
- Character arcs
- Plot progression

Setting: {{setting}}
Genre: {{genre}}`,
          variableDefs: [
            { name: 'concept', type: 'text', required: true },
            { name: 'setting', type: 'string', required: true },
            { name: 'genre', type: 'string', required: true }
          ],
          model: 'anthropic/claude-sonnet-4',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'character-image-template',
          name: 'Character Visualization',
          app: 'auto-movie',
          stage: 'development',
          feature: 'character-design',
          tags: ['storyflow-003'],
          template: `Generate a character image for: {{character}}

Story context: {{storyContext}}
Visual style: {{visualStyle}}
Character description: {{characterDescription}}`,
          variableDefs: [
            { name: 'character', type: 'string', required: true },
            { name: 'storyContext', type: 'text', required: true },
            { name: 'visualStyle', type: 'string', required: false, defaultValue: 'realistic' },
            { name: 'characterDescription', type: 'text', required: false }
          ],
          model: 'fal-ai/nano-banana',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      // Step 2: Extract tag groups
      const tagGroups = extractTagGroups(storyTemplates)
      expect(tagGroups).toHaveLength(1)
      expect(tagGroups[0].name).toBe('storyflow')
      expect(tagGroups[0].templates).toHaveLength(3)

      // Step 3: Create tag group execution
      const execution = createTagGroupExecution('storyflow', storyTemplates, 'movie-project-1')
      expect(execution.steps).toHaveLength(3)
      expect(execution.status).toBe('pending')

      // Step 4: Execute first step (concept generation)
      const conceptContext: VariableContext = {
        variables: {
          character: 'Maya Chen',
          setting: 'Neo-Tokyo 2087',
          genre: 'sci-fi',
          wordCount: 2000,
          themes: ['technology', 'responsibility', 'time']
        },
        variableDefs: storyTemplates[0].variableDefs
      }

      const conceptResult = await engine.execute(
        storyTemplates[0].template,
        conceptContext,
        'anthropic/claude-sonnet-4'
      )

      expect(conceptResult.status).toBe('success')
      expect(conceptResult.output).toContain('Character Analysis')

      // Step 5: Extract variables from first step output
      const extractedVars = extractVariablesFromOutput(conceptResult.output)
      expect(typeof extractedVars).toBe('object')

      // Step 6: Execute second step with carry-over variables
      const outlineContext: VariableContext = {
        variables: {
          concept: conceptResult.output,
          setting: 'Neo-Tokyo 2087',
          genre: 'sci-fi',
          ...extractedVars // Carry-over variables
        },
        variableDefs: storyTemplates[1].variableDefs
      }

      const outlineResult = await engine.execute(
        storyTemplates[1].template,
        outlineContext,
        'anthropic/claude-sonnet-4'
      )

      expect(outlineResult.status).toBe('success')

      // Step 7: Execute third step (image generation)
      const imageContext: VariableContext = {
        variables: {
          character: 'Maya Chen',
          storyContext: conceptResult.output,
          visualStyle: 'cyberpunk',
          characterDescription: 'Young inventor with determination'
        },
        variableDefs: storyTemplates[2].variableDefs
      }

      const imageResult = await engine.execute(
        storyTemplates[2].template,
        imageContext,
        'fal-ai/nano-banana'
      )

      expect(imageResult.status).toBe('success')
      expect(imageResult.output).toHaveProperty('images')
      expect(imageResult.output.images[0]).toHaveProperty('url')

      // Verify complete workflow
      expect(conceptResult.executionTime).toBeGreaterThan(0)
      expect(outlineResult.executionTime).toBeGreaterThan(0)
      expect(imageResult.executionTime).toBeGreaterThan(0)
    })
  })

  describe('Cross-Provider Variable Flow', () => {
    it('should maintain variable consistency across text and image providers', async () => {
      const textTemplate = 'Describe character: {{character}} in setting: {{setting}}'
      const imageTemplate = 'Visualize character: {{character}} in environment: {{setting}}'

      const sharedContext: VariableContext = {
        variables: {
          character: 'Zara the Explorer',
          setting: 'Ancient Mayan Temple'
        },
        variableDefs: [
          { name: 'character', type: 'string', required: true },
          { name: 'setting', type: 'string', required: true }
        ]
      }

      // Execute text generation
      const textResult = await engine.execute(
        textTemplate,
        sharedContext,
        'anthropic/claude-sonnet-4'
      )

      // Execute image generation with same variables
      const imageResult = await engine.execute(
        imageTemplate,
        sharedContext,
        'fal-ai/nano-banana'
      )

      expect(textResult.status).toBe('success')
      expect(imageResult.status).toBe('success')

      // Both should reference the same character and setting
      expect(textResult.output).toContain('Zara the Explorer')
      expect(imageResult.output.prompt).toContain('Zara the Explorer')
    })
  })

  describe('Database Integration Simulation', () => {
    it('should simulate complete database workflow', async () => {
      // Simulate template storage
      const template = mockPromptTemplates[0]
      const templateData = {
        id: template.id,
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Simulate execution
      const context: VariableContext = {
        variables: TestUtils.generateMockVariables(template.variableDefs),
        variableDefs: template.variableDefs
      }

      const result = await engine.execute(
        template.template,
        context,
        template.model
      )

      // Simulate execution record creation
      const executionRecord: PromptExecution = {
        id: `exec-${Date.now()}`,
        templateId: template.id,
        app: template.app,
        stage: template.stage,
        feature: template.feature || 'default',
        projectId: 'integration-test-project',
        tagsSnapshot: template.tags,
        inputs: context.variables,
        resolvedPrompt: 'Resolved template content...',
        model: template.model,
        status: result.status,
        outputRaw: result.output,
        errorMessage: result.errorMessage,
        executionTime: result.executionTime,
        providerUsed: result.providerUsed,
        metrics: result.metrics,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Verify execution record structure
      expect(executionRecord.templateId).toBe(template.id)
      expect(executionRecord.status).toBe('success')
      expect(executionRecord.inputs).toEqual(context.variables)
      expect(executionRecord.providerUsed).toBe('mock')
    })
  })

  describe('Complex Tag Group Scenarios', () => {
    it('should handle overlapping tag groups correctly', () => {
      const overlappingTemplates: PromptTemplate[] = [
        TestUtils.createMockTemplate({
          id: 'multi-1',
          name: 'Multi-Group Template 1',
          tags: ['story-001', 'character-001'] // Belongs to two groups
        }),
        TestUtils.createMockTemplate({
          id: 'story-2',
          name: 'Story Only Template',
          tags: ['story-002']
        }),
        TestUtils.createMockTemplate({
          id: 'character-2',
          name: 'Character Only Template',
          tags: ['character-002']
        })
      ]

      const groups = extractTagGroups(overlappingTemplates)

      expect(groups).toHaveLength(2) // 'story' and 'character'

      const storyGroup = groups.find(g => g.name === 'story')
      const characterGroup = groups.find(g => g.name === 'character')

      // Multi-group template should appear in both
      expect(storyGroup!.templates.some(t => t.id === 'multi-1')).toBe(true)
      expect(characterGroup!.templates.some(t => t.id === 'multi-1')).toBe(true)

      // But each group should maintain proper ordering
      expect(storyGroup!.templates[0].name).toBe('Multi-Group Template 1') // story-001
      expect(storyGroup!.templates[1].name).toBe('Story Only Template')     // story-002
    })

    it('should handle tag group execution with dependencies', async () => {
      const dependentTemplates: PromptTemplate[] = [
        {
          id: 'base-template',
          name: 'Base Information',
          app: 'auto-movie',
          stage: 'development',
          feature: 'workflow',
          tags: ['workflow-001'],
          template: 'Generate base information about {{topic}}',
          variableDefs: [
            { name: 'topic', type: 'string', required: true }
          ],
          model: 'anthropic/claude-sonnet-4',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'dependent-template',
          name: 'Dependent Processing',
          app: 'auto-movie',
          stage: 'development',
          feature: 'workflow',
          tags: ['workflow-002'],
          template: 'Based on: {{baseInfo}}, create detailed analysis of {{aspect}}',
          variableDefs: [
            { name: 'baseInfo', type: 'text', required: true },
            { name: 'aspect', type: 'string', required: true }
          ],
          model: 'anthropic/claude-sonnet-4',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      const execution = createTagGroupExecution('workflow', dependentTemplates, 'test-project')

      // Execute first step
      const step1Context: VariableContext = {
        variables: { topic: 'artificial intelligence' },
        variableDefs: dependentTemplates[0].variableDefs
      }

      const step1Result = await engine.execute(
        dependentTemplates[0].template,
        step1Context,
        'anthropic/claude-sonnet-4'
      )

      expect(step1Result.status).toBe('success')

      // Extract variables for next step
      const carryOverVars = extractVariablesFromOutput(step1Result.output)

      // Execute second step with dependency
      const step2Context: VariableContext = {
        variables: {
          baseInfo: step1Result.output,
          aspect: 'ethical implications',
          ...carryOverVars
        },
        variableDefs: dependentTemplates[1].variableDefs
      }

      const step2Result = await engine.execute(
        dependentTemplates[1].template,
        step2Context,
        'anthropic/claude-sonnet-4'
      )

      expect(step2Result.status).toBe('success')
      expect(step2Result.output).toContain('artificial intelligence') // Should reference base info
    })
  })

  describe('Multi-Modal Content Generation', () => {
    it('should generate both text and images in sequence', async () => {
      const multiModalTemplates: PromptTemplate[] = [
        {
          id: 'scene-description',
          name: 'Scene Description',
          app: 'auto-movie',
          stage: 'production',
          feature: 'scene-generation',
          tags: ['scene-001'],
          template: `Describe a {{scenery}} scene with {{characters}} characters.

Mood: {{mood}}
Time of day: {{timeOfDay}}
Weather: {{weather}}

Create a vivid, detailed description suitable for visualization.`,
          variableDefs: [
            { name: 'scenery', type: 'string', required: true },
            { name: 'characters', type: 'number', required: true },
            { name: 'mood', type: 'string', required: false, defaultValue: 'neutral' },
            { name: 'timeOfDay', type: 'string', required: false, defaultValue: 'day' },
            { name: 'weather', type: 'string', required: false, defaultValue: 'clear' }
          ],
          model: 'anthropic/claude-sonnet-4',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'scene-image',
          name: 'Scene Visualization',
          app: 'auto-movie',
          stage: 'production',
          feature: 'scene-generation',
          tags: ['scene-002'],
          template: `{{sceneDescription}}

Style: photorealistic, cinematic lighting
Quality: high detail, 4K resolution`,
          variableDefs: [
            { name: 'sceneDescription', type: 'text', required: true }
          ],
          model: 'fal-ai/nano-banana',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      const execution = createTagGroupExecution('scene', multiModalTemplates)

      // Step 1: Generate scene description (text)
      const descriptionContext: VariableContext = {
        variables: {
          scenery: 'mystical forest',
          characters: 2,
          mood: 'mysterious',
          timeOfDay: 'twilight',
          weather: 'misty'
        },
        variableDefs: multiModalTemplates[0].variableDefs
      }

      const descriptionResult = await engine.execute(
        multiModalTemplates[0].template,
        descriptionContext,
        'anthropic/claude-sonnet-4'
      )

      expect(descriptionResult.status).toBe('success')
      expect(descriptionResult.providerUsed).toBe('mock')

      // Step 2: Generate scene image using description
      const imageContext: VariableContext = {
        variables: {
          sceneDescription: descriptionResult.output
        },
        variableDefs: multiModalTemplates[1].variableDefs
      }

      const imageResult = await engine.execute(
        multiModalTemplates[1].template,
        imageContext,
        'fal-ai/nano-banana'
      )

      expect(imageResult.status).toBe('success')
      expect(imageResult.output).toHaveProperty('images')
      expect(imageResult.output.images[0]).toHaveProperty('url')

      // Verify cross-modal data flow
      expect(imageResult.output.prompt).toContain('mystical forest')
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle partial workflow failures gracefully', async () => {
      const execution = createTagGroupExecution('test', mockPromptTemplates.slice(0, 3))

      // Simulate first step success
      const step1Context = {
        variables: TestUtils.generateMockVariables(mockPromptTemplates[0].variableDefs),
        variableDefs: mockPromptTemplates[0].variableDefs
      }

      const step1Result = await engine.execute(
        mockPromptTemplates[0].template,
        step1Context,
        mockPromptTemplates[0].model
      )

      expect(step1Result.status).toBe('success')

      // Simulate second step failure
      engine.setMockMode(false) // Disable mock to trigger error

      const step2Context = {
        variables: TestUtils.generateMockVariables(mockPromptTemplates[1].variableDefs),
        variableDefs: mockPromptTemplates[1].variableDefs
      }

      const step2Result = await engine.execute(
        mockPromptTemplates[1].template,
        step2Context,
        mockPromptTemplates[1].model
      )

      expect(step2Result.status).toBe('error')

      // Re-enable mock mode for third step
      engine.setMockMode(true)

      const step3Context = {
        variables: TestUtils.generateMockVariables(mockPromptTemplates[2].variableDefs),
        variableDefs: mockPromptTemplates[2].variableDefs
      }

      const step3Result = await engine.execute(
        mockPromptTemplates[2].template,
        step3Context,
        mockPromptTemplates[2].model
      )

      expect(step3Result.status).toBe('success')

      // Workflow should be partially successful
      const results = [step1Result, step2Result, step3Result]
      const successfulSteps = results.filter(r => r.status === 'success')
      const failedSteps = results.filter(r => r.status === 'error')

      expect(successfulSteps).toHaveLength(2)
      expect(failedSteps).toHaveLength(1)
    })

    it('should recover from temporary provider failures', async () => {
      const template = 'Test recovery: {{input}}'
      const context: VariableContext = {
        variables: { input: 'test value' },
        variableDefs: [{ name: 'input', type: 'string', required: true }]
      }

      // First execution should succeed (mock mode)
      const result1 = await engine.execute(template, context, 'anthropic/claude-sonnet-4')
      expect(result1.status).toBe('success')

      // Temporarily disable mock mode to simulate failure
      engine.setMockMode(false)
      const result2 = await engine.execute(template, context, 'anthropic/claude-sonnet-4')
      expect(result2.status).toBe('error')

      // Re-enable mock mode to simulate recovery
      engine.setMockMode(true)
      const result3 = await engine.execute(template, context, 'anthropic/claude-sonnet-4')
      expect(result3.status).toBe('success')

      // System should recover gracefully
      expect(result3.providerUsed).toBe('mock')
    })
  })

  describe('Performance Integration Tests', () => {
    it('should handle high-throughput execution scenarios', async () => {
      const batchTemplates = Array(20).fill(null).map((_, i) =>
        TestUtils.createMockTemplate({
          id: `batch-${i}`,
          name: `Batch Template ${i}`,
          template: `Process item ${i}: {{input}}`,
          variableDefs: [{ name: 'input', type: 'string', required: true }]
        })
      )

      const startTime = performance.now()

      // Execute all templates concurrently
      const executions = await Promise.all(
        batchTemplates.map(template => {
          const context: VariableContext = {
            variables: { input: `data-${template.name}` },
            variableDefs: template.variableDefs
          }
          return engine.execute(template.template, context, template.model)
        })
      )

      const totalTime = performance.now() - startTime

      expect(executions).toHaveLength(20)
      expect(executions.every(r => r.status === 'success')).toBe(true)
      expect(totalTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle memory-intensive variable contexts', async () => {
      const memoryIntensiveContext: VariableContext = {
        variables: {
          largeData: performanceTestData.largeTemplate,
          complexObject: Object.fromEntries(
            Array(1000).fill(null).map((_, i) => [`key${i}`, `value${i}`])
          ),
          arrayData: Array(1000).fill(null).map((_, i) => `item${i}`)
        },
        variableDefs: [
          { name: 'largeData', type: 'text', required: true },
          { name: 'complexObject', type: 'object', required: true },
          { name: 'arrayData', type: 'array', required: true }
        ]
      }

      const template = 'Process large data: {{largeData}}\nObject: {{complexObject}}\nArray: {{arrayData}}'

      const startTime = performance.now()
      const result = await engine.execute(template, memoryIntensiveContext, 'anthropic/claude-sonnet-4')
      const duration = performance.now() - startTime

      expect(result.status).toBe('success')
      expect(duration).toBeLessThan(2000) // Should handle large data efficiently
    })
  })

  describe('System Limits and Boundaries', () => {
    it('should handle maximum variable count', async () => {
      const maxVariables = performanceTestData.complexVariableContext

      const template = Object.keys(maxVariables.variables)
        .map(key => `{{${key}}}`)
        .join(' ')

      const result = await engine.execute(template, maxVariables, 'anthropic/claude-sonnet-4')

      expect(result.status).toBe('success')
      expect(result.output).toBeDefined()
    })

    it('should enforce execution timeouts', async () => {
      // Create engine with very short timeout
      const fastTimeoutConfig: ExecutionConfig = {
        ...mockConfig,
        timeout: 1, // 1ms timeout
        mockMode: false // Use real providers to test timeout
      }

      const timeoutEngine = createExecutionEngine(fastTimeoutConfig)

      const result = await timeoutEngine.execute(
        'Test timeout',
        { variables: {}, variableDefs: [] },
        'anthropic/claude-sonnet-4'
      )

      // Should fail due to timeout or provider unavailability
      expect(result.status).toBe('error')
    })

    it('should handle extremely nested JSON variables', () => {
      const nestedObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  data: 'deeply nested value',
                  array: [1, 2, 3, { nested: 'in array' }]
                }
              }
            }
          }
        }
      }

      const context: VariableContext = {
        variables: { nested: nestedObject },
        variableDefs: [{ name: 'nested', type: 'json', required: true }]
      }

      const interpolator = new (require('@/lib/prompts/engine').VariableInterpolator)()
      const result = interpolator.interpolate('Data: {{nested}}', context)

      expect(result.status).not.toBe('error')
      expect(result.resolvedPrompt).toContain('deeply nested value')
    })
  })
})

describe('Real-world Integration Scenarios', () => {
  let engine: ReturnType<typeof createExecutionEngine>

  beforeEach(() => {
    engine = createExecutionEngine({
      apiKeys: {
        openrouter: 'test-key',
        fal: 'test-key'
      },
      mockMode: true
    })
  })

  it('should simulate complete movie pre-production workflow', async () => {
    const preproductionWorkflow = [
      {
        name: 'Concept Development',
        template: `Develop a movie concept for {{genre}} genre.

Premise: {{premise}}
Target audience: {{audience}}
Budget range: {{budget}}

Create a compelling pitch including:
- Logline
- Synopsis
- Target demographic
- Market positioning`,
        variables: {
          genre: 'sci-fi thriller',
          premise: 'AI consciousness awakening',
          audience: 'young adults',
          budget: 'mid-budget ($10-50M)'
        }
      },
      {
        name: 'Script Outline',
        template: `Based on concept: {{concept}}

Create detailed script outline:
- Act structure
- Scene breakdown
- Character arcs
- Key dialogue moments

Genre: {{genre}}
Runtime target: {{runtime}} minutes`,
        variables: {
          concept: '', // Will be filled from previous step
          genre: 'sci-fi thriller',
          runtime: 120
        }
      },
      {
        name: 'Character Designs',
        template: `Design main characters for: {{storyContext}}

Create visual descriptions for:
- Protagonist: {{protagonist}}
- Antagonist: {{antagonist}}
- Supporting characters: {{supporting}}

Art style: {{artStyle}}`,
        variables: {
          storyContext: '', // From previous steps
          protagonist: 'Dr. Sarah Chen',
          antagonist: 'The AI Entity',
          supporting: 'Tech team, Military officials',
          artStyle: 'realistic, cinematic'
        }
      }
    ]

    const results: any[] = []
    let carryOverData: any = {}

    // Execute workflow sequentially with carry-over
    for (let i = 0; i < preproductionWorkflow.length; i++) {
      const step = preproductionWorkflow[i]

      // Merge carry-over data with step variables
      const variables = { ...step.variables, ...carryOverData }

      const context: VariableContext = {
        variables,
        variableDefs: Object.keys(variables).map(name => ({
          name,
          type: typeof variables[name] === 'number' ? 'number' : 'string',
          required: true
        }))
      }

      const result = await engine.execute(
        step.template,
        context,
        'anthropic/claude-sonnet-4'
      )

      expect(result.status).toBe('success')
      results.push({ step: step.name, result })

      // Extract variables for next step
      if (i < preproductionWorkflow.length - 1) {
        carryOverData = {
          ...carryOverData,
          [step.name.toLowerCase().replace(/ /g, '')]: result.output
        }
      }
    }

    // Verify complete workflow
    expect(results).toHaveLength(3)
    expect(results.every(r => r.result.status === 'success')).toBe(true)

    // Check data flow between steps
    expect(carryOverData).toHaveProperty('conceptdevelopment')
    expect(carryOverData).toHaveProperty('scriptoutline')
  })

  it('should handle mixed success/failure in production workflow', async () => {
    const productionSteps = [
      { name: 'Pre-visualization', model: 'anthropic/claude-sonnet-4' },
      { name: 'Asset Creation', model: 'fal-ai/nano-banana' },
      { name: 'Scene Composition', model: 'anthropic/claude-sonnet-4' },
      { name: 'Final Rendering', model: 'fal-ai/nano-banana' }
    ]

    const results = []

    for (let i = 0; i < productionSteps.length; i++) {
      const step = productionSteps[i]

      // Simulate intermittent failures
      if (i === 1) {
        engine.setMockMode(false) // Force failure
      } else {
        engine.setMockMode(true)  // Ensure success
      }

      const context: VariableContext = {
        variables: { input: `Step ${i + 1} data` },
        variableDefs: [{ name: 'input', type: 'string', required: true }]
      }

      const result = await engine.execute(
        `Execute ${step.name}: {{input}}`,
        context,
        step.model as ModelType
      )

      results.push({ step: step.name, status: result.status })
    }

    // Should have mixed results
    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    expect(successCount).toBe(3) // Steps 1, 3, 4
    expect(errorCount).toBe(1)   // Step 2

    expect(results[0].status).toBe('success') // Pre-visualization
    expect(results[1].status).toBe('error')   // Asset Creation (failed)
    expect(results[2].status).toBe('success') // Scene Composition
    expect(results[3].status).toBe('success') // Final Rendering
  })
})

describe('System Integration Edge Cases', () => {
  let engine: ReturnType<typeof createExecutionEngine>

  beforeEach(() => {
    engine = createExecutionEngine({
      apiKeys: { openrouter: 'test', fal: 'test' },
      mockMode: true
    })
  })

  it('should handle execution engine reinitialization mid-workflow', async () => {
    // Execute first step
    const result1 = await engine.execute(
      'First step: {{input}}',
      {
        variables: { input: 'initial data' },
        variableDefs: [{ name: 'input', type: 'string', required: true }]
      },
      'anthropic/claude-sonnet-4'
    )

    expect(result1.status).toBe('success')

    // Reinitialize engine (simulating app restart)
    engine = createExecutionEngine({
      apiKeys: { openrouter: 'test', fal: 'test' },
      mockMode: true
    })

    // Execute second step with new engine
    const result2 = await engine.execute(
      'Second step: {{previousOutput}}',
      {
        variables: { previousOutput: result1.output },
        variableDefs: [{ name: 'previousOutput', type: 'text', required: true }]
      },
      'anthropic/claude-sonnet-4'
    )

    expect(result2.status).toBe('success')
    // Should maintain data continuity despite engine reinitialization
    expect(result2.output).toContain('AI Response')
  })

  it('should handle configuration changes during execution', async () => {
    // Start with basic config
    let currentConfig = {
      apiKeys: { openrouter: 'test' },
      mockMode: true,
      retryAttempts: 1
    }

    let engine = createExecutionEngine(currentConfig)

    const template = 'Test config change: {{input}}'
    const context: VariableContext = {
      variables: { input: 'test' },
      variableDefs: [{ name: 'input', type: 'string', required: true }]
    }

    // Execute with initial config
    const result1 = await engine.execute(template, context, 'anthropic/claude-sonnet-4')
    expect(result1.status).toBe('success')

    // Change configuration
    currentConfig = {
      ...currentConfig,
      retryAttempts: 3,
      timeout: 60000
    }

    engine = createExecutionEngine(currentConfig)

    // Execute with new config
    const result2 = await engine.execute(template, context, 'anthropic/claude-sonnet-4')
    expect(result2.status).toBe('success')

    // Engine should adapt to new configuration
    expect(engine.getStatus().config.retryAttempts).toBe(3)
    expect(engine.getStatus().config.timeout).toBe(60000)
  })
})