import { getPayload } from '@/utils/getPayload'
import type { Episode } from '@/payload-types'

export interface CreateEpisodeDTO {
  project: string
  episodeNumber: number
  title: string
  description?: string
}

export interface UpdateEpisodeDTO {
  title?: string
  description?: string
  status?: string
  script?: Partial<Episode['script']>
  production?: Partial<Episode['production']>
  metadata?: Partial<Episode['metadata']>
}

export class EpisodeService {
  /**
   * Create a new episode
   */
  static async create(data: CreateEpisodeDTO): Promise<Episode> {
    const payload = await getPayload()

    // Check for duplicate episode number in project
    const existing = await this.findByProjectAndNumber(data.project, data.episodeNumber)
    if (existing) {
      throw new Error(`Episode ${data.episodeNumber} already exists for this project`)
    }

    const episode = await payload.create({
      collection: 'episodes',
      data,
    })

    return episode as Episode
  }

  /**
   * Find episode by ID
   */
  static async findById(id: string): Promise<Episode | null> {
    const payload = await getPayload()

    try {
      const episode = await payload.findByID({
        collection: 'episodes',
        id,
      })
      return episode as Episode
    } catch (error) {
      return null
    }
  }

  /**
   * Find episode by project and episode number
   */
  static async findByProjectAndNumber(
    projectId: string,
    episodeNumber: number,
  ): Promise<Episode | null> {
    const payload = await getPayload()

    const result = await payload.find({
      collection: 'episodes',
      where: {
        and: [{ project: { equals: projectId } }, { episodeNumber: { equals: episodeNumber } }],
      },
      limit: 1,
    })

    return result.docs.length > 0 ? (result.docs[0] as Episode) : null
  }

  /**
   * Get all episodes for a project
   */
  static async findByProject(projectId: string): Promise<Episode[]> {
    const payload = await getPayload()

    const result = await payload.find({
      collection: 'episodes',
      where: {
        project: { equals: projectId },
      },
      sort: 'episodeNumber',
      limit: 100,
    })

    return result.docs as Episode[]
  }

  /**
   * Update episode
   */
  static async update(id: string, data: UpdateEpisodeDTO): Promise<Episode> {
    const payload = await getPayload()

    const episode = await payload.update({
      collection: 'episodes',
      id,
      data,
    })

    return episode as Episode
  }

  /**
   * Delete episode
   */
  static async delete(id: string): Promise<boolean> {
    const payload = await getPayload()

    try {
      await payload.delete({
        collection: 'episodes',
        id,
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Update episode script
   */
  static async updateScript(id: string, scriptData: Partial<Episode['script']>): Promise<void> {
    const payload = await getPayload()

    const episode = await this.findById(id)
    if (!episode) {
      throw new Error('Episode not found')
    }

    await payload.update({
      collection: 'episodes',
      id,
      data: {
        script: {
          ...episode.script,
          ...scriptData,
        },
      },
    })
  }

  /**
   * Update episode production status
   */
  static async updateProduction(
    id: string,
    productionData: Partial<Episode['production']>,
  ): Promise<void> {
    const payload = await getPayload()

    const episode = await this.findById(id)
    if (!episode) {
      throw new Error('Episode not found')
    }

    await payload.update({
      collection: 'episodes',
      id,
      data: {
        production: {
          ...episode.production,
          ...productionData,
        },
      },
    })
  }

  /**
   * Get episode statistics
   */
  static async getStats(id: string) {
    const episode = await this.findById(id)
    if (!episode) {
      throw new Error('Episode not found')
    }

    const sceneCount = episode.production?.sceneCount || 0
    const completedScenes = episode.production?.completedScenes || 0
    const progress =
      sceneCount > 0 ? Math.round((completedScenes / sceneCount) * 100) : 0

    return {
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      status: episode.status,
      sceneCount,
      completedScenes,
      progress,
      wordCount: episode.script?.wordCount || 0,
      estimatedDuration: episode.script?.estimatedDuration || 0,
      actualDuration: episode.metadata?.duration || 0,
    }
  }
}