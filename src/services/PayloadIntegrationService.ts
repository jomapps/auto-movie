import { getPayload } from 'payload'
import config from '@payload-config'
import type { ExtractedEntity } from './DataExtractionService'

export interface CreatedEntities {
  characters: Array<{ id: string; name: string }>
  scenes: Array<{ id: string; title: string }>
  locations: Array<{ id: string; name: string }>
  props: Array<{ id: string; name: string }>
  events: Array<{ id: string; title: string }>
}

/**
 * PayloadIntegrationService - Create CMS entities from extracted data
 * Handles creation of characters, scenes, locations, etc. in PayloadCMS
 */
export class PayloadIntegrationService {
  private logger = {
    info: (msg: string, meta?: any) => console.log('[PayloadIntegration]', msg, meta || ''),
    error: (msg: string, meta?: any) => console.error('[PayloadIntegration]', msg, meta || ''),
    warn: (msg: string, meta?: any) => console.warn('[PayloadIntegration]', msg, meta || ''),
  }

  /**
   * Create entities from extracted data
   */
  async createFromExtractedData(
    entities: ExtractedEntity[],
    projectId: string
  ): Promise<CreatedEntities> {
    const created: CreatedEntities = {
      characters: [],
      scenes: [],
      locations: [],
      props: [],
      events: [],
    }

    try {
      const payload = await getPayload({ config })

      for (const entity of entities) {
        try {
          switch (entity.type) {
            case 'character':
              const character = await this.createCharacter(payload, entity, projectId)
              if (character) {
                created.characters.push({
                  id: character.id,
                  name: character.name || 'Unnamed Character',
                })
              }
              break

            case 'scene':
              const scene = await this.createScene(payload, entity, projectId)
              if (scene) {
                created.scenes.push({
                  id: scene.id,
                  title: scene.title || 'Untitled Scene',
                })
              }
              break

            case 'location':
              const location = await this.createLocation(payload, entity, projectId)
              if (location) {
                created.locations.push({
                  id: location.id,
                  name: location.name || 'Unnamed Location',
                })
              }
              break

            case 'prop':
              // Props can be added as assets or noted in scenes
              this.logger.info('Prop extraction detected, storing as metadata', {
                prop: entity.data.name,
              })
              break

            case 'event':
              // Events can be added to project timeline or episode structure
              this.logger.info('Event extraction detected, storing as metadata', {
                event: entity.data.title,
              })
              break
          }
        } catch (error) {
          this.logger.error(`Failed to create ${entity.type}`, { error, entity })
        }
      }

      return created
    } catch (error) {
      this.logger.error('Failed to create entities from extracted data', { error })
      throw error
    }
  }

  /**
   * Create character in PayloadCMS
   */
  private async createCharacter(payload: any, entity: ExtractedEntity, projectId: string) {
    const characterData = {
      name: entity.data.name || 'Unnamed Character',
      description: entity.data.description || '',
      role: entity.data.role || 'supporting',
      traits: entity.data.traits || [],
      project: projectId,
      status: 'draft' as const,
      confidence: entity.confidence,
      extractedFrom: entity.sourceText,
    }

    try {
      const character = await payload.create({
        collection: 'characters',
        data: characterData,
      })

      this.logger.info('Created character', { id: character.id, name: character.name })
      return character
    } catch (error) {
      this.logger.error('Failed to create character', { error, data: characterData })
      return null
    }
  }

  /**
   * Create scene in PayloadCMS
   */
  private async createScene(payload: any, entity: ExtractedEntity, projectId: string) {
    const sceneData = {
      title: entity.data.title || 'Untitled Scene',
      description: entity.data.description || '',
      location: entity.data.location || undefined,
      actions: entity.data.actions || [],
      project: projectId,
      status: 'draft' as const,
      confidence: entity.confidence,
      extractedFrom: entity.sourceText,
    }

    try {
      const scene = await payload.create({
        collection: 'scenes',
        data: sceneData,
      })

      this.logger.info('Created scene', { id: scene.id, title: scene.title })
      return scene
    } catch (error) {
      this.logger.error('Failed to create scene', { error, data: sceneData })
      return null
    }
  }

  /**
   * Create location in PayloadCMS
   */
  private async createLocation(payload: any, entity: ExtractedEntity, projectId: string) {
    const locationData = {
      name: entity.data.name || 'Unnamed Location',
      description: entity.data.description || '',
      atmosphere: entity.data.atmosphere || '',
      project: projectId,
      status: 'draft' as const,
      confidence: entity.confidence,
      extractedFrom: entity.sourceText,
    }

    try {
      const location = await payload.create({
        collection: 'locations',
        data: locationData,
      })

      this.logger.info('Created location', { id: location.id, name: location.name })
      return location
    } catch (error) {
      this.logger.error('Failed to create location', { error, data: locationData })
      return null
    }
  }

  /**
   * Update project with created entities
   */
  async updateProjectEntities(projectId: string, entities: CreatedEntities): Promise<void> {
    try {
      const payload = await getPayload({ config })

      const project = await payload.findByID({
        collection: 'projects',
        id: projectId,
      })

      if (!project) {
        throw new Error('Project not found')
      }

      // Update project's entity counts
      const updates: any = {}

      if (entities.characters.length > 0) {
        updates.characterCount = (project.characterCount || 0) + entities.characters.length
      }
      if (entities.scenes.length > 0) {
        updates.sceneCount = (project.sceneCount || 0) + entities.scenes.length
      }
      if (entities.locations.length > 0) {
        updates.locationCount = (project.locationCount || 0) + entities.locations.length
      }

      if (Object.keys(updates).length > 0) {
        await payload.update({
          collection: 'projects',
          id: projectId,
          data: updates,
        })

        this.logger.info('Updated project entity counts', { projectId, updates })
      }
    } catch (error) {
      this.logger.error('Failed to update project entities', { error })
    }
  }
}