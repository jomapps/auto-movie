// Core execution engine types
export interface ExecutionConfig {
  apiKeys: {
    openrouter?: string
    fal?: string
  }
  mockMode?: boolean
  timeout?: number
  retryAttempts?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

export interface ExecutionResult {
  output: any
  status: 'success' | 'error'
  errorMessage?: string
  executionTime: number
  providerUsed: string
  model: string
  metrics?: ExecutionMetrics
}

export interface ExecutionMetrics {
  tokenCount?: number
  promptTokens?: number
  completionTokens?: number
  cost?: number
  latency: number
  retryCount: number
}

// Provider interfaces
export interface ProviderAdapter {
  name: string
  supportedModels: string[]
  execute(prompt: string, model: string, config?: any): Promise<ExecutionResult>
  validateConfig(): boolean
}

export interface OpenRouterConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

export interface FalConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
  pollingInterval?: number
  maxPollingAttempts?: number
}

// Provider-specific request/response types
export interface OpenRouterRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string | Array<{ type: string; text?: string; image_url?: any }>
  }>
  max_tokens?: number
  temperature?: number
  top_p?: number
  stream?: boolean
}

export interface OpenRouterResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface FalImageRequest {
  prompt: string
  image_size?: string
  num_images?: number
  guidance_scale?: number
  num_inference_steps?: number
  seed?: number
  image_url?: string // For image-to-image
}

export interface FalResponse {
  request_id: string
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  images?: Array<{
    url: string
    width: number
    height: number
    content_type: string
  }>
  error?: string
}

// Variable interpolation types
export interface VariableContext {
  variables: Record<string, any>
  variableDefs: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'json' | 'text' | 'url'
    required: boolean
    defaultValue?: any
  }>
}

export interface InterpolationResult {
  resolvedPrompt: string
  errors: string[]
  missingVariables: string[]
  usedVariables: string[]
}

// Model type mapping
export type ModelType =
  | 'anthropic/claude-sonnet-4'
  | 'qwen/qwen3-vl-235b-a22b-thinking'
  | 'fal-ai/nano-banana'
  | 'fal-ai/nano-banana/edit'

export const MODEL_TO_PROVIDER_MAP: Record<ModelType, string> = {
  'anthropic/claude-sonnet-4': 'openrouter',
  'qwen/qwen3-vl-235b-a22b-thinking': 'openrouter',
  'fal-ai/nano-banana': 'fal',
  'fal-ai/nano-banana/edit': 'fal'
}

// Logging interface
export interface ExecutionLogger {
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
}
