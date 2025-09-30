/**
 * Movies API Endpoint
 * GET /api/v1/movies
 *
 * List generated movies with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createAuthenticatedHandler } from '@/middleware/auth'

/**
 * GET /api/v1/movies
 * List user's generated movies (completed sessions)
 */
async function handleListMovies(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

    const payload = await getPayload({ config })

    // Build query filters
    const where: any = {
      user: { equals: user.id },
    }

    // Filter by project if specified
    if (projectId) {
      where.project = { equals: projectId }
    }

    // Filter by status if specified
    if (status) {
      where['metadata.status'] = { equals: status }
    }

    // Query sessions (movie generation jobs)
    const result = await payload.find({
      collection: 'sessions',
      where,
      page,
      limit,
      depth: 2,
      sort: '-createdAt',
    })

    // Format response
    const movies = result.docs.map((session) => {
      const metadata = session.metadata as any
      const project =
        typeof session.project === 'object' ? session.project : { id: session.project }

      return {
        id: session.id,
        jobId: metadata?.jobId || null,
        projectId: project?.id || null,
        project: project
          ? {
              id: project.id,
              title: (project as any).title,
              genre: (project as any).genre,
            }
          : null,
        status: metadata?.status || 'unknown',
        progress: metadata?.progress || 0,
        result: metadata?.result || null,
        error: metadata?.error || null,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        completedAt: metadata?.completedAt || null,
      }
    })

    const response = {
      success: true,
      data: {
        movies,
        pagination: {
          page: result.page || 1,
          limit: result.limit,
          total: result.totalDocs,
          pages: result.totalPages,
          hasNext: result.hasNextPage,
          hasPrev: result.hasPrevPage,
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error listing movies:', error)

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
export const GET = createAuthenticatedHandler(handleListMovies, {
  requiredRoles: ['user', 'admin', 'creator'],
})