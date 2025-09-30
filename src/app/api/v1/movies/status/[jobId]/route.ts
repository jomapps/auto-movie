/**
 * Movie Generation Status API Endpoint
 * GET /api/v1/movies/status/:jobId
 *
 * Check the status of a movie generation job
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createAuthenticatedHandler } from '@/middleware/auth'

interface RouteParams {
  params: Promise<{
    jobId: string
  }>
}

/**
 * GET /api/v1/movies/status/:jobId
 * Retrieve status and progress of a generation job
 */
async function handleGetStatus(request: NextRequest, user: any, context: RouteParams) {
  try {
    const { jobId } = await context.params

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job ID is required',
          code: 'MISSING_JOB_ID',
        },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Find session by jobId in contextData
    const sessions = await payload.find({
      collection: 'sessions',
      where: {
        'contextData.jobId': { equals: jobId },
      },
      limit: 1,
      depth: 2,
    })

    if (!sessions.docs.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Generation job not found',
          code: 'JOB_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    const session = sessions.docs[0]

    // Verify user has access to this session
    const sessionUserId =
      typeof session.user === 'string' ? session.user : (session.user as any)?.id

    if (sessionUserId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions to access this job',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    // Extract job metadata
    const metadata = session.contextData as any
    const status = metadata?.status || 'unknown'
    const progress = metadata?.progress || 0
    const error = metadata?.error
    const result = metadata?.result

    // Fetch associated project
    const projectField = session.project as any
    const projectId =
      typeof projectField === 'string' ? projectField : projectField?.id
    let project = null
    if (projectId) {
      try {
        project = await payload.findByID({
          collection: 'projects',
          id: projectId,
          depth: 0,
        })
      } catch (error) {
        console.error('Error fetching project:', error)
      }
    }

    // Build response based on status
    const response: any = {
      success: true,
      data: {
        jobId,
        sessionId: session.id,
        status,
        progress: Math.min(Math.max(progress, 0), 100), // Ensure 0-100 range
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    }

    // Add project info if available
    if (project) {
      response.data.project = {
        id: project.id,
        title: project.title,
        status: project.status,
      }
    }

    // Add status-specific data
    switch (status) {
      case 'queued':
        response.data.message = 'Generation job is queued and waiting to start'
        break

      case 'processing':
        response.data.message = 'Movie generation is in progress'
        response.data.currentStep = metadata?.currentStep || 'initializing'
        response.data.estimatedTimeRemaining = metadata?.estimatedTimeRemaining || null
        break

      case 'completed':
        response.data.message = 'Movie generation completed successfully'
        response.data.result = result || {
          mediaCount: metadata?.mediaCount || 0,
          duration: metadata?.duration || 0,
          outputUrl: metadata?.outputUrl || null,
        }
        break

      case 'failed':
        response.data.message = 'Movie generation failed'
        response.data.error = error || 'Unknown error occurred'
        response.data.errorCode = metadata?.errorCode || 'GENERATION_ERROR'
        break

      case 'cancelled':
        response.data.message = 'Movie generation was cancelled'
        break

      default:
        response.data.message = 'Job status unknown'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching job status:', error)

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

// Export authenticated GET handler with params
export async function GET(request: NextRequest, context: RouteParams) {
  const handler = createAuthenticatedHandler(
    (req, user) => handleGetStatus(req, user, context),
    {
      requiredRoles: ['user', 'admin', 'creator'],
    }
  )
  return handler(request)
}