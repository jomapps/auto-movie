import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Media } from '@/payload-types'

// GET /api/v1/media - List project media with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const mediaType = searchParams.get('mediaType')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100) // Max 100 per page

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Validate required projectId parameter
    if (!projectId) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: {
            projectId: 'projectId parameter is required',
          },
        },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Verify project exists and user has access
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // TODO: Check if user has access to this project
    // const userId = getUserFromAuth(authHeader)
    // if (!hasProjectAccess(project, userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Build query filters
    const where: any = {
      project: { equals: projectId },
    }

    if (mediaType) {
      where.mediaType = { equals: mediaType }
    }

    if (status) {
      where.status = { equals: status }
    }

    // Query media with pagination
    const result = await payload.find({
      collection: 'media',
      where,
      page,
      limit,
      depth: 1,
      sort: '-createdAt',
    })

    // Format response according to contract
    const response = {
      media: result.docs.map((media: Media) => ({
        id: media.id,
        url: media.url || '',
        filename: media.filename || 'unknown',
        mediaType: media.mediaType,
        agentGenerated: media.agentGenerated || false,
        description: media.description || '',
        tags: media.tags || [],
        technicalData: {
          duration: media.technicalData?.duration,
          resolution: media.technicalData?.resolution,
          fps: media.technicalData?.fps,
        },
        status: media.status || 'active',
        createdAt: media.createdAt,
      })),
      pagination: {
        page: result.page || 1,
        limit: result.limit,
        total: result.totalDocs,
        pages: result.totalPages,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching media:', error)

    if (error instanceof Error && error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
