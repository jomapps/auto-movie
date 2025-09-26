/**
 * AI Service Error Handling and Fallbacks
 * Comprehensive error handling for AI/LLM service failures with graceful degradation
 */

import { aiLogger, AppError, ErrorType } from '@/utils/logger'

/**
 * AI service error types
 */
export enum AIErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  INVALID_REQUEST = 'INVALID_REQUEST',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_KEY_INVALID = 'API_KEY_INVALID',
  CONTENT_FILTERED = 'CONTENT_FILTERED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * AI service configuration
 */
export interface AIServiceConfig {
  name: string
  baseUrl: string
  apiKey: string
  model: string
  timeout: number
  maxRetries: number
  retryDelay: number
  priority: number // Lower number = higher priority
}

/**
 * AI response structure
 */
export interface AIResponse {
  content: string
  model: string
  service: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason?: string
  choices?: Array<{
    id: string
    title: string
    description: string
    type: 'recommended' | 'alternative' | 'manual'
  }>
  metadata?: Record<string, any>
}

/**
 * AI service error class
 */
export class AIServiceError extends AppError {
  public readonly aiErrorType: AIErrorType
  public readonly service: string
  public readonly retryable: boolean

  constructor(
    message: string,
    aiErrorType: AIErrorType,
    service: string,
    retryable: boolean = true,
    metadata?: Record<string, any>
  ) {
    super(message, ErrorType.AI_SERVICE, 503, true, metadata)
    this.aiErrorType = aiErrorType
    this.service = service
    this.retryable = retryable
  }
}

/**
 * AI service manager with fallbacks
 */
export class AIServiceManager {
  private services: AIServiceConfig[] = []
  private circuitBreakers = new Map<string, CircuitBreaker>()

  constructor() {
    this.initializeServices()
  }

  private initializeServices(): void {
    // Primary AI service (Novel LLM)
    if (process.env.NOVEL_LLM_API_KEY) {
      this.services.push({
        name: 'novel-llm',
        baseUrl: process.env.NOVEL_LLM_BASE_URL || 'https://api.novellm.com/v1',
        apiKey: process.env.NOVEL_LLM_API_KEY,
        model: 'gpt-4-turbo-preview',
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        priority: 1,
      })
    }

    // Fallback services
    if (process.env.OPENAI_API_KEY) {
      this.services.push({
        name: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',
        timeout: 30000,
        maxRetries: 2,
        retryDelay: 2000,
        priority: 2,
      })
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.services.push({
        name: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-sonnet-20240229',
        timeout: 30000,
        maxRetries: 2,
        retryDelay: 2000,
        priority: 3,
      })
    }

    // Sort by priority
    this.services.sort((a, b) => a.priority - b.priority)

    // Initialize circuit breakers
    this.services.forEach(service => {
      this.circuitBreakers.set(service.name, new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 30000,
      }))
    })

    aiLogger.info('AI services initialized', {
      serviceCount: this.services.length,
      services: this.services.map(s => ({ name: s.name, priority: s.priority })),
    })
  }

  /**
   * Generate AI response with fallback handling
   */
  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    context: Record<string, any> = {},
    options: {
      preferredService?: string
      maxTokens?: number
      temperature?: number
      timeout?: number
    } = {}
  ): Promise<AIResponse> {
    const startTime = Date.now()
    let lastError: AIServiceError | null = null

    // Get available services (excluding circuit breaker opened ones)
    const availableServices = this.services.filter(service => {
      const breaker = this.circuitBreakers.get(service.name)
      return breaker?.isAvailable() !== false
    })

    if (availableServices.length === 0) {
      // All services are down - use emergency fallback
      return this.emergencyFallback(messages, context)
    }

    // Try preferred service first if specified and available
    if (options.preferredService) {
      const preferredService = availableServices.find(s => s.name === options.preferredService)
      if (preferredService) {
        availableServices.splice(availableServices.indexOf(preferredService), 1)
        availableServices.unshift(preferredService)
      }
    }

    for (const service of availableServices) {
      try {
        const breaker = this.circuitBreakers.get(service.name)!
        
        const response = await breaker.execute(async () => {
          return this.callAIService(service, messages, context, options)
        })

        const duration = Date.now() - startTime
        aiLogger.info('AI response generated successfully', {
          service: service.name,
          duration: `${duration}ms`,
          model: response.model,
          usage: response.usage,
        })

        return response
      } catch (error) {
        lastError = this.handleServiceError(error as Error, service)
        
        aiLogger.warn('AI service failed, trying fallback', {
          service: service.name,
          error: lastError.message,
          aiErrorType: lastError.aiErrorType,
          retryable: lastError.retryable,
        })

        // If error is not retryable, skip other services of the same type
        if (!lastError.retryable) {
          break
        }
      }
    }

    // All services failed - return emergency fallback or throw
    if (lastError) {
      if (this.shouldUseEmergencyFallback(lastError)) {
        return this.emergencyFallback(messages, context)
      }
      throw lastError
    }

    throw new AIServiceError(
      'No AI services available',
      AIErrorType.MODEL_UNAVAILABLE,
      'none',
      false
    )
  }

  /**
   * Call a specific AI service
   */
  private async callAIService(
    service: AIServiceConfig,
    messages: Array<{ role: string; content: string }>,
    context: Record<string, any>,
    options: Record<string, any>
  ): Promise<AIResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.timeout || service.timeout)

    try {
      const requestBody = this.buildRequestBody(service, messages, context, options)
      
      const response = await fetch(`${service.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${service.apiKey}`,
          ...(service.name === 'anthropic' && {
            'anthropic-version': '2023-06-01',
          }),
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(`HTTP ${response.status}: ${errorData?.error?.message || response.statusText}`)
      }

      const data = await response.json()
      return this.parseResponse(data, service)
    } catch (error) {
      clearTimeout(timeout)
      throw error
    }
  }

  /**
   * Build request body for different AI services
   */
  private buildRequestBody(
    service: AIServiceConfig,
    messages: Array<{ role: string; content: string }>,
    context: Record<string, any>,
    options: Record<string, any>
  ): Record<string, any> {
    const baseBody = {
      model: service.model,
      messages,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
    }

    // Service-specific adjustments
    switch (service.name) {
      case 'anthropic':
        return {
          ...baseBody,
          max_tokens: baseBody.max_tokens,
          system: context.systemPrompt || undefined,
        }
      
      case 'openai':
      case 'novel-llm':
      default:
        return {
          ...baseBody,
          functions: context.functions || undefined,
          function_call: context.function_call || undefined,
        }
    }
  }

  /**
   * Parse response from different AI services
   */
  private parseResponse(data: any, service: AIServiceConfig): AIResponse {
    const choice = data.choices?.[0]
    if (!choice) {
      throw new AIServiceError(
        'No response choices returned',
        AIErrorType.INVALID_REQUEST,
        service.name,
        false
      )
    }

    const response: AIResponse = {
      content: choice.message?.content || choice.text || '',
      model: data.model || service.model,
      service: service.name,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
      } : undefined,
      finishReason: choice.finish_reason,
    }

    // Parse function calls if present
    if (choice.message?.function_call) {
      try {
        const functionArgs = JSON.parse(choice.message.function_call.arguments)
        if (choice.message.function_call.name === 'generate_choices' && functionArgs.choices) {
          response.choices = functionArgs.choices
        }
      } catch (parseError) {
        aiLogger.warn('Failed to parse function call', { error: parseError.message })
      }
    }

    return response
  }

  /**
   * Handle service-specific errors
   */
  private handleServiceError(error: Error, service: AIServiceConfig): AIServiceError {
    const message = error.message.toLowerCase()

    // Rate limiting
    if (message.includes('rate limit') || message.includes('429')) {
      return new AIServiceError(
        'AI service rate limit exceeded',
        AIErrorType.RATE_LIMIT,
        service.name,
        true,
        { originalError: error.message }
      )
    }

    // Quota exceeded
    if (message.includes('quota') || message.includes('usage limit')) {
      return new AIServiceError(
        'AI service quota exceeded',
        AIErrorType.QUOTA_EXCEEDED,
        service.name,
        false,
        { originalError: error.message }
      )
    }

    // Authentication
    if (message.includes('unauthorized') || message.includes('401') || message.includes('api key')) {
      return new AIServiceError(
        'AI service authentication failed',
        AIErrorType.API_KEY_INVALID,
        service.name,
        false,
        { originalError: error.message }
      )
    }

    // Content filtering
    if (message.includes('content policy') || message.includes('filtered')) {
      return new AIServiceError(
        'Content filtered by AI service',
        AIErrorType.CONTENT_FILTERED,
        service.name,
        false,
        { originalError: error.message }
      )
    }

    // Timeout
    if (message.includes('timeout') || message.includes('aborted')) {
      return new AIServiceError(
        'AI service request timed out',
        AIErrorType.TIMEOUT,
        service.name,
        true,
        { originalError: error.message }
      )
    }

    // Network errors
    if (message.includes('network') || message.includes('connection') || message.includes('fetch failed')) {
      return new AIServiceError(
        'AI service network error',
        AIErrorType.NETWORK_ERROR,
        service.name,
        true,
        { originalError: error.message }
      )
    }

    // Model unavailable
    if (message.includes('model') || message.includes('503')) {
      return new AIServiceError(
        'AI model temporarily unavailable',
        AIErrorType.MODEL_UNAVAILABLE,
        service.name,
        true,
        { originalError: error.message }
      )
    }

    // Default error
    return new AIServiceError(
      `AI service error: ${error.message}`,
      AIErrorType.UNKNOWN,
      service.name,
      true,
      { originalError: error.message }
    )
  }

  /**
   * Determine if emergency fallback should be used
   */
  private shouldUseEmergencyFallback(error: AIServiceError): boolean {
    // Use fallback for temporary issues, not permanent ones
    return error.retryable && ![
      AIErrorType.API_KEY_INVALID,
      AIErrorType.CONTENT_FILTERED,
      AIErrorType.INVALID_REQUEST,
    ].includes(error.aiErrorType)
  }

  /**
   * Emergency fallback response when all services fail
   */
  private emergencyFallback(
    messages: Array<{ role: string; content: string }>,
    context: Record<string, any>
  ): AIResponse {
    aiLogger.warn('Using emergency fallback response')

    // Generate a helpful fallback response based on the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
    
    let fallbackContent = "I'm experiencing technical difficulties with my AI services right now. "

    // Context-aware fallback responses
    if (lastUserMessage.toLowerCase().includes('help')) {
      fallbackContent += "I'd love to help you with your project! While my AI processing is temporarily unavailable, you can continue by selecting one of the manual options or try again in a few minutes."
    } else if (lastUserMessage.toLowerCase().includes('choice')) {
      fallbackContent += "I'm having trouble generating response choices at the moment. Please try again in a few minutes, or feel free to describe what you'd like to do next in your own words."
    } else {
      fallbackContent += "Please try your request again in a few minutes. In the meantime, you can continue working on your project manually or explore the media upload features."
    }

    return {
      content: fallbackContent,
      model: 'fallback',
      service: 'emergency-fallback',
      choices: [
        {
          id: 'manual_continue',
          title: 'Continue Manually',
          description: 'Proceed with manual input instead of AI assistance',
          type: 'manual',
        },
        {
          id: 'retry_later',
          title: 'Try Again Later',
          description: 'Wait a few minutes and retry the AI request',
          type: 'alternative',
        },
        {
          id: 'upload_files',
          title: 'Upload Reference Files',
          description: 'Upload images or documents to help with your project',
          type: 'alternative',
        },
      ],
      metadata: {
        isFallback: true,
        fallbackReason: 'AI services temporarily unavailable',
      },
    }
  }

  /**
   * Get service health status
   */
  getServiceHealth(): Record<string, any> {
    return Object.fromEntries(
      this.services.map(service => [
        service.name,
        {
          available: this.circuitBreakers.get(service.name)?.isAvailable() !== false,
          priority: service.priority,
          stats: this.circuitBreakers.get(service.name)?.getStats(),
        }
      ])
    )
  }
}

/**
 * Simple circuit breaker implementation
 */
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private config: {
      failureThreshold: number
      resetTimeout: number
      monitoringPeriod: number
    }
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open'
    }
  }

  isAvailable(): boolean {
    return this.state !== 'open'
  }

  getStats(): Record<string, any> {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    }
  }
}

// Export singleton instance
export const aiServiceManager = new AIServiceManager()
export default aiServiceManager