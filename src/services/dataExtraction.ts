/**
 * Data Extraction Service
 *
 * LLM-based entity extraction from conversational text.
 * Extracts structured data (characters, scenes, episodes) from chat messages.
 *
 * Features:
 * - Multi-entity extraction from single messages
 * - Confidence scoring based on context completeness
 * - Multi-turn extraction support for complex entities
 * - Context-aware extraction using project history
 * - Validation and error handling
 *
 * @example
 * ```typescript
 * const extractor = new DataExtractionService(openRouterLLMService)
 *
 * const result = await extractor.extractFromMessage(
 *   "Create a character named Sarah, she's a 28-year-old detective...",
 *   {
 *     projectId: 'proj_123',
 *     sessionId: 'sess_456',
 *     messageId: 'msg_789'
 *   }
 * )
 *
 * console.log(result.entities) // [{ type: 'character', data: {...}, confidence: 'high' }]
 * ```
 */

import type {
  ExtractedCharacter,
  ExtractedScene,
  ExtractedEpisode,
  ExtractedEntity,
  EntityType,
  ConfidenceLevel,
  ExtractionResult,
  ExtractionServiceConfig,
  LLMExtractionRequest,
  LLMExtractionResponse,
  ExtractionState,
  ExtractionError,
} from '../types/extraction'

import {
  ExtractedCharacterSchema,
  ExtractedSceneSchema,
  ExtractedEpisodeSchema,
} from '../types/extraction'

import type { LLMMessage } from './novelLLM'
import openRouterLLMService from './novelLLM'

/**
 * DataExtractionService
 *
 * Handles LLM-based extraction of structured entities from conversational text.
 */
export class DataExtractionService {
  private config: Required<ExtractionServiceConfig>
  private extractionStates: Map<string, ExtractionState> = new Map()

  constructor(
    private llmService: typeof openRouterLLMService,
    config?: ExtractionServiceConfig
  ) {
    this.config = {
      llmModel: config?.llmModel || 'anthropic/claude-sonnet-4',
      confidenceThreshold: config?.confidenceThreshold || 0.7,
      enableMultiTurn: config?.enableMultiTurn ?? true,
      maxClarificationAttempts: config?.maxClarificationAttempts || 3,
    }
  }

  /**
   * Extract entities from a chat message
   */
  async extractFromMessage(
    message: string,
    context: {
      projectId: string
      sessionId: string
      messageId: string
      conversationHistory?: LLMMessage[]
      genre?: string
      existingEntities?: {
        characters?: string[]
        scenes?: string[]
        episodes?: string[]
      }
    }
  ): Promise<ExtractionResult> {
    const startTime = Date.now()

    try {
      // Build LLM extraction request
      const request = this.buildExtractionRequest(message, context)

      // Call LLM for extraction
      const llmResponse = await this.callLLMForExtraction(request)

      // Parse and validate extracted entities
      const entities = await this.parseAndValidateEntities(
        llmResponse,
        context,
        message
      )

      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(entities)

      // Handle multi-turn extraction if enabled
      if (this.config.enableMultiTurn && llmResponse.needsClarification) {
        await this.updateExtractionState(context.sessionId, entities)
      }

      return {
        entities,
        needsClarification: llmResponse.needsClarification,
        clarificationQuestions: llmResponse.clarificationQuestions,
        extractionTime: Date.now() - startTime,
        metadata: {
          model: this.config.llmModel,
          confidence: overallConfidence,
        },
      }
    } catch (error) {
      console.error('Extraction error:', error)
      throw {
        name: 'ExtractionError',
        message: error instanceof Error ? error.message : 'Unknown extraction error',
        code: 'LLM_ERROR',
        details: error,
      } as ExtractionError
    }
  }

  /**
   * Extract specific entity types from message
   */
  async extractEntities(
    message: string,
    entityTypes: EntityType[],
    context: {
      projectId: string
      sessionId: string
      genre?: string
    }
  ): Promise<ExtractionResult> {
    const request = this.buildExtractionRequest(message, {
      ...context,
      messageId: `extract_${Date.now()}`,
    })

    // Filter extraction to specific types
    request.extractionTarget = entityTypes

    const llmResponse = await this.callLLMForExtraction(request)
    const entities = await this.parseAndValidateEntities(
      llmResponse,
      { ...context, messageId: `extract_${Date.now()}` },
      message
    )

    return {
      entities: entities.filter((e) => entityTypes.includes(e.type)),
      needsClarification: llmResponse.needsClarification,
      clarificationQuestions: llmResponse.clarificationQuestions,
      extractionTime: 0,
      metadata: {
        confidence: this.calculateOverallConfidence(entities),
      },
    }
  }

  /**
   * Build LLM extraction request with prompts
   */
  private buildExtractionRequest(
    message: string,
    context: {
      projectId: string
      genre?: string
      conversationHistory?: LLMMessage[]
      existingEntities?: {
        characters?: string[]
        scenes?: string[]
        episodes?: string[]
      }
    }
  ): LLMExtractionRequest {
    const systemPrompt = this.buildSystemPrompt(context)

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(context.conversationHistory || []),
      {
        role: 'user',
        content: this.buildExtractionPrompt(message, context),
      },
    ]

    return {
      messages,
      projectContext: {
        projectId: context.projectId,
        genre: context.genre,
        existingEntities: context.existingEntities,
      },
      extractionTarget: ['character', 'scene', 'episode'],
      responseFormat: 'json_object',
    }
  }

  /**
   * Build system prompt for extraction
   */
  private buildSystemPrompt(context: {
    genre?: string
    existingEntities?: {
      characters?: string[]
      scenes?: string[]
      episodes?: string[]
    }
  }): string {
    return `You are an expert data extraction AI for a movie production platform.

Your task is to extract structured entities from conversational text about movie projects.

EXTRACTION TARGETS:
1. **Characters**: Name, age, personality traits, occupation, backstory, motivations
2. **Scenes**: Location, time of day, description, mood, characters involved, dialogue
3. **Episodes**: Episode number, title, description, themes, estimated duration

CONFIDENCE SCORING:
- **high**: All required fields present, clear context
- **medium**: Some required fields present, needs minor clarification
- **low**: Minimal information, needs significant clarification

${context.genre ? `\nProject Genre: ${context.genre}` : ''}
${
  context.existingEntities
    ? `\nExisting Entities:
${context.existingEntities.characters ? `- Characters: ${context.existingEntities.characters.join(', ')}` : ''}
${context.existingEntities.scenes ? `- Scenes: ${context.existingEntities.scenes.length} scenes` : ''}
${context.existingEntities.episodes ? `- Episodes: ${context.existingEntities.episodes.length} episodes` : ''}`
    : ''
}

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "extracted": {
    "characters": [{ "name": "...", "description": "...", "profile": {...}, "confidence": "high/medium/low", "source": "..." }],
    "scenes": [{ "title": "...", "location": "...", "timeOfDay": "...", "confidence": "high/medium/low", "source": "..." }],
    "episodes": [{ "episodeNumber": 1, "title": "...", "description": "...", "confidence": "high/medium/low", "source": "..." }]
  },
  "confidence": "high/medium/low",
  "needsClarification": true/false,
  "clarificationQuestions": ["question1", "question2"],
  "reasoning": "Brief explanation of extraction decisions"
}

RULES:
1. Only extract entities explicitly mentioned or strongly implied
2. Set confidence based on completeness of extracted data
3. Include "source" field with the original text snippet
4. If critical information is missing, set needsClarification=true and provide specific questions
5. For dialogue, extract character name and lines separately
6. Preserve original wording when possible`
  }

  /**
   * Build user extraction prompt
   */
  private buildExtractionPrompt(
    message: string,
    _context: { projectId: string }
  ): string {
    return `Extract all movie production entities from the following message.

Message:
"""
${message}
"""

Extract characters, scenes, and episodes mentioned. Return structured JSON following the response format.`
  }

  /**
   * Call LLM service for extraction
   */
  private async callLLMForExtraction(
    request: LLMExtractionRequest
  ): Promise<LLMExtractionResponse> {
    try {
      // Use the OpenRouter LLM service
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://auto-movie.app',
          'X-Title': 'Auto Movie Platform - Data Extraction',
        },
        body: JSON.stringify({
          model: this.config.llmModel,
          messages: request.messages,
          response_format: { type: 'json_object' },
          temperature: 0.3, // Lower temperature for more consistent extraction
          max_tokens: 3000,
        }),
      })

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('Empty response from LLM')
      }

      // Parse JSON response
      const parsed = JSON.parse(content) as LLMExtractionResponse

      // Ensure structure exists
      return {
        extracted: {
          characters: parsed.extracted?.characters || [],
          scenes: parsed.extracted?.scenes || [],
          episodes: parsed.extracted?.episodes || [],
        },
        confidence: parsed.confidence || 'low',
        needsClarification: parsed.needsClarification ?? false,
        clarificationQuestions: parsed.clarificationQuestions || [],
        reasoning: parsed.reasoning,
      }
    } catch (error) {
      console.error('LLM extraction call failed:', error)
      throw new Error(
        `Failed to extract entities: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Parse and validate extracted entities
   */
  private async parseAndValidateEntities(
    llmResponse: LLMExtractionResponse,
    context: {
      projectId: string
      sessionId: string
      messageId: string
    },
    originalMessage: string
  ): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = []

    // Validate and add characters
    for (const char of llmResponse.extracted.characters) {
      try {
        const validated = ExtractedCharacterSchema.parse(char)
        entities.push({
          type: 'character',
          data: validated,
          confidence: validated.confidence,
          extractedAt: new Date(),
          conversationContext: context,
        })
      } catch (error) {
        console.warn('Character validation failed:', error)
      }
    }

    // Validate and add scenes
    for (const scene of llmResponse.extracted.scenes) {
      try {
        const validated = ExtractedSceneSchema.parse(scene)
        entities.push({
          type: 'scene',
          data: validated,
          confidence: validated.confidence,
          extractedAt: new Date(),
          conversationContext: context,
        })
      } catch (error) {
        console.warn('Scene validation failed:', error)
      }
    }

    // Validate and add episodes
    for (const episode of llmResponse.extracted.episodes) {
      try {
        const validated = ExtractedEpisodeSchema.parse(episode)
        entities.push({
          type: 'episode',
          data: validated,
          confidence: validated.confidence,
          extractedAt: new Date(),
          conversationContext: context,
        })
      } catch (error) {
        console.warn('Episode validation failed:', error)
      }
    }

    return entities
  }

  /**
   * Calculate overall confidence from multiple entities
   */
  private calculateOverallConfidence(entities: ExtractedEntity[]): ConfidenceLevel {
    if (entities.length === 0) return 'low'

    const scores = { high: 3, medium: 2, low: 1 }
    const avgScore =
      entities.reduce((sum, e) => sum + scores[e.confidence], 0) / entities.length

    if (avgScore >= 2.5) return 'high'
    if (avgScore >= 1.5) return 'medium'
    return 'low'
  }

  /**
   * Update extraction state for multi-turn extraction
   */
  private async updateExtractionState(
    sessionId: string,
    entities: ExtractedEntity[]
  ): Promise<void> {
    const state = this.extractionStates.get(sessionId) || {
      sessionId,
      projectId: entities[0]?.conversationContext.projectId || '',
      pendingEntities: new Map(),
      completedEntities: [],
      awaitingClarification: false,
      clarificationQuestions: [],
    }

    // Add entities to completed
    state.completedEntities.push(...entities)

    this.extractionStates.set(sessionId, state)
  }

  /**
   * Get extraction state for a session
   */
  getExtractionState(sessionId: string): ExtractionState | undefined {
    return this.extractionStates.get(sessionId)
  }

  /**
   * Clear extraction state
   */
  clearExtractionState(sessionId: string): void {
    this.extractionStates.delete(sessionId)
  }
}

// Export singleton instance
export const dataExtractionService = new DataExtractionService(openRouterLLMService)
export default dataExtractionService