import type {
  ProviderAdapter,
  ExecutionResult,
  ExecutionConfig,
  ModelType,
  ExecutionLogger
} from '../types'
import { MODEL_TO_PROVIDER_MAP } from '../types'
import { OpenRouterProvider } from './openrouter'
import { FalProvider } from './fal'

// Simple console logger implementation
export class ConsoleLogger implements ExecutionLogger {
  private logLevel: string

  constructor(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.logLevel = logLevel
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.logLevel)
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, meta || '')
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, meta || '')
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, meta || '')
    }
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, meta || '')
    }
  }
}

// Provider Factory
export class ProviderFactory {
  private providers: Map<string, ProviderAdapter> = new Map()
  private config: ExecutionConfig
  private logger: ExecutionLogger

  constructor(config: ExecutionConfig, logger?: ExecutionLogger) {
    this.config = config
    this.logger = logger || new ConsoleLogger(config.logLevel || 'info')
    this.initializeProviders()
  }

  private initializeProviders(): void {
    // Initialize OpenRouter provider
    if (this.config.apiKeys.openrouter) {
      const openrouterProvider = new OpenRouterProvider(
        { apiKey: this.config.apiKeys.openrouter },
        this.logger
      )
      this.providers.set('openrouter', openrouterProvider)
      this.logger.info('OpenRouter provider initialized')
    } else if (!this.config.mockMode) {
      this.logger.warn('OpenRouter API key not provided')
    }

    // Initialize FAL provider
    if (this.config.apiKeys.fal) {
      const falProvider = new FalProvider(
        { apiKey: this.config.apiKeys.fal },
        this.logger
      )
      this.providers.set('fal', falProvider)
      this.logger.info('FAL provider initialized')
    } else if (!this.config.mockMode) {
      this.logger.warn('FAL API key not provided')
    }
  }

  getProvider(model: ModelType): ProviderAdapter | null {
    const providerName = MODEL_TO_PROVIDER_MAP[model]
    if (!providerName) {
      this.logger.error(`No provider mapping found for model: ${model}`)
      return null
    }

    const provider = this.providers.get(providerName)
    if (!provider) {
      this.logger.error(`Provider ${providerName} not initialized for model: ${model}`)
      return null
    }

    return provider
  }

  getAvailableModels(): ModelType[] {
    const availableModels: ModelType[] = []
    
    for (const [modelType, providerName] of Object.entries(MODEL_TO_PROVIDER_MAP)) {
      if (this.providers.has(providerName)) {
        availableModels.push(modelType as ModelType)
      }
    }

    return availableModels
  }

  async testAllProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    for (const [name, provider] of this.providers) {
      try {
        if ('testConnection' in provider && typeof provider.testConnection === 'function') {
          results[name] = await provider.testConnection()
        } else {
          results[name] = true // Assume working if no test method
        }
      } catch (error) {
        this.logger.error(`Provider ${name} test failed`, error)
        results[name] = false
      }
    }

    return results
  }

  // Mock provider for testing
  private createMockProvider(models: string[]): ProviderAdapter {
    return {
      name: 'mock',
      supportedModels: models,
      validateConfig: () => true,
      execute: async (prompt: string, model: string): Promise<ExecutionResult> => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
        
        const mockOutput = this.generateMockOutput(prompt, model)
        
        return {
          output: mockOutput,
          status: 'success',
          executionTime: Math.random() * 1000 + 500,
          providerUsed: 'mock',
          model,
          metrics: {
            tokenCount: Math.floor(Math.random() * 1000) + 100,
            latency: Math.random() * 1000 + 500,
            retryCount: 0
          }
        }
      }
    }
  }

  private generateMockOutput(prompt: string, model: string): any {
    if (model.includes('fal-ai')) {
      // Mock image generation response
      return {
        images: [{
          url: 'https://via.placeholder.com/1024x1024.png?text=Mock+Generated+Image',
          width: 1024,
          height: 1024,
          content_type: 'image/png'
        }],
        prompt
      }
    } else {
      // Mock text response
      const promptLower = prompt.toLowerCase()
      
      if (promptLower.includes('character')) {
        return `Character Analysis (Generated by ${model}):\n\nBased on your prompt, here's a character profile with complex motivations and development arc.`
      } else if (promptLower.includes('story')) {
        return `Story Analysis (Generated by ${model}):\n\nThe narrative shows strong structure with clear character development and engaging plot progression.`
      } else {
        return `AI Response (Generated by ${model}):\n\nThis is a mock response to your prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`
      }
    }
  }

  // Enable mock mode for testing
  enableMockMode(): void {
    this.config.mockMode = true
    
    // Add mock providers for all model types
    const textModels = ['anthropic/claude-sonnet-4', 'qwen/qwen3-vl-235b-a22b-thinking']
    const imageModels = ['fal-ai/nano-banana', 'fal-ai/nano-banana/edit']
    
    this.providers.set('openrouter', this.createMockProvider(textModels))
    this.providers.set('fal', this.createMockProvider(imageModels))
    
    this.logger.info('Mock mode enabled - all providers will return mock responses')
  }

  disableMockMode(): void {
    this.config.mockMode = false
    this.providers.clear()
    this.initializeProviders()
    this.logger.info('Mock mode disabled - real providers reinitialized')
  }
}

// Factory function for easy instantiation
export function createProviderFactory(config: ExecutionConfig): ProviderFactory {
  return new ProviderFactory(config)
}

// Export provider classes
export { OpenRouterProvider, FalProvider }
