import type {
  ProviderAdapter,
  ExecutionResult,
  FalConfig,
  FalImageRequest,
  FalResponse,
  ExecutionLogger
} from '../types'

export class FalProvider implements ProviderAdapter {
  name = 'fal'
  supportedModels = [
    'fal-ai/nano-banana',
    'fal-ai/nano-banana/edit'
  ]

  private config: FalConfig
  private logger: ExecutionLogger

  constructor(config: FalConfig, logger: ExecutionLogger) {
    this.config = {
      baseUrl: 'https://fal.run/fal-ai',
      timeout: 60000,
      pollingInterval: 1000,
      maxPollingAttempts: 60,
      ...config
    }
    this.logger = logger
  }

  validateConfig(): boolean {
    if (!this.config.apiKey) {
      this.logger.error('FAL API key is required')
      return false
    }
    return true
  }

  async execute(prompt: string, model: string, config?: any): Promise<ExecutionResult> {
    const startTime = Date.now()
    const retryCount = 0

    if (!this.validateConfig()) {
      return {
        output: null,
        status: 'error',
        errorMessage: 'Invalid FAL configuration',
        executionTime: 0,
        providerUsed: this.name,
        model
      }
    }

    if (!this.supportedModels.includes(model)) {
      return {
        output: null,
        status: 'error',
        errorMessage: `Model ${model} not supported by FAL provider`,
        executionTime: 0,
        providerUsed: this.name,
        model
      }
    }

    try {
      this.logger.info('Executing image generation with FAL', { model, promptLength: prompt.length })

      const modelEndpoint = this.getModelEndpoint(model)
      const requestBody = this.buildRequestBody(prompt, model, config)

      // Submit the request
      const jobId = await this.submitRequest(modelEndpoint, requestBody)
      this.logger.debug('FAL job submitted', { jobId, model })

      // Poll for results
      const result = await this.pollForResult(jobId)
      const executionTime = Date.now() - startTime

      if (result.status === 'COMPLETED' && result.images) {
        this.logger.info('FAL execution completed', {
          model,
          executionTime,
          imagesGenerated: result.images.length
        })

        return {
          output: {
            images: result.images,
            prompt: prompt
          },
          status: 'success',
          executionTime,
          providerUsed: this.name,
          model,
          metrics: {
            latency: executionTime,
            retryCount
          }
        }
      } else {
        throw new Error(result.error || 'Image generation failed')
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown FAL error'
      
      this.logger.error('FAL execution failed', { error: errorMessage, model, executionTime })

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

  private getModelEndpoint(model: string): string {
    switch (model) {
      case 'fal-ai/nano-banana':
        return '/nano-banana'
      case 'fal-ai/nano-banana/edit':
        return '/nano-banana/edit'
      default:
        throw new Error(`Unknown FAL model: ${model}`)
    }
  }

  private buildRequestBody(prompt: string, model: string, config?: any): FalImageRequest {
    const baseRequest: FalImageRequest = {
      prompt,
      image_size: config?.imageSize || '1024x1024',
      num_images: config?.numImages || 1,
      guidance_scale: config?.guidanceScale || 7.5,
      num_inference_steps: config?.numInferenceSteps || 50,
      seed: config?.seed
    }

    // Add image_url for image-to-image models
    if (model.includes('/edit') && config?.imageUrl) {
      baseRequest.image_url = config.imageUrl
    }

    return baseRequest
  }

  private async submitRequest(endpoint: string, requestBody: FalImageRequest): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout!)

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`FAL API error: ${response.status} ${response.statusText} - ${errorBody}`)
      }

      const result = await response.json()
      return result.request_id
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`FAL request timeout after ${this.config.timeout}ms`)
      }
      throw error
    }
  }

  private async pollForResult(jobId: string): Promise<FalResponse> {
    let attempts = 0
    const maxAttempts = this.config.maxPollingAttempts!

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.config.baseUrl}/requests/${jobId}/status`, {
          headers: {
            'Authorization': `Key ${this.config.apiKey}`
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to check status: ${response.status} ${response.statusText}`)
        }

        const result: FalResponse = await response.json()

        if (result.status === 'COMPLETED' || result.status === 'FAILED') {
          return result
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, this.config.pollingInterval!))
        attempts++
        
        this.logger.debug('Polling FAL job status', { jobId, status: result.status, attempt: attempts })
      } catch (error) {
        this.logger.warn('Error polling FAL job status', { jobId, error: error instanceof Error ? error.message : String(error) })
        attempts++
        await new Promise(resolve => setTimeout(resolve, this.config.pollingInterval!))
      }
    }

    throw new Error(`Job ${jobId} did not complete within ${maxAttempts} attempts`)
  }

  // Helper method for testing API key
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.execute('test prompt', 'fal-ai/nano-banana', { numImages: 1 })
      return result.status === 'success'
    } catch {
      return false
    }
  }

  // Utility method to download image from URL
  async downloadImage(imageUrl: string): Promise<Buffer> {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }
    return Buffer.from(await response.arrayBuffer())
  }
}
