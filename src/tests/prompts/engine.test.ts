import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals'
import {
  PromptExecutionEngine,
  VariableInterpolator,
  createExecutionEngine,
  ConsoleLogger
} from '@/lib/prompts/engine'
import type {
  ExecutionConfig,
  VariableContext,
  ModelType,
  ExecutionResult
} from '@/lib/prompts/types'

// Mock the provider factory
jest.mock('@/lib/prompts/providers', () => ({
  ProviderFactory: jest.fn().mockImplementation(() => ({
    getProvider: jest.fn(),
    getAvailableModels: jest.fn(() => ['anthropic/claude-sonnet-4', 'fal-ai/nano-banana']),
    testAllProviders: jest.fn(() => Promise.resolve({ openrouter: true, fal: true })),
    enableMockMode: jest.fn(),
    disableMockMode: jest.fn()
  })),
  ConsoleLogger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}))

describe('VariableInterpolator', () => {
  let interpolator: VariableInterpolator
  let mockLogger: any

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
    interpolator = new VariableInterpolator(mockLogger)
  })

  describe('interpolate', () => {
    it('should replace simple variables correctly', () => {
      const template = 'Hello {{name}}, welcome to {{app}}!'
      const context: VariableContext = {
        variables: { name: 'John', app: 'MovieGen' },
        variableDefs: [
          { name: 'name', type: 'string', required: true },
          { name: 'app', type: 'string', required: true }
        ]
      }

      const result = interpolator.interpolate(template, context)

      expect(result.resolvedPrompt).toBe('Hello John, welcome to MovieGen!')
      expect(result.errors).toHaveLength(0)
      expect(result.usedVariables).toEqual(['name', 'app'])
      expect(result.missingVariables).toHaveLength(0)
    })

    it('should handle missing required variables', () => {
      const template = 'Hello {{name}}, your age is {{age}}'
      const context: VariableContext = {
        variables: { name: 'John' },
        variableDefs: [
          { name: 'name', type: 'string', required: true },
          { name: 'age', type: 'number', required: true }
        ]
      }

      const result = interpolator.interpolate(template, context)

      expect(result.resolvedPrompt).toBe(template) // Should remain unchanged
      expect(result.errors).toContain("Required variable 'age' is missing")
      expect(result.missingVariables).toEqual(['age'])
      expect(result.usedVariables).toHaveLength(0)
    })

    it('should use default values for optional variables', () => {
      const template = 'Hello {{name}}, your mood is {{mood}}'
      const context: VariableContext = {
        variables: { name: 'John' },
        variableDefs: [
          { name: 'name', type: 'string', required: true },
          { name: 'mood', type: 'string', required: false, defaultValue: 'happy' }
        ]
      }

      const result = interpolator.interpolate(template, context)

      expect(result.resolvedPrompt).toBe('Hello John, your mood is happy')
      expect(result.errors).toHaveLength(0)
      expect(result.usedVariables).toEqual(['name', 'mood'])
    })

    it('should handle different variable types correctly', () => {
      const template = 'User: {{name}}, Active: {{active}}, Count: {{count}}, Data: {{data}}'
      const context: VariableContext = {
        variables: {
          name: 'John',
          active: true,
          count: 42,
          data: { key: 'value', nested: { prop: 123 } }
        },
        variableDefs: [
          { name: 'name', type: 'string', required: true },
          { name: 'active', type: 'boolean', required: true },
          { name: 'count', type: 'number', required: true },
          { name: 'data', type: 'json', required: true }
        ]
      }

      const result = interpolator.interpolate(template, context)

      expect(result.resolvedPrompt).toContain('User: John')
      expect(result.resolvedPrompt).toContain('Active: true')
      expect(result.resolvedPrompt).toContain('Count: 42')
      expect(result.resolvedPrompt).toContain('"key": "value"')
      expect(result.errors).toHaveLength(0)
    })

    it('should detect undefined variables in template', () => {
      const template = 'Hello {{name}}, your {{undefinedVar}} is ready'
      const context: VariableContext = {
        variables: { name: 'John' },
        variableDefs: [
          { name: 'name', type: 'string', required: true }
        ]
      }

      const result = interpolator.interpolate(template, context)

      expect(result.errors).toContain("Variable 'undefinedVar' found in template but not defined")
      expect(result.resolvedPrompt).toContain('{{undefinedVar}}') // Should remain unreplaced
    })

    it('should handle URL validation warnings', () => {
      const template = 'Image URL: {{imageUrl}}'
      const context: VariableContext = {
        variables: { imageUrl: 'not-a-valid-url' },
        variableDefs: [
          { name: 'imageUrl', type: 'url', required: true }
        ]
      }

      const result = interpolator.interpolate(template, context)

      expect(result.resolvedPrompt).toBe('Image URL: not-a-valid-url')
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('URL variable may be invalid')
      )
    })
  })

  describe('extractVariableNames', () => {
    it('should extract all variable names from template', () => {
      const template = 'Hello {{name}}, welcome to {{app}}! Your {{role}} is {{status}}.'
      const variables = interpolator.extractVariableNames(template)

      expect(variables).toEqual(['name', 'app', 'role', 'status'])
    })

    it('should return empty array for template without variables', () => {
      const template = 'This template has no variables'
      const variables = interpolator.extractVariableNames(template)

      expect(variables).toEqual([])
    })

    it('should handle malformed variable syntax', () => {
      const template = 'Hello {name}, welcome to {{app}! Your {{{role}} is incomplete'
      const variables = interpolator.extractVariableNames(template)

      expect(variables).toEqual(['app']) // Only properly formatted variables
    })
  })

  describe('validateTemplate', () => {
    it('should validate template against variable definitions', () => {
      const template = 'Hello {{name}}, your {{age}} and {{undefinedVar}}'
      const variableDefs = [
        { name: 'name', type: 'string', required: true },
        { name: 'age', type: 'number', required: true }
      ]

      const errors = interpolator.validateTemplate(template, variableDefs)

      expect(errors).toContain("Variable 'undefinedVar' used in template but not defined")
      expect(errors).toHaveLength(1)
    })

    it('should return no errors for valid template', () => {
      const template = 'Hello {{name}}, your age is {{age}}'
      const variableDefs = [
        { name: 'name', type: 'string', required: true },
        { name: 'age', type: 'number', required: true }
      ]

      const errors = interpolator.validateTemplate(template, variableDefs)

      expect(errors).toHaveLength(0)
    })
  })
})

describe('PromptExecutionEngine', () => {
  let engine: PromptExecutionEngine
  let mockConfig: ExecutionConfig
  let mockProvider: any

  beforeEach(() => {
    mockConfig = {
      apiKeys: {
        openrouter: 'test-openrouter-key',
        fal: 'test-fal-key'
      },
      mockMode: true,
      timeout: 30000,
      retryAttempts: 3,
      logLevel: 'info'
    }

    mockProvider = {
      name: 'test-provider',
      supportedModels: ['anthropic/claude-sonnet-4'],
      execute: jest.fn(),
      validateConfig: jest.fn(() => true)
    }

    engine = new PromptExecutionEngine(mockConfig)

    // Mock the provider factory
    ;(engine as any).providerFactory = {
      getProvider: jest.fn(() => mockProvider),
      getAvailableModels: jest.fn(() => ['anthropic/claude-sonnet-4']),
      testAllProviders: jest.fn(() => Promise.resolve({ testProvider: true })),
      enableMockMode: jest.fn(),
      disableMockMode: jest.fn()
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    it('should execute prompt successfully with valid inputs', async () => {
      const template = 'Generate a story about {{character}} in {{setting}}'
      const variableContext: VariableContext = {
        variables: { character: 'Alice', setting: 'wonderland' },
        variableDefs: [
          { name: 'character', type: 'string', required: true },
          { name: 'setting', type: 'string', required: true }
        ]
      }
      const model: ModelType = 'anthropic/claude-sonnet-4'

      const mockResult: ExecutionResult = {
        output: 'Generated story content...',
        status: 'success',
        executionTime: 1500,
        providerUsed: 'test-provider',
        model
      }

      mockProvider.execute.mockResolvedValue(mockResult)

      const result = await engine.execute(template, variableContext, model)

      expect(result.status).toBe('success')
      expect(result.output).toBe('Generated story content...')
      expect(mockProvider.execute).toHaveBeenCalledWith(
        'Generate a story about Alice in wonderland',
        model,
        undefined
      )
    })

    it('should handle variable interpolation errors', async () => {
      const template = 'Hello {{name}}, your {{age}}'
      const variableContext: VariableContext = {
        variables: { name: 'John' }, // missing required 'age'
        variableDefs: [
          { name: 'name', type: 'string', required: true },
          { name: 'age', type: 'number', required: true }
        ]
      }
      const model: ModelType = 'anthropic/claude-sonnet-4'

      const result = await engine.execute(template, variableContext, model)

      expect(result.status).toBe('error')
      expect(result.errorMessage).toContain("Required variable 'age' is missing")
      expect(mockProvider.execute).not.toHaveBeenCalled()
    })

    it('should handle provider not found error', async () => {
      ;(engine as any).providerFactory.getProvider.mockReturnValue(null)

      const template = 'Test template'
      const variableContext: VariableContext = {
        variables: {},
        variableDefs: []
      }
      const model: ModelType = 'anthropic/claude-sonnet-4'

      const result = await engine.execute(template, variableContext, model)

      expect(result.status).toBe('error')
      expect(result.errorMessage).toContain('No provider available for model')
      expect(result.providerUsed).toBe('none')
    })

    it('should implement retry logic with exponential backoff', async () => {
      const template = 'Test template'
      const variableContext: VariableContext = {
        variables: {},
        variableDefs: []
      }
      const model: ModelType = 'anthropic/claude-sonnet-4'

      // Mock provider to fail twice, then succeed
      mockProvider.execute
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockResolvedValueOnce({
          output: 'Success after retries',
          status: 'success',
          executionTime: 1000,
          providerUsed: 'test-provider',
          model
        })

      const result = await engine.execute(template, variableContext, model)

      expect(result.status).toBe('success')
      expect(result.output).toBe('Success after retries')
      expect(mockProvider.execute).toHaveBeenCalledTimes(3)
      expect(result.metrics?.retryCount).toBe(2)
    })

    it('should fail after max retry attempts', async () => {
      mockConfig.retryAttempts = 2
      engine = new PromptExecutionEngine(mockConfig)
      ;(engine as any).providerFactory = {
        getProvider: jest.fn(() => mockProvider),
        getAvailableModels: jest.fn(() => ['anthropic/claude-sonnet-4'])
      }

      const template = 'Test template'
      const variableContext: VariableContext = {
        variables: {},
        variableDefs: []
      }
      const model: ModelType = 'anthropic/claude-sonnet-4'

      mockProvider.execute.mockRejectedValue(new Error('Persistent error'))

      const result = await engine.execute(template, variableContext, model)

      expect(result.status).toBe('error')
      expect(result.errorMessage).toContain('Persistent error')
      expect(mockProvider.execute).toHaveBeenCalledTimes(2)
    })
  })

  describe('mock mode', () => {
    it('should enable mock mode correctly', () => {
      const mockProviderFactory = (engine as any).providerFactory

      engine.setMockMode(true)

      expect(mockProviderFactory.enableMockMode).toHaveBeenCalled()
      expect(engine.getStatus().mockMode).toBe(true)
    })

    it('should disable mock mode correctly', () => {
      const mockProviderFactory = (engine as any).providerFactory

      engine.setMockMode(false)

      expect(mockProviderFactory.disableMockMode).toHaveBeenCalled()
      expect(engine.getStatus().mockMode).toBe(false)
    })
  })

  describe('getStatus', () => {
    it('should return current engine status', () => {
      const status = engine.getStatus()

      expect(status).toHaveProperty('mockMode')
      expect(status).toHaveProperty('availableModels')
      expect(status).toHaveProperty('config')
      expect(Array.isArray(status.availableModels)).toBe(true)
    })
  })

  describe('validateTemplate', () => {
    it('should validate template without executing', () => {
      const template = 'Hello {{name}}, {{invalidVar}}'
      const variableDefs = [
        { name: 'name', type: 'string', required: true }
      ]

      const errors = engine.validateTemplate(template, variableDefs)

      expect(errors).toContain("Variable 'invalidVar' used in template but not defined")
    })
  })

  describe('testProviders', () => {
    it('should test all provider connections', async () => {
      const results = await engine.testProviders()

      expect(results).toHaveProperty('testProvider')
      expect(typeof results).toBe('object')
    })
  })
})

describe('createExecutionEngine', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should create engine with environment variables', () => {
    process.env.OPENROUTER_API_KEY = 'env-openrouter-key'
    process.env.FAL_API_KEY = 'env-fal-key'
    process.env.MOCK_MODE = 'true'
    process.env.NODE_ENV = 'development'
    process.env.EXECUTION_TIMEOUT = '45000'
    process.env.RETRY_ATTEMPTS = '5'
    process.env.LOG_LEVEL = 'debug'

    const engine = createExecutionEngine()
    const status = engine.getStatus()

    expect(status.config.apiKeys.openrouter).toBe('env-openrouter-key')
    expect(status.config.apiKeys.fal).toBe('env-fal-key')
    expect(status.config.mockMode).toBe(true)
    expect(status.config.timeout).toBe(45000)
    expect(status.config.retryAttempts).toBe(5)
    expect(status.config.logLevel).toBe('debug')
  })

  it('should support FAL_KEY fallback for FAL API key', () => {
    process.env.FAL_KEY = 'fallback-fal-key'

    const engine = createExecutionEngine()
    const status = engine.getStatus()

    expect(status.config.apiKeys.fal).toBe('fallback-fal-key')
  })

  it('should apply config overrides', () => {
    const overrides = {
      mockMode: false,
      timeout: 60000,
      logLevel: 'warn' as const
    }

    const engine = createExecutionEngine(overrides)
    const status = engine.getStatus()

    expect(status.config.mockMode).toBe(false)
    expect(status.config.timeout).toBe(60000)
    expect(status.config.logLevel).toBe('warn')
  })
})

describe('Edge Cases and Error Handling', () => {
  let engine: PromptExecutionEngine
  let mockProvider: any

  beforeEach(() => {
    const config: ExecutionConfig = {
      apiKeys: { openrouter: 'test-key' },
      mockMode: true,
      retryAttempts: 1
    }

    mockProvider = {
      name: 'test-provider',
      execute: jest.fn()
    }

    engine = new PromptExecutionEngine(config)
    ;(engine as any).providerFactory = {
      getProvider: jest.fn(() => mockProvider),
      getAvailableModels: jest.fn(() => ['anthropic/claude-sonnet-4'])
    }
  })

  it('should handle extremely large templates', async () => {
    const largeTemplate = 'Repeat: ' + '{{text}}'.repeat(1000)
    const variableContext: VariableContext = {
      variables: { text: 'Hello World! ' },
      variableDefs: [
        { name: 'text', type: 'string', required: true }
      ]
    }

    mockProvider.execute.mockResolvedValue({
      output: 'Processed large template',
      status: 'success',
      executionTime: 2000,
      providerUsed: 'test-provider',
      model: 'anthropic/claude-sonnet-4'
    })

    const result = await engine.execute(largeTemplate, variableContext, 'anthropic/claude-sonnet-4')

    expect(result.status).toBe('success')
    expect(mockProvider.execute).toHaveBeenCalledWith(
      expect.stringContaining('Repeat: Hello World!'),
      'anthropic/claude-sonnet-4',
      undefined
    )
  })

  it('should handle special characters in variables', () => {
    const interpolator = new VariableInterpolator()
    const template = 'Message: {{message}}'
    const context: VariableContext = {
      variables: { message: 'Hello "World" & <Friends>! \n\t Special chars: $@#%' },
      variableDefs: [
        { name: 'message', type: 'string', required: true }
      ]
    }

    const result = interpolator.interpolate(template, context)

    expect(result.resolvedPrompt).toContain('Hello "World" & <Friends>!')
    expect(result.resolvedPrompt).toContain('Special chars: $@#%')
    expect(result.errors).toHaveLength(0)
  })

  it('should handle circular JSON references gracefully', () => {
    const interpolator = new VariableInterpolator()
    const template = 'Data: {{data}}'

    // Create circular reference
    const obj: any = { name: 'test' }
    obj.self = obj

    const context: VariableContext = {
      variables: { data: obj },
      variableDefs: [
        { name: 'data', type: 'json', required: true }
      ]
    }

    expect(() => {
      interpolator.interpolate(template, context)
    }).not.toThrow() // Should handle gracefully without crashing
  })

  it('should handle execution timeout scenarios', async () => {
    const template = 'Test timeout'
    const variableContext: VariableContext = {
      variables: {},
      variableDefs: []
    }

    // Mock a timeout error
    mockProvider.execute.mockRejectedValue(new Error('Request timeout'))

    const result = await engine.execute(template, variableContext, 'anthropic/claude-sonnet-4')

    expect(result.status).toBe('error')
    expect(result.errorMessage).toContain('Request timeout')
  })
})

describe('Performance Tests', () => {
  let engine: PromptExecutionEngine

  beforeEach(() => {
    const config: ExecutionConfig = {
      apiKeys: { openrouter: 'test-key' },
      mockMode: true
    }
    engine = new PromptExecutionEngine(config)
  })

  it('should process variable interpolation efficiently', () => {
    const interpolator = new VariableInterpolator()
    const template = Array(100).fill('{{var}}').join(' ')
    const context: VariableContext = {
      variables: { var: 'test' },
      variableDefs: [
        { name: 'var', type: 'string', required: true }
      ]
    }

    const startTime = performance.now()
    const result = interpolator.interpolate(template, context)
    const duration = performance.now() - startTime

    expect(result.errors).toHaveLength(0)
    expect(duration).toBeLessThan(100) // Should complete in under 100ms
  })

  it('should handle concurrent executions', async () => {
    const mockProvider = {
      name: 'concurrent-test',
      execute: jest.fn().mockResolvedValue({
        output: 'Concurrent result',
        status: 'success',
        executionTime: 100,
        providerUsed: 'concurrent-test',
        model: 'anthropic/claude-sonnet-4'
      })
    }

    ;(engine as any).providerFactory.getProvider = jest.fn(() => mockProvider)

    const template = 'Test concurrent execution'
    const variableContext: VariableContext = {
      variables: {},
      variableDefs: []
    }

    // Execute 10 prompts concurrently
    const promises = Array(10).fill(null).map(() =>
      engine.execute(template, variableContext, 'anthropic/claude-sonnet-4')
    )

    const results = await Promise.all(promises)

    expect(results).toHaveLength(10)
    expect(results.every(r => r.status === 'success')).toBe(true)
    expect(mockProvider.execute).toHaveBeenCalledTimes(10)
  })
})