import { OpenRouterProvider } from '@/lib/prompts/providers/openrouter'
import type { ExecutionLogger } from '@/lib/prompts/types'

export interface ExtractedEntity {
  type: 'character' | 'scene' | 'location' | 'prop' | 'event'
  data: any
  confidence: number
  sourceText: string
}

export interface ExtractionResult {
  entities: ExtractedEntity[]
  summary: string
  suggestions: string[]
}

/**
 * DataExtractionService - Extract structured entities from user messages
 * Uses Claude to identify characters, scenes, locations, etc. from natural language
 */
export class DataExtractionService {
  private provider: OpenRouterProvider
  private logger: ExecutionLogger

  constructor(apiKey?: string) {
    this.logger = {
      info: (msg: string, meta?: any) => console.log('[DataExtraction]', msg, meta || ''),
      error: (msg: string, meta?: any) => console.error('[DataExtraction]', msg, meta || ''),
      warn: (msg: string, meta?: any) => console.warn('[DataExtraction]', msg, meta || ''),
      debug: (msg: string, meta?: any) => console.debug('[DataExtraction]', msg, meta || ''),
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
   * Extract structured data from user message
   */
  async extractStructuredData(message: string, context?: any): Promise<ExtractionResult> {
    try {
      const prompt = this.buildExtractionPrompt(message, context)

      const result = await this.provider.execute(
        prompt,
        'anthropic/claude-sonnet-4',
        {
          maxTokens: 2000,
          temperature: 0.3, // Lower temperature for more consistent extraction
        }
      )

      if (result.status === 'error') {
        throw new Error(result.errorMessage || 'Extraction failed')
      }

      return this.parseExtractionResult(result.output || '', message)
    } catch (error) {
      this.logger.error('Failed to extract structured data', { error })
      return {
        entities: [],
        summary: 'Could not extract structured data',
        suggestions: [],
      }
    }
  }

  /**
   * Build extraction prompt
   */
  private buildExtractionPrompt(message: string, context?: any): string {
    return `You are a data extraction assistant for a movie production system. Extract structured information from the user's message.

Identify and extract:
1. **Characters**: Names, descriptions, roles, personality traits
2. **Scenes**: Scene descriptions, settings, actions, dialogue
3. **Locations**: Place names, descriptions, atmosphere
4. **Props**: Objects mentioned, their significance
5. **Events**: Plot points, story beats, narrative elements

User Message:
${message}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Respond with a JSON object in this exact format:
{
  "entities": [
    {
      "type": "character" | "scene" | "location" | "prop" | "event",
      "data": {
        // Entity-specific fields
        // For character: name, description, role, traits
        // For scene: title, description, location, actions
        // For location: name, description, atmosphere
        // For prop: name, description, significance
        // For event: title, description, impact
      },
      "confidence": 0.0 to 1.0,
      "sourceText": "relevant quote from user message"
    }
  ],
  "summary": "Brief summary of extracted information",
  "suggestions": ["suggestion1", "suggestion2"]
}

IMPORTANT: Respond ONLY with valid JSON, no additional text.`
  }

  /**
   * Parse extraction result from LLM output
   */
  private parseExtractionResult(output: string, originalMessage: string): ExtractionResult {
    try {
      // Try to find JSON in the output
      const jsonMatch = output.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in output')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        entities: parsed.entities || [],
        summary: parsed.summary || 'Extracted information from message',
        suggestions: parsed.suggestions || [],
      }
    } catch (error) {
      this.logger.warn('Failed to parse extraction result, using fallback', { error })

      // Fallback: Basic pattern matching
      return this.fallbackExtraction(originalMessage)
    }
  }

  /**
   * Fallback extraction using simple pattern matching
   */
  private fallbackExtraction(message: string): ExtractionResult {
    const entities: ExtractedEntity[] = []

    // Simple pattern matching for common entities
    const characterPattern = /(?:character|protagonist|hero|villain)\s+(?:named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    const locationPattern = /(?:location|place|setting)\s+(?:called\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi

    let match
    while ((match = characterPattern.exec(message)) !== null) {
      entities.push({
        type: 'character',
        data: {
          name: match[1],
          description: 'Character mentioned in conversation',
        },
        confidence: 0.5,
        sourceText: match[0],
      })
    }

    while ((match = locationPattern.exec(message)) !== null) {
      entities.push({
        type: 'location',
        data: {
          name: match[1],
          description: 'Location mentioned in conversation',
        },
        confidence: 0.5,
        sourceText: match[0],
      })
    }

    return {
      entities,
      summary: `Found ${entities.length} entities using pattern matching`,
      suggestions: [],
    }
  }

  /**
   * Validate extracted entity data
   */
  validateEntity(entity: ExtractedEntity): boolean {
    if (!entity.type || !entity.data) {
      return false
    }

    switch (entity.type) {
      case 'character':
        return !!(entity.data.name || entity.data.description)
      case 'scene':
        return !!(entity.data.title || entity.data.description)
      case 'location':
        return !!(entity.data.name || entity.data.description)
      case 'prop':
        return !!(entity.data.name || entity.data.description)
      case 'event':
        return !!(entity.data.title || entity.data.description)
      default:
        return false
    }
  }
}