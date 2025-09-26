'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { createProjectError, handlePayloadError } from '@/lib/utils/error-handling'
import type { Project } from '@/payload-types'

export interface GetProjectResult {
  success: boolean
  data?: Project
  error?: string
}

export async function getProject(projectId: string): Promise<GetProjectResult> {
  try {
    if (!projectId || typeof projectId !== 'string') {
      throw createProjectError('VALIDATION_ERROR', 'Invalid project ID')
    }

    // Get PayloadCMS instance
    const payload = await getPayload({ config })

    // Get project by ID via PayloadCMS Local API
    const result = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 2 // Include related data
    })

    if (!result) {
      throw createProjectError('NOT_FOUND_ERROR', 'Project not found')
    }

    return {
      success: true,
      data: result as Project
    }

  } catch (error) {
    console.error('Get project error:', error)

    // Handle PayloadCMS errors
    if (error && typeof error === 'object') {
      const handledError = handlePayloadError(error, 'findByID')
      return {
        success: false,
        error: handledError.message
      }
    }

    // Handle custom project errors
    if (error instanceof Error && error.message.includes('Project not found')) {
      return {
        success: false,
        error: 'Project not found. It may have been deleted or you may not have access to it.'
      }
    }

    // Handle generic errors
    const projectError = createProjectError('SERVER_ERROR', 'Failed to retrieve project. Please try again.')
    return {
      success: false,
      error: projectError.message
    }
  }
}

export async function getProjectBasicInfo(projectId: string): Promise<GetProjectResult> {
  try {
    if (!projectId || typeof projectId !== 'string') {
      throw createProjectError('VALIDATION_ERROR', 'Invalid project ID')
    }

    // Get PayloadCMS instance
    const payload = await getPayload({ config })

    // Get project with minimal depth for performance
    const result = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0 // Minimal data for basic info
    })

    if (!result) {
      throw createProjectError('NOT_FOUND_ERROR', 'Project not found')
    }

    return {
      success: true,
      data: result as Project
    }

  } catch (error) {
    console.error('Get project basic info error:', error)

    // Handle PayloadCMS errors
    if (error && typeof error === 'object') {
      const handledError = handlePayloadError(error, 'findByID')
      return {
        success: false,
        error: handledError.message
      }
    }

    // Handle generic errors
    const projectError = createProjectError('SERVER_ERROR', 'Failed to retrieve project information.')
    return {
      success: false,
      error: projectError.message
    }
  }
}