/**
 * Schema Mapper Service
 *
 * Maps extracted entities to PayloadCMS collection schemas.
 * Handles reference resolution (names → IDs) and validation.
 *
 * Features:
 * - Type-safe mapping from extracted data to PayloadCMS schemas
 * - Reference resolution (character names → character IDs)
 * - Validation before mapping
 * - Default value assignment
 * - Error handling with detailed messages
 *
 * @example
 * ```typescript
 * const mapper = new SchemaMapper(payload)
 *
 * const result = await mapper.mapCharacter(
 *   extractedCharacter,
 *   'proj_123'
 * )
 *
 * if (result.success) {
 *   console.log(result.mapped) // Ready for PayloadCMS
 * }
 * ```
 */

import type { Payload } from 'payload'
import type {
  ExtractedCharacter,
  ExtractedScene,
  ExtractedEpisode,
  ExtractedEntity,
  MappedCharacter,
  MappedScene,
  MappedEpisode,
  MappingResult,
  MappingError,
} from '../types/extraction'

/**
 * SchemaMapper
 *
 * Maps extracted entities to PayloadCMS collection schemas with validation.
 */
export class SchemaMapper {
  private referenceCache: Map<string, Map<string, string>> = new Map()

  constructor(private payload: Payload) {}

  /**
   * Map extracted character to PayloadCMS Character schema
   */
  async mapCharacter(
    extracted: ExtractedCharacter,
    projectId: string
  ): Promise<MappingResult<MappedCharacter>> {
    try {
      // Validate required fields
      if (!extracted.name) {
        return {
          success: false,
          errors: [{ field: 'name', message: 'Character name is required' }],
        }
      }

      // Map to PayloadCMS schema
      const mapped: MappedCharacter = {
        project: projectId,
        name: extracted.name,
        description: extracted.description || `Character: ${extracted.name}`,
        profile: extracted.profile
          ? {
              age: extracted.profile.age,
              gender: extracted.profile.gender,
              personality: extracted.profile.personality,
              backstory: extracted.profile.backstory,
              motivations: extracted.profile.motivations,
            }
          : undefined,
        voiceProfile: extracted.voiceProfile
          ? {
              voiceCharacteristics: extracted.voiceProfile.voiceCharacteristics,
            }
          : undefined,
      }

      // Validate against confidence threshold
      const warnings: string[] = []
      if (extracted.confidence === 'low') {
        warnings.push(
          'Low confidence extraction - consider manual review before saving'
        )
      }

      return {
        success: true,
        mapped,
        warnings,
      }
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            field: 'general',
            message:
              error instanceof Error ? error.message : 'Character mapping failed',
          },
        ],
      }
    }
  }

  /**
   * Map extracted scene to PayloadCMS Scene schema
   */
  async mapScene(
    extracted: ExtractedScene,
    projectId: string,
    episodeId: string,
    sceneNumber: number
  ): Promise<MappingResult<MappedScene>> {
    try {
      // Validate required fields
      const errors: Array<{ field: string; message: string }> = []

      if (!extracted.title && !extracted.location) {
        errors.push({
          field: 'title',
          message: 'Scene must have at least a title or location',
        })
      }

      if (errors.length > 0) {
        return { success: false, errors }
      }

      // Resolve character references (names → IDs)
      const resolvedReferences = new Map<string, string>()
      let characterIds: string[] | undefined

      if (extracted.characters && extracted.characters.length > 0) {
        characterIds = await this.resolveCharacterReferences(
          extracted.characters,
          projectId,
          resolvedReferences
        )

        if (characterIds.length !== extracted.characters.length) {
          errors.push({
            field: 'characters',
            message: `Could not resolve all character references (${characterIds.length}/${extracted.characters.length} found)`,
          })
        }
      }

      // Map dialogue with character ID resolution
      let dialogue:
        | Array<{ character: string; lines: string; emotion?: string }>
        | undefined

      if (extracted.dialogue && extracted.dialogue.length > 0) {
        dialogue = await Promise.all(
          extracted.dialogue.map(async (d) => {
            const characterId = await this.resolveCharacterName(
              d.character,
              projectId,
              resolvedReferences
            )

            if (!characterId) {
              errors.push({
                field: 'dialogue',
                message: `Character "${d.character}" not found for dialogue`,
              })
            }

            return {
              character: characterId || d.character,
              lines: d.lines,
              emotion: d.emotion,
            }
          })
        )
      }

      // Map to PayloadCMS schema
      const mapped: MappedScene = {
        project: projectId,
        episode: episodeId,
        sceneNumber,
        title: extracted.title || `Scene at ${extracted.location}`,
        location: extracted.location,
        timeOfDay: extracted.timeOfDay,
        mood: extracted.mood,
        characters: characterIds,
        script: dialogue
          ? {
              action: extracted.description,
              dialogue,
            }
          : undefined,
        production: {
          status: 'pending',
        },
      }

      const warnings: string[] = []
      if (extracted.confidence === 'low') {
        warnings.push('Low confidence extraction - review scene details')
      }

      return {
        success: errors.length === 0,
        mapped,
        errors: errors.length > 0 ? errors : undefined,
        warnings,
        resolvedReferences,
      }
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            field: 'general',
            message: error instanceof Error ? error.message : 'Scene mapping failed',
          },
        ],
      }
    }
  }

  /**
   * Map extracted episode to PayloadCMS Episode schema
   */
  async mapEpisode(
    extracted: ExtractedEpisode,
    projectId: string,
    fallbackEpisodeNumber?: number
  ): Promise<MappingResult<MappedEpisode>> {
    try {
      // Validate required fields
      const errors: Array<{ field: string; message: string }> = []

      if (!extracted.title && !extracted.description) {
        errors.push({
          field: 'title',
          message: 'Episode must have at least a title or description',
        })
      }

      if (errors.length > 0) {
        return { success: false, errors }
      }

      // Determine episode number
      const episodeNumber =
        extracted.episodeNumber || fallbackEpisodeNumber || (await this.getNextEpisodeNumber(projectId))

      // Map to PayloadCMS schema
      const mapped: MappedEpisode = {
        project: projectId,
        episodeNumber,
        title: extracted.title || `Episode ${episodeNumber}`,
        description: extracted.description,
        synopsis: extracted.synopsis
          ? {
              logline: extracted.synopsis.logline,
              summary: extracted.synopsis.summary,
              themes: extracted.synopsis.themes,
            }
          : undefined,
        status: 'planning',
        script: extracted.estimatedDuration
          ? {
              estimatedDuration: extracted.estimatedDuration,
            }
          : undefined,
      }

      const warnings: string[] = []
      if (extracted.confidence === 'low') {
        warnings.push('Low confidence extraction - review episode details')
      }

      if (!extracted.episodeNumber && fallbackEpisodeNumber) {
        warnings.push(`Using fallback episode number: ${episodeNumber}`)
      }

      return {
        success: true,
        mapped,
        warnings,
      }
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            field: 'general',
            message:
              error instanceof Error ? error.message : 'Episode mapping failed',
          },
        ],
      }
    }
  }

  /**
   * Batch map multiple entities
   */
  async mapEntities(
    entities: ExtractedEntity[],
    projectId: string,
    options?: {
      defaultEpisodeId?: string
      startSceneNumber?: number
    }
  ): Promise<{
    characters: MappingResult<MappedCharacter>[]
    scenes: MappingResult<MappedScene>[]
    episodes: MappingResult<MappedEpisode>[]
    stats: {
      total: number
      successful: number
      failed: number
    }
  }> {
    const characters: MappingResult<MappedCharacter>[] = []
    const scenes: MappingResult<MappedScene>[] = []
    const episodes: MappingResult<MappedEpisode>[] = []

    let successful = 0
    let failed = 0
    let sceneNumber = options?.startSceneNumber || 1

    for (const entity of entities) {
      try {
        if (entity.type === 'character') {
          const result = await this.mapCharacter(
            entity.data as ExtractedCharacter,
            projectId
          )
          characters.push(result)
          if (result.success) successful++
          else failed++
        } else if (entity.type === 'scene') {
          if (!options?.defaultEpisodeId) {
            scenes.push({
              success: false,
              errors: [
                {
                  field: 'episode',
                  message: 'Episode ID required for scene mapping',
                },
              ],
            })
            failed++
            continue
          }

          const result = await this.mapScene(
            entity.data as ExtractedScene,
            projectId,
            options.defaultEpisodeId,
            sceneNumber++
          )
          scenes.push(result)
          if (result.success) successful++
          else failed++
        } else if (entity.type === 'episode') {
          const result = await this.mapEpisode(
            entity.data as ExtractedEpisode,
            projectId
          )
          episodes.push(result)
          if (result.success) successful++
          else failed++
        }
      } catch (error) {
        console.error(`Failed to map ${entity.type}:`, error)
        failed++
      }
    }

    return {
      characters,
      scenes,
      episodes,
      stats: {
        total: entities.length,
        successful,
        failed,
      },
    }
  }

  /**
   * Resolve character name to ID
   */
  private async resolveCharacterName(
    name: string,
    projectId: string,
    cache: Map<string, string>
  ): Promise<string | null> {
    // Check cache first
    if (cache.has(name)) {
      return cache.get(name)!
    }

    try {
      const result = await this.payload.find({
        collection: 'characters',
        where: {
          and: [{ project: { equals: projectId } }, { name: { equals: name } }],
        },
        limit: 1,
      })

      if (result.docs.length > 0) {
        const id = result.docs[0].id
        cache.set(name, id)
        return id
      }

      return null
    } catch (error) {
      console.error(`Failed to resolve character name "${name}":`, error)
      return null
    }
  }

  /**
   * Resolve multiple character names to IDs
   */
  private async resolveCharacterReferences(
    names: string[],
    projectId: string,
    cache: Map<string, string>
  ): Promise<string[]> {
    const resolved: string[] = []

    for (const name of names) {
      const id = await this.resolveCharacterName(name, projectId, cache)
      if (id) {
        resolved.push(id)
      }
    }

    return resolved
  }

  /**
   * Get next episode number for a project
   */
  private async getNextEpisodeNumber(projectId: string): Promise<number> {
    try {
      const result = await this.payload.find({
        collection: 'episodes',
        where: {
          project: { equals: projectId },
        },
        sort: '-episodeNumber',
        limit: 1,
      })

      if (result.docs.length > 0) {
        return (result.docs[0].episodeNumber as number) + 1
      }

      return 1
    } catch (error) {
      console.error('Failed to get next episode number:', error)
      return 1
    }
  }

  /**
   * Clear reference cache
   */
  clearCache(): void {
    this.referenceCache.clear()
  }
}

export default SchemaMapper