import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Session } from '@/payload-types'
import { CeleryBridge } from '@/services/celeryBridge'
import { authenticateRequest, validateResourceOwnership } from '@/middleware/auth'

// GET /api/v1/chat/sessions - List chat sessions with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100) // Max 100 per page

    // Authenticate user with PayloadCMS
    const authResult = await authenticateRequest(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      )
    }

    const user = authResult.user
    const payload = await getPayload({ config })

    // Build query filters
    const where: any = {}

    if (projectId) {
      // Verify project exists and user has access
      const hasAccess = await validateResourceOwnership(user.id, 'project', projectId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'You do not have access to this project' },
          { status: 403 }
        )
      }

      where.project = { equals: projectId }
    }

    if (status) {
      where.status = { equals: status }
    }

    // Filter sessions by user access (sessions they own or from projects they have access to)
    where.user = { equals: user.id }

    // Query sessions with pagination
    const result = await payload.find({
      collection: 'sessions',
      where,
      page,
      limit,
      depth: 2, // Include project and participants
      sort: '-updatedAt',
    })

    // PHASE 0 INTEGRATION: Fetch production task status for sessions
    const celeryBridge = new CeleryBridge()

    // Format response according to contract with production status
    const sessionsWithStatus = await Promise.all(
      result.docs.map(async (session: Session) => {
        // Get production task IDs from session context
        const taskIds = ((session.contextData as Record<string, any>)?.productionTasks || []) as string[]

        // Fetch task statuses
        let productionStatus = {
          totalTasks: 0,
          pendingTasks: 0,
          runningTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
        }

        if (taskIds.length > 0) {
          const taskStatuses = await Promise.all(
            taskIds.map((taskId) => celeryBridge.getTaskStatus(taskId))
          )

          productionStatus = {
            totalTasks: taskIds.length,
            pendingTasks: taskStatuses.filter((t) => t?.status === 'pending').length,
            runningTasks: taskStatuses.filter((t) => t?.status === 'running').length,
            completedTasks: taskStatuses.filter((t) => t?.status === 'completed').length,
            failedTasks: taskStatuses.filter((t) => t?.status === 'failed').length,
          }
        }

        // Count created entities
        const createdEntities = (session.contextData as Record<string, any>)?.createdEntities || {
          characters: [],
          scenes: [],
          locations: [],
        }

        return {
          id: session.id,
          title: `Session ${session.id}`,
          projectId: session.project,
          projectName: '',
          status: session.sessionState || 'active',
          messageCount: Array.isArray(session.conversationHistory)
            ? session.conversationHistory.length
            : 0,
          lastActivity: session.updatedAt,
          createdAt: session.createdAt,
          participants: [],
          productionStatus,
          createdEntitiesCount: {
            characters: createdEntities.characters?.length || 0,
            scenes: createdEntities.scenes?.length || 0,
            locations: createdEntities.locations?.length || 0,
          },
        }
      })
    )

    const response = {
      sessions: sessionsWithStatus,
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
    // Authenticate user with PayloadCMS
    const authResult = await authenticateRequest(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      )
    }

    const user = authResult.user
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

    // Verify user has access to create sessions for this project
    const hasAccess = await validateResourceOwnership(user.id, 'project', projectId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      )
    }

    // Create new session
    const sessionData = {
      project: projectId,
      user: user.id,
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

    // PHASE 0 INTEGRATION: Format response with workflow and production status
    const response = {
      id: session.id,
      title: `Session ${session.id}`,
      projectId: session.project,
      status: session.sessionState || 'active',
      messageCount: Array.isArray(session.conversationHistory)
        ? session.conversationHistory.length
        : 0,
      participants: [],
      createdAt: session.createdAt,
      workflowState: {
        currentStep: session.currentStep,
        completedSteps: [],
      },
      productionStatus: {
        totalTasks: 0,
        pendingTasks: 0,
        runningTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
      },
      createdEntitiesCount: {
        characters: 0,
        scenes: 0,
        locations: 0,
      },
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
