'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { projectSchema } from '@/lib/validations/project-schema'
import { createProjectError, handlePayloadError } from '@/lib/utils/error-handling'
import type { Project } from '@/payload-types'

export interface CreateProjectState {
  success?: boolean
  error?: string
  data?: Partial<Project>
}

export async function createProject(
  prevState: CreateProjectState | null,
  formData: FormData
): Promise<CreateProjectState> {
  try {
    // Extract form data
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      genre: formData.get('genre') as string,
      episodeCount: parseInt(formData.get('episodeCount') as string) || 10,
      targetAudience: (formData.get('targetAudience') as string) || 'family',
      status: (formData.get('status') as string) || 'concept',
      aspectRatio: (formData.get('aspectRatio') as string) || '16:9',
      episodeDuration: parseInt(formData.get('episodeDuration') as string) || 22,
      qualityTier: (formData.get('qualityTier') as string) || 'standard',
    }

    // Validate with Zod schema
    const validatedData = projectSchema.parse({
      title: rawData.title,
      description: rawData.description,
      genre: rawData.genre,
      episodeCount: rawData.episodeCount,
      targetAudience: rawData.targetAudience,
      projectSettings: {
        aspectRatio: rawData.aspectRatio,
        episodeDuration: rawData.episodeDuration,
        qualityTier: rawData.qualityTier,
      },
    })

    // Get PayloadCMS instance
    const payload = await getPayload({ config })

    // Create project via PayloadCMS Local API
    const result = await payload.create({
      collection: 'projects',
      data: {
        title: validatedData.title,
        description: validatedData.description,
        genre: validatedData.genre,
        episodeCount: validatedData.episodeCount,
        targetAudience: validatedData.targetAudience,
        status: 'concept', // Default status for new projects
        projectSettings: validatedData.projectSettings,
        createdBy: 'temp-user', // TODO: Replace with actual user ID from auth
      },
    })

    // Revalidate related pages
    revalidatePath('/dashboard/projects')
    revalidatePath('/dashboard/projects/new')

    // Redirect to the new project page
    redirect(`/dashboard/projects/${result.id}`)
  } catch (error) {
    console.error('Create project error:', error)

    // Handle Zod validation errors
    if (error?.constructor?.name === 'ZodError') {
      const zodError = error as any
      const firstError = zodError.errors[0]
      return {
        success: false,
        error: firstError?.message || 'Invalid form data. Please check your inputs.',
      }
    }

    // Handle PayloadCMS errors
    if (error && typeof error === 'object') {
      const handledError = handlePayloadError(error, 'create')
      return {
        success: false,
        error: handledError.message,
      }
    }

    // Handle generic errors
    const projectError = createProjectError(
      'SERVER_ERROR',
      'Failed to create project. Please try again.'
    )
    return {
      success: false,
      error: projectError.message,
    }
  }
}
