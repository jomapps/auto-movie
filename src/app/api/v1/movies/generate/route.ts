/**
 * Movie Generation API Endpoint
 * POST /api/v1/movies/generate
 *
 * Handles movie generation requests with AI-powered content creation
 * Integrates with project system and external AI services
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createAuthenticatedHandler } from '@/middleware/auth'
import { z } from 'zod'

// Validation schema for movie generation request
const movieGenerationSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  genre: z.enum([
    'action',
    'comedy',
    'drama',
    'scifi',
    'fantasy',
    'horror',
    'documentary',
    'animation',
  ]),
  episodeCount: z.number().min(1).max(50),
  episodeDuration: z.number().min(5).max(120).optional().default(30),
  style: z
    .object({
      visualStyle: z.string().optional(),
      musicStyle: z.string().optional(),
      narrativeTone: z.string().optional(),
    })
    .optional(),
  settings: z
    .object({
      aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3']).optional().default('16:9'),
      qualityTier: z.enum(['draft', 'standard', 'premium']).optional().default('standard'),
      autoPublish: z.boolean().optional().default(false),
    })
    .optional(),
})

export type MovieGenerationRequest = z.infer<typeof movieGenerationSchema>

/**
 * POST /api/v1/movies/generate
 * Create a new movie generation job
 */
async function handleGenerate(request: NextRequest, user: any) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = movieGenerationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const payload = await getPayload({ config })

    // Verify project exists and user has access
    const project = await payload.findByID({
      collection: 'projects',
      id: data.projectId,
      depth: 1,
    })

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          code: 'PROJECT_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Verify user has access to project
    const hasAccess =
      project.createdBy === user.id ||
      (project.createdBy as any)?.id === user.id ||
      (project.collaborators || []).some(
        (collab: any) => collab === user.id || collab?.id === user.id
      )

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions to access this project',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    // Check subscription limits (placeholder for now)
    // TODO: Implement subscription tier checking
    const userProjectsCount = await payload.count({
      collection: 'projects',
      where: {
        createdBy: { equals: user.id },
      },
    })

    // Create generation job record
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create session for tracking generation progress
    const session = await payload.create({
      collection: 'sessions',
      data: {
        user: user.id,
        project: data.projectId,
        sessionType: 'movie_generation',
        metadata: {
          jobId,
          status: 'queued',
          request: data,
          createdAt: new Date().toISOString(),
        },
      },
    })

    // Update project status
    await payload.update({
      collection: 'projects',
      id: data.projectId,
      data: {
        status: 'generation',
        progress: {
          currentPhase: 'generation',
          overallProgress: 0,
        },
      },
    })

    // Queue generation task (async processing)
    // Note: This would integrate with the CELERY_TASK_SERVICE or BRAIN_SERVICE
    const taskServiceUrl = process.env.NEXT_PUBLIC_TASK_SERVICE_URL
    if (taskServiceUrl) {
      try {
        // Fire and forget - don't wait for response
        fetch(`${taskServiceUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.CELERY_TASK_API_KEY || '',
          },
          body: JSON.stringify({
            jobId,
            sessionId: session.id,
            projectId: data.projectId,
            userId: user.id,
            request: data,
          }),
        }).catch((error) => {
          console.error('Failed to queue generation task:', error)
        })
      } catch (error) {
        console.error('Error submitting to task service:', error)
      }
    }

    // Return job information
    return NextResponse.json(
      {
        success: true,
        data: {
          jobId,
          sessionId: session.id,
          projectId: data.projectId,
          status: 'queued',
          message: 'Movie generation job created successfully',
          estimatedTime: data.episodeCount * data.episodeDuration * 2, // Rough estimate in seconds
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating movie generation job:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

// Export authenticated handler
export const POST = createAuthenticatedHandler(handleGenerate, {
  requiredRoles: ['user', 'admin', 'creator'],
})