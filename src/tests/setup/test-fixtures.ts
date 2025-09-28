import type {
  PromptTemplate,
  PromptExecution,
  VariableDefinition
} from '@/types/prompts'
import type {
  TagGroupExecution,
  TagGroupStep
} from '@/lib/prompts/tag-utils'
import type {
  ExecutionResult,
  ExecutionConfig,
  VariableContext
} from '@/lib/prompts/types'

/**
 * Test fixtures for prompt management system testing
 */

// Sample Variable Definitions
export const mockVariableDefinitions: VariableDefinition[] = [
  {
    name: 'character',
    type: 'string',
    required: true,
    description: 'Main character name'
  },
  {
    name: 'setting',
    type: 'string',
    required: true,
    description: 'Story setting location'
  },
  {
    name: 'genre',
    type: 'string',
    required: false,
    defaultValue: 'fantasy',
    options: ['fantasy', 'sci-fi', 'mystery', 'romance'],
    description: 'Story genre'
  },
  {
    name: 'wordCount',
    type: 'number',
    required: false,
    defaultValue: 1000,
    description: 'Target word count'
  },
  {
    name: 'includeDialogue',
    type: 'boolean',
    required: false,
    defaultValue: true,
    description: 'Include character dialogue'
  },
  {
    name: 'themes',
    type: 'array',
    required: false,
    defaultValue: ['adventure', 'friendship'],
    description: 'Story themes'
  },
  {
    name: 'metadata',
    type: 'object',
    required: false,
    defaultValue: { rating: 'PG', audience: 'general' },
    description: 'Story metadata'
  },
  {
    name: 'imageUrl',
    type: 'url',
    required: false,
    description: 'Reference image URL'
  }
]

// Sample Prompt Templates
export const mockPromptTemplates: PromptTemplate[] = [
  {
    id: 'story-concept-001',
    name: 'Story Concept Development',
    app: 'auto-movie',
    stage: 'development',
    feature: 'story-generation',
    tags: ['preproduction-001', 'story-001'],
    template: `Create a compelling story concept for a {{genre}} story.

Setting: {{setting}}
Main Character: {{character}}
Target Length: {{wordCount}} words
Include Dialogue: {{includeDialogue}}

Themes to explore: {{themes}}

Additional metadata: {{metadata}}

{{#if imageUrl}}
Reference Image: {{imageUrl}}
{{/if}}

Develop a rich, engaging concept that sets up the foundation for a complete narrative.`,
    variableDefs: mockVariableDefinitions,
    outputSchema: {
      concept: 'string',
      logline: 'string',
      keyScenes: 'array',
      characters: 'object'
    },
    model: 'anthropic/claude-sonnet-4',
    notes: 'Foundation template for story development pipeline',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'story-outline-002',
    name: 'Story Outline Creation',
    app: 'auto-movie',
    stage: 'development',
    feature: 'story-generation',
    tags: ['preproduction-002', 'story-002'],
    template: `Based on the story concept: {{concept}}

Create a detailed story outline that includes:
- Three-act structure
- Character development arcs
- Key plot points and conflicts
- Scene breakdown

Target word count: {{wordCount}}
Genre: {{genre}}
Setting: {{setting}}

Ensure the outline supports the themes: {{themes}}`,
    variableDefs: [
      { name: 'concept', type: 'text', required: true, description: 'Story concept from previous step' },
      { name: 'wordCount', type: 'number', required: false, defaultValue: 1000 },
      { name: 'genre', type: 'string', required: true },
      { name: 'setting', type: 'string', required: true },
      { name: 'themes', type: 'array', required: false, defaultValue: [] }
    ],
    outputSchema: {
      outline: 'object',
      acts: 'array',
      scenes: 'array'
    },
    model: 'anthropic/claude-sonnet-4',
    notes: 'Second step in story development pipeline',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'character-design-001',
    name: 'Character Visual Design',
    app: 'auto-movie',
    stage: 'development',
    feature: 'character-design',
    tags: ['character-001', 'visual-001'],
    template: `Create a visual design prompt for the character: {{character}}

Story Context: {{storyContext}}
Character Role: {{characterRole}}
Visual Style: {{visualStyle}}

Generate a detailed description suitable for image generation.`,
    variableDefs: [
      { name: 'character', type: 'string', required: true },
      { name: 'storyContext', type: 'text', required: true },
      { name: 'characterRole', type: 'string', required: true },
      { name: 'visualStyle', type: 'string', required: false, defaultValue: 'realistic' }
    ],
    model: 'fal-ai/nano-banana',
    notes: 'Character visual design for image generation',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'scene-image-001',
    name: 'Scene Image Generation',
    app: 'auto-movie',
    stage: 'production',
    feature: 'visual-generation',
    tags: ['visual-002', 'scene-001'],
    template: `Generate an image for this scene:

Scene Description: {{sceneDescription}}
Characters Present: {{characters}}
Environment: {{environment}}
Mood/Atmosphere: {{mood}}
Lighting: {{lighting}}

Style: {{artStyle}}
Resolution: {{resolution}}`,
    variableDefs: [
      { name: 'sceneDescription', type: 'text', required: true },
      { name: 'characters', type: 'array', required: false, defaultValue: [] },
      { name: 'environment', type: 'string', required: true },
      { name: 'mood', type: 'string', required: false, defaultValue: 'neutral' },
      { name: 'lighting', type: 'string', required: false, defaultValue: 'natural' },
      { name: 'artStyle', type: 'string', required: false, defaultValue: 'photorealistic' },
      { name: 'resolution', type: 'string', required: false, defaultValue: '1024x1024' }
    ],
    model: 'fal-ai/nano-banana',
    notes: 'Scene visualization for storyboard creation',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

// Sample Execution Results
export const mockExecutionResults: ExecutionResult[] = [
  {
    output: {
      concept: 'A young inventor discovers an ancient artifact that grants the ability to manipulate time, but each use comes with unpredictable consequences.',
      logline: 'When a brilliant but impulsive inventor finds a mysterious temporal device, she must learn to control both time and her own impulses before reality unravels completely.',
      keyScenes: [
        'Discovery of the artifact in grandmother\'s attic',
        'First time manipulation attempt goes wrong',
        'Confrontation with temporal guardians',
        'Final choice between power and responsibility'
      ],
      characters: {
        protagonist: 'Maya Chen - 22-year-old engineering student',
        mentor: 'Dr. Sarah Williams - quantum physicist',
        antagonist: 'The Chronarch - guardian of temporal balance'
      }
    },
    status: 'success',
    executionTime: 2500,
    providerUsed: 'openrouter',
    model: 'anthropic/claude-sonnet-4',
    metrics: {
      tokenCount: 1250,
      promptTokens: 450,
      completionTokens: 800,
      latency: 2500,
      retryCount: 0,
      cost: 0.025
    }
  },
  {
    output: {
      images: [{
        url: 'https://example.com/generated-image-123.png',
        width: 1024,
        height: 1024,
        content_type: 'image/png'
      }],
      prompt: 'A young woman with dark hair wearing steampunk goggles, holding a glowing temporal artifact, in a cluttered inventor\'s workshop'
    },
    status: 'success',
    executionTime: 8000,
    providerUsed: 'fal',
    model: 'fal-ai/nano-banana',
    metrics: {
      latency: 8000,
      retryCount: 1,
      cost: 0.10
    }
  },
  {
    output: null,
    status: 'error',
    errorMessage: 'API rate limit exceeded. Please try again in 60 seconds.',
    executionTime: 1000,
    providerUsed: 'openrouter',
    model: 'anthropic/claude-sonnet-4',
    metrics: {
      latency: 1000,
      retryCount: 3
    }
  }
]

// Sample Prompt Executions
export const mockPromptExecutions: PromptExecution[] = [
  {
    id: 'execution-1',
    templateId: 'story-concept-001',
    app: 'auto-movie',
    stage: 'development',
    feature: 'story-generation',
    projectId: 'project-123',
    tagsSnapshot: ['preproduction-001', 'story-001'],
    inputs: {
      character: 'Maya Chen',
      setting: 'Neo-Tokyo 2087',
      genre: 'sci-fi',
      wordCount: 2000,
      includeDialogue: true,
      themes: ['technology', 'responsibility', 'time'],
      metadata: { rating: 'PG-13', audience: 'young-adult' }
    },
    resolvedPrompt: 'Create a compelling story concept for a sci-fi story...',
    model: 'anthropic/claude-sonnet-4',
    status: 'success',
    outputRaw: mockExecutionResults[0].output,
    executionTime: 2500,
    providerUsed: 'openrouter',
    metrics: mockExecutionResults[0].metrics,
    startedAt: '2024-01-01T10:00:00.000Z',
    finishedAt: '2024-01-01T10:00:02.500Z',
    createdAt: '2024-01-01T10:00:03.000Z',
    updatedAt: '2024-01-01T10:00:03.000Z'
  },
  {
    id: 'execution-2',
    templateId: 'character-design-001',
    app: 'auto-movie',
    stage: 'development',
    feature: 'character-design',
    projectId: 'project-123',
    tagsSnapshot: ['character-001', 'visual-001'],
    inputs: {
      character: 'Maya Chen',
      storyContext: 'Sci-fi thriller about time manipulation',
      characterRole: 'protagonist',
      visualStyle: 'cyberpunk'
    },
    resolvedPrompt: 'Create a visual design prompt for the character: Maya Chen...',
    model: 'fal-ai/nano-banana',
    status: 'success',
    outputRaw: mockExecutionResults[1].output,
    executionTime: 8000,
    providerUsed: 'fal',
    metrics: mockExecutionResults[1].metrics,
    startedAt: '2024-01-01T10:05:00.000Z',
    finishedAt: '2024-01-01T10:05:08.000Z',
    createdAt: '2024-01-01T10:05:09.000Z',
    updatedAt: '2024-01-01T10:05:09.000Z'
  },
  {
    id: 'execution-3',
    templateId: 'story-concept-001',
    app: 'auto-movie',
    stage: 'development',
    feature: 'story-generation',
    inputs: {
      character: 'Invalid Character',
      setting: 'Test Setting'
      // Missing required 'genre'
    },
    resolvedPrompt: 'Create a compelling story concept for a {{genre}} story...',
    model: 'anthropic/claude-sonnet-4',
    status: 'error',
    errorMessage: 'Required variable \'genre\' is missing',
    executionTime: 100,
    providerUsed: 'none',
    startedAt: '2024-01-01T11:00:00.000Z',
    finishedAt: '2024-01-01T11:00:00.100Z',
    createdAt: '2024-01-01T11:00:01.000Z',
    updatedAt: '2024-01-01T11:00:01.000Z'
  }
]

// Sample Tag Group Executions
export const mockTagGroupExecution: TagGroupExecution = {
  id: 'tg-exec-20240101-abc123',
  groupName: 'preproduction',
  projectId: 'project-123',
  currentStepIndex: 0,
  status: 'running',
  startedAt: '2024-01-01T10:00:00.000Z',
  steps: [
    {
      id: 'step-concept-20240101',
      templateId: 'story-concept-001',
      templateName: 'Story Concept Development',
      order: 1,
      status: 'completed',
      inputs: {
        character: 'Maya Chen',
        setting: 'Neo-Tokyo 2087',
        genre: 'sci-fi'
      },
      execution: mockPromptExecutions[0],
      notes: 'Successfully generated core concept',
      startedAt: '2024-01-01T10:00:00.000Z',
      completedAt: '2024-01-01T10:00:02.500Z'
    },
    {
      id: 'step-outline-20240101',
      templateId: 'story-outline-002',
      templateName: 'Story Outline Creation',
      order: 2,
      status: 'running',
      inputs: {
        concept: 'A young inventor discovers an ancient artifact...',
        wordCount: 2000,
        genre: 'sci-fi',
        setting: 'Neo-Tokyo 2087',
        themes: ['technology', 'responsibility']
      },
      notes: 'In progress - generating detailed outline',
      startedAt: '2024-01-01T10:05:00.000Z'
    },
    {
      id: 'step-characters-20240101',
      templateId: 'character-design-001',
      templateName: 'Character Design',
      order: 3,
      status: 'pending',
      inputs: {},
      notes: ''
    }
  ],
  notes: 'Movie preproduction workflow execution'
}

// Sample Variable Contexts
export const mockVariableContexts: VariableContext[] = [
  {
    variables: {
      character: 'Alice',
      setting: 'Wonderland',
      genre: 'fantasy',
      wordCount: 1500,
      includeDialogue: true,
      themes: ['adventure', 'coming-of-age'],
      metadata: { rating: 'G', audience: 'children' }
    },
    variableDefs: mockVariableDefinitions
  },
  {
    variables: {
      character: 'John Doe',
      setting: 'Mars Colony Alpha'
    },
    variableDefs: [
      { name: 'character', type: 'string', required: true },
      { name: 'setting', type: 'string', required: true },
      { name: 'year', type: 'number', required: true } // Missing in variables
    ]
  },
  {
    variables: {},
    variableDefs: [] // No variables defined
  }
]

// Sample Execution Configs
export const mockExecutionConfigs: ExecutionConfig[] = [
  {
    apiKeys: {
      openrouter: 'test-openrouter-key-123',
      fal: 'test-fal-key-456'
    },
    mockMode: false,
    timeout: 30000,
    retryAttempts: 3,
    logLevel: 'info'
  },
  {
    apiKeys: {},
    mockMode: true,
    timeout: 5000,
    retryAttempts: 1,
    logLevel: 'debug'
  },
  {
    apiKeys: {
      openrouter: 'production-key'
    },
    mockMode: false,
    timeout: 60000,
    retryAttempts: 5,
    logLevel: 'warn'
  }
]

// Mock Provider Responses
export const mockProviderResponses = {
  openrouter: {
    success: {
      id: 'chatcmpl-test123',
      object: 'chat.completion',
      created: 1704067200,
      model: 'anthropic/claude-sonnet-4',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a successful response from the OpenRouter provider.'
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 300,
        total_tokens: 450
      }
    },
    error: {
      error: {
        message: 'Rate limit exceeded',
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded'
      }
    }
  },
  fal: {
    success: {
      request_id: 'fal-req-123',
      status: 'COMPLETED',
      images: [{
        url: 'https://fal.media/files/generated-image-123.png',
        width: 1024,
        height: 1024,
        content_type: 'image/png'
      }]
    },
    pending: {
      request_id: 'fal-req-456',
      status: 'IN_PROGRESS'
    },
    error: {
      request_id: 'fal-req-789',
      status: 'FAILED',
      error: 'Content policy violation'
    }
  }
}

// Test Utilities
export class TestUtils {
  /**
   * Create a minimal prompt template for testing
   */
  static createMockTemplate(overrides: Partial<PromptTemplate> = {}): PromptTemplate {
    return {
      id: `test-template-${Date.now()}`,
      name: 'Test Template',
      app: 'auto-movie',
      stage: 'development',
      feature: 'testing',
      tags: ['test-001'],
      template: 'Test template with {{variable}}',
      variableDefs: [
        { name: 'variable', type: 'string', required: true }
      ],
      model: 'anthropic/claude-sonnet-4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    }
  }

  /**
   * Create a mock execution result
   */
  static createMockExecutionResult(overrides: Partial<ExecutionResult> = {}): ExecutionResult {
    return {
      output: 'Mock execution output',
      status: 'success',
      executionTime: 1000,
      providerUsed: 'mock',
      model: 'anthropic/claude-sonnet-4',
      metrics: {
        tokenCount: 100,
        latency: 1000,
        retryCount: 0
      },
      ...overrides
    }
  }

  /**
   * Create a complete tag group execution for testing
   */
  static createMockTagGroupExecution(
    groupName: string = 'test',
    stepCount: number = 3
  ): TagGroupExecution {
    const templates = Array(stepCount).fill(null).map((_, i) =>
      this.createMockTemplate({
        id: `template-${i + 1}`,
        name: `Step ${i + 1}`,
        tags: [`${groupName}-${String(i + 1).padStart(3, '0')}`]
      })
    )

    return {
      id: `tg-exec-${Date.now()}-test`,
      groupName,
      projectId: 'test-project',
      currentStepIndex: 0,
      status: 'pending',
      steps: templates.map((template, i) => ({
        id: `step-${template.id}`,
        templateId: template.id,
        templateName: template.name,
        order: i + 1,
        status: 'pending' as const,
        inputs: {},
        notes: ''
      }))
    }
  }

  /**
   * Simulate step execution with realistic timing
   */
  static async simulateStepExecution(
    step: TagGroupStep,
    success: boolean = true,
    executionTime: number = 1500
  ): Promise<TagGroupStep> {
    await new Promise(resolve => setTimeout(resolve, Math.min(executionTime / 10, 100)))

    const updatedStep = { ...step }
    updatedStep.status = success ? 'completed' : 'failed'
    updatedStep.startedAt = new Date().toISOString()
    updatedStep.completedAt = new Date().toISOString()

    if (success) {
      updatedStep.execution = {
        id: `exec-${step.id}`,
        outputRaw: `Mock output for ${step.templateName}`,
        status: 'success',
        executionTime,
        providerUsed: 'mock',
        model: 'anthropic/claude-sonnet-4',
        startedAt: updatedStep.startedAt,
        finishedAt: updatedStep.completedAt
      } as any
    } else {
      updatedStep.execution = {
        id: `exec-${step.id}`,
        status: 'error',
        errorMessage: 'Simulated execution failure',
        executionTime,
        startedAt: updatedStep.startedAt,
        finishedAt: updatedStep.completedAt
      } as any
    }

    return updatedStep
  }

  /**
   * Generate realistic variable values for testing
   */
  static generateMockVariables(variableDefs: VariableDefinition[]): Record<string, any> {
    const variables: Record<string, any> = {}

    variableDefs.forEach(def => {
      switch (def.type) {
        case 'string':
          variables[def.name] = def.options ?
            def.options[Math.floor(Math.random() * def.options.length)] :
            `Test ${def.name} value`
          break
        case 'number':
          variables[def.name] = Math.floor(Math.random() * 1000) + 1
          break
        case 'boolean':
          variables[def.name] = Math.random() > 0.5
          break
        case 'array':
          variables[def.name] = [`item1`, `item2`, `item3`]
          break
        case 'object':
          variables[def.name] = { key: 'value', nested: { prop: 'test' } }
          break
        case 'url':
          variables[def.name] = 'https://example.com/test-image.jpg'
          break
        case 'text':
          variables[def.name] = `This is a longer text value for ${def.name} used in testing scenarios.`
          break
        default:
          variables[def.name] = `${def.name}-value`
      }
    })

    return variables
  }

  /**
   * Clear all localStorage mock data
   */
  static clearMockStorage(): void {
    localStorageMock.clear()
  }

  /**
   * Setup localStorage with test data
   */
  static setupMockStorage(executions: TagGroupExecution[]): void {
    executions.forEach(execution => {
      localStorageMock.setItem(
        `taggroup-execution-${execution.id}`,
        JSON.stringify(execution)
      )
    })

    localStorageMock.setItem(
      'taggroup-active-executions',
      JSON.stringify(executions.map(e => e.id))
    )
  }
}

// Error Scenarios
export const mockErrorScenarios = {
  networkError: new Error('Network request failed'),
  timeoutError: new Error('Request timeout after 30000ms'),
  rateLimitError: new Error('API rate limit exceeded'),
  invalidApiKeyError: new Error('Invalid API key provided'),
  contentPolicyError: new Error('Content violates provider policy'),
  insufficientCreditsError: new Error('Insufficient API credits'),
  modelNotFoundError: new Error('Requested model not available'),
  payloadTooLargeError: new Error('Request payload exceeds size limit')
}

// Performance Test Data
export const performanceTestData = {
  largeTemplate: 'Generate content for: ' + 'Very long prompt content. '.repeat(1000),
  manyVariables: Array(100).fill(null).map((_, i) => ({
    name: `var${i}`,
    type: 'string' as const,
    required: false,
    defaultValue: `value${i}`
  })),
  complexVariableContext: {
    variables: Object.fromEntries(
      Array(100).fill(null).map((_, i) => [`var${i}`, `value${i}`])
    ),
    variableDefs: Array(100).fill(null).map((_, i) => ({
      name: `var${i}`,
      type: 'string' as const,
      required: false
    }))
  }
}

// Export localStorage mock for use in tests
export { localStorageMock }