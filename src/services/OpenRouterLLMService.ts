import { OpenRouterProvider } from '@/lib/prompts/providers/openrouter'
import type { ExecutionLogger } from '@/lib/prompts/types'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatContext {
  projectId: string
  currentStep?: string
  sessionId?: string
  extractedEntities?: any[]
}

export interface LLMResponse {
  message: string
  confidence: number
  suggestedActions?: string[]
  extractedEntities?: any[]
}

/**
 * OpenRouterLLMService - Wrapper for chat integration
 * Handles conversation management and context-aware AI responses
 */
export class OpenRouterLLMService {
  private provider: OpenRouterProvider
  private logger: ExecutionLogger

  constructor(apiKey?: string) {
    // Create console logger for service
    this.logger = {
      info: (msg: string, meta?: any) => console.log('[OpenRouterLLM]', msg, meta || ''),
      error: (msg: string, meta?: any) => console.error('[OpenRouterLLM]', msg, meta || ''),
      warn: (msg: string, meta?: any) => console.warn('[OpenRouterLLM]', msg, meta || ''),
      debug: (msg: string, meta?: any) => console.debug('[OpenRouterLLM]', msg, meta || ''),
    }

    this.provider = new OpenRouterProvider(
      {
        apiKey: apiKey || process.env.OPENROUTER_API_KEY || '',
        baseUrl: 'https://openrouter.ai/api/v1',
        timeout: 30000,
      },
      this.logger
    )
  }

  /**
   * Generate AI response for chat conversation
   */
  async generateResponse(
    messages: ChatMessage[],
    context: ChatContext
  ): Promise<LLMResponse> {
    try {
      // Build context-aware system prompt
      const systemPrompt = this.buildSystemPrompt(context)

      // Format conversation for OpenRouter
      const formattedMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages,
      ]

      // Convert to single prompt (OpenRouter provider expects string)
      const prompt = this.formatMessagesAsPrompt(formattedMessages)

      // Execute with Claude Sonnet 4
      const result = await this.provider.execute(
        prompt,
        'anthropic/claude-sonnet-4',
        {
          maxTokens: 4000,
          temperature: 0.7,
        }
      )

      if (result.status === 'error') {
        throw new Error(result.errorMessage || 'LLM execution failed')
      }

      return {
        message: result.output || 'I apologize, I could not generate a response.',
        confidence: 0.85,
        suggestedActions: this.extractSuggestedActions(result.output || ''),
      }
    } catch (error) {
      this.logger.error('Failed to generate LLM response', { error })
      throw error
    }
  }

  /**
   * Build context-aware system prompt
   */
  private buildSystemPrompt(context: ChatContext): string {
    const basePrompt = `You are an AI assistant helping users create movie projects. You guide users through the creative process with empathy and expertise.`

    const contextPrompts: string[] = [basePrompt]

    if (context.currentStep) {
      contextPrompts.push(
        `\nCurrent workflow step: ${context.currentStep}. Focus on helping the user complete this step.`
      )
    }

    if (context.extractedEntities && context.extractedEntities.length > 0) {
      contextPrompts.push(
        `\nPreviously created entities: ${context.extractedEntities.map((e) => e.type).join(', ')}`
      )
    }

    contextPrompts.push(
      `\nWhen the user provides structured information (characters, scenes, locations, etc.), acknowledge it and suggest next steps.`
    )
    contextPrompts.push(
      `\nBe conversational, encouraging, and help users develop their creative vision.`
    )

    return contextPrompts.join('')
  }

  /**
   * Format messages as a single prompt for OpenRouter
   */
  private formatMessagesAsPrompt(messages: ChatMessage[]): string {
    return messages
      .map((msg) => {
        if (msg.role === 'system') {
          return `System: ${msg.content}`
        } else if (msg.role === 'user') {
          return `User: ${msg.content}`
        } else {
          return `Assistant: ${msg.content}`
        }
      })
      .join('\n\n')
  }

  /**
   * Extract suggested actions from AI response
   */
  private extractSuggestedActions(response: string): string[] {
    const suggestions: string[] = []

    // Look for common action patterns
    if (response.toLowerCase().includes('character')) {
      suggestions.push('create_characters')
    }
    if (response.toLowerCase().includes('scene')) {
      suggestions.push('develop_scenes')
    }
    if (response.toLowerCase().includes('story') || response.toLowerCase().includes('plot')) {
      suggestions.push('develop_story')
    }
    if (response.toLowerCase().includes('location') || response.toLowerCase().includes('setting')) {
      suggestions.push('define_locations')
    }

    return suggestions
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    return this.provider.testConnection()
  }
}