import type {
  ExecutionConfig,
  ExecutionResult,
  VariableContext,
  InterpolationResult,
  ModelType,
  ExecutionLogger
} from './types'
import { ProviderFactory, ConsoleLogger } from './providers'

/**
 * Variable interpolation engine
 * Handles replacement of {{variableName}} placeholders with actual values
 */
export class VariableInterpolator {
  private logger: ExecutionLogger

  constructor(logger?: ExecutionLogger) {
    this.logger = logger || new ConsoleLogger()
  }

  /**
   * Interpolate variables in a template string
   */
  interpolate(template: string, context: VariableContext): InterpolationResult {
    const errors: string[] = []
    const missingVariables: string[] = []
    const usedVariables: string[] = []
    let resolvedPrompt = template

    // Validate required variables
    for (const varDef of context.variableDefs) {
      if (varDef.required && !(varDef.name in context.variables)) {
        missingVariables.push(varDef.name)
        errors.push(`Required variable '${varDef.name}' is missing`)
      }
    }

    // Return early if there are missing required variables
    if (missingVariables.length > 0) {
      return {
        resolvedPrompt: template,
        errors,
        missingVariables,
        usedVariables
      }
    }

    // Replace variables in template
    for (const varDef of context.variableDefs) {
      const placeholder = `{{${varDef.name}}}`
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')
      
      if (template.includes(placeholder)) {
        usedVariables.push(varDef.name)
        
        const rawValue = context.variables[varDef.name] ?? varDef.defaultValue
        const stringValue = this.convertValueToString(rawValue, varDef.type)
        
        resolvedPrompt = resolvedPrompt.replace(regex, stringValue)
        
        this.logger.debug(`Replaced variable '${varDef.name}' with value of type '${varDef.type}'`)
      }
    }

    // Check for any remaining unreplaced variables
    const unreplacedMatches = resolvedPrompt.match(/{{\w+}}/g)
    if (unreplacedMatches) {
      for (const match of unreplacedMatches) {
        const varName = match.slice(2, -2) // Remove {{ and }}
        errors.push(`Variable '${varName}' found in template but not defined`)
      }
    }

    return {
      resolvedPrompt,
      errors,
      missingVariables,
      usedVariables
    }
  }

  private convertValueToString(value: any, type: string): string {
    if (value === null || value === undefined) {
      return ''
    }

    switch (type) {
      case 'json':
        return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
      case 'boolean':
        return value ? 'true' : 'false'
      case 'number':
        return String(Number(value))
      case 'url':
        // Basic URL validation
        const urlValue = String(value)
        if (!urlValue.startsWith('http://') && !urlValue.startsWith('https://') && !urlValue.startsWith('data:')) {
          this.logger.warn(`URL variable may be invalid: ${urlValue}`)
        }
        return urlValue
      case 'text':
      case 'string':
      default:
        return String(value)
    }
  }

  /**
   * Extract variable names from a template
   */
  extractVariableNames(template: string): string[] {
    const matches = template.match(/{{(\w+)}}/g)
    if (!matches) return []
    
    return matches.map(match => match.slice(2, -2)) // Remove {{ and }}
  }

  /**
   * Validate that all variables in template are defined
   */
  validateTemplate(template: string, variableDefs: VariableContext['variableDefs']): string[] {
    const errors: string[] = []
    const templateVars = this.extractVariableNames(template)
    const definedVars = new Set(variableDefs.map(def => def.name))

    for (const varName of templateVars) {
      if (!definedVars.has(varName)) {
        errors.push(`Variable '${varName}' used in template but not defined`)
      }
    }

    return errors
  }
}

/**
 * Main execution engine
 * Coordinates variable interpolation and provider execution
 */
export class PromptExecutionEngine {
  private config: ExecutionConfig
  private providerFactory: ProviderFactory
  private interpolator: VariableInterpolator
  private logger: ExecutionLogger

  constructor(config: ExecutionConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      logLevel: 'info',
      mockMode: false,
      ...config
    }
    
    this.logger = new ConsoleLogger(this.config.logLevel)
    this.providerFactory = new ProviderFactory(this.config, this.logger)
    this.interpolator = new VariableInterpolator(this.logger)

    this.logger.info('Prompt execution engine initialized', {
      mockMode: this.config.mockMode,
      availableModels: this.providerFactory.getAvailableModels()
    })
  }

  /**
   * Execute a prompt with variable interpolation and provider routing
   */
  async execute(
    template: string,
    variableContext: VariableContext,
    model: ModelType,
    executionConfig?: any
  ): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    try {
      this.logger.info('Starting prompt execution', {
        model,
        templateLength: template.length,
        variableCount: variableContext.variableDefs.length
      })

      // Step 1: Interpolate variables
      const interpolationResult = this.interpolator.interpolate(template, variableContext)
      
      if (interpolationResult.errors.length > 0) {
        const errorMessage = `Variable interpolation failed: ${interpolationResult.errors.join(', ')}`
        this.logger.error(errorMessage)
        
        return {
          output: null,
          status: 'error',
          errorMessage,
          executionTime: Date.now() - startTime,
          providerUsed: 'none',
          model
        }
      }

      this.logger.debug('Variable interpolation completed', {
        usedVariables: interpolationResult.usedVariables,
        resolvedLength: interpolationResult.resolvedPrompt.length
      })

      // Step 2: Get provider for model
      const provider = this.providerFactory.getProvider(model)
      if (!provider) {
        const errorMessage = `No provider available for model: ${model}`
        this.logger.error(errorMessage)
        
        return {
          output: null,
          status: 'error',
          errorMessage,
          executionTime: Date.now() - startTime,
          providerUsed: 'none',
          model
        }
      }

      // Step 3: Execute with provider
      const result = await this.executeWithRetry(
        provider,
        interpolationResult.resolvedPrompt,
        model,
        executionConfig
      )

      this.logger.info('Prompt execution completed', {
        status: result.status,
        executionTime: result.executionTime,
        provider: result.providerUsed
      })

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error'
      const executionTime = Date.now() - startTime
      
      this.logger.error('Prompt execution failed', { error: errorMessage, executionTime })

      return {
        output: null,
        status: 'error',
        errorMessage,
        executionTime,
        providerUsed: 'unknown',
        model
      }
    }
  }

  private async executeWithRetry(
    provider: any,
    prompt: string,
    model: ModelType,
    config?: any
  ): Promise<ExecutionResult> {
    let lastError: Error | null = null
    const maxAttempts = this.config.retryAttempts || 3

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.debug(`Execution attempt ${attempt}/${maxAttempts}`, { model, provider: provider.name })
        
        const result = await provider.execute(prompt, model, config)
        
        if (result.status === 'success') {
          if (result.metrics) {
            result.metrics.retryCount = attempt - 1
          }
          return result
        } else {
          lastError = new Error(result.errorMessage || 'Provider execution failed')
          if (attempt === maxAttempts) {
            break
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        this.logger.warn(`Execution attempt ${attempt} failed`, {
          error: lastError.message,
          willRetry: attempt < maxAttempts
        })
        
        if (attempt < maxAttempts) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All attempts failed
    return {
      output: null,
      status: 'error',
      errorMessage: lastError?.message || 'All retry attempts failed',
      executionTime: 0,
      providerUsed: provider.name,
      model,
      metrics: {
        retryCount: maxAttempts,
        latency: 0
      }
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): ModelType[] {
    return this.providerFactory.getAvailableModels()
  }

  /**
   * Test all provider connections
   */
  async testProviders(): Promise<Record<string, boolean>> {
    return this.providerFactory.testAllProviders()
  }

  /**
   * Enable/disable mock mode
   */
  setMockMode(enabled: boolean): void {
    if (enabled) {
      this.providerFactory.enableMockMode()
    } else {
      this.providerFactory.disableMockMode()
    }
    this.config.mockMode = enabled
    this.logger.info(`Mock mode ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Validate a template without executing
   */
  validateTemplate(template: string, variableDefs: VariableContext['variableDefs']): string[] {
    return this.interpolator.validateTemplate(template, variableDefs)
  }

  /**
   * Get execution engine status
   */
  getStatus(): {
    mockMode: boolean
    availableModels: ModelType[]
    config: ExecutionConfig
  } {
    return {
      mockMode: this.config.mockMode || false,
      availableModels: this.getAvailableModels(),
      config: this.config
    }
  }
}

/**
 * Factory function to create execution engine with environment config
 */
export function createExecutionEngine(overrides?: Partial<ExecutionConfig>): PromptExecutionEngine {
  const config: ExecutionConfig = {
    apiKeys: {
      openrouter: process.env.OPENROUTER_API_KEY,
      fal: process.env.FAL_KEY || process.env.FAL_API_KEY // Support both naming conventions
    },
    mockMode: process.env.NODE_ENV === 'development' && process.env.MOCK_MODE === 'true',
    timeout: parseInt(process.env.EXECUTION_TIMEOUT || '30000'),
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    ...overrides
  }

  return new PromptExecutionEngine(config)
}

// Export main classes and types
export type { ExecutionConfig, ExecutionResult, VariableContext, InterpolationResult, ModelType }
export { ConsoleLogger }
