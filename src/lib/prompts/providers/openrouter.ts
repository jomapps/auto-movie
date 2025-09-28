import type {
  ProviderAdapter,
  ExecutionResult,
  OpenRouterConfig,
  OpenRouterRequest,
  OpenRouterResponse,
  ExecutionLogger
} from '../types'

export class OpenRouterProvider implements ProviderAdapter {
  name = 'openrouter'
  supportedModels = [
    'anthropic/claude-sonnet-4',
    'qwen/qwen3-vl-235b-a22b-thinking'
  ]

  private config: OpenRouterConfig
  private logger: ExecutionLogger

  constructor(config: OpenRouterConfig, logger: ExecutionLogger) {
    this.config = {
      baseUrl: 'https://openrouter.ai/api/v1',
      timeout: 30000,
      ...config
    }
    this.logger = logger
  }

  validateConfig(): boolean {
    if (!this.config.apiKey) {
      this.logger.error('OpenRouter API key is required')
      return false
    }
    return true
  }

  async execute(prompt: string, model: string, config?: any): Promise<ExecutionResult> {
    const startTime = Date.now()
    let retryCount = 0

    if (!this.validateConfig()) {
      return {
        output: null,
        status: 'error',
        errorMessage: 'Invalid OpenRouter configuration',
        executionTime: 0,
        providerUsed: this.name,
        model
      }
    }

    if (!this.supportedModels.includes(model)) {
      return {
        output: null,
        status: 'error',
        errorMessage: `Model ${model} not supported by OpenRouter provider`,
        executionTime: 0,
        providerUsed: this.name,
        model
      }
    }

    try {
      this.logger.info('Executing prompt with OpenRouter', { model, promptLength: prompt.length })

      const requestBody: OpenRouterRequest = {
        model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: config?.maxTokens || 4000,
        temperature: config?.temperature || 0.7,
        top_p: config?.topP || 0.9
      }

      // Handle vision models differently
      if (model.includes('vl') && config?.imageUrl) {
        requestBody.messages[0].content = [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: config.imageUrl } }
        ]
      }

      const response = await this.makeRequest(requestBody)
      const executionTime = Date.now() - startTime

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response choices received from OpenRouter')
      }

      const output = response.choices[0].message.content
      
      this.logger.info('OpenRouter execution completed', {
        model,
        executionTime,
        tokensUsed: response.usage?.total_tokens
      })

      return {
        output,
        status: 'success',
        executionTime,
        providerUsed: this.name,
        model,
        metrics: {
          tokenCount: response.usage?.total_tokens,
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          latency: executionTime,
          retryCount
        }
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown OpenRouter error'
      
      this.logger.error('OpenRouter execution failed', { error: errorMessage, model, executionTime })

      return {
        output: null,
        status: 'error',
        errorMessage,
        executionTime,
        providerUsed: this.name,
        model,
        metrics: {
          latency: executionTime,
          retryCount
        }
      }
    }
  }

  private async makeRequest(requestBody: OpenRouterRequest): Promise<OpenRouterResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout!)

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3010',
          'X-Title': 'Auto Movie Platform'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorBody}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OpenRouter request timeout after ${this.config.timeout}ms`)
      }
      throw error
    }
  }

  // Helper method for testing API key
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.execute('Hello', 'anthropic/claude-sonnet-4', { maxTokens: 10 })
      return result.status === 'success'
    } catch {
      return false
    }
  }
}
