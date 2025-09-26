import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Session } from '@/payload-types'

// GET /api/v1/chat/sessions - List chat sessions with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100) // Max 100 per page

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    // TODO: Get user ID from auth and filter sessions by user access
    // const userId = getUserFromAuth(authHeader)

    // Build query filters
    const where: any = {}

    if (projectId) {
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
      // if (!hasProjectAccess(project, userId)) {
      //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      // }

      where.project = { equals: projectId }
    }

    if (status) {
      where.status = { equals: status }
    }

    // TODO: Add user access filter
    // where.participants = { contains: userId }

    // Query sessions with pagination
    const result = await payload.find({
      collection: 'sessions',
      where,
      page,
      limit,
      depth: 2, // Include project and participants
      sort: '-updatedAt',
    })

    // Format response according to contract
    const response = {
      sessions: result.docs.map((session: Session) => ({
        id: session.id,
        title: `Session ${session.id}`, // Session interface doesn't have title property
        projectId: session.project, // Session interface defines project as string
        projectName: '', // Would need to fetch project details separately
        status: session.sessionState || 'active', // Using sessionState from Session interface
        messageCount: Array.isArray(session.conversationHistory)
          ? session.conversationHistory.length
          : 0,
        lastActivity: session.updatedAt,
        createdAt: session.createdAt,
        participants: [], // Session interface doesn't have participants property
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
    console.error('Error fetching chat sessions:', error)

    if (error instanceof Error && error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/chat/sessions - Create a new chat session
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data = await request.json()
    const { projectId, title: _title, initialMessage } = data

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: {
            projectId: 'projectId is required',
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

    // TODO: Check if user has access to create sessions for this project
    // const userId = getUserFromAuth(authHeader)
    // if (!hasProjectAccess(project, userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Create new session
    const sessionData = {
      project: projectId,
      user: 'temp-user-id', // TODO: Get actual user ID from auth
      currentStep: 'initial',
      conversationHistory: initialMessage
        ? [
            {
              role: 'user',
              content: initialMessage,
              timestamp: new Date().toISOString(),
            },
          ]
        : [],
      sessionState: 'active' as const,
    }

    const session = (await payload.create({
      collection: 'sessions',
      data: sessionData,
    })) as Session

    // Format response
    const response = {
      id: session.id,
      title: `Session ${session.id}`, // Session interface doesn't have title property
      projectId: session.project,
      status: session.sessionState || 'active',
      messageCount: Array.isArray(session.conversationHistory)
        ? session.conversationHistory.length
        : 0,
      participants: [], // Session interface doesn't have participants property
      createdAt: session.createdAt,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating chat session:', error)

    if (error instanceof Error && error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
