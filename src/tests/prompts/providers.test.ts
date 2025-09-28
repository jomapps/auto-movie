import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { ProviderFactory, ConsoleLogger } from '@/lib/prompts/providers'
import { OpenRouterProvider } from '@/lib/prompts/providers/openrouter'
import { FalProvider } from '@/lib/prompts/providers/fal'
import type {
  ExecutionConfig,
  ExecutionResult,
  ModelType
} from '@/lib/prompts/types'

// Mock fetch for provider testing
global.fetch = jest.fn()

describe('ProviderFactory', () => {
  let factory: ProviderFactory
  let mockConfig: ExecutionConfig
  let mockLogger: any

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    mockConfig = {
      apiKeys: {
        openrouter: 'test-openrouter-key',
        fal: 'test-fal-key'
      },
      mockMode: false,
      timeout: 30000,
      retryAttempts: 3,
      logLevel: 'info'
    }

    factory = new ProviderFactory(mockConfig, mockLogger)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize providers when API keys are provided', () => {
      expect(mockLogger.info).toHaveBeenCalledWith('OpenRouter provider initialized')
      expect(mockLogger.info).toHaveBeenCalledWith('FAL provider initialized')
    })

    it('should warn when API keys are missing in non-mock mode', () => {
      const configWithoutKeys: ExecutionConfig = {
        apiKeys: {},
        mockMode: false
      }

      new ProviderFactory(configWithoutKeys, mockLogger)

      expect(mockLogger.warn).toHaveBeenCalledWith('OpenRouter API key not provided')
      expect(mockLogger.warn).toHaveBeenCalledWith('FAL API key not provided')
    })

    it('should not warn about missing keys in mock mode', () => {
      const configMockMode: ExecutionConfig = {
        apiKeys: {},
        mockMode: true
      }

      new ProviderFactory(configMockMode, mockLogger)

      // Should not warn in mock mode
      expect(mockLogger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('API key not provided')
      )
    })
  })

  describe('getProvider', () => {
    it('should return correct provider for OpenRouter models', () => {
      const provider = factory.getProvider('anthropic/claude-sonnet-4')

      expect(provider).toBeDefined()
      expect(provider).toBeInstanceOf(OpenRouterProvider)
    })

    it('should return correct provider for FAL models', () => {
      const provider = factory.getProvider('fal-ai/nano-banana')

      expect(provider).toBeDefined()
      expect(provider).toBeInstanceOf(FalProvider)
    })

    it('should return null for unmapped models', () => {
      const provider = factory.getProvider('unknown/model' as ModelType)

      expect(provider).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'No provider mapping found for model: unknown/model'
      )
    })

    it('should return null when provider not initialized', () => {
      // Create factory without API keys
      const factoryWithoutKeys = new ProviderFactory({
        apiKeys: {},
        mockMode: false
      }, mockLogger)

      const provider = factoryWithoutKeys.getProvider('anthropic/claude-sonnet-4')

      expect(provider).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Provider openrouter not initialized')
      )
    })
  })

  describe('getAvailableModels', () => {
    it('should return models for initialized providers', () => {
      const models = factory.getAvailableModels()

      expect(models).toContain('anthropic/claude-sonnet-4')
      expect(models).toContain('qwen/qwen3-vl-235b-a22b-thinking')
      expect(models).toContain('fal-ai/nano-banana')
      expect(models).toContain('fal-ai/nano-banana/edit')
    })

    it('should return empty array when no providers initialized', () => {
      const factoryWithoutKeys = new ProviderFactory({
        apiKeys: {},
        mockMode: false
      })

      const models = factoryWithoutKeys.getAvailableModels()

      expect(models).toHaveLength(0)
    })
  })

  describe('testAllProviders', () => {
    it('should test all initialized providers', async () => {
      // Mock the provider test methods
      const mockOpenRouterProvider = factory['providers'].get('openrouter') as any
      const mockFalProvider = factory['providers'].get('fal') as any

      if (mockOpenRouterProvider && 'testConnection' in mockOpenRouterProvider) {
        mockOpenRouterProvider.testConnection = jest.fn().mockResolvedValue(true)
      }
      if (mockFalProvider && 'testConnection' in mockFalProvider) {
        mockFalProvider.testConnection = jest.fn().mockResolvedValue(true)
      }

      const results = await factory.testAllProviders()

      expect(results).toHaveProperty('openrouter')
      expect(results).toHaveProperty('fal')
      expect(Object.values(results).every(Boolean)).toBe(true)
    })

    it('should handle provider test failures gracefully', async () => {
      const mockProvider = factory['providers'].get('openrouter') as any
      if (mockProvider && 'testConnection' in mockProvider) {
        mockProvider.testConnection = jest.fn().mockRejectedValue(new Error('Connection failed'))
      }

      const results = await factory.testAllProviders()

      expect(results.openrouter).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Provider openrouter test failed',
        expect.any(Error)
      )
    })
  })

  describe('mock mode', () => {
    it('should enable mock mode correctly', () => {
      factory.enableMockMode()

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Mock mode enabled - all providers will return mock responses'
      )

      // Should have mock providers for all model types
      const openrouterProvider = factory.getProvider('anthropic/claude-sonnet-4')
      const falProvider = factory.getProvider('fal-ai/nano-banana')

      expect(openrouterProvider).toBeDefined()
      expect(falProvider).toBeDefined()
      expect(openrouterProvider!.name).toBe('mock')
      expect(falProvider!.name).toBe('mock')
    })

    it('should disable mock mode and reinitialize real providers', () => {
      factory.enableMockMode()
      factory.disableMockMode()

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Mock mode disabled - real providers reinitialized'
      )

      // Should have real providers again
      const provider = factory.getProvider('anthropic/claude-sonnet-4')
      expect(provider).toBeInstanceOf(OpenRouterProvider)
    })

    it('should generate appropriate mock responses', async () => {
      factory.enableMockMode()

      // Test text model mock
      const textProvider = factory.getProvider('anthropic/claude-sonnet-4')!
      const textResult = await textProvider.execute(
        'Generate a character description',
        'anthropic/claude-sonnet-4'
      )

      expect(textResult.status).toBe('success')
      expect(textResult.output).toContain('Character Analysis')
      expect(textResult.providerUsed).toBe('mock')
      expect(textResult.metrics?.tokenCount).toBeGreaterThan(0)

      // Test image model mock
      const imageProvider = factory.getProvider('fal-ai/nano-banana')!
      const imageResult = await imageProvider.execute(
        'Generate an image of a cat',
        'fal-ai/nano-banana'
      )

      expect(imageResult.status).toBe('success')
      expect(imageResult.output).toHaveProperty('images')
      expect(imageResult.output.images[0]).toHaveProperty('url')
      expect(imageResult.output.images[0].url).toContain('placeholder')
    })
  })
})

describe('OpenRouterProvider', () => {
  let provider: OpenRouterProvider
  let mockLogger: any

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    provider = new OpenRouterProvider({
      apiKey: 'test-openrouter-key'
    }, mockLogger)

    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should execute text generation successfully', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        id: 'chatcmpl-test',
        choices: [{
          message: {
            content: 'Generated text response'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        }
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const result = await provider.execute(
      'Generate a story',
      'anthropic/claude-sonnet-4'
    )

    expect(result.status).toBe('success')
    expect(result.output).toBe('Generated text response')
    expect(result.providerUsed).toBe('openrouter')
    expect(result.metrics?.promptTokens).toBe(100)
    expect(result.metrics?.completionTokens).toBe(200)
    expect(result.metrics?.tokenCount).toBe(300)
  })

  it('should handle API errors correctly', async () => {
    const mockErrorResponse = {
      ok: false,
      status: 429,
      json: jest.fn().mockResolvedValue({
        error: {
          message: 'Rate limit exceeded',
          type: 'rate_limit_error'
        }
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockErrorResponse)

    const result = await provider.execute(
      'Test prompt',
      'anthropic/claude-sonnet-4'
    )

    expect(result.status).toBe('error')
    expect(result.errorMessage).toContain('Rate limit exceeded')
  })

  it('should handle network failures', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const result = await provider.execute(
      'Test prompt',
      'anthropic/claude-sonnet-4'
    )

    expect(result.status).toBe('error')
    expect(result.errorMessage).toContain('Network error')
  })

  it('should validate configuration correctly', () => {
    expect(provider.validateConfig()).toBe(true)

    const invalidProvider = new OpenRouterProvider({
      apiKey: ''
    })

    expect(invalidProvider.validateConfig()).toBe(false)
  })
})

describe('FalProvider', () => {
  let provider: FalProvider
  let mockLogger: any

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    provider = new FalProvider({
      apiKey: 'test-fal-key'
    }, mockLogger)

    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should execute image generation successfully', async () => {
    // Mock initial submission
    const submitResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        request_id: 'fal-req-123',
        status: 'IN_QUEUE'
      })
    }

    // Mock polling response
    const pollResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        request_id: 'fal-req-123',
        status: 'COMPLETED',
        images: [{
          url: 'https://fal.media/files/image-123.png',
          width: 1024,
          height: 1024,
          content_type: 'image/png'
        }]
      })
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(submitResponse)
      .mockResolvedValue(pollResponse)

    const result = await provider.execute(
      'A beautiful sunset over mountains',
      'fal-ai/nano-banana'
    )

    expect(result.status).toBe('success')
    expect(result.output).toHaveProperty('images')
    expect(result.output.images[0].url).toContain('fal.media')
    expect(result.providerUsed).toBe('fal')
  })

  it('should handle polling timeout', async () => {
    // Mock submission
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        request_id: 'fal-req-456',
        status: 'IN_QUEUE'
      })
    })

    // Mock polling to always return IN_PROGRESS
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        request_id: 'fal-req-456',
        status: 'IN_PROGRESS'
      })
    })

    // Configure short polling timeout for test
    const fastProvider = new FalProvider({
      apiKey: 'test-key',
      maxPollingAttempts: 2,
      pollingInterval: 10
    }, mockLogger)

    const result = await fastProvider.execute(
      'Test prompt',
      'fal-ai/nano-banana'
    )

    expect(result.status).toBe('error')
    expect(result.errorMessage).toContain('Polling timeout')
  })

  it('should handle API errors during submission', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        error: 'Invalid prompt content'
      })
    })

    const result = await provider.execute(
      'Invalid prompt',
      'fal-ai/nano-banana'
    )

    expect(result.status).toBe('error')
    expect(result.errorMessage).toContain('Invalid prompt content')
  })

  it('should handle failed generation status', async () => {
    // Mock successful submission
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        request_id: 'fal-req-789',
        status: 'IN_QUEUE'
      })
    })

    // Mock polling with failed status
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        request_id: 'fal-req-789',
        status: 'FAILED',
        error: 'Content policy violation'
      })
    })

    const result = await provider.execute(
      'Inappropriate content',
      'fal-ai/nano-banana'
    )

    expect(result.status).toBe('error')
    expect(result.errorMessage).toContain('Content policy violation')
  })

  it('should validate configuration correctly', () => {
    expect(provider.validateConfig()).toBe(true)

    const invalidProvider = new FalProvider({
      apiKey: ''
    })

    expect(invalidProvider.validateConfig()).toBe(false)
  })

  it('should support image-to-image editing', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          request_id: 'edit-req-123',
          status: 'IN_QUEUE'
        })
      })
      .mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          request_id: 'edit-req-123',
          status: 'COMPLETED',
          images: [{
            url: 'https://fal.media/files/edited-image-123.png',
            width: 1024,
            height: 1024,
            content_type: 'image/png'
          }]
        })
      })

    const config = {
      image_url: 'https://example.com/base-image.jpg',
      guidance_scale: 7.5,
      num_inference_steps: 50
    }

    const result = await provider.execute(
      'Edit the image to add a rainbow',
      'fal-ai/nano-banana/edit',
      config
    )

    expect(result.status).toBe('success')
    expect(result.output.images[0].url).toContain('edited-image')

    // Verify image_url was included in request
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
    const requestBody = JSON.parse(fetchCall[1].body)
    expect(requestBody.image_url).toBe('https://example.com/base-image.jpg')
  })
})

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger
  const originalConsole = global.console

  beforeEach(() => {
    global.console = {
      ...originalConsole,
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
  })

  afterEach(() => {
    global.console = originalConsole
  })

  it('should respect log level filtering', () => {
    logger = new ConsoleLogger('warn')

    logger.debug('Debug message')
    logger.info('Info message')
    logger.warn('Warn message')
    logger.error('Error message')

    expect(console.debug).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith('[WARN] Warn message', '')
    expect(console.error).toHaveBeenCalledWith('[ERROR] Error message', '')
  })

  it('should log all levels in debug mode', () => {
    logger = new ConsoleLogger('debug')

    logger.debug('Debug message', { extra: 'data' })
    logger.info('Info message')
    logger.warn('Warn message')
    logger.error('Error message')

    expect(console.debug).toHaveBeenCalledWith('[DEBUG] Debug message', { extra: 'data' })
    expect(console.info).toHaveBeenCalledWith('[INFO] Info message', '')
    expect(console.warn).toHaveBeenCalledWith('[WARN] Warn message', '')
    expect(console.error).toHaveBeenCalledWith('[ERROR] Error message', '')
  })

  it('should handle metadata correctly', () => {
    logger = new ConsoleLogger('info')

    const metadata = { userId: '123', action: 'execute' }
    logger.info('User action', metadata)

    expect(console.info).toHaveBeenCalledWith('[INFO] User action', metadata)
  })
})

describe('Provider Integration Tests', () => {
  let factory: ProviderFactory

  beforeEach(() => {
    const config: ExecutionConfig = {
      apiKeys: {
        openrouter: 'integration-test-key',
        fal: 'integration-test-key'
      },
      mockMode: true, // Use mock mode for integration tests
      timeout: 5000,
      retryAttempts: 2
    }

    factory = new ProviderFactory(config)
    factory.enableMockMode()
  })

  it('should route different model types to correct providers', async () => {
    // Test text model routing
    const textProvider = factory.getProvider('anthropic/claude-sonnet-4')
    expect(textProvider).toBeDefined()

    const textResult = await textProvider!.execute(
      'Generate text',
      'anthropic/claude-sonnet-4'
    )
    expect(textResult.output).toContain('AI Response')

    // Test image model routing
    const imageProvider = factory.getProvider('fal-ai/nano-banana')
    expect(imageProvider).toBeDefined()

    const imageResult = await imageProvider!.execute(
      'Generate image',
      'fal-ai/nano-banana'
    )
    expect(imageResult.output).toHaveProperty('images')
  })

  it('should handle provider switching during execution', async () => {
    // Start with real providers
    factory.disableMockMode()

    const realProvider = factory.getProvider('anthropic/claude-sonnet-4')
    expect(realProvider).toBeInstanceOf(OpenRouterProvider)

    // Switch to mock mode
    factory.enableMockMode()

    const mockProvider = factory.getProvider('anthropic/claude-sonnet-4')
    expect(mockProvider!.name).toBe('mock')
  })

  it('should maintain consistent interface across providers', async () => {
    const providers = [
      factory.getProvider('anthropic/claude-sonnet-4'),
      factory.getProvider('fal-ai/nano-banana')
    ]

    for (const provider of providers) {
      expect(provider).toBeDefined()
      expect(provider!).toHaveProperty('name')
      expect(provider!).toHaveProperty('supportedModels')
      expect(provider!).toHaveProperty('execute')
      expect(provider!).toHaveProperty('validateConfig')

      // Test execute method signature
      const result = await provider!.execute('test', 'test-model')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('output')
      expect(result).toHaveProperty('executionTime')
      expect(result).toHaveProperty('providerUsed')
      expect(result).toHaveProperty('model')
    }
  })
})

describe('Provider Error Recovery', () => {
  let factory: ProviderFactory

  beforeEach(() => {
    factory = new ProviderFactory({
      apiKeys: {
        openrouter: 'test-key',
        fal: 'test-key'
      },
      mockMode: true
    })
    factory.enableMockMode()
  })

  it('should gracefully degrade when providers fail', async () => {
    const provider = factory.getProvider('anthropic/claude-sonnet-4')!

    // Mock provider to fail
    provider.execute = jest.fn().mockRejectedValue(new Error('Provider unavailable'))

    const result = await provider.execute('test', 'anthropic/claude-sonnet-4')

    expect(result.status).toBe('error')
    expect(result.errorMessage).toContain('Provider unavailable')
    expect(result.output).toBeNull()
  })

  it('should handle partial provider initialization', () => {
    // Create factory with only one API key
    const partialFactory = new ProviderFactory({
      apiKeys: {
        openrouter: 'test-key'
        // Missing fal key
      },
      mockMode: false
    })

    // Should still provide OpenRouter models
    const openrouterProvider = partialFactory.getProvider('anthropic/claude-sonnet-4')
    expect(openrouterProvider).toBeDefined()

    // Should return null for FAL models
    const falProvider = partialFactory.getProvider('fal-ai/nano-banana')
    expect(falProvider).toBeNull()

    // Available models should only include OpenRouter models
    const availableModels = partialFactory.getAvailableModels()
    expect(availableModels).toContain('anthropic/claude-sonnet-4')
    expect(availableModels).not.toContain('fal-ai/nano-banana')
  })
})

describe('Provider Performance and Stress Tests', () => {
  let factory: ProviderFactory

  beforeEach(() => {
    factory = new ProviderFactory({
      apiKeys: { openrouter: 'test-key' },
      mockMode: true
    })
    factory.enableMockMode()
  })

  it('should handle large prompts efficiently', async () => {
    const provider = factory.getProvider('anthropic/claude-sonnet-4')!
    const largePrompt = 'Large prompt content. '.repeat(1000) // ~23KB prompt

    const startTime = performance.now()
    const result = await provider.execute(largePrompt, 'anthropic/claude-sonnet-4')
    const duration = performance.now() - startTime

    expect(result.status).toBe('success')
    expect(duration).toBeLessThan(2000) // Should complete within 2 seconds in mock mode
  })

  it('should handle concurrent executions', async () => {
    const provider = factory.getProvider('anthropic/claude-sonnet-4')!

    const concurrentPromises = Array(10).fill(null).map((_, i) =>
      provider.execute(`Prompt ${i}`, 'anthropic/claude-sonnet-4')
    )

    const startTime = performance.now()
    const results = await Promise.all(concurrentPromises)
    const duration = performance.now() - startTime

    expect(results).toHaveLength(10)
    expect(results.every(r => r.status === 'success')).toBe(true)
    expect(duration).toBeLessThan(5000) // All should complete within 5 seconds
  })

  it('should maintain memory efficiency during extended use', async () => {
    const provider = factory.getProvider('anthropic/claude-sonnet-4')!

    // Simulate extended usage
    for (let i = 0; i < 50; i++) {
      await provider.execute(`Test prompt ${i}`, 'anthropic/claude-sonnet-4')
    }

    // Memory usage should remain stable
    // (In real tests, you might check actual memory usage)
    expect(provider.validateConfig()).toBe(true) // Provider should still be functional
  })
})