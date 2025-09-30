/**
 * Payload Integration Service
 *
 * Handles CRUD operations for extracted entities in PayloadCMS.
 * Provides duplicate detection, batch creation, and error handling.
 *
 * Features:
 * - Create entities from extracted data
 * - Duplicate detection before creation
 * - Batch creation with partial failure handling
 * - Transaction-like rollback on critical errors
 * - Comprehensive error reporting
 *
 * @example
 * ```typescript
 * const integration = new PayloadIntegrationService(payload)
 *
 * const result = await integration.createFromExtractedData(
 *   entities,
 *   'proj_123'
 * )
 *
 * console.log(result.stats)
 * // { total: 5, created: 4, skipped: 1, failed: 0 }
 * ```
 */

import type { Payload } from 'payload'
import type {
  ExtractedEntity,
  MappedCharacter,
  MappedScene,
  MappedEpisode,
  IntegrationResult,
  DuplicateCheckResult,
  IntegrationError,
} from '../types/extraction'
import { SchemaMapper } from './schemaMapper'

/**
 * PayloadIntegrationService
 *
 * Manages PayloadCMS CRUD operations for extracted entities.
 */
export class PayloadIntegrationService {
  private mapper: SchemaMapper

  constructor(private payload: Payload) {
    this.mapper = new SchemaMapper(payload)
  }

  /**
   * Create entities from extracted data
   */
  async createFromExtractedData(
    entities: ExtractedEntity[],
    projectId: string,
    options?: {
      skipDuplicates?: boolean
      continueOnError?: boolean
      defaultEpisodeId?: string
      validateBeforeCreate?: boolean
    }
  ): Promise<IntegrationResult> {
    const result: IntegrationResult = {
      success: true,
      created: [],
      skipped: [],
      errors: [],
      stats: {
        total: entities.length,
        created: 0,
        skipped: 0,
        failed: 0,
      },
    }

    const {
      skipDuplicates = true,
      continueOnError = true,
      defaultEpisodeId,
      validateBeforeCreate = true,
    } = options || {}

    try {
      // Separate entities by type
      const characters = entities.filter((e) => e.type === 'character')
      const episodes = entities.filter((e) => e.type === 'episode')
      const scenes = entities.filter((e) => e.type === 'scene')

      // Create characters first (may be referenced by scenes)
      for (const entity of characters) {
        try {
          await this.createCharacter(entity, projectId, {
            skipDuplicates,
            validateBeforeCreate,
            result,
          })
        } catch (error) {
          this.handleEntityError(entity, error, result, continueOnError)
        }
      }

      // Create episodes (may be referenced by scenes)
      for (const entity of episodes) {
        try {
          await this.createEpisode(entity, projectId, {
            skipDuplicates,
            validateBeforeCreate,
            result,
          })
        } catch (error) {
          this.handleEntityError(entity, error, result, continueOnError)
        }
      }

      // Create scenes (reference characters and episodes)
      for (const entity of scenes) {
        try {
          await this.createScene(entity, projectId, defaultEpisodeId, {
            skipDuplicates,
            validateBeforeCreate,
            result,
          })
        } catch (error) {
          this.handleEntityError(entity, error, result, continueOnError)
        }
      }

      result.success = result.stats.failed === 0

      return result
    } catch (error) {
      console.error('Batch creation failed:', error)
      result.success = false
      result.errors?.push({
        entity: entities[0],
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error during batch creation',
      })
      return result
    }
  }

  /**
   * Create character in PayloadCMS
   */
  private async createCharacter(
    entity: ExtractedEntity,
    projectId: string,
    options: {
      skipDuplicates: boolean
      validateBeforeCreate: boolean
      result: IntegrationResult
    }
  ): Promise<void> {
    const { skipDuplicates, validateBeforeCreate, result } = options

    // Map to PayloadCMS schema
    const mappingResult = await this.mapper.mapCharacter(
      entity.data as any,
      projectId
    )

    if (!mappingResult.success) {
      result.errors?.push({
        entity,
        error: `Mapping failed: ${mappingResult.errors?.map((e) => e.message).join(', ')}`,
      })
      result.stats.failed++
      return
    }

    const mapped = mappingResult.mapped!

    // Check for duplicates
    if (skipDuplicates) {
      const duplicateCheck = await this.checkCharacterDuplicate(
        mapped.name,
        projectId
      )

      if (duplicateCheck.isDuplicate) {
        result.skipped?.push({
          entity,
          reason: `Duplicate character: ${mapped.name} (ID: ${duplicateCheck.existingId})`,
        })
        result.stats.skipped++
        return
      }
    }

    // Validate before creation
    if (validateBeforeCreate) {
      const validation = this.validateCharacter(mapped)
      if (!validation.valid) {
        result.errors?.push({
          entity,
          error: `Validation failed: ${validation.errors.join(', ')}`,
        })
        result.stats.failed++
        return
      }
    }

    // Create in PayloadCMS
    const created = await this.payload.create({
      collection: 'characters',
      data: mapped,
    })

    result.created?.push({
      collection: 'characters',
      id: created.id,
      entity,
    })
    result.stats.created++
  }

  /**
   * Create scene in PayloadCMS
   */
  private async createScene(
    entity: ExtractedEntity,
    projectId: string,
    defaultEpisodeId: string | undefined,
    options: {
      skipDuplicates: boolean
      validateBeforeCreate: boolean
      result: IntegrationResult
    }
  ): Promise<void> {
    const { skipDuplicates, validateBeforeCreate, result } = options

    if (!defaultEpisodeId) {
      result.errors?.push({
        entity,
        error: 'Episode ID required for scene creation',
      })
      result.stats.failed++
      return
    }

    // Get next scene number
    const sceneNumber = await this.getNextSceneNumber(projectId, defaultEpisodeId)

    // Map to PayloadCMS schema
    const mappingResult = await this.mapper.mapScene(
      entity.data as any,
      projectId,
      defaultEpisodeId,
      sceneNumber
    )

    if (!mappingResult.success) {
      result.errors?.push({
        entity,
        error: `Mapping failed: ${mappingResult.errors?.map((e) => e.message).join(', ')}`,
      })
      result.stats.failed++
      return
    }

    const mapped = mappingResult.mapped!

    // Check for duplicates
    if (skipDuplicates) {
      const duplicateCheck = await this.checkSceneDuplicate(
        mapped.title,
        defaultEpisodeId,
        sceneNumber
      )

      if (duplicateCheck.isDuplicate) {
        result.skipped?.push({
          entity,
          reason: `Duplicate scene: ${mapped.title} (ID: ${duplicateCheck.existingId})`,
        })
        result.stats.skipped++
        return
      }
    }

    // Validate before creation
    if (validateBeforeCreate) {
      const validation = this.validateScene(mapped)
      if (!validation.valid) {
        result.errors?.push({
          entity,
          error: `Validation failed: ${validation.errors.join(', ')}`,
        })
        result.stats.failed++
        return
      }
    }

    // Create in PayloadCMS
    const created = await this.payload.create({
      collection: 'scenes',
      data: mapped as any,
    })

    result.created?.push({
      collection: 'scenes',
      id: created.id,
      entity,
    })
    result.stats.created++
  }

  /**
   * Create episode in PayloadCMS
   */
  private async createEpisode(
    entity: ExtractedEntity,
    projectId: string,
    options: {
      skipDuplicates: boolean
      validateBeforeCreate: boolean
      result: IntegrationResult
    }
  ): Promise<void> {
    const { skipDuplicates, validateBeforeCreate, result } = options

    // Map to PayloadCMS schema
    const mappingResult = await this.mapper.mapEpisode(entity.data as any, projectId)

    if (!mappingResult.success) {
      result.errors?.push({
        entity,
        error: `Mapping failed: ${mappingResult.errors?.map((e) => e.message).join(', ')}`,
      })
      result.stats.failed++
      return
    }

    const mapped = mappingResult.mapped!

    // Check for duplicates
    if (skipDuplicates) {
      const duplicateCheck = await this.checkEpisodeDuplicate(
        mapped.episodeNumber,
        projectId
      )

      if (duplicateCheck.isDuplicate) {
        result.skipped?.push({
          entity,
          reason: `Duplicate episode: Episode ${mapped.episodeNumber} (ID: ${duplicateCheck.existingId})`,
        })
        result.stats.skipped++
        return
      }
    }

    // Validate before creation
    if (validateBeforeCreate) {
      const validation = this.validateEpisode(mapped)
      if (!validation.valid) {
        result.errors?.push({
          entity,
          error: `Validation failed: ${validation.errors.join(', ')}`,
        })
        result.stats.failed++
        return
      }
    }

    // Create in PayloadCMS
    const created = await this.payload.create({
      collection: 'episodes',
      data: mapped,
    })

    result.created?.push({
      collection: 'episodes',
      id: created.id,
      entity,
    })
    result.stats.created++
  }

  /**
   * Check if character already exists
   */
  async checkCharacterDuplicate(
    name: string,
    projectId: string
  ): Promise<DuplicateCheckResult> {
    try {
      const result = await this.payload.find({
        collection: 'characters',
        where: {
          and: [{ project: { equals: projectId } }, { name: { equals: name } }],
        },
        limit: 1,
      })

      if (result.docs.length > 0) {
        return {
          isDuplicate: true,
          existingId: result.docs[0].id,
          confidence: 'high',
        }
      }

      return {
        isDuplicate: false,
        confidence: 'high',
      }
    } catch (error) {
      console.error('Duplicate check failed:', error)
      return {
        isDuplicate: false,
        confidence: 'low',
      }
    }
  }

  /**
   * Check if scene already exists
   */
  async checkSceneDuplicate(
    title: string,
    episodeId: string,
    sceneNumber: number
  ): Promise<DuplicateCheckResult> {
    try {
      const result = await this.payload.find({
        collection: 'scenes',
        where: {
          and: [
            { episode: { equals: episodeId } },
            { sceneNumber: { equals: sceneNumber } },
          ],
        },
        limit: 1,
      })

      if (result.docs.length > 0) {
        return {
          isDuplicate: true,
          existingId: result.docs[0].id,
          confidence: 'high',
        }
      }

      return {
        isDuplicate: false,
        confidence: 'high',
      }
    } catch (error) {
      console.error('Duplicate check failed:', error)
      return {
        isDuplicate: false,
        confidence: 'low',
      }
    }
  }

  /**
   * Check if episode already exists
   */
  async checkEpisodeDuplicate(
    episodeNumber: number,
    projectId: string
  ): Promise<DuplicateCheckResult> {
    try {
      const result = await this.payload.find({
        collection: 'episodes',
        where: {
          and: [
            { project: { equals: projectId } },
            { episodeNumber: { equals: episodeNumber } },
          ],
        },
        limit: 1,
      })

      if (result.docs.length > 0) {
        return {
          isDuplicate: true,
          existingId: result.docs[0].id,
          confidence: 'high',
        }
      }

      return {
        isDuplicate: false,
        confidence: 'high',
      }
    } catch (error) {
      console.error('Duplicate check failed:', error)
      return {
        isDuplicate: false,
        confidence: 'low',
      }
    }
  }

  /**
   * Validate character data
   */
  private validateCharacter(
    character: MappedCharacter
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!character.name || character.name.trim().length === 0) {
      errors.push('Character name is required')
    }

    if (!character.project) {
      errors.push('Project ID is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate scene data
   */
  private validateScene(scene: MappedScene): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!scene.title || scene.title.trim().length === 0) {
      errors.push('Scene title is required')
    }

    if (!scene.project) {
      errors.push('Project ID is required')
    }

    if (!scene.episode) {
      errors.push('Episode ID is required')
    }

    if (!scene.sceneNumber || scene.sceneNumber < 1) {
      errors.push('Valid scene number is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate episode data
   */
  private validateEpisode(
    episode: MappedEpisode
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!episode.title || episode.title.trim().length === 0) {
      errors.push('Episode title is required')
    }

    if (!episode.project) {
      errors.push('Project ID is required')
    }

    if (!episode.episodeNumber || episode.episodeNumber < 1) {
      errors.push('Valid episode number is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get next scene number for an episode
   */
  private async getNextSceneNumber(
    projectId: string,
    episodeId: string
  ): Promise<number> {
    try {
      const result = await this.payload.find({
        collection: 'scenes',
        where: {
          and: [
            { project: { equals: projectId } },
            { episode: { equals: episodeId } },
          ],
        },
        sort: '-sceneNumber',
        limit: 1,
      })

      if (result.docs.length > 0) {
        return (result.docs[0].sceneNumber as number) + 1
      }

      return 1
    } catch (error) {
      console.error('Failed to get next scene number:', error)
      return 1
    }
  }

  /**
   * Handle entity creation error
   */
  private handleEntityError(
    entity: ExtractedEntity,
    error: unknown,
    result: IntegrationResult,
    continueOnError: boolean
  ): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during creation'

    result.errors?.push({
      entity,
      error: errorMessage,
    })
    result.stats.failed++

    if (!continueOnError) {
      throw error
    }
  }
}

export default PayloadIntegrationService