'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { projectFiltersSchema } from '@/lib/validations/project-schema'
import { createProjectError, handlePayloadError } from '@/lib/utils/error-handling'
import type { Project } from '@/payload-types'
import type { Where } from 'payload'

export interface ProjectListParams {
  page?: number
  limit?: number
  sort?: string
  search?: string
  genre?: string | string[]
  status?: string | string[]
  targetAudience?: string | string[]
  progressMin?: number
  progressMax?: number
  episodeCountMin?: number
  episodeCountMax?: number
  createdBy?: string
}

export interface ProjectListResult {
  success: boolean
  data?: {
    docs: Project[]
    totalDocs: number
    totalPages: number
    page: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  error?: string
}

export async function listProjects(params: ProjectListParams = {}): Promise<ProjectListResult> {
  try {
    // Extract pagination and other fields not in schema
    const {
      page = 1,
      limit = 10,
      sort: _sort = '-createdAt',
      targetAudience,
      progressMin,
      progressMax,
      episodeCountMin,
      episodeCountMax,
      createdBy,
      ...filterParams
    } = params

    // Validate filter params with schema
    const { search, genre, status, sortBy, sortOrder } = projectFiltersSchema.parse(filterParams)

    // Build where clause for filtering
    const where: Where = {}
    const andConditions: Where[] = []

    // Text search across title and description
    if (search && search.trim()) {
      andConditions.push({
        or: [{ title: { like: search } }, { description: { like: search } }],
      })
    }

    // Genre filter
    if (genre) {
      if (Array.isArray(genre)) {
        andConditions.push({ genre: { in: genre } })
      } else {
        andConditions.push({ genre: { equals: genre } })
      }
    }

    // Status filter
    if (status) {
      if (Array.isArray(status)) {
        andConditions.push({ status: { in: status } })
      } else {
        andConditions.push({ status: { equals: status } })
      }
    }

    // Target audience filter
    if (targetAudience) {
      if (Array.isArray(targetAudience)) {
        andConditions.push({ targetAudience: { in: targetAudience } })
      } else {
        andConditions.push({ targetAudience: { equals: targetAudience } })
      }
    }

    // Progress percentage range filter
    if (progressMin !== undefined || progressMax !== undefined) {
      const progressWhere: any = {}
      if (progressMin !== undefined) {
        progressWhere.gte = progressMin
      }
      if (progressMax !== undefined) {
        progressWhere.lte = progressMax
      }
      andConditions.push({ 'progress.overallProgress': progressWhere })
    }

    // Episode count range filter
    if (episodeCountMin !== undefined || episodeCountMax !== undefined) {
      const episodeWhere: any = {}
      if (episodeCountMin !== undefined) {
        episodeWhere.gte = episodeCountMin
      }
      if (episodeCountMax !== undefined) {
        episodeWhere.lte = episodeCountMax
      }
      andConditions.push({ episodeCount: episodeWhere })
    }

    // Created by filter (for user-specific projects)
    if (createdBy) {
      andConditions.push({ createdBy: { equals: createdBy } })
    }

    // Combine all conditions
    if (andConditions.length > 0) {
      where.and = andConditions
    }

    // Construct sort string from validated sortBy and sortOrder
    const sortString = sortOrder === 'desc' ? `-${sortBy}` : sortBy

    // Get PayloadCMS instance
    const payload = await getPayload({ config })

    // Query projects via PayloadCMS Local API with full-attribute filtering and sorting
    const result = await payload.find({
      collection: 'projects',
      where,
      sort: sortString,
      page,
      limit,
      depth: 1, // Include some related data but not too deep for performance
    })

    return {
      success: true,
      data: {
        docs: result.docs as Project[],
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page || 1,
        hasNextPage: result.hasNextPage || false,
        hasPrevPage: result.hasPrevPage || false,
      },
    }
  } catch (error) {
    console.error('List projects error:', error)

    // Handle Zod validation errors
    if (error?.constructor?.name === 'ZodError') {
      const zodError = error as any
      const firstError = zodError.errors[0]
      return {
        success: false,
        error: `Invalid filter parameters: ${firstError?.message || 'Please check your search criteria.'}`,
      }
    }

    // Handle PayloadCMS errors
    if (error && typeof error === 'object') {
      const handledError = handlePayloadError(error, 'find')
      return {
        success: false,
        error: handledError.message,
      }
    }

    // Handle generic errors
    const projectError = createProjectError(
      'SERVER_ERROR',
      'Failed to retrieve projects. Please try again.'
    )
    return {
      success: false,
      error: projectError.message,
    }
  }
}

// Helper function to get projects count for dashboard stats
export async function getProjectsCount(
  userId?: string
): Promise<{ total: number; error?: string }> {
  try {
    const payload = await getPayload({ config })

    const where: Where = userId ? { createdBy: { equals: userId } } : {}

    const result = await payload.count({
      collection: 'projects',
      where,
    })

    return { total: result.totalDocs }
  } catch (error) {
    console.error('Get projects count error:', error)
    return { total: 0, error: 'Failed to get projects count' }
  }
}
