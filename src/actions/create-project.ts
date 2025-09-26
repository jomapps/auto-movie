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
  redirectTo?: string
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

    // Get or create a default user for development
    // First, try to find an existing user
    let defaultUser
    try {
      const users = await payload.find({
        collection: 'users',
        limit: 1,
      })

      if (users.docs.length > 0) {
        defaultUser = users.docs[0]
      } else {
        // Create a default user if none exists
        defaultUser = await payload.create({
          collection: 'users',
          data: {
            email: 'default@auto-movie.com',
            password: 'temp-password-123',
            name: 'Default User',
            role: 'user',
          },
        })
      }
    } catch (userError) {
      console.error('Error handling default user:', userError)
      throw new Error('Failed to get or create default user')
    }

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
        createdBy: defaultUser.id, // Use actual user ID
      },
    })

    // Revalidate related pages
    revalidatePath('/dashboard/projects')
    revalidatePath('/dashboard/projects/new')

    // Return success with the project ID for redirect
    return {
      success: true,
      data: result,
      redirectTo: `/dashboard/projects/${result.id}`,
    }
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
