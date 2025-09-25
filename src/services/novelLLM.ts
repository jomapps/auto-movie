/**
 * AI LLM Service Client
 * Handles communication with AI services for movie production assistance
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  metadata?: Record<string, any>
}

export interface LLMResponse {
  content: string
  choices?: Array<{
    id: string
    title: string
    description: string
    type: 'recommended' | 'alternative' | 'manual'
    metadata?: Record<string, any>
  }>
  metadata?: Record<string, any>
}

export interface ProjectContext {
  id: string
  title: string
  genre: string
  description?: string
  currentStep: string
  progress: number
  styleReferences?: string[]
  settings?: Record<string, any>
}

class NovelLLMService {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.LLM_BASE_URL || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    this.apiKey = process.env.LLM_API_KEY || process.env.OPENROUTER_API_KEY || ''
  }

  /**
   * Generate AI response for chat messages
   */
  async generateResponse(
    messages: LLMMessage[],
    context: ProjectContext
  ): Promise<LLMResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(context)
      const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ]

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.LLM_DEFAULT_MODEL || process.env.OPENROUTER_DEFAULT_MODEL || 'qwen/qwen3-vl-235b-a22b-thinking',
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: 2000,
          functions: this.getAvailableFunctions(context.currentStep),
        }),
      })

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.statusText}`)
      }

      const data = await response.json()
      return this.parseResponse(data, context)

    } catch (error) {
      console.error('LLM service error:', error)
      throw new Error('Failed to generate AI response')
    }
  }

  /**
   * Process choice selections and generate next steps
   */
  async processChoice(
    choiceId: string,
    context: ProjectContext,
    conversationHistory: LLMMessage[]
  ): Promise<LLMResponse> {
    try {
      const prompt = this.buildChoicePrompt(choiceId, context)
      const messages = [
        ...conversationHistory,
        { role: 'user', content: prompt }
      ]

      return await this.generateResponse(messages, context)

    } catch (error) {
      console.error('Choice processing error:', error)
      throw new Error('Failed to process choice selection')
    }
  }

  /**
   * Generate workflow step transitions
   */
  async transitionStep(
    fromStep: string,
    toStep: string,
    context: ProjectContext
  ): Promise<LLMResponse> {
    try {
      const transitionPrompt = this.buildStepTransitionPrompt(fromStep, toStep, context)
      
      return await this.generateResponse(
        [{ role: 'user', content: transitionPrompt }],
        { ...context, currentStep: toStep }
      )

    } catch (error) {
      console.error('Step transition error:', error)
      throw new Error('Failed to transition workflow step')
    }
  }

  /**
   * Build system prompt based on project context
   */
  private buildSystemPrompt(context: ProjectContext): string {
    return `You are an AI assistant specialized in movie production guidance.

Project Context:
- Title: ${context.title}
- Genre: ${context.genre}
- Current Step: ${context.currentStep}
- Progress: ${context.progress}%
${context.description ? `- Description: ${context.description}` : ''}

Your role is to guide users through the movie production process with the following principles:
1. Provide specific, actionable advice tailored to their project
2. Offer multiple choices when appropriate (recommended, alternative, manual override)
3. Maintain enthusiasm and creativity while being practical
4. Ask clarifying questions when needed
5. Reference uploaded files and style references when relevant
6. Keep responses concise but comprehensive

Current workflow step: ${context.currentStep}
${this.getStepGuidance(context.currentStep)}

Always end responses with specific next step options when appropriate.`
  }

  /**
   * Build choice processing prompt
   */
  private buildChoicePrompt(choiceId: string, context: ProjectContext): string {
    return `The user has selected choice ID: ${choiceId}

Process this selection and provide:
1. Confirmation of what they chose
2. Specific guidance for executing this choice
3. Next logical steps or choices
4. Any resources or references they might need

Keep the response focused and actionable.`
  }

  /**
   * Build step transition prompt
   */
  private buildStepTransitionPrompt(fromStep: string, toStep: string, context: ProjectContext): string {
    return `Transitioning from ${fromStep} to ${toStep} step.

Provide:
1. Welcome message for the new step
2. Overview of what they'll accomplish in this phase
3. Specific first actions they should take
4. Initial choices or options for proceeding

Make this transition feel natural and progressive.`
  }

  /**
   * Get step-specific guidance
   */
  private getStepGuidance(step: string): string {
    const guidance = {
      'concept': 'Help develop the core concept, genre, and basic premise.',
      'story': 'Focus on story structure, plot points, and narrative flow.',
      'characters': 'Develop characters, personalities, and relationships.',
      'storyboard': 'Plan visual sequences and scene compositions.',
      'assets': 'Create or gather visual assets, props, and resources.',
      'scenes': 'Plan individual scenes and shot sequences.',
      'production': 'Guide through actual production and filming.',
      'editing': 'Assist with post-production and editing decisions.',
      'review': 'Help with final review, feedback, and polish.',
      'final': 'Prepare final deliverables and project completion.'
    }

    return guidance[step] || 'Provide general movie production guidance.'
  }

  /**
   * Get available functions for the current step
   */
  private getAvailableFunctions(step: string) {
    return [
      {
        name: 'generate_choices',
        description: 'Generate multiple choice options for the user',
        parameters: {
          type: 'object',
          properties: {
            choices: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  type: { type: 'string', enum: ['recommended', 'alternative', 'manual'] }
                }
              }
            }
          }
        }
      },
      {
        name: 'update_project_progress',
        description: 'Update project progress and current step',
        parameters: {
          type: 'object',
          properties: {
            progress: { type: 'number', minimum: 0, maximum: 100 },
            nextStep: { type: 'string' }
          }
        }
      }
    ]
  }

  /**
   * Parse LLM response and extract structured data
   */
  private parseResponse(data: any, context: ProjectContext): LLMResponse {
    const message = data.choices?.[0]?.message
    if (!message) {
      throw new Error('Invalid response format from LLM service')
    }

    const response: LLMResponse = {
      content: message.content || '',
      metadata: {
        model: data.model,
        usage: data.usage,
        finishReason: data.choices?.[0]?.finish_reason
      }
    }

    // Parse function calls if present
    if (message.function_call) {
      try {
        const functionArgs = JSON.parse(message.function_call.arguments)
        
        if (message.function_call.name === 'generate_choices') {
          response.choices = functionArgs.choices
        }
        
        if (message.function_call.name === 'update_project_progress') {
          response.metadata = {
            ...response.metadata,
            progressUpdate: functionArgs
          }
        }
      } catch (error) {
        console.error('Failed to parse function call:', error)
      }
    }

    return response
  }
}

// Export singleton instance
export const novelLLMService = new NovelLLMService()
export default novelLLMService