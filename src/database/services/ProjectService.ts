import { getPayloadInstance } from '@/utils/getPayload'
import type { Project } from '@/payload-types'

export interface CreateProjectDTO {
  title: string
  description?: string
  genre: string
  episodeCount: number
  targetAudience?: string
  createdBy: string
}

export interface UpdateProjectDTO {
  title?: string
  description?: string
  genre?: string
  episodeCount?: number
  targetAudience?: string
  status?: string
  projectSettings?: Partial<Project['projectSettings']>
  progress?: Partial<Project['progress']>
}

export interface ProjectFilters {
  status?: string
  genre?: string
  createdBy?: string
  collaborators?: string
}

export class ProjectService {
  /**
   * Create a new project
   */
  static async create(data: CreateProjectDTO): Promise<Project> {
    const payload = await getPayloadInstance()

    const project = await payload.create({
      collection: 'projects',
      data,
    })

    return project as Project
  }

  /**
   * Find project by ID
   */
  static async findById(id: string): Promise<Project | null> {
    const payload = await getPayloadInstance()

    try {
      const project = await payload.findByID({
        collection: 'projects',
        id,
      })
      return project as Project
    } catch (error) {
      return null
    }
  }

  /**
   * Find projects by user with optional filters
   */
  static async findByUser(userId: string, filters?: ProjectFilters): Promise<Project[]> {
    const payload = await getPayloadInstance()

    const where: any = {
      or: [{ createdBy: { equals: userId } }, { collaborators: { contains: userId } }],
    }

    if (filters?.status) {
      where.status = { equals: filters.status }
    }
    if (filters?.genre) {
      where.genre = { equals: filters.genre }
    }

    const result = await payload.find({
      collection: 'projects',
      where,
      limit: 100,
      sort: '-updatedAt',
    })

    return result.docs as Project[]
  }

  /**
   * Update project
   */
  static async update(id: string, data: UpdateProjectDTO): Promise<Project> {
    const payload = await getPayloadInstance()

    const project = await payload.update({
      collection: 'projects',
      id,
      data,
    })

    return project as Project
  }

  /**
   * Delete project
   */
  static async delete(id: string): Promise<boolean> {
    const payload = await getPayloadInstance()

    try {
      await payload.delete({
        collection: 'projects',
        id,
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Add collaborator to project
   */
  static async addCollaborator(projectId: string, userId: string): Promise<void> {
    const payload = await getPayloadInstance()

    const project = await this.findById(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    const collaborators = Array.isArray(project.collaborators)
      ? project.collaborators.map((c: any) => (typeof c === 'string' ? c : c.id))
      : []

    if (!collaborators.includes(userId)) {
      collaborators.push(userId)

      await payload.update({
        collection: 'projects',
        id: projectId,
        data: {
          collaborators,
        },
      })
    }
  }

  /**
   * Remove collaborator from project
   */
  static async removeCollaborator(projectId: string, userId: string): Promise<void> {
    const payload = await getPayloadInstance()

    const project = await this.findById(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    const collaborators = Array.isArray(project.collaborators)
      ? project.collaborators
          .map((c: any) => (typeof c === 'string' ? c : c.id))
          .filter((id: string) => id !== userId)
      : []

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: {
        collaborators,
      },
    })
  }

  /**
   * Update project progress
   */
  static async updateProgress(
    projectId: string,
    progress: Partial<Project['progress']>,
  ): Promise<void> {
    const payload = await getPayloadInstance()

    const project = await this.findById(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: {
        progress: {
          ...project.progress,
          ...progress,
        },
      },
    })
  }

  /**
   * Search projects by title
   */
  static async search(query: string, userId?: string): Promise<Project[]> {
    const payload = await getPayloadInstance()

    const where: any = {
      title: {
        contains: query,
      },
    }

    // If userId provided, only search user's projects
    if (userId) {
      where.or = [{ createdBy: { equals: userId } }, { collaborators: { contains: userId } }]
    }

    const result = await payload.find({
      collection: 'projects',
      where,
      limit: 50,
    })

    return result.docs as Project[]
  }
}