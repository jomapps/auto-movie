import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Project, User } from '@/payload-types'

// GET /api/v1/projects - List user's projects with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const genre = searchParams.get('genre')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50) // Max 50 per page

    // TODO: Get authenticated user from request
    // For now, we'll simulate authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    
    // Build query filters
    const where: any = {
      // TODO: Filter by authenticated user
      // createdBy: { equals: userId }
    }

    if (status) {
      where.status = { equals: status }
    }

    if (genre) {
      where.genre = { equals: genre }
    }

    // Query projects with pagination
    const result = await payload.find({
      collection: 'projects',
      where,
      page,
      limit,
      depth: 2, // Include related user data
      sort: '-createdAt'
    })

    // Format response according to contract
    const response = {
      projects: result.docs.map((project: Project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        genre: project.genre,
        status: project.status,
        episodeCount: project.episodeCount,
        targetAudience: project.targetAudience,
        progress: {
          currentPhase: project.progress?.currentPhase || 'concept',
          overallProgress: project.progress?.overallProgress || 0
        },
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      })),
      pagination: {
        page: result.page || 1,
        limit: result.limit,
        total: result.totalDocs,
        pages: result.totalPages
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate required fields
    if (!data.title || !data.genre || !data.episodeCount) {
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          title: !data.title ? 'Title is required' : undefined,
          genre: !data.genre ? 'Genre is required' : undefined,
          episodeCount: !data.episodeCount ? 'Episode count is required' : undefined
        }
      }, { status: 400 })
    }

    // Validate episode count range
    if (data.episodeCount < 1 || data.episodeCount > 50) {
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          episodeCount: 'Episode count must be between 1 and 50'
        }
      }, { status: 400 })
    }

    // Validate genre
    const validGenres = ['action', 'comedy', 'drama', 'scifi', 'fantasy', 'horror', 'documentary', 'animation']
    if (!validGenres.includes(data.genre)) {
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          genre: `Genre must be one of: ${validGenres.join(', ')}`
        }
      }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // TODO: Check subscription limits
    // const userId = getUserFromAuth(authHeader)
    // const userProjects = await payload.count({ collection: 'projects', where: { createdBy: { equals: userId } } })
    // Check against user's subscription tier limits

    // Create project data
    const projectData = {
      title: data.title,
      description: data.description || '',
      genre: data.genre,
      episodeCount: data.episodeCount,
      targetAudience: data.targetAudience || 'all',
      status: 'concept',
      // createdBy: userId, // TODO: Set from authenticated user
      collaborators: [],
      projectSettings: {
        aspectRatio: data.projectSettings?.aspectRatio || '16:9',
        episodeDuration: data.projectSettings?.episodeDuration || 30,
        qualityTier: data.projectSettings?.qualityTier || 'standard'
      },
      progress: {
        currentPhase: 'story_development',
        completedSteps: [],
        overallProgress: 0
      }
    }

    const project = await payload.create({
      collection: 'projects',
      data: projectData
    })

    // Format response according to contract
    const response = {
      id: project.id,
      title: project.title,
      description: project.description,
      genre: project.genre,
      episodeCount: project.episodeCount,
      targetAudience: project.targetAudience,
      status: project.status,
      createdBy: project.createdBy as string, // TODO: Return user object
      collaborators: project.collaborators || [],
      projectSettings: project.projectSettings,
      progress: project.progress,
      createdAt: project.createdAt
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}