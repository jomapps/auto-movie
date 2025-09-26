'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { updateProjectSchema } from '@/lib/validations/project-schema'
import { createProjectError, handlePayloadError } from '@/lib/utils/error-handling'
import type { Project } from '@/payload-types'

export interface UpdateProjectState {
  success?: boolean
  error?: string
  data?: Partial<Project>
}

export async function updateProject(
  projectId: string,
  prevState: UpdateProjectState | null,
  formData: FormData
): Promise<UpdateProjectState> {
  try {
    if (!projectId || typeof projectId !== 'string') {
      throw createProjectError('VALIDATION_ERROR', 'Invalid project ID')
    }

    // Extract form data
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      genre: formData.get('genre') as string,
      episodeCount: formData.get('episodeCount') ? parseInt(formData.get('episodeCount') as string) : undefined,
      targetAudience: formData.get('targetAudience') as string,
      status: formData.get('status') as string,
      aspectRatio: formData.get('aspectRatio') as string,
      episodeDuration: formData.get('episodeDuration') ? parseInt(formData.get('episodeDuration') as string) : undefined,
      qualityTier: formData.get('qualityTier') as string,
      currentPhase: formData.get('currentPhase') as string,
      overallProgress: formData.get('overallProgress') ? parseInt(formData.get('overallProgress') as string) : undefined
    }

    // Filter out undefined values and prepare update data
    const updateData: any = {}
    
    if (rawData.title) updateData.title = rawData.title
    if (rawData.description) updateData.description = rawData.description
    if (rawData.genre) updateData.genre = rawData.genre
    if (rawData.episodeCount !== undefined) updateData.episodeCount = rawData.episodeCount
    if (rawData.targetAudience) updateData.targetAudience = rawData.targetAudience
    if (rawData.status) updateData.status = rawData.status

    // Handle nested projectSettings
    if (rawData.aspectRatio || rawData.episodeDuration !== undefined || rawData.qualityTier) {
      updateData.projectSettings = {}
      if (rawData.aspectRatio) updateData.projectSettings.aspectRatio = rawData.aspectRatio
      if (rawData.episodeDuration !== undefined) updateData.projectSettings.episodeDuration = rawData.episodeDuration
      if (rawData.qualityTier) updateData.projectSettings.qualityTier = rawData.qualityTier
    }

    // Handle nested progress
    if (rawData.currentPhase || rawData.overallProgress !== undefined) {
      updateData.progress = {}
      if (rawData.currentPhase) updateData.progress.currentPhase = rawData.currentPhase
      if (rawData.overallProgress !== undefined) updateData.progress.overallProgress = rawData.overallProgress
    }

    // Validate with Zod schema
    const validatedData = updateProjectSchema.parse(updateData)

    // Get PayloadCMS instance
    const payload = await getPayload({ config })

    // Update project via PayloadCMS Local API
    const result = await payload.update({
      collection: 'projects',
      id: projectId,
      data: validatedData
    })

    // Revalidate related pages
    revalidatePath('/dashboard/projects')
    revalidatePath(`/dashboard/projects/${projectId}`)
    revalidatePath(`/dashboard/projects/${projectId}/edit`)

    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('Update project error:', error)

    // Handle Zod validation errors
    if (error?.constructor?.name === 'ZodError') {
      const zodError = error as any
      const firstError = zodError.errors[0]
      return {
        success: false,
        error: firstError?.message || 'Invalid form data. Please check your inputs.'
      }
    }

    // Handle PayloadCMS errors
    if (error && typeof error === 'object') {
      const handledError = handlePayloadError(error, 'update')
      return {
        success: false,
        error: handledError.message
      }
    }

    // Handle generic errors
    const projectError = createProjectError('SERVER_ERROR', 'Failed to update project. Please try again.')
    return {
      success: false,
      error: projectError.message
    }
  }
}