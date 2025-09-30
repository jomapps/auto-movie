/**
 * Type definitions for data extraction pipeline
 * Week 1: Chat → Structured Data Extraction
 */

import { z } from 'zod'

// ============================================================================
// EXTRACTION TYPES
// ============================================================================

/**
 * Entity types that can be extracted from conversations
 */
export type EntityType = 'character' | 'scene' | 'episode' | 'project'

/**
 * Confidence levels for extracted data
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

/**
 * Extracted character data from conversation
 */
export interface ExtractedCharacter {
  name: string
  description?: string
  profile?: {
    age?: string
    gender?: string
    personality?: string[]
    backstory?: string
    motivations?: string[]
  }
  voiceProfile?: {
    voiceCharacteristics?: string[]
  }
  confidence: ConfidenceLevel
  source: string // Original text snippet
}

/**
 * Extracted scene data from conversation
 */
export interface ExtractedScene {
  title?: string
  location?: string
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night'
  description?: string
  mood?: string
  characters?: string[] // Character names mentioned
  dialogue?: Array<{
    character: string
    lines: string
    emotion?: string
  }>
  confidence: ConfidenceLevel
  source: string
}

/**
 * Extracted episode data from conversation
 */
export interface ExtractedEpisode {
  episodeNumber?: number
  title?: string
  description?: string
  synopsis?: {
    logline?: string
    summary?: string
    themes?: string[]
  }
  estimatedDuration?: number
  confidence: ConfidenceLevel
  source: string
}

/**
 * Generic extracted entity container
 */
export interface ExtractedEntity {
  type: EntityType
  data: ExtractedCharacter | ExtractedScene | ExtractedEpisode
  confidence: ConfidenceLevel
  extractedAt: Date
  conversationContext: {
    messageId: string
    sessionId: string
    projectId: string
  }
}

/**
 * Multi-turn extraction state for complex entities
 */
export interface ExtractionState {
  sessionId: string
  projectId: string
  pendingEntities: Map<string, Partial<ExtractedEntity>>
  completedEntities: ExtractedEntity[]
  awaitingClarification: boolean
  clarificationQuestions: string[]
}

// ============================================================================
// VALIDATION SCHEMAS (Zod)
// ============================================================================

/**
 * Character extraction schema
 */
export const ExtractedCharacterSchema = z.object({
  name: z.string().min(1, 'Character name is required'),
  description: z.string().optional(),
  profile: z
    .object({
      age: z.string().optional(),
      gender: z.string().optional(),
      personality: z.array(z.string()).optional(),
      backstory: z.string().optional(),
      motivations: z.array(z.string()).optional(),
    })
    .optional(),
  voiceProfile: z
    .object({
      voiceCharacteristics: z.array(z.string()).optional(),
    })
    .optional(),
  confidence: z.enum(['high', 'medium', 'low']),
  source: z.string(),
})

/**
 * Scene extraction schema
 */
export const ExtractedSceneSchema = z.object({
  title: z.string().optional(),
  location: z.string().optional(),
  timeOfDay: z.enum(['dawn', 'day', 'dusk', 'night']).optional(),
  description: z.string().optional(),
  mood: z.string().optional(),
  characters: z.array(z.string()).optional(),
  dialogue: z
    .array(
      z.object({
        character: z.string(),
        lines: z.string(),
        emotion: z.string().optional(),
      })
    )
    .optional(),
  confidence: z.enum(['high', 'medium', 'low']),
  source: z.string(),
})

/**
 * Episode extraction schema
 */
export const ExtractedEpisodeSchema = z.object({
  episodeNumber: z.number().int().positive().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  synopsis: z
    .object({
      logline: z.string().optional(),
      summary: z.string().optional(),
      themes: z.array(z.string()).optional(),
    })
    .optional(),
  estimatedDuration: z.number().positive().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
  source: z.string(),
})

// ============================================================================
// SCHEMA MAPPING TYPES
// ============================================================================

/**
 * Mapped PayloadCMS Character document
 */
export interface MappedCharacter {
  project: string // Project ID
  name: string
  description: string
  profile?: {
    age?: string
    gender?: string
    personality?: string[]
    backstory?: string
    motivations?: string[]
  }
  voiceProfile?: {
    voiceCharacteristics?: string[]
  }
}

/**
 * Mapped PayloadCMS Scene document
 */
export interface MappedScene {
  project: string
  episode: string // Episode ID
  sceneNumber: number
  title: string
  location?: string
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night'
  mood?: string
  characters?: string[] // Character IDs
  script?: {
    action?: string
    dialogue?: Array<{
      character: string // Character ID
      lines: string
      emotion?: string
    }>
  }
  production?: {
    status: 'pending' | 'generating' | 'reviewing' | 'approved' | 'failed'
  }
}

/**
 * Mapped PayloadCMS Episode document
 */
export interface MappedEpisode {
  project: string
  episodeNumber: number
  title: string
  description?: string
  synopsis?: {
    logline?: string
    summary?: string
    themes?: string[]
  }
  status: 'planning' | 'scripting' | 'storyboarding' | 'production' | 'editing' | 'completed'
  script?: {
    estimatedDuration?: number
  }
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * Extraction service configuration
 */
export interface ExtractionServiceConfig {
  llmModel?: string
  confidenceThreshold?: number
  enableMultiTurn?: boolean
  maxClarificationAttempts?: number
}

/**
 * Extraction result with metadata
 */
export interface ExtractionResult {
  entities: ExtractedEntity[]
  needsClarification: boolean
  clarificationQuestions: string[]
  extractionTime: number
  metadata: {
    tokensUsed?: number
    model?: string
    confidence: ConfidenceLevel
  }
}

/**
 * Schema mapping result
 */
export interface MappingResult<T = any> {
  success: boolean
  mapped?: T
  errors?: Array<{
    field: string
    message: string
  }>
  warnings?: string[]
  resolvedReferences?: Map<string, string> // name → ID mapping
}

/**
 * Payload integration result
 */
export interface IntegrationResult {
  success: boolean
  created?: Array<{
    collection: string
    id: string
    entity: ExtractedEntity
  }>
  skipped?: Array<{
    entity: ExtractedEntity
    reason: string
  }>
  errors?: Array<{
    entity: ExtractedEntity
    error: string
  }>
  stats: {
    total: number
    created: number
    skipped: number
    failed: number
  }
}

/**
 * Duplicate detection result
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingId?: string
  similarity?: number
  confidence: ConfidenceLevel
}

// ============================================================================
// LLM PROMPT TYPES
// ============================================================================

/**
 * Extraction prompt template
 */
export interface ExtractionPromptTemplate {
  system: string
  userTemplate: string
  fewShotExamples?: Array<{
    input: string
    output: string
  }>
  responseFormat: 'json' | 'structured'
}

/**
 * LLM extraction request
 */
export interface LLMExtractionRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  projectContext: {
    projectId: string
    genre?: string
    existingEntities?: {
      characters: string[]
      scenes: string[]
      episodes: string[]
    }
  }
  extractionTarget: EntityType[]
  responseFormat?: 'json_object' | 'text'
}

/**
 * LLM extraction response
 */
export interface LLMExtractionResponse {
  extracted: {
    characters: ExtractedCharacter[]
    scenes: ExtractedScene[]
    episodes: ExtractedEpisode[]
  }
  confidence: ConfidenceLevel
  needsClarification: boolean
  clarificationQuestions: string[]
  reasoning?: string
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ExtractionError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_INPUT' | 'LLM_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN',
    public details?: any
  ) {
    super(message)
    this.name = 'ExtractionError'
  }
}

export class MappingError extends Error {
  constructor(
    message: string,
    public code: 'MISSING_REFERENCE' | 'VALIDATION_ERROR' | 'SCHEMA_MISMATCH',
    public details?: any
  ) {
    super(message)
    this.name = 'MappingError'
  }
}

export class IntegrationError extends Error {
  constructor(
    message: string,
    public code: 'DUPLICATE_ENTITY' | 'DATABASE_ERROR' | 'PERMISSION_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'IntegrationError'
  }
}